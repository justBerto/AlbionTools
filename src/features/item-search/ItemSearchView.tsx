import React, { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  Filter, 
  Layers, 
  Sparkles, 
  ExternalLink, 
  Shield, 
  Sword, 
  Zap, 
  Scale, 
  TrendingUp,
  Package,
  Info,
  ChevronRight,
  RefreshCw,
  Coins
} from "lucide-react";
import { 
  COMPLETE_ITEM_CATALOG, 
  CatalogItem, 
  MainCategory, 
  SUBCATEGORIES_BY_MAIN, 
  buildItemUniqueName, 
  getFormattedItemName, 
  calculateItemPower, 
  getItemDescription,
  fetchLiveMarketPrices,
  MarketPriceRecord,
  CITIES,
  AlbionServerRegion
} from "../../services/albionDataApi";

interface ItemSearchViewProps {
  onNavigateToTrade?: (item: CatalogItem, tier: number, enchant: number) => void;
}

export const ItemSearchView: React.FC<ItemSearchViewProps> = ({ onNavigateToTrade }) => {
  const getInitialRegion = (): AlbionServerRegion => {
    const saved = localStorage.getItem("albiontools_server");
    if (saved?.includes("Asia")) return "Asia";
    if (saved?.includes("Americas")) return "Americas";
    return "Europe";
  };

  const [selectedRegion] = useState<AlbionServerRegion>(getInitialRegion);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedItem, setSelectedItem] = useState<CatalogItem>(COMPLETE_ITEM_CATALOG[0]);
  const [selectedTier, setSelectedTier] = useState<number>(4);
  const [selectedEnchant, setSelectedEnchant] = useState<number>(0);

  // Live price metrics for currently inspected item
  const [prices, setPrices] = useState<MarketPriceRecord[]>([]);
  const [isLoadingPrices, setIsLoadingPrices] = useState<boolean>(false);

  // Available subcategories for chosen main category
  const availableSubCategories = useMemo(() => {
    if (selectedCategory === "All") return [];
    return SUBCATEGORIES_BY_MAIN[selectedCategory as MainCategory] || [];
  }, [selectedCategory]);

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedSubCategory("All");
  };

  const handleSelectItem = (item: CatalogItem) => {
    setSelectedItem(item);
    if (selectedTier < item.minTier || selectedTier > item.maxTier) {
      setSelectedTier(item.minTier);
    }
    if (!item.hasEnchantments) {
      setSelectedEnchant(0);
    }
  };

  // Full canonical in-game identifier (e.g. T5_WOOD_LEVEL1@1 or T8_MAIN_SWORD@2)
  const canonicalItemId = useMemo(() => {
    return buildItemUniqueName(selectedTier, selectedItem.id, selectedEnchant);
  }, [selectedTier, selectedItem, selectedEnchant]);

  // Formatted display title (e.g. "T5 Cedar Logs" or "Elder's Broadsword (.2 Rare)")
  const formattedItemName = useMemo(() => {
    return getFormattedItemName(selectedItem, selectedTier, selectedEnchant);
  }, [selectedItem, selectedTier, selectedEnchant]);

  // Item Power
  const itemPower = useMemo(() => {
    return calculateItemPower(selectedItem, selectedTier, selectedEnchant);
  }, [selectedItem, selectedTier, selectedEnchant]);

  // Fetch live prices when selected item changes
  useEffect(() => {
    let isCancelled = false;
    const fetchPrices = async () => {
      setIsLoadingPrices(true);
      const data = await fetchLiveMarketPrices(canonicalItemId, selectedRegion, [1, 2, 3, 4, 5]);
      if (!isCancelled) {
        setPrices(data);
        setIsLoadingPrices(false);
      }
    };

    fetchPrices();
    return () => {
      isCancelled = true;
    };
  }, [canonicalItemId, selectedRegion]);

  // Lowest sell price and highest buy order
  const bestSell = useMemo(() => {
    const valid = prices.filter((p) => p.sell_price_min > 0 && p.city !== "Black Market");
    if (valid.length === 0) return null;
    return valid.reduce((prev, curr) => (prev.sell_price_min < curr.sell_price_min ? prev : curr));
  }, [prices]);

  const bestBuy = useMemo(() => {
    const valid = prices.filter((p) => p.buy_price_max > 0);
    if (valid.length === 0) return null;
    return valid.reduce((prev, curr) => (prev.buy_price_max > curr.buy_price_max ? prev : curr));
  }, [prices]);

  // Filter items in catalog
  const filteredCatalog = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return COMPLETE_ITEM_CATALOG.filter((item) => {
      const matchCat = selectedCategory === "All" || item.category === selectedCategory;
      const matchSub = 
        selectedSubCategory === "All" || 
        selectedSubCategory.startsWith("All ") || 
        item.subCategory === selectedSubCategory;
      const matchQuery = 
        !q || 
        item.name.toLowerCase().includes(q) || 
        item.id.toLowerCase().includes(q) || 
        item.subCategory.toLowerCase().includes(q);

      return matchCat && matchSub && matchQuery;
    });
  }, [selectedCategory, selectedSubCategory, searchQuery]);

  // Valid tiers for selected item
  const validTiers = useMemo(() => {
    if (!selectedItem.hasTiers) return [selectedItem.minTier];
    const tiers: number[] = [];
    for (let t = selectedItem.minTier; t <= selectedItem.maxTier; t++) {
      tiers.push(t);
    }
    return tiers;
  }, [selectedItem]);

  // Navigate to Trade suite with current item
  const handleOpenInTrade = () => {
    try {
      localStorage.setItem("albiontools_selected_trade_item", JSON.stringify({
        itemId: selectedItem.id,
        tier: selectedTier,
        enchant: selectedEnchant
      }));
      window.dispatchEvent(new CustomEvent("albiontools_navigate_trade", {
        detail: {
          item: selectedItem,
          tier: selectedTier,
          enchant: selectedEnchant
        }
      }));
    } catch {}

    if (onNavigateToTrade) {
      onNavigateToTrade(selectedItem, selectedTier, selectedEnchant);
    }
  };

  // Enchantment color border
  const getEnchantBorder = (enchant: number) => {
    switch (enchant) {
      case 1: return "border-emerald-500/60 shadow-emerald-500/20";
      case 2: return "border-sky-500/60 shadow-sky-500/20";
      case 3: return "border-purple-500/60 shadow-purple-500/20";
      case 4: return "border-amber-400/80 shadow-amber-400/30";
      default: return "border-slate-800 shadow-slate-900/40";
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-80px)]">
      {/* Header and Search Filters */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 font-['Outfit'] flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-400" />
              <span>Item Database & Encyclopedia</span>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono">
                {COMPLETE_ITEM_CATALOG.length} Items Indexed
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive encyclopedia of raw resources, refined materials, equipment, weapons, consumables, and mounts.
            </p>
          </div>

          <div className="text-xs text-slate-400 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Unified Database with Market & Trade</span>
          </div>
        </div>

        {/* Row 1: Main Category Pills + Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
            <span className="text-slate-500 text-[11px] font-semibold mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-amber-400" /> Category:
            </span>
            {["All", "Materials", "Weapons", "Armor", "Accessories", "Consumables", "Mounts"].map((cat) => (
              <button
                key={cat}
                onClick={() => handleSelectCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                    : "bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search wood, hide, broadsword, potion..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        {/* Row 2: Sub-Categories Branch */}
        {availableSubCategories.length > 0 && (
          <div className="pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
              <span className="text-amber-400/80 text-[11px] font-semibold mr-1 shrink-0 flex items-center gap-1">
                <Layers className="w-3 h-3" /> Sub-category:
              </span>
              {availableSubCategories.map((sub) => {
                const isSelected = selectedSubCategory === sub;
                return (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubCategory(sub)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                      isSelected
                        ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40"
                        : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80"
                    }`}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Row 3: Tier & Enchantment Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/60">
          <div className="flex flex-wrap items-center gap-4">
            {/* Tier Buttons */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 font-semibold mr-1">Tier:</span>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((t) => {
                const isValid = validTiers.includes(t);
                return (
                  <button
                    key={t}
                    disabled={!isValid}
                    onClick={() => setSelectedTier(t)}
                    className={`w-7 h-7 rounded-lg font-mono font-bold transition-colors ${
                      !isValid
                        ? "bg-slate-950 text-slate-700 border border-slate-900 cursor-not-allowed opacity-40"
                        : selectedTier === t
                        ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                        : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                    }`}
                  >
                    T{t}
                  </button>
                );
              })}
            </div>

            {/* Enchantment Buttons */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 font-semibold mr-1">Enchant:</span>
              {[0, 1, 2, 3, 4].map((e) => {
                const isEnabled = selectedItem.hasEnchantments !== false;
                return (
                  <button
                    key={e}
                    disabled={!isEnabled}
                    onClick={() => setSelectedEnchant(e)}
                    className={`w-7 h-7 rounded-lg font-mono font-bold transition-colors ${
                      !isEnabled
                        ? "bg-slate-950 text-slate-700 border border-slate-900 cursor-not-allowed opacity-40"
                        : selectedEnchant === e
                        ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20"
                        : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                    }`}
                  >
                    .{e}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            Showing <span className="font-bold text-amber-400">{filteredCatalog.length}</span> items
          </div>
        </div>
      </div>

      {/* Main Content: Item Cards (2 Cols) & Selected Item Detailed Inspector (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Item Cards Grid */}
        <div className="lg:col-span-2 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredCatalog.map((item) => {
              const isSelected = selectedItem.id === item.id;
              const cardItemId = buildItemUniqueName(
                validTiers.includes(selectedTier) ? selectedTier : item.minTier,
                item.id,
                item.hasEnchantments ? selectedEnchant : 0
              );
              const cardItemPower = calculateItemPower(
                item,
                validTiers.includes(selectedTier) ? selectedTier : item.minTier,
                item.hasEnchantments ? selectedEnchant : 0
              );

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className={`glass-panel p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? "border-amber-500/80 bg-amber-500/10 shadow-lg shadow-amber-500/10"
                      : "border-slate-800 hover:border-slate-700 bg-slate-900/40"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 p-1 flex items-center justify-center shrink-0">
                      <img
                        src={`https://render.albiononline.com/v1/item/${cardItemId}.png`}
                        alt={item.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-100 truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate flex items-center gap-1.5">
                        <span className="text-amber-400 font-mono">{item.subCategory}</span>
                        {cardItemPower > 0 && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-sky-400">{cardItemPower} IP</span>
                          </>
                        )}
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                        T{item.minTier}-{item.maxTier}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      T{validTiers.includes(selectedTier) ? selectedTier : item.minTier}
                      {item.hasEnchantments && selectedEnchant > 0 ? `.${selectedEnchant}` : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Selected Item Detailed Inspector */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 h-fit sticky top-6">
          <div className="flex flex-col items-center text-center pb-4 border-b border-slate-800">
            <div className={`w-24 h-24 rounded-2xl bg-slate-900/90 border-2 p-2 flex items-center justify-center shadow-2xl mb-3 transition-all ${getEnchantBorder(selectedEnchant)}`}>
              <img
                src={`https://render.albiononline.com/v1/item/${canonicalItemId}.png`}
                alt={formattedItemName}
                className="w-full h-full object-contain"
              />
            </div>

            <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
              {formattedItemName}
            </h3>
            
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                Tier {selectedTier}{selectedEnchant > 0 ? `.${selectedEnchant}` : ""}
              </span>
              {itemPower > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
                  {itemPower} Base IP
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block mb-1">Item Lore & Notes</span>
              <p className="text-slate-300 text-[11px] leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                {getItemDescription(selectedItem, selectedTier)}
              </p>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between p-2 rounded-lg bg-slate-900/40 text-[11px]">
                <span className="text-slate-400">Canonical ID:</span>
                <span className="font-mono text-amber-400 select-all">{canonicalItemId}</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-900/40 text-[11px]">
                <span className="text-slate-400">Category:</span>
                <span className="text-slate-200">{selectedItem.category}</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-900/40 text-[11px]">
                <span className="text-slate-400">Sub-Category:</span>
                <span className="text-slate-200">{selectedItem.subCategory}</span>
              </div>
            </div>

            {/* Live Market Price Overview Widget */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" /> Live Market Summary
                </span>
                {isLoadingPrices && (
                  <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Lowest Sell Price</div>
                  <div className="text-emerald-400 font-bold font-mono text-xs mt-0.5">
                    {bestSell ? `${bestSell.sell_price_min.toLocaleString()} silver` : "No Orders"}
                  </div>
                  {bestSell && (
                    <div className="text-slate-500 text-[9px] mt-0.5 truncate">{bestSell.city}</div>
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Highest Buy Order</div>
                  <div className="text-sky-400 font-bold font-mono text-xs mt-0.5">
                    {bestBuy ? `${bestBuy.buy_price_max.toLocaleString()} silver` : "No Orders"}
                  </div>
                  {bestBuy && (
                    <div className="text-slate-500 text-[9px] mt-0.5 truncate">{bestBuy.city}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Button to Jump to Market & Trade */}
            <button
              onClick={handleOpenInTrade}
              className="w-full mt-3 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-500/20"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Inspect in Market & Trade Suite</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
