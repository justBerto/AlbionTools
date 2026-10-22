import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  X,
  RotateCcw,
  Filter,
  Layers,
  Star,
  Copy,
  Check,
  Scale,
  TrendingUp,
  Package,
  Info,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  Coins,
  List,
  LayoutGrid,
  Calendar,
  Award,
  ArrowUpDown,
  ExternalLink,
  Clock
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
  fetchItemPriceHistory,
  MarketPriceRecord,
  MarketHistoryLocationData,
  CITIES,
  AlbionServerRegion
} from "../../services/albionDataApi";

interface ItemSearchViewProps {
  onNavigateToTrade?: (item: CatalogItem, tier: number, enchant: number) => void;
}

type ViewMode = "table" | "grid";
type SortOption = "name_asc" | "name_desc" | "tier_desc" | "tier_asc" | "ip_desc";
type InspectorTab = "main" | "quality" | "history" | "info";

const QUALITY_NAMES: Record<number, string> = {
  1: "Normal",
  2: "Good",
  3: "Outstanding",
  4: "Excellent",
  5: "Masterpiece",
};

const CITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Bridgewatch: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
  Caerleon: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
  "Fort Sterling": { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30" },
  Lymhurst: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  Martlock: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  Thetford: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
  Brecilien: { bg: "bg-fuchsia-500/10", text: "text-fuchsia-400", border: "border-fuchsia-500/30" },
  "Black Market": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
};

const ITEMS_PER_PAGE = 40;

