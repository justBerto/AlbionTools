import React, { useState, useEffect, useMemo } from "react";
import { 
  Scale, 
  Search, 
  TrendingUp, 
  Coins, 
  ArrowRight, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle,
  ExternalLink,
  Clock,
  Layers,
  Sparkles,
  DollarSign
} from "lucide-react";
import { 
  fetchLiveMarketPrices, 
  fetchLiveGoldPrices,
  MarketPriceRecord, 
  GoldPriceRecord,
  POPULAR_CATALOG, 
  CatalogItem,
  buildItemUniqueName,
  AlbionServerRegion,
  CITIES 
} from "../../services/albionDataApi";

export const TradeView: React.FC = () => {
  const getInitialRegion = (): AlbionServerRegion => {
    const saved = localStorage.getItem("albiontools_server");
    if (saved?.includes("Asia")) return "Asia";
    if (saved?.includes("Americas")) return "Americas";
    return "Europe";
  };

  const [selectedRegion, setSelectedRegion] = useState<AlbionServerRegion>(getInitialRegion);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState<number>(8);
  const [selectedEnchant, setSelectedEnchant] = useState<number>(0);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem>(POPULAR_CATALOG[0]);
  const [customItemId, setCustomItemId] = useState<string>("");
  const [selectedQuality, setSelectedQuality] = useState<number>(0); // 0 = all
  const [hasPremium, setHasPremium] = useState<boolean>(true);

  const [prices, setPrices] = useState<MarketPriceRecord[]>([]);
  const [goldPrices, setGoldPrices] = useState<GoldPriceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);

  // Active full item ID
  const activeItemId = useMemo(() => {
    if (customItemId.trim()) {
      return customItemId.trim().toUpperCase();
    }
    return buildItemUniqueName(selectedTier, selectedCatalogItem.id, selectedEnchant);
  }, [customItemId, selectedCatalogItem, selectedTier, selectedEnchant]);

  const activeItemDisplayName = useMemo(() => {
    if (customItemId.trim()) {
      return customItemId.trim().toUpperCase();
    }
    const enchantSuffix = selectedEnchant > 0 ? `.${selectedEnchant}` : "";
    return `T${selectedTier} ${selectedCatalogItem.name}${enchantSuffix}`;
  }, [customItemId, selectedCatalogItem, selectedTier, selectedEnchant]);

  // Load live prices from AODP
  const loadMarketData = async (itemId: string, region: AlbionServerRegion) => {
    setIsLoading(true);
    const qualities = selectedQuality === 0 ? [1, 2, 3, 4, 5] : [selectedQuality];
    const [priceData, goldData] = await Promise.all([
      fetchLiveMarketPrices(itemId, region, qualities),
      fetchLiveGoldPrices(region, 5)
    ]);

    setPrices(priceData);
    setGoldPrices(goldData);
    setIsLoading(false);
    setLastRefreshedAt(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    loadMarketData(activeItemId, selectedRegion);
  }, [activeItemId, selectedRegion, selectedQuality]);

  // Filter catalog by category and search
  const filteredCatalog = useMemo(() => {
    return POPULAR_CATALOG.filter((item) => {
      const matchCat = selectedCategory === "All" || item.category === selectedCategory;
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Tax calculations
  const taxRate = hasPremium ? 0.04 : 0.08;
  const setupFee = 0.025;
  const totalDeductionRate = taxRate + setupFee;

  // Aggregate prices per city (best sell price min > 0, best buy price max > 0)
  const cityAggregates = useMemo(() => {
    return CITIES.map((cityName) => {
      const cityRecords = prices.filter((p) => p.city.toLowerCase() === cityName.toLowerCase());
      
      const validSells = cityRecords.filter((p) => p.sell_price_min > 0);
      const minSellRecord = validSells.length > 0 
        ? validSells.reduce((prev, curr) => (prev.sell_price_min < curr.sell_price_min ? prev : curr))
        : null;

      const validBuys = cityRecords.filter((p) => p.buy_price_max > 0);
      const maxBuyRecord = validBuys.length > 0
        ? validBuys.reduce((prev, curr) => (prev.buy_price_max > curr.buy_price_max ? prev : curr))
        : null;

      return {
        city: cityName,
        sellPriceMin: minSellRecord?.sell_price_min || 0,
        sellDate: minSellRecord?.sell_price_min_date || "",
        buyPriceMax: maxBuyRecord?.buy_price_max || 0,
        buyDate: maxBuyRecord?.buy_price_max_date || "",
      };
    });
  }, [prices]);

  // Find lowest sell price (excluding Black Market for buying)
  const availableBuyCities = cityAggregates.filter((c) => c.sellPriceMin > 0 && c.city !== "Black Market");
  const lowestCityBuy = availableBuyCities.length > 0
    ? availableBuyCities.reduce((prev, curr) => (prev.sellPriceMin < curr.sellPriceMin ? prev : curr))
    : null;

  // Find highest buy order across all cities (including Black Market)
  const availableSellCities = cityAggregates.filter((c) => c.buyPriceMax > 0);
  const highestCitySell = availableSellCities.length > 0
    ? availableSellCities.reduce((prev, curr) => (prev.buyPriceMax > curr.buyPriceMax ? prev : curr))
    : null;

  const buyCost = lowestCityBuy ? lowestCityBuy.sellPriceMin : 0;
  const grossSell = highestCitySell ? highestCitySell.buyPriceMax : 0;
  const netSell = grossSell * (1 - totalDeductionRate);
  const flipProfit = netSell - buyCost;
  const flipRoi = buyCost > 0 ? (flipProfit / buyCost) * 100 : 0;

  // Format relative timestamp
  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr || dateStr.startsWith("0001")) return null;
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return null;
    }
  };

  const latestGold = goldPrices.length > 0 ? goldPrices[goldPrices.length - 1] : null;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-80px)]">
      {/* Top Banner with Server Selection & AODP Developer Info */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 font-['Outfit'] flex items-center gap-2">
                <span>Market & Trade Monitoring Suite</span>
                <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full font-mono">
                  AODP API v2
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Live market price comparison across all 6 Royal Cities, Caerleon & Black Market via{" "}
                <a 
                  href="https://www.albion-online-data.com/developer" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-amber-400 hover:underline inline-flex items-center gap-1 font-mono"
                >
                  albion-online-data.com <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Gold Ticker */}
          {latestGold && (
            <div className="flex items-center gap-2 bg-amber-950/30 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-mono">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300">Gold:</span>
              <span className="text-amber-400 font-bold">{latestGold.price.toLocaleString()} silver</span>
            </div>
          )}

          {/* Region Switcher */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            {(["Asia", "Europe", "Americas"] as AlbionServerRegion[]).map((region) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  selectedRegion === region
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {region}
              </button>
            ))}
          </div>

          {/* Premium Status Toggle */}
          <button
            onClick={() => setHasPremium(!hasPremium)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-colors ${
              hasPremium
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                : "bg-slate-900 text-slate-400 border-slate-800"
            }`}
            title="Premium accounts pay 4% tax + 2.5% setup fee (6.5% total). Non-Premium pays 8% tax + 2.5% fee (10.5%)."
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{hasPremium ? "Premium (6.5% Fee)" : "Standard (10.5% Fee)"}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => loadMarketData(activeItemId, selectedRegion)}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs bg-slate-900/80 hover:bg-slate-800 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
            <span>{isLoading ? "Fetching..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Item Selection & Filters */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        {/* Category Filter Pills & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
            {["All", "Weapons", "Armor", "Accessories", "Materials", "Consumables", "Mounts"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-slate-800 text-amber-400 font-bold border border-amber-500/30"
                    : "text-slate-400 hover:text-slate-200 border border-transparent"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search item name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        {/* Tier & Enchantment Selector */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-4">
            {/* Tier Selector */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 font-semibold mr-1">Tier:</span>
              {[4, 5, 6, 7, 8].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setSelectedTier(t);
                    setCustomItemId("");
                  }}
                  className={`w-7 h-7 rounded-lg font-mono font-bold transition-colors ${
                    selectedTier === t && !customItemId
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  T{t}
                </button>
              ))}
            </div>

            {/* Enchantment Selector */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 font-semibold mr-1">Enchant:</span>
              {[0, 1, 2, 3, 4].map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    setSelectedEnchant(e);
                    setCustomItemId("");
                  }}
                  className={`w-7 h-7 rounded-lg font-mono font-bold transition-colors ${
                    selectedEnchant === e && !customItemId
                      ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  .{e}
                </button>
              ))}
            </div>

            {/* Quality Selector */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 font-semibold mr-1">Quality:</span>
              <select
                value={selectedQuality}
                onChange={(e) => setSelectedQuality(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500/50"
              >
                <option value={0}>All Qualities (1-5)</option>
                <option value={1}>Normal</option>
                <option value={2}>Good</option>
                <option value={3}>Outstanding</option>
                <option value={4}>Excellent</option>
                <option value={5}>Masterpiece</option>
              </select>
            </div>
          </div>

          {/* Custom Raw ID Input */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Custom ID:</span>
            <input
              type="text"
              placeholder="e.g. T8_BAG@1"
              value={customItemId}
              onChange={(e) => setCustomItemId(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-amber-400 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 uppercase w-32"
            />
          </div>
        </div>

        {/* Quick Item Selection Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-36 overflow-y-auto pr-1">
          {filteredCatalog.map((item) => {
            const isSelected = selectedCatalogItem.id === item.id && !customItemId;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedCatalogItem(item);
                  setCustomItemId("");
                }}
                className={`p-2 rounded-xl text-left border transition-all ${
                  isSelected
                    ? "bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm shadow-amber-500/10"
                    : "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700"
                }`}
              >
                <div className="text-[11px] font-bold truncate">{item.name}</div>
                <div className="text-[9px] text-slate-500 font-mono truncate">{item.id}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Arbitrage Opportunity Card */}
      {lowestCityBuy && highestCitySell && flipProfit > 0 ? (
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
                  Profitable Arbitrage Opportunity Detected!
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  +{flipRoi.toFixed(1)}% Net ROI
                </span>
              </div>
              <div className="text-sm font-bold text-slate-100 mt-1 flex flex-wrap items-center gap-2 font-mono">
                <span>Buy in {lowestCityBuy.city} ({buyCost.toLocaleString()})</span>
                <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-emerald-400">Sell in {highestCitySell.city} ({grossSell.toLocaleString()})</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Estimated Net Profit: <strong className="text-emerald-400 font-mono">+{Math.round(flipProfit).toLocaleString()} silver / item</strong> (after {((totalDeductionRate) * 100).toFixed(1)}% tax & market fees).
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-mono block">Data Source</span>
            <span className="text-xs font-bold text-emerald-400">Albion Online Data Project</span>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-slate-500" />
            <span>
              {buyCost === 0 && grossSell === 0 
                ? "No recorded active orders found in recent Albion Data Project logs for this item."
                : "No instant profitable buy-order flip available right now. Consider placing sell orders."}
            </span>
          </div>
          {lastRefreshedAt && (
            <span className="text-[11px] text-slate-500 font-mono">
              Refreshed at {lastRefreshedAt}
            </span>
          )}
        </div>
      )}

      {/* City Prices Comparison Matrix */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 p-1 flex items-center justify-center shrink-0">
              <img
                src={`https://render.albiononline.com/v1/item/${activeItemId}.png`}
                alt={activeItemDisplayName}
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback icon if render server does not have the custom ID
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-['Outfit'] flex items-center gap-2">
                <span>{activeItemDisplayName}</span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                  {activeItemId}
                </span>
              </h3>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Server: <strong className="text-amber-400">{selectedRegion}</strong></span>
                <span>•</span>
                <span>Market Fee: <strong className="text-slate-300 font-mono">{((totalDeductionRate) * 100).toFixed(1)}%</strong></span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Data synced with Albion Online Data Project</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">City / Market</th>
                <th className="py-2.5 px-3">Lowest Sell Offer (Buy Price)</th>
                <th className="py-2.5 px-3">Sell Updated</th>
                <th className="py-2.5 px-3">Highest Buy Order</th>
                <th className="py-2.5 px-3">Buy Updated</th>
                <th className="py-2.5 px-3">Estimated Net Sell</th>
                <th className="py-2.5 px-3">Spread</th>
                <th className="py-2.5 px-3">Status / Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 font-medium font-mono">
              {cityAggregates.map((row) => {
                const isLowestBuy = lowestCityBuy?.city === row.city && row.sellPriceMin > 0;
                const isHighestSell = highestCitySell?.city === row.city && row.buyPriceMax > 0;
                const spread = row.sellPriceMin > 0 && row.buyPriceMax > 0 ? row.sellPriceMin - row.buyPriceMax : 0;
                const net = row.buyPriceMax > 0 ? Math.round(row.buyPriceMax * (1 - totalDeductionRate)) : 0;

                const sellAgo = formatTimeAgo(row.sellDate);
                const buyAgo = formatTimeAgo(row.buyDate);

                return (
                  <tr key={row.city} className="hover:bg-slate-800/40 transition-colors">
                    {/* City Name */}
                    <td className="py-3 px-3 font-semibold text-slate-100 flex items-center gap-2 font-sans">
                      <span>{row.city}</span>
                      {row.city === "Black Market" && (
                        <span className="text-[9px] bg-red-950 text-red-300 px-1.5 py-0.2 rounded border border-red-800 font-mono">
                          Red Zone
                        </span>
                      )}
                      {row.city === "Caerleon" && (
                        <span className="text-[9px] bg-amber-950 text-amber-300 px-1.5 py-0.2 rounded border border-amber-800 font-mono">
                          Royal Center
                        </span>
                      )}
                    </td>

                    {/* Lowest Sell Offer */}
                    <td className="py-3 px-3">
                      {row.sellPriceMin > 0 ? (
                        <span className={isLowestBuy ? "text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20" : "text-slate-200"}>
                          {row.sellPriceMin.toLocaleString()} silver
                        </span>
                      ) : (
                        <span className="text-slate-600 italic">No Active Order</span>
                      )}
                    </td>

                    {/* Sell Order Timestamp */}
                    <td className="py-3 px-3 text-[11px] text-slate-400 font-sans">
                      {sellAgo ? (
                        <span className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${sellAgo.includes("m") ? "bg-emerald-400" : "bg-slate-500"}`} />
                          <span>{sellAgo}</span>
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Highest Buy Order */}
                    <td className="py-3 px-3">
                      {row.buyPriceMax > 0 ? (
                        <span className={isHighestSell ? "text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20" : "text-slate-200"}>
                          {row.buyPriceMax.toLocaleString()} silver
                        </span>
                      ) : (
                        <span className="text-slate-600 italic">No Active Order</span>
                      )}
                    </td>

                    {/* Buy Order Timestamp */}
                    <td className="py-3 px-3 text-[11px] text-slate-400 font-sans">
                      {buyAgo ? (
                        <span className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${buyAgo.includes("m") ? "bg-emerald-400" : "bg-slate-500"}`} />
                          <span>{buyAgo}</span>
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Net Payout */}
                    <td className="py-3 px-3 text-slate-300">
                      {net > 0 ? `${net.toLocaleString()} silver` : "-"}
                    </td>

                    {/* Spread */}
                    <td className="py-3 px-3 text-slate-400">
                      {spread > 0 ? `+${spread.toLocaleString()}` : "-"}
                    </td>

                    {/* Recommendation Badge */}
                    <td className="py-3 px-3 font-sans">
                      {isLowestBuy ? (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                          Cheapest to Buy
                        </span>
                      ) : isHighestSell ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                          Highest Payout
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
