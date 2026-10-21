import React, { useState, useEffect } from "react";
import { 
  Scale, 
  Search, 
  TrendingUp, 
  Coins, 
  ArrowRight, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle,
  Percent,
  CheckCircle2,
  DollarSign
} from "lucide-react";
import { fetchLiveMarketPrices, MarketPriceRecord } from "../../services/albionDataApi";

export const TradeView: React.FC = () => {
  const [selectedItemId, setSelectedItemId] = useState("T8_MAIN_SWORD");
  const [selectedItemName, setSelectedItemName] = useState("Elder's Broadsword");
  const [prices, setPrices] = useState<MarketPriceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPremium, setHasPremium] = useState(true);

  // Quick preset items
  const popularItems = [
    { id: "T8_MAIN_SWORD", name: "Elder's Broadsword (T8)" },
    { id: "T8_2H_BOW", name: "Elder's Warbow (T8)" },
    { id: "T8_BAG@1", name: "Elder's Bag 8.1" },
    { id: "T7_ARMOR_CLOTH_SET3@1", name: "Cultist Robe 7.1" },
    { id: "T8_CLOTH", name: "Elder's Cloth (Refined)" },
  ];

  const loadPrices = async (id: string) => {
    setIsLoading(true);
    const data = await fetchLiveMarketPrices(id, "Europe");
    setPrices(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadPrices(selectedItemId);
  }, [selectedItemId]);

  const taxRate = hasPremium ? 0.04 : 0.08;
  const setupFee = 0.025;
  const totalDeductionRate = taxRate + setupFee;

  // Find lowest sell price (best city to buy from)
  const availableSellPrices = prices.filter((p) => p.sell_price_min > 0 && p.city !== "Black Market");
  const lowestCityBuy = availableSellPrices.length
    ? availableSellPrices.reduce((prev, curr) => (prev.sell_price_min < curr.sell_price_min ? prev : curr))
    : null;

  // Find highest buy order (best city to sell to, often Black Market or Caerleon)
  const availableBuyOrders = prices.filter((p) => p.buy_price_max > 0);
  const highestCitySell = availableBuyOrders.length
    ? availableBuyOrders.reduce((prev, curr) => (prev.buy_price_max > curr.buy_price_max ? prev : curr))
    : null;

  const buyCost = lowestCityBuy ? lowestCityBuy.sell_price_min : 0;
  const grossSell = highestCitySell ? highestCitySell.buy_price_max : 0;
  const netSell = grossSell * (1 - totalDeductionRate);
  const flipProfit = netSell - buyCost;
  const flipRoi = buyCost > 0 ? (flipProfit / buyCost) * 100 : 0;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-80px)]">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 font-['Outfit'] flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" />
            <span>Market & Trade Monitoring Suite</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time market price comparison across all 6 Royal Cities, Caerleon & the Black Market via Albion Data Project.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Premium Status Toggle */}
          <button
            onClick={() => setHasPremium(!hasPremium)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-colors ${
              hasPremium
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
            title="Premium accounts pay only 4% market tax instead of 8%"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{hasPremium ? "Premium Tax (4%)" : "Non-Premium (8%)"}</span>
          </button>

          <button
            onClick={() => loadPrices(selectedItemId)}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs bg-slate-900/80 hover:bg-slate-800 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            <span>Refresh Prices</span>
          </button>
        </div>
      </div>

      {/* Item Selector Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-semibold shrink-0">Popular Items:</span>
        {popularItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setSelectedItemId(item.id);
              setSelectedItemName(item.name);
            }}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors ${
              selectedItemId === item.id
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      {/* Arbitrage Opportunity Card */}
      {lowestCityBuy && highestCitySell && flipProfit > 0 && (
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
                  Profitable Arbitrage Route Found!
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  +{flipRoi.toFixed(1)}% ROI
                </span>
              </div>
              <div className="text-sm font-bold text-slate-100 mt-1 flex items-center gap-2 font-mono">
                <span>Buy in {lowestCityBuy.city} ({buyCost.toLocaleString()})</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Sell in {highestCitySell.city} ({grossSell.toLocaleString()})</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Estimated Net Profit per item: <strong className="text-emerald-400 font-mono">+{Math.round(flipProfit).toLocaleString()} silver</strong> (after {((totalDeductionRate) * 100).toFixed(1)}% tax & fee).
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-mono block">Volume Potential</span>
            <span className="text-xs font-bold text-slate-200">High Demand</span>
          </div>
        </div>
      )}

      {/* City Prices Comparison Table */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 p-1 flex items-center justify-center">
              <img
                src={`https://render.albiononline.com/v1/item/${selectedItemId}.png`}
                alt={selectedItemName}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
                {selectedItemName} — City Price Matrix
              </h3>
              <span className="text-xs text-slate-400 font-mono">{selectedItemId}</span>
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Deduction: <span className="font-mono text-amber-400">{((totalDeductionRate) * 100).toFixed(1)}%</span> (Tax + Setup)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">City / Market</th>
                <th className="py-2.5 px-3">Lowest Sell Offer (Buy Price)</th>
                <th className="py-2.5 px-3">Highest Buy Order</th>
                <th className="py-2.5 px-3">Estimated Net Sell</th>
                <th className="py-2.5 px-3">Market Spread</th>
                <th className="py-2.5 px-3">Opportunity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 font-medium font-mono">
              {prices.map((p) => {
                const isLowestBuy = lowestCityBuy?.city === p.city;
                const isHighestSell = highestCitySell?.city === p.city;
                const spread = p.sell_price_min > 0 && p.buy_price_max > 0 ? p.sell_price_min - p.buy_price_max : 0;
                const net = p.buy_price_max > 0 ? Math.round(p.buy_price_max * (1 - totalDeductionRate)) : 0;

                return (
                  <tr key={p.city} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-100 flex items-center gap-2 font-sans">
                      <span>{p.city}</span>
                      {p.city === "Black Market" && (
                        <span className="text-[9px] bg-red-950 text-red-300 px-1.5 py-0.2 rounded border border-red-800 font-mono">
                          Red Zone
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {p.sell_price_min > 0 ? (
                        <span className={isLowestBuy ? 'text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded' : 'text-slate-200'}>
                          {p.sell_price_min.toLocaleString()} silver
                        </span>
                      ) : (
                        <span className="text-slate-600">No Orders</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {p.buy_price_max > 0 ? (
                        <span className={isHighestSell ? 'text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded' : 'text-slate-200'}>
                          {p.buy_price_max.toLocaleString()} silver
                        </span>
                      ) : (
                        <span className="text-slate-600">No Orders</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {net > 0 ? `${net.toLocaleString()} silver` : '-'}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {spread > 0 ? `+${spread.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      {isLowestBuy ? (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                          Best City to Buy
                        </span>
                      ) : isHighestSell ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                          Best City to Sell
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">-</span>
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