export const ItemSearchView: React.FC<ItemSearchViewProps> = ({ onNavigateToTrade }) => {
  const getInitialRegion = (): AlbionServerRegion => {
    const saved = localStorage.getItem("albiontools_server");
    if (saved?.includes("Asia")) return "Asia";
    if (saved?.includes("Americas")) return "Americas";
    return "Europe";
  };

  const [selectedRegion] = useState<AlbionServerRegion>(getInitialRegion);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("All");
  const [selectedTierFilter, setSelectedTierFilter] = useState<number | "All">("All");
  const [selectedEnchantFilter, setSelectedEnchantFilter] = useState<number | "All">("All");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(false);
  const [sortOption, setSortOption] = useState<SortOption>("name_asc");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Favorites (Persistent)
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("albiontools_favorite_items");
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch {}
    return new Set<string>();
  });

  const toggleFavorite = useCallback((itemId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      try {
        localStorage.setItem("albiontools_favorite_items", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  }, []);

  // Currently inspected item
  const [selectedItem, setSelectedItem] = useState<CatalogItem>(COMPLETE_ITEM_CATALOG[0]);
  const [inspectedTier, setInspectedTier] = useState<number>(4);
  const [inspectedEnchant, setInspectedEnchant] = useState<number>(0);
  const [selectedQuality, setSelectedQuality] = useState<number>(1);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("main");
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // Live market prices for inspected item
  const [prices, setPrices] = useState<MarketPriceRecord[]>([]);
  const [isLoadingPrices, setIsLoadingPrices] = useState<boolean>(false);
  const [lastPriceFetchTime, setLastPriceFetchTime] = useState<Date | null>(null);

  // Historical price data for inspected item
  const [historyData, setHistoryData] = useState<MarketHistoryLocationData[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [historyTimeScale, setHistoryTimeScale] = useState<number>(24); // 24 = daily

  // Available subcategories for chosen main category
  const availableSubCategories = useMemo(() => {
    if (selectedCategory === "All") return [];
    return SUBCATEGORIES_BY_MAIN[selectedCategory as MainCategory] || [];
  }, [selectedCategory]);

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedSubCategory("All");
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedSubCategory("All");
    setSelectedTierFilter("All");
    setSelectedEnchantFilter("All");
    setShowOnlyFavorites(false);
    setSortOption("name_asc");
    setCurrentPage(1);
  };

  // Inspect item handler
  const handleSelectItem = (item: CatalogItem, tier?: number, enchant?: number) => {
    setSelectedItem(item);
    const targetTier = tier ?? (inspectedTier < item.minTier || inspectedTier > item.maxTier ? item.minTier : inspectedTier);
    setInspectedTier(targetTier);
    const targetEnchant = item.hasEnchantments ? (enchant ?? inspectedEnchant) : 0;
    setInspectedEnchant(targetEnchant);
  };

  // Canonical unique name (e.g. T6_MAIN_SWORD@2)
  const canonicalItemId = useMemo(() => {
    return buildItemUniqueName(inspectedTier, selectedItem.id, inspectedEnchant);
  }, [inspectedTier, selectedItem, inspectedEnchant]);

  // Formatted display title (e.g. "T6.2 Adept's Broadsword")
  const formattedItemName = useMemo(() => {
    return getFormattedItemName(selectedItem, inspectedTier, inspectedEnchant);
  }, [selectedItem, inspectedTier, inspectedEnchant]);

  // Base Item Power
  const itemPower = useMemo(() => {
    return calculateItemPower(selectedItem, inspectedTier, inspectedEnchant);
  }, [selectedItem, inspectedTier, inspectedEnchant]);

  // Copy canonical ID
  const handleCopyCanonicalId = () => {
    try {
      navigator.clipboard.writeText(canonicalItemId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {}
  };

  // Fetch prices for inspected item
  const loadMarketPrices = useCallback(async () => {
    setIsLoadingPrices(true);
    const data = await fetchLiveMarketPrices(canonicalItemId, selectedRegion, [1, 2, 3, 4, 5]);
    setPrices(data);
    setLastPriceFetchTime(new Date());
    setIsLoadingPrices(false);
  }, [canonicalItemId, selectedRegion]);

  useEffect(() => {
    loadMarketPrices();
  }, [loadMarketPrices]);

  // Fetch history for inspected item when history tab is active
  useEffect(() => {
    if (inspectorTab !== "history") return;

    let isCancelled = false;
    const loadHistory = async () => {
      setIsLoadingHistory(true);
      const data = await fetchItemPriceHistory(canonicalItemId, selectedRegion, selectedQuality, historyTimeScale);
      if (!isCancelled) {
        setHistoryData(data);
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
    return () => {
      isCancelled = true;
    };
  }, [canonicalItemId, selectedRegion, selectedQuality, historyTimeScale, inspectorTab]);

  // Filter items in catalog
  const filteredCatalog = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return COMPLETE_ITEM_CATALOG.filter((item) => {
      if (showOnlyFavorites && !favorites.has(item.id)) {
        return false;
      }
      if (selectedCategory !== "All" && item.category !== selectedCategory) {
        return false;
      }
      if (
        selectedSubCategory !== "All" &&
        !selectedSubCategory.startsWith("All ") &&
        item.subCategory !== selectedSubCategory
      ) {
        return false;
      }
      if (selectedTierFilter !== "All") {
        if (selectedTierFilter < item.minTier || selectedTierFilter > item.maxTier) {
          return false;
        }
      }
      if (selectedEnchantFilter !== "All" && selectedEnchantFilter > 0 && !item.hasEnchantments) {
        return false;
      }
      if (q) {
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesId = item.id.toLowerCase().includes(q);
        const matchesSub = item.subCategory.toLowerCase().includes(q);
        const matchesTierName = item.tierNames
          ? Object.values(item.tierNames).some((tn) => tn.toLowerCase().includes(q))
          : false;
        if (!matchesName && !matchesId && !matchesSub && !matchesTierName) {
          return false;
        }
      }
      return true;
    });
  }, [
    searchQuery,
    selectedCategory,
    selectedSubCategory,
    selectedTierFilter,
    selectedEnchantFilter,
    showOnlyFavorites,
    favorites,
  ]);

  // Sorted catalog
  const sortedCatalog = useMemo(() => {
    const list = [...filteredCatalog];
    switch (sortOption) {
      case "name_asc":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name_desc":
        list.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "tier_desc":
        list.sort((a, b) => b.maxTier - a.maxTier);
        break;
      case "tier_asc":
        list.sort((a, b) => a.minTier - b.minTier);
        break;
      case "ip_desc":
        list.sort((a, b) => {
          const ipA = calculateItemPower(a, a.maxTier, a.hasEnchantments ? 4 : 0);
          const ipB = calculateItemPower(b, b.maxTier, b.hasEnchantments ? 4 : 0);
          return ipB - ipA;
        });
        break;
    }
    return list;
  }, [filteredCatalog, sortOption]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sortedCatalog.length / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedCatalog.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedCatalog, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Valid tiers for selected item
  const validTiers = useMemo(() => {
    if (!selectedItem.hasTiers) return [selectedItem.minTier];
    const tiers: number[] = [];
    for (let t = selectedItem.minTier; t <= selectedItem.maxTier; t++) {
      tiers.push(t);
    }
    return tiers;
  }, [selectedItem]);

  // Lowest sell price and highest buy order across cities
  const bestSell = useMemo(() => {
    const valid = prices.filter(
      (p) => p.quality === selectedQuality && p.sell_price_min > 0 && p.city !== "Black Market"
    );
    if (valid.length === 0) return null;
    return valid.reduce((prev, curr) => (prev.sell_price_min < curr.sell_price_min ? prev : curr));
  }, [prices, selectedQuality]);

  const bestBuy = useMemo(() => {
    const valid = prices.filter((p) => p.quality === selectedQuality && p.buy_price_max > 0);
    if (valid.length === 0) return null;
    return valid.reduce((prev, curr) => (prev.buy_price_max > curr.buy_price_max ? prev : curr));
  }, [prices, selectedQuality]);

  // Potential Arbitrage Profit Margin
  const arbitrageMargin = useMemo(() => {
    if (!bestSell || !bestBuy) return null;
    const diff = bestBuy.buy_price_max - bestSell.sell_price_min;
    const pct = bestSell.sell_price_min > 0 ? (diff / bestSell.sell_price_min) * 100 : 0;
    return { diff, pct };
  }, [bestSell, bestBuy]);

  // Jump to Trade Suite
  const handleOpenInTrade = () => {
    try {
      localStorage.setItem(
        "albiontools_selected_trade_item",
        JSON.stringify({
          itemId: selectedItem.id,
          tier: inspectedTier,
          enchant: inspectedEnchant,
        })
      );
      window.dispatchEvent(
        new CustomEvent("albiontools_navigate_trade", {
          detail: {
            item: selectedItem,
            tier: inspectedTier,
            enchant: inspectedEnchant,
          },
        })
      );
    } catch {}

    if (onNavigateToTrade) {
      onNavigateToTrade(selectedItem, inspectedTier, inspectedEnchant);
    }
  };

  // Enchantment color border
  const getEnchantBorder = (enchant: number) => {
    switch (enchant) {
      case 1:
        return "border-emerald-500/80 shadow-emerald-500/20";
      case 2:
        return "border-sky-500/80 shadow-sky-500/20";
      case 3:
        return "border-purple-500/80 shadow-purple-500/20";
      case 4:
        return "border-amber-400/90 shadow-amber-400/30";
      default:
        return "border-slate-800 shadow-slate-900/40";
    }
  };

  // Relative time formatter
  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr || dateStr.startsWith("0001")) return "Never";
    try {
      const d = new Date(dateStr);
      const diffMs = Date.now() - d.getTime();
      if (diffMs < 0) return "Just now";
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "< 1m ago";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return "Unknown";
    }
  };

  const getFreshnessColor = (dateStr: string) => {
    if (!dateStr || dateStr.startsWith("0001")) return "text-slate-600 bg-slate-800";
    try {
      const d = new Date(dateStr);
      const diffHours = (Date.now() - d.getTime()) / (1000 * 60 * 60);
      if (diffHours <= 2) return "text-emerald-400 bg-emerald-500/20";
      if (diffHours <= 24) return "text-amber-400 bg-amber-500/20";
      return "text-slate-400 bg-slate-800";
    } catch {
      return "text-slate-500 bg-slate-800";
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-80px)]">
      {/* Top Filter and Search Control Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 font-['Outfit'] flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-400" />
              <span>Item Database & Encyclopedia</span>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-mono font-semibold">
                {COMPLETE_ITEM_CATALOG.length} Items Indexed
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive encyclopedia with live multi-city market pricing, quality matrix, and price history trends.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode("table")}
                title="Table List View"
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === "table"
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                onClick={() => setViewMode("grid")}
                title="Grid Cards View"
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === "grid"
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>

            {/* Server Badge */}
            <div className="text-xs text-slate-400 bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Region: {selectedRegion}</span>
            </div>
          </div>
        </div>

        {/* Row 1: Search Input + Reset Button + Sort + Category Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, ID, or weapon type (e.g. Broadsword, T6, Wood)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="md:col-span-3">
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="bg-transparent text-xs text-slate-300 focus:outline-none w-full cursor-pointer"
              >
                <option value="name_asc" className="bg-slate-900">Name (A to Z)</option>
                <option value="name_desc" className="bg-slate-900">Name (Z to A)</option>
                <option value="tier_desc" className="bg-slate-900">Tier (Highest first)</option>
                <option value="tier_asc" className="bg-slate-900">Tier (Lowest first)</option>
                <option value="ip_desc" className="bg-slate-900">Base IP (Highest first)</option>
              </select>
            </div>
          </div>

          {/* Checkboxes: Favorites Only + Reset Button */}
          <div className="md:col-span-4 flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl transition-colors select-none">
              <input
                type="checkbox"
                checked={showOnlyFavorites}
                onChange={(e) => {
                  setShowOnlyFavorites(e.target.checked);
                  setCurrentPage(1);
                }}
                className="accent-amber-500 rounded"
              />
              <Star className={`w-3.5 h-3.5 ${showOnlyFavorites ? "text-amber-400 fill-amber-400" : "text-slate-500"}`} />
              <span className="font-medium">Only Favorites</span>
              <span className="text-[10px] text-slate-500 font-mono">({favorites.size})</span>
            </label>

            <button
              onClick={handleResetFilters}
              title="Reset all filters"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-amber-400 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Row 2: Category Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/60 overflow-x-auto text-xs pb-1">
          <span className="text-slate-500 text-[11px] font-semibold mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3 text-amber-400" /> Category:
          </span>
          {["All", "Weapons", "Armor", "Materials", "Accessories", "Consumables", "Mounts"].map((cat) => (
            <button
              key={cat}
              onClick={() => handleSelectCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-colors shrink-0 ${
                selectedCategory === cat
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                  : "bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Row 3: Subcategories Pills */}
        {availableSubCategories.length > 0 && (
          <div className="pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
              <span className="text-amber-400/90 text-[11px] font-semibold mr-1 shrink-0 flex items-center gap-1">
                <Layers className="w-3 h-3" /> Subcategory:
              </span>
              {availableSubCategories.map((sub) => {
                const isSelected = selectedSubCategory === sub;
                return (
                  <button
                    key={sub}
                    onClick={() => {
                      setSelectedSubCategory(sub);
                      setCurrentPage(1);
                    }}
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

        {/* Row 4: Tier Filter & Level/Enchantment Filter */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/60">
          <div className="flex flex-wrap items-center gap-5">
            {/* Tier Filters */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 font-semibold mr-1.5">Filter Tier:</span>
              <button
                onClick={() => {
                  setSelectedTierFilter("All");
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-mono text-xs font-semibold transition-colors ${
                  selectedTierFilter === "All"
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                All
              </button>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setSelectedTierFilter(t);
                    setInspectedTier(t);
                    setCurrentPage(1);
                  }}
                  className={`w-7 h-7 rounded-lg font-mono font-bold transition-colors ${
                    selectedTierFilter === t
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  T{t}
                </button>
              ))}
            </div>

            {/* Enchantment Filters */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 font-semibold mr-1.5">Enchantment:</span>
              <button
                onClick={() => {
                  setSelectedEnchantFilter("All");
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-mono text-xs font-semibold transition-colors ${
                  selectedEnchantFilter === "All"
                    ? "bg-sky-500 text-slate-950 font-bold"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                All
              </button>
              {[0, 1, 2, 3, 4].map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    setSelectedEnchantFilter(e);
                    setInspectedEnchant(e);
                    setCurrentPage(1);
                  }}
                  className={`w-7 h-7 rounded-lg font-mono font-bold transition-colors ${
                    selectedEnchantFilter === e
                      ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  .{e}
                </button>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            Catalog: <span className="font-bold text-amber-400">{filteredCatalog.length}</span> matches found
          </div>
        </div>
      </div>

      {/* Main Content: Split Grid with Items Catalog (Col 1 & 2) & Item Inspector (Col 3) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column (Items Catalog List / Grid) */}
        <div className="xl:col-span-7 space-y-4">
          {/* Catalog Container */}
          {sortedCatalog.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
              <Package className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-300">No items match your filter criteria</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try clearing the search term, selecting "All" categories, or resetting filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>
          ) : viewMode === "table" ? (
            /* Table View (Matching Upstream ListView) */
            <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase text-[10px] font-mono tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">Fav</th>
                      <th className="py-2.5 px-3 w-14 text-center">Icon</th>
                      <th className="py-2.5 px-4">Item Name</th>
                      <th className="py-2.5 px-3">Subcategory</th>
                      <th className="py-2.5 px-3 text-center">Tiers</th>
                      <th className="py-2.5 px-3 text-right">Power</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {paginatedItems.map((item) => {
                      const isSelected = selectedItem.id === item.id;
                      const isFav = favorites.has(item.id);
                      const currentTier =
                        selectedTierFilter !== "All"
                          ? selectedTierFilter
                          : inspectedTier >= item.minTier && inspectedTier <= item.maxTier
                          ? inspectedTier
                          : item.minTier;
                      const currentEnchant =
                        item.hasEnchantments && selectedEnchantFilter !== "All"
                          ? selectedEnchantFilter
                          : item.hasEnchantments
                          ? inspectedEnchant
                          : 0;
                      const tableItemUniqueName = buildItemUniqueName(currentTier, item.id, currentEnchant);
                      const tableItemPower = calculateItemPower(item, currentTier, currentEnchant);

                      return (
                        <tr
                          key={item.id}
                          onClick={() => handleSelectItem(item, currentTier, currentEnchant)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-amber-500/15 text-slate-100 border-l-4 border-l-amber-500"
                              : "hover:bg-slate-800/40 text-slate-300"
                          }`}
                        >
                          {/* Favorite Star */}
                          <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => toggleFavorite(item.id)}
                              className="p-1 text-slate-500 hover:text-amber-400 transition-colors"
                              title={isFav ? "Remove from favorites" : "Add to favorites"}
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  isFav ? "text-amber-400 fill-amber-400" : "hover:text-amber-400"
                                }`}
                              />
                            </button>
                          </td>

                          {/* Thumbnail Icon */}
                          <td className="py-2 px-3 text-center">
                            <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 p-0.5 mx-auto flex items-center justify-center shrink-0">
                              <img
                                src={`https://render.albiononline.com/v1/item/${tableItemUniqueName}.png`}
                                alt={item.name}
                                loading="lazy"
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            </div>
                          </td>

                          {/* Item Name */}
                          <td className="py-2 px-4">
                            <div className="font-bold text-xs text-slate-100 flex items-center gap-2">
                              <span>{item.name}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-amber-400">
                                T{currentTier}{item.hasEnchantments && currentEnchant > 0 ? `.${currentEnchant}` : ""}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate select-all">
                              {tableItemUniqueName}
                            </div>
                          </td>

                          {/* Subcategory */}
                          <td className="py-2 px-3 text-slate-400 text-xs">
                            <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[11px]">
                              {item.subCategory}
                            </span>
                          </td>

                          {/* Tier Range */}
                          <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-400">
                            T{item.minTier}{item.hasTiers && item.maxTier > item.minTier ? ` - T${item.maxTier}` : ""}
                          </td>

                          {/* Item Power */}
                          <td className="py-2 px-3 text-right font-mono text-[11px] text-sky-400 font-semibold">
                            {tableItemPower > 0 ? `${tableItemPower} IP` : "-"}
                          </td>

                          {/* Select Chevron */}
                          <td className="py-2 px-3 text-center">
                            <button
                              onClick={() => handleSelectItem(item, currentTier, currentEnchant)}
                              className={`p-1.5 rounded-lg text-xs transition-colors ${
                                isSelected
                                  ? "bg-amber-500 text-slate-950 font-bold"
                                  : "text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800"
                              }`}
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Grid Mode Cards */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[660px] overflow-y-auto pr-1">
              {paginatedItems.map((item) => {
                const isSelected = selectedItem.id === item.id;
                const isFav = favorites.has(item.id);
                const currentTier =
                  selectedTierFilter !== "All"
                    ? selectedTierFilter
                    : inspectedTier >= item.minTier && inspectedTier <= item.maxTier
                    ? inspectedTier
                    : item.minTier;
                const currentEnchant =
                  item.hasEnchantments && selectedEnchantFilter !== "All"
                    ? selectedEnchantFilter
                    : item.hasEnchantments
                    ? inspectedEnchant
                    : 0;
                const cardItemUniqueName = buildItemUniqueName(currentTier, item.id, currentEnchant);
                const cardItemPower = calculateItemPower(item, currentTier, currentEnchant);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectItem(item, currentTier, currentEnchant)}
                    className={`glass-panel p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "border-amber-500/80 bg-amber-500/10 shadow-lg shadow-amber-500/10"
                        : "border-slate-800 hover:border-slate-700 bg-slate-900/40"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 p-1 flex items-center justify-center shrink-0">
                        <img
                          src={`https://render.albiononline.com/v1/item/${cardItemUniqueName}.png`}
                          alt={item.name}
                          loading="lazy"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-100 truncate flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {isFav && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
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
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5 truncate select-all">
                          {cardItemUniqueName}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                        T{currentTier}{item.hasEnchantments && currentEnchant > 0 ? `.${currentEnchant}` : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="glass-panel p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="text-slate-400">
                Showing <span className="font-semibold text-slate-200">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
                <span className="font-semibold text-slate-200">
                  {Math.min(currentPage * ITEMS_PER_PAGE, sortedCatalog.length)}
                </span>{" "}
                of <span className="font-semibold text-amber-400">{sortedCatalog.length}</span> items
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="First Page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-3 py-1 font-mono font-semibold bg-slate-900 border border-slate-800 rounded-lg text-slate-200">
                  {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Last Page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Detailed Item Inspector (Matching Upstream ItemDetailsControl) */}
        <div className="xl:col-span-5">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 sticky top-6">
            {/* Inspector Header: Image, Title, Tier/Enchant Pills, Canonical ID, Refresh */}
            <div className="pb-4 border-b border-slate-800">
              <div className="flex items-start gap-4">
                {/* Large Item Icon with Enchantment Glow Ring */}
                <div
                  className={`w-20 h-20 rounded-2xl bg-slate-900/90 border-2 p-1.5 flex items-center justify-center shrink-0 transition-all ${getEnchantBorder(
                    inspectedEnchant
                  )}`}
                >
                  <img
                    src={`https://render.albiononline.com/v1/item/${canonicalItemId}.png`}
                    alt={formattedItemName}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-100 font-['Outfit'] truncate">
                      {formattedItemName}
                    </h3>

                    {/* Favorite Toggle Button */}
                    <button
                      onClick={() => toggleFavorite(selectedItem.id)}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                      title={favorites.has(selectedItem.id) ? "Remove Favorite" : "Add Favorite"}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          favorites.has(selectedItem.id) ? "text-amber-400 fill-amber-400" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {/* Badges: Tier, Category, SubCategory, IP */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700 font-mono">
                      Tier {inspectedTier}{inspectedEnchant > 0 ? `.${inspectedEnchant}` : ""}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                      {selectedItem.category}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                      {selectedItem.subCategory}
                    </span>
                    {itemPower > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
                        {itemPower} Base IP
                      </span>
                    )}
                  </div>

                  {/* Canonical ID with Copy Button */}
                  <div className="flex items-center justify-between gap-2 mt-2 pt-1 text-[11px] font-mono text-slate-400">
                    <span className="truncate select-all text-amber-400/90">{canonicalItemId}</span>
                    <button
                      onClick={handleCopyCanonicalId}
                      className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-amber-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded transition-colors shrink-0"
                      title="Copy Unique ID"
                    >
                      {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tier & Enchantment Switcher for Current Selected Item */}
              <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Tier buttons */}
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 text-[11px] font-semibold mr-1">Tier:</span>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((t) => {
                    const isValid = validTiers.includes(t);
                    return (
                      <button
                        key={t}
                        disabled={!isValid}
                        onClick={() => setInspectedTier(t)}
                        className={`w-6 h-6 rounded font-mono text-xs font-bold transition-colors ${
                          !isValid
                            ? "bg-slate-950 text-slate-700 border border-slate-900 cursor-not-allowed opacity-30"
                            : inspectedTier === t
                            ? "bg-amber-500 text-slate-950 shadow"
                            : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>

                {/* Enchantment buttons */}
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 text-[11px] font-semibold mr-1">Enchant:</span>
                  {[0, 1, 2, 3, 4].map((e) => {
                    const isEnabled = selectedItem.hasEnchantments !== false;
                    return (
                      <button
                        key={e}
                        disabled={!isEnabled}
                        onClick={() => setInspectedEnchant(e)}
                        className={`w-6 h-6 rounded font-mono text-xs font-bold transition-colors ${
                          !isEnabled
                            ? "bg-slate-950 text-slate-700 border border-slate-900 cursor-not-allowed opacity-30"
                            : inspectedEnchant === e
                            ? "bg-sky-500 text-slate-950 shadow"
                            : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                        }`}
                      >
                        .{e}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Inspector Navigation Tabs */}
            <div className="flex items-center border-b border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setInspectorTab("main")}
                className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                  inspectorTab === "main"
                    ? "border-amber-400 text-amber-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Market Prices</span>
              </button>
              <button
                onClick={() => setInspectorTab("quality")}
                className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                  inspectorTab === "quality"
                    ? "border-amber-400 text-amber-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Quality Matrix</span>
              </button>
              <button
                onClick={() => setInspectorTab("history")}
                className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                  inspectorTab === "history"
                    ? "border-amber-400 text-amber-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Price History</span>
              </button>
              <button
                onClick={() => setInspectorTab("info")}
                className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                  inspectorTab === "info"
                    ? "border-amber-400 text-amber-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>Lore & Specs</span>
              </button>
            </div>

            {/* TAB 1: Main City Market Overview */}
            {inspectorTab === "main" && (
              <div className="space-y-3.5">
                {/* Quality Selector & Refresh Button */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
                    <span className="text-slate-500 font-semibold mr-1">Quality:</span>
                    {[1, 2, 3, 4, 5].map((q) => (
                      <button
                        key={q}
                        onClick={() => setSelectedQuality(q)}
                        className={`px-2 py-0.5 rounded font-medium transition-colors ${
                          selectedQuality === q
                            ? "bg-amber-500 text-slate-950 font-bold"
                            : "bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800"
                        }`}
                      >
                        {QUALITY_NAMES[q]}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={loadMarketPrices}
                    disabled={isLoadingPrices}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-400 transition-colors disabled:opacity-50"
                    title="Refresh market prices"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPrices ? "animate-spin text-amber-400" : ""}`} />
                  </button>
                </div>

                {/* Best Value Summary Metrics */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Lowest Sell Offer</div>
                    <div className="text-emerald-400 font-bold font-mono text-sm mt-0.5">
                      {bestSell ? `${bestSell.sell_price_min.toLocaleString()} silver` : "No Orders"}
                    </div>
                    {bestSell && (
                      <div className="text-slate-400 text-[10px] mt-0.5 flex items-center justify-between">
                        <span>{bestSell.city}</span>
                        <span className="text-slate-500 font-mono">{formatTimeAgo(bestSell.sell_price_min_date)}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Highest Buy Order</div>
                    <div className="text-sky-400 font-bold font-mono text-sm mt-0.5">
                      {bestBuy ? `${bestBuy.buy_price_max.toLocaleString()} silver` : "No Orders"}
                    </div>
                    {bestBuy && (
                      <div className="text-slate-400 text-[10px] mt-0.5 flex items-center justify-between">
                        <span>{bestBuy.city}</span>
                        <span className="text-slate-500 font-mono">{formatTimeAgo(bestBuy.buy_price_max_date)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Arbitrage Spread Badge */}
                {arbitrageMargin && arbitrageMargin.diff > 0 && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5" /> Potential Market Spread:
                    </span>
                    <span className="font-mono font-bold text-emerald-300">
                      +{arbitrageMargin.diff.toLocaleString()} silver ({arbitrageMargin.pct.toFixed(1)}%)
                    </span>
                  </div>
                )}

                {/* All Cities Market Table */}
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                  <div className="max-h-[260px] overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase text-[9px] font-mono sticky top-0">
                        <tr>
                          <th className="py-2 px-3">City</th>
                          <th className="py-2 px-3 text-right">Min Sell</th>
                          <th className="py-2 px-3 text-right">Max Buy</th>
                          <th className="py-2 px-3 text-center">Freshness</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {CITIES.map((city) => {
                          const record = prices.find((p) => p.city === city && p.quality === selectedQuality);
                          const isBestSellCity = bestSell && bestSell.city === city && record && record.sell_price_min > 0;
                          const isBestBuyCity = bestBuy && bestBuy.city === city && record && record.buy_price_max > 0;
                          const cityColor = CITY_COLORS[city] || {
                            bg: "bg-slate-800",
                            text: "text-slate-300",
                            border: "border-slate-700",
                          };

                          return (
                            <tr key={city} className="hover:bg-slate-900/40">
                              <td className="py-2 px-3 font-semibold">
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] border ${cityColor.bg} ${cityColor.text} ${cityColor.border}`}
                                >
                                  {city}
                                </span>
                              </td>

                              <td className="py-2 px-3 text-right font-mono text-[11px]">
                                {record && record.sell_price_min > 0 ? (
                                  <span
                                    className={
                                      isBestSellCity
                                        ? "text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20"
                                        : "text-slate-200"
                                    }
                                  >
                                    {record.sell_price_min.toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="text-slate-600">-</span>
                                )}
                              </td>

                              <td className="py-2 px-3 text-right font-mono text-[11px]">
                                {record && record.buy_price_max > 0 ? (
                                  <span
                                    className={
                                      isBestBuyCity
                                        ? "text-sky-400 font-bold px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20"
                                        : "text-slate-300"
                                    }
                                  >
                                    {record.buy_price_max.toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="text-slate-600">-</span>
                                )}
                              </td>

                              <td className="py-2 px-3 text-center">
                                {record && (record.sell_price_min_date || record.buy_price_max_date) ? (
                                  <span
                                    className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full ${getFreshnessColor(
                                      record.sell_price_min_date || record.buy_price_max_date
                                    )}`}
                                  >
                                    <Clock className="w-2.5 h-2.5" />
                                    <span>
                                      {formatTimeAgo(record.sell_price_min_date || record.buy_price_max_date)}
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-slate-600 text-[10px]">-</span>
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
            )}

            {/* TAB 2: Quality Matrix Across Cities */}
            {inspectorTab === "quality" && (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-400">
                  Compare lowest sell prices across all 5 qualities for every royal and outlaw market.
                </p>

                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                  <div className="max-h-[300px] overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase text-[9px] font-mono sticky top-0">
                        <tr>
                          <th className="py-2 px-2.5">Location</th>
                          <th className="py-2 px-2 text-right">Q1 Normal</th>
                          <th className="py-2 px-2 text-right">Q2 Good</th>
                          <th className="py-2 px-2 text-right">Q3 Out.</th>
                          <th className="py-2 px-2 text-right">Q4 Exc.</th>
                          <th className="py-2 px-2 text-right">Q5 Master.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium font-mono text-[11px]">
                        {CITIES.map((city) => {
                          return (
                            <tr key={city} className="hover:bg-slate-900/40">
                              <td className="py-2 px-2.5 font-sans font-semibold text-slate-300">
                                {city}
                              </td>
                              {[1, 2, 3, 4, 5].map((q) => {
                                const match = prices.find((p) => p.city === city && p.quality === q);
                                const hasPrice = match && match.sell_price_min > 0;
                                return (
                                  <td
                                    key={q}
                                    className={`py-2 px-2 text-right ${
                                      hasPrice ? "text-slate-200" : "text-slate-600"
                                    }`}
                                  >
                                    {hasPrice ? match.sell_price_min.toLocaleString() : "-"}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Price History Trends & Volume */}
            {inspectorTab === "history" && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-[11px] font-semibold">Scale:</span>
                    <button
                      onClick={() => setHistoryTimeScale(24)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                        historyTimeScale === 24
                          ? "bg-amber-500 text-slate-950 font-bold"
                          : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                      }`}
                    >
                      Daily (24h)
                    </button>
                    <button
                      onClick={() => setHistoryTimeScale(1)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                        historyTimeScale === 1
                          ? "bg-amber-500 text-slate-950 font-bold"
                          : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                      }`}
                    >
                      Hourly (1h)
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono">
                    Quality {QUALITY_NAMES[selectedQuality]}
                  </span>
                </div>

                {isLoadingHistory ? (
                  <div className="p-8 text-center text-slate-500 space-y-2">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-400" />
                    <div className="text-xs">Fetching history from Albion Data Project...</div>
                  </div>
                ) : historyData.length === 0 || !historyData.some((h) => h.data && h.data.length > 0) ? (
                  <div className="p-8 text-center text-slate-500 border border-slate-800 rounded-xl bg-slate-950/40 space-y-1">
                    <Calendar className="w-6 h-6 mx-auto text-slate-600 mb-1" />
                    <div className="text-xs font-semibold text-slate-400">No Historical Records Found</div>
                    <div className="text-[10px] text-slate-500">
                      Historical trade volume was not submitted for this quality on {selectedRegion}.
                    </div>
                  </div>
                ) : (
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 max-h-[280px] overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase text-[9px] font-mono sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Location</th>
                          <th className="py-2 px-3">Timestamp</th>
                          <th className="py-2 px-3 text-right">Avg Price</th>
                          <th className="py-2 px-3 text-right">Volume</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {historyData.flatMap((loc) =>
                          (loc.data || []).slice(-5).map((point, idx) => (
                            <tr key={`${loc.location}-${idx}`} className="hover:bg-slate-900/40">
                              <td className="py-1.5 px-3 font-semibold text-slate-300">
                                {loc.location}
                              </td>
                              <td className="py-1.5 px-3 font-mono text-[10px] text-slate-500">
                                {new Date(point.timestamp).toLocaleDateString()}{" "}
                                {new Date(point.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono text-emerald-400 font-semibold">
                                {point.avg_price.toLocaleString()}
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono text-sky-400">
                                {point.item_count.toLocaleString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Lore & Specifications */}
            {inspectorTab === "info" && (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Item Lore & Notes</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                    {getItemDescription(selectedItem, inspectedTier)}
                  </p>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between p-2 rounded-lg bg-slate-900/40 text-[11px]">
                    <span className="text-slate-400">Canonical Identifier:</span>
                    <span className="font-mono text-amber-400 select-all font-semibold">{canonicalItemId}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-900/40 text-[11px]">
                    <span className="text-slate-400">Main Category:</span>
                    <span className="text-slate-200">{selectedItem.category}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-900/40 text-[11px]">
                    <span className="text-slate-400">Sub-Category:</span>
                    <span className="text-slate-200">{selectedItem.subCategory}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-900/40 text-[11px]">
                    <span className="text-slate-400">Tier Availability:</span>
                    <span className="font-mono text-slate-200">
                      T{selectedItem.minTier} to T{selectedItem.maxTier}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-900/40 text-[11px]">
                    <span className="text-slate-400">Enchantable:</span>
                    <span className="text-slate-200">{selectedItem.hasEnchantments ? "Yes (up to .4)" : "No"}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-900/40 text-[11px]">
                    <span className="text-slate-400">Base Item Power:</span>
                    <span className="font-mono text-sky-400 font-bold">{itemPower > 0 ? `${itemPower} IP` : "-"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Action Footer */}
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={handleOpenInTrade}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-500/20"
              >
                <Scale className="w-4 h-4" />
                <span>Inspect in Market & Trade Suite</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
