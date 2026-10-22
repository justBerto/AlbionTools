import React, { useState, useMemo } from "react";
import { 
  Clock, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Trophy,
  Search,
  Filter,
  Layers,
  Coins,
  ShieldCheck,
  Package,
  Trash2
} from "lucide-react";
import { 
  SessionStats, 
  LootItem, 
  GameStatus, 
  ChestCategoryData, 
  SessionHistoryPoint,
  SavedSession
} from "../../types";
import { ZoneHistoryEntry } from "../map-history/MapHistoryView";
import { HistoryChart } from "./HistoryChart";

interface DashboardViewProps {
  stats: SessionStats;
  recentLoot: LootItem[];
  onResetSession?: () => void;
  gameStatus?: GameStatus;
  mapHistory?: ZoneHistoryEntry[];
  chestsData?: Record<string, ChestCategoryData>;
  activeContents?: string[];
  sessionHistory?: SessionHistoryPoint[];
  savedSessions?: SavedSession[];
  selectedSessionId?: string;
  onSelectSession?: (id: string) => void;
  onDeleteSession?: (id: string) => void;
  resetOnMapChange?: boolean;
  onToggleResetOnMapChange?: (val: boolean) => void;
  isLiveSession?: boolean;
}

interface FactionOption {
  id: string;
  name: string;
  seal: string;
  coin: string;
  points: number;
  pointsPerHour: number;
  standing: number;
  standingPerHour: number;
}

const FACTIONS: FactionOption[] = [
  { id: "bridgewatch", name: "Bridgewatch", seal: "/assets/seal_bridgewatch.png", coin: "/assets/factioncoin_bridgewatch.png", points: 0, pointsPerHour: 0, standing: 0, standingPerHour: 0 },
  { id: "martlock", name: "Martlock", seal: "/assets/seal_martlock.png", coin: "/assets/factioncoin_martlock.png", points: 0, pointsPerHour: 0, standing: 0, standingPerHour: 0 },
  { id: "lymhurst", name: "Lymhurst", seal: "/assets/seal_lymhurst.png", coin: "/assets/factioncoin_lymhurst.png", points: 0, pointsPerHour: 0, standing: 0, standingPerHour: 0 },
  { id: "fortsterling", name: "Fort Sterling", seal: "/assets/seal_fortsterling.png", coin: "/assets/factioncoin_fortsterling.png", points: 0, pointsPerHour: 0, standing: 0, standingPerHour: 0 },
  { id: "thetford", name: "Thetford", seal: "/assets/seal_thetford.png", coin: "/assets/factioncoin_thetford.png", points: 0, pointsPerHour: 0, standing: 0, standingPerHour: 0 },
  { id: "caerleon", name: "Caerleon", seal: "/assets/seal_caerleon.png", coin: "/assets/factioncoin_caerleon.png", points: 0, pointsPerHour: 0, standing: 0, standingPerHour: 0 },
];

export const ALL_CONTENT_CATEGORIES = [
  { id: "solo", name: "Solo Dungeon", icon: "/assets/dungeon.png" },
  { id: "standard", name: "Standard Dungeon", icon: "/assets/static_chest.png" },
  { id: "avalonian_dungeon", name: "Avalonian Dungeon", icon: "/assets/ava_chest.png" },
  { id: "static", name: "Static Dungeon", icon: "/assets/static_chest.png" },
  { id: "avalonian_roads", name: "Avalonian Roads", icon: "/assets/ava_chest.png" },
  { id: "hellgate", name: "Hellgate", icon: "/assets/hellgate.png" },
  { id: "corrupted", name: "Corrupted Dungeon", icon: "/assets/corrupted_dungeon.png" },
  { id: "expedition", name: "Expedition", icon: "/assets/dungeon.png" },
  { id: "mists", name: "Mists", icon: "/assets/mists_dungeon.png" },
  { id: "mists_dungeon", name: "Mists Dungeon", icon: "/assets/mists_dungeon.png" },
  { id: "abyssal_depths", name: "Abyssal Depths", icon: "/assets/abyssal_depths.png" },
  { id: "ancient_lands", name: "Ancient Lands", icon: "/assets/ancient_lands_portal_small.png" },
  { id: "open_world", name: "Open World", icon: "/assets/openworld_chests.png" },
  { id: "arena", name: "Arena", icon: "/assets/combat_swords.png" },
  { id: "others", name: "Others", icon: "/assets/bag.png" },
];

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  stats, 
  recentLoot, 
  onResetSession,
  gameStatus,
  mapHistory = [],
  chestsData = {},
  activeContents = [],
  sessionHistory = [],
  savedSessions = [],
  selectedSessionId = "live",
  onSelectSession,
  onDeleteSession,
  resetOnMapChange = false,
  onToggleResetOnMapChange,
  isLiveSession = true
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "loot" | "combat" | "economy" | "mobs">("overview");
  const [timeRange, setTimeRange] = useState("all-time");
  const [contentFilter, setContentFilter] = useState("all");

  // Collapsible sections state
  const [collapseRankings, setCollapseRankings] = useState(false);
  const [collapseChests, setCollapseChests] = useState(false);
  const [collapseImportantLoot, setCollapseImportantLoot] = useState(false);
  const [collapseHistory, setCollapseHistory] = useState(false);

  // Looted Chests dynamic tab state
  const [selectedChestTab, setSelectedChestTab] = useState<string>("all_active");

  // Important Loot view & filter state
  const [lootSubTab, setLootSubTab] = useState<"recent" | "valuable">("recent");
  const [minLootValue, setMinLootValue] = useState<number>(0);
  const [lootSearchQuery, setLootSearchQuery] = useState<string>("");
  const [selectedQuality, setSelectedQuality] = useState<string>("all");

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "k";
    return num.toLocaleString();
  };

  // Determine detected active contents based on sniffer data
  const detectedActiveContents = useMemo(() => {
    const list: string[] = [];

    // Add any content explicitly registered in activeContents
    activeContents.forEach((c) => {
      if (!list.includes(c)) list.push(c);
    });

    // Check if any category has recorded chests or loot
    Object.keys(chestsData).forEach((cat) => {
      const data = chestsData[cat];
      const totalCount = (data?.green || 0) + (data?.blue || 0) + (data?.purple || 0) + (data?.gold || 0);
      if ((totalCount > 0 || (data?.totalLootValue || 0) > 0 || (data?.mapsCount || 0) > 0) && !list.includes(cat)) {
        list.push(cat);
      }
    });

    // Check current zone from gameStatus (only if location is actually detected and in world)
    if (gameStatus?.isLocationDetected && gameStatus?.currentZone && gameStatus.currentZone !== "Not in World") {
      const z = gameStatus.currentZone.toLowerCase();
      if ((z.includes("random dungeon") || z.includes("solo")) && !list.includes("Solo Dungeon")) {
        list.push("Solo Dungeon");
      } else if (z.includes("corrupted") && !list.includes("Corrupted Dungeon")) {
        list.push("Corrupted Dungeon");
      } else if (z.includes("hellgate") && !list.includes("Hellgate")) {
        list.push("Hellgate");
      } else if ((z.includes("mists") || gameStatus.zoneDanger === "Mists") && !list.includes("Mists")) {
        list.push("Mists");
      } else if (gameStatus.zoneDanger === "Avalon" && !list.includes("Avalonian Roads")) {
        list.push("Avalonian Roads");
      } else if (list.length === 0) {
        list.push("Open World");
      }
    }

    return list;
  }, [activeContents, chestsData, gameStatus]);

  const handleContentFilterChange = (val: string) => {
    setContentFilter(val);
    if (val === "all") {
      setSelectedChestTab("all_active");
    } else {
      setSelectedChestTab(val);
    }
  };

  // Overall Chest totals across all categories
  const overallChestTotals = useMemo(() => {
    let green = 0;
    let blue = 0;
    let purple = 0;
    let gold = 0;
    let totalLootValue = 0;

    Object.values(chestsData).forEach((cat) => {
      green += cat.green;
      blue += cat.blue;
      purple += cat.purple;
      gold += cat.gold;
      totalLootValue += cat.totalLootValue;
    });

    const totalCount = green + blue + purple + gold;
    return { green, blue, purple, gold, totalCount, totalLootValue };
  }, [chestsData]);

  // Important Loot metrics
  const totalLootedValue = useMemo(() => {
    return recentLoot.reduce((sum, item) => sum + (item.estimatedValue * item.amount), 0);
  }, [recentLoot]);

  const avgLootValue = useMemo(() => {
    return recentLoot.length > 0 ? Math.round(totalLootedValue / recentLoot.length) : 0;
  }, [recentLoot, totalLootedValue]);

  const lootPerHour = useMemo(() => {
    if (stats.uptimeSeconds < 60) return totalLootedValue;
    return Math.round((totalLootedValue / stats.uptimeSeconds) * 3600);
  }, [totalLootedValue, stats.uptimeSeconds]);

  // Top Most Valuable Loot Items (sorted descending)
  const mostValuableLoot = useMemo(() => {
    return [...recentLoot]
      .sort((a, b) => (b.estimatedValue * b.amount) - (a.estimatedValue * a.amount))
      .filter((item) => {
        const passesVal = (item.estimatedValue * item.amount) >= minLootValue;
        const passesSearch = !lootSearchQuery || item.name.toLowerCase().includes(lootSearchQuery.toLowerCase());
        const passesQuality = selectedQuality === "all" || item.quality.toString() === selectedQuality;
        return passesVal && passesSearch && passesQuality;
      })
      .slice(0, 20);
  }, [recentLoot, minLootValue, lootSearchQuery, selectedQuality]);

  // Filtered Recently Looted Items
  const filteredRecentLoot = useMemo(() => {
    return recentLoot.filter((item) => {
      const passesVal = (item.estimatedValue * item.amount) >= minLootValue;
      const passesSearch = !lootSearchQuery || item.name.toLowerCase().includes(lootSearchQuery.toLowerCase());
      const passesQuality = selectedQuality === "all" || item.quality.toString() === selectedQuality;
      return passesVal && passesSearch && passesQuality;
    });
  }, [recentLoot, minLootValue, lootSearchQuery, selectedQuality]);

  // Helper to render an individual Content Chest Card
  const renderChestCard = (categoryName: string) => {
    const data: ChestCategoryData = chestsData[categoryName] || {
      category: categoryName,
      icon: ALL_CONTENT_CATEGORIES.find((c) => c.name === categoryName)?.icon || "/assets/static_chest.png",
      green: 0,
      blue: 0,
      purple: 0,
      gold: 0,
      totalLootValue: 0,
      mapsCount: 0,
    };

    const totalCategoryChests = data.green + data.blue + data.purple + data.gold;
    const valueShare = overallChestTotals.totalLootValue > 0
      ? ((data.totalLootValue / overallChestTotals.totalLootValue) * 100).toFixed(1)
      : "0.0";

    const avgChestsPerMap = data.mapsCount > 0 ? (totalCategoryChests / data.mapsCount).toFixed(2) : "0.00";
    const isActiveInSession = detectedActiveContents.includes(categoryName);

    return (
      <div 
        key={categoryName}
        className="glass-card rounded-2xl border border-slate-800 p-4 space-y-4 hover:border-slate-700 transition-colors"
      >
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
          <div className="flex items-center gap-2.5">
            <img src={data.icon} alt={categoryName} className="w-6 h-6 object-contain" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-100 font-['Outfit']">
                  {categoryName}
                </span>
                {isActiveInSession && (
                  <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Active in Session</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right font-mono text-[11px] text-slate-400">
            <span>{data.mapsCount} {data.mapsCount === 1 ? "Map" : "Maps"} Visited</span>
          </div>
        </div>

        {/* Card Body: Left Hero Metrics + Right 4 Chest Rarities */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          {/* Left Column: Big total & Averages */}
          <div className="md:col-span-2 space-y-1">
            <div className="text-3xl font-extrabold text-slate-100 font-['Outfit']">
              {totalCategoryChests}
            </div>
            <div className="text-xs font-mono text-slate-300">
              <span className="font-bold text-amber-400">
                {formatNumber(data.totalLootValue)} Silver
              </span>{" "}
              <span className="text-slate-400">({valueShare}%)</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 pt-0.5">
              Average / Maps: <strong className="text-slate-200">{avgChestsPerMap}</strong>
            </div>
          </div>

          {/* Right 4 Columns: Green, Blue, Purple, Gold */}
          <div className="md:col-span-3 grid grid-cols-4 gap-2 text-center font-mono">
            {/* Standard / Green */}
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 flex flex-col items-center justify-between space-y-1.5 hover:border-emerald-500/30 transition-colors">
              <img src="/assets/chest_green.png" alt="Standard" className="w-6 h-6 object-contain" />
              <div className="text-base font-bold text-emerald-400 font-['Outfit']">
                {data.green}
              </div>
              <div className="text-[10px] text-slate-400">
                {totalCategoryChests > 0 ? `${Math.round((data.green / totalCategoryChests) * 100)}%` : "0%"}
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full" 
                  style={{ width: `${totalCategoryChests > 0 ? (data.green / totalCategoryChests) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Uncommon / Blue */}
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 flex flex-col items-center justify-between space-y-1.5 hover:border-sky-500/30 transition-colors">
              <img src="/assets/chest_blue.png" alt="Uncommon" className="w-6 h-6 object-contain" />
              <div className="text-base font-bold text-sky-400 font-['Outfit']">
                {data.blue}
              </div>
              <div className="text-[10px] text-slate-400">
                {totalCategoryChests > 0 ? `${Math.round((data.blue / totalCategoryChests) * 100)}%` : "0%"}
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-sky-500 rounded-full" 
                  style={{ width: `${totalCategoryChests > 0 ? (data.blue / totalCategoryChests) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Rare / Purple */}
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 flex flex-col items-center justify-between space-y-1.5 hover:border-purple-500/30 transition-colors">
              <img src="/assets/chest_purple.png" alt="Rare" className="w-6 h-6 object-contain" />
              <div className="text-base font-bold text-purple-400 font-['Outfit']">
                {data.purple}
              </div>
              <div className="text-[10px] text-slate-400">
                {totalCategoryChests > 0 ? `${Math.round((data.purple / totalCategoryChests) * 100)}%` : "0%"}
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full" 
                  style={{ width: `${totalCategoryChests > 0 ? (data.purple / totalCategoryChests) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Legendary / Gold */}
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 flex flex-col items-center justify-between space-y-1.5 hover:border-amber-500/30 transition-colors">
              <img src="/assets/chest_gold.png" alt="Legendary" className="w-6 h-6 object-contain" />
              <div className="text-base font-bold text-amber-400 font-['Outfit']">
                {data.gold}
              </div>
              <div className="text-[10px] text-slate-400">
                {totalCategoryChests > 0 ? `${Math.round((data.gold / totalCategoryChests) * 100)}%` : "0%"}
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-400 rounded-full" 
                  style={{ width: `${totalCategoryChests > 0 ? (data.gold / totalCategoryChests) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-80px)] select-none">
      {/* Top Filter Bar (Time Range, Content, Session, Reset on Map Change, Reset Session) */}
      <div className="glass-panel p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Time Range */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Time Range
            </span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer min-w-[125px]"
            >
              <option value="all-time">All Time</option>
              <option value="10m">10 Minutes</option>
              <option value="30m">30 Minutes</option>
              <option value="1h">1 Hour</option>
              <option value="2h">2 Hours</option>
            </select>
          </div>

          <div className="h-7 w-px bg-slate-800" />

          {/* Content Filter */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Content
            </span>
            <select
              value={contentFilter}
              onChange={(e) => handleContentFilterChange(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer min-w-[155px]"
            >
              <option value="all">All content</option>
              {ALL_CONTENT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} {detectedActiveContents.includes(c.name) ? "(Active)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="h-7 w-px bg-slate-800" />

          {/* Session Filter */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Session
            </span>
            <div className="flex items-center gap-1.5">
              <select
                value={selectedSessionId || "live"}
                onChange={(e) => onSelectSession?.(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer min-w-[190px] max-w-[280px] truncate"
              >
                <option value="all">All sessions</option>
                <option value="live">Current Session</option>
                {savedSessions && savedSessions.length > 0 && (
                  <optgroup label="Saved Sessions">
                    {savedSessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>

              {/* If a past saved session is selected, offer quick delete button */}
              {selectedSessionId !== "live" && selectedSessionId !== "all" && (
                <button
                  onClick={() => {
                    const target = savedSessions?.find((s) => s.id === selectedSessionId);
                    if (target && window.confirm(`Delete saved session "${target.name}"?`)) {
                      onDeleteSession?.(selectedSessionId);
                    }
                  }}
                  title="Delete this saved session"
                  className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="h-7 w-px bg-slate-800" />

          {/* Reset on Map Change toggle */}
          <div className="flex items-center gap-2 pt-3">
            <input
              type="checkbox"
              id="mapReset"
              checked={resetOnMapChange || false}
              onChange={(e) => onToggleResetOnMapChange?.(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="mapReset" className="text-xs text-slate-300 cursor-pointer select-none">
              Reset session on map change
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onResetSession?.()}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-slate-100 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/70 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Session</span>
          </button>
        </div>
      </div>

      {/* Main Tab Selector (Dashboard / Loot / Combat / Economy / Mobs) */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "overview"
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab("loot")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "loot"
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
          }`}
        >
          <img src="/assets/static_chest.png" alt="Loot" className="w-3.5 h-3.5 object-contain" />
          <span>Loot</span>
        </button>

        <button
          onClick={() => setActiveTab("combat")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "combat"
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
          }`}
        >
          <img src="/assets/combat_swords.png" alt="Combat" className="w-3.5 h-3.5 object-contain" />
          <span>Combat</span>
        </button>

        <button
          onClick={() => setActiveTab("economy")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "economy"
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
          }`}
        >
          <img src="/assets/gold.png" alt="Economy" className="w-3.5 h-3.5 object-contain" />
          <span>Economy</span>
        </button>

        <button
          onClick={() => setActiveTab("mobs")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "mobs"
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
          }`}
        >
          <img src="/assets/skull_gold.png" alt="Mobs" className="w-3.5 h-3.5 object-contain" />
          <span>Mobs</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Top 6 Summary Cards (Fame, ReSpec, Silver, Might, Favor, Session Time) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Fame */}
            <div className="glass-card p-3.5 rounded-xl border border-slate-800 hover:border-amber-500/40 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <img src="/assets/fame.png" alt="Fame" className="w-5 h-5 object-contain" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Fame</span>
              </div>
              <div className="text-xl font-extrabold text-slate-100 font-['Outfit']">
                {formatNumber(stats.totalFame)}
              </div>
              <div className="mt-1 text-[11px] font-mono text-amber-400">
                +{formatNumber(stats.famePerHour)} / h
              </div>
            </div>

            {/* ReSpec */}
            <div className="glass-card p-3.5 rounded-xl border border-slate-800 hover:border-sky-500/40 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <img src="/assets/respec.png" alt="ReSpec" className="w-5 h-5 object-contain" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">ReSpec</span>
              </div>
              <div className="text-xl font-extrabold text-slate-100 font-['Outfit']">
                {formatNumber(stats.reSpecPoints)}
              </div>
              <div className="mt-1 text-[11px] font-mono text-sky-400">
                +{formatNumber(stats.reSpecPerHour)} / h
              </div>
            </div>

            {/* Silver */}
            <div className="glass-card p-3.5 rounded-xl border border-slate-800 hover:border-yellow-500/40 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <img src="/assets/silver.png" alt="Silver" className="w-5 h-5 object-contain" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Silver</span>
              </div>
              <div className="text-xl font-extrabold text-slate-100 font-['Outfit']">
                {formatNumber(stats.totalSilver)}
              </div>
              <div className="mt-1 text-[11px] font-mono text-yellow-400">
                +{formatNumber(stats.silverPerHour)} / h
              </div>
            </div>

            {/* Might */}
            <div className="glass-card p-3.5 rounded-xl border border-slate-800 hover:border-purple-500/40 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <img src="/assets/might.png" alt="Might" className="w-5 h-5 object-contain" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Might</span>
              </div>
              <div className="text-xl font-extrabold text-slate-100 font-['Outfit']">
                {formatNumber(stats.might)}
              </div>
              <div className="mt-1 text-[11px] font-mono text-purple-400">
                +{formatNumber(stats.mightPerHour)} / h
              </div>
            </div>

            {/* Favor */}
            <div className="glass-card p-3.5 rounded-xl border border-slate-800 hover:border-cyan-500/40 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <img src="/assets/favor.png" alt="Favor" className="w-5 h-5 object-contain" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Favor</span>
              </div>
              <div className="text-xl font-extrabold text-slate-100 font-['Outfit']">
                {formatNumber(stats.favor)}
              </div>
              <div className="mt-1 text-[11px] font-mono text-cyan-400">
                +{formatNumber(stats.favorPerHour)} / h
              </div>
            </div>

            {/* Session Time */}
            <div className="glass-card p-3.5 rounded-xl border border-slate-800 hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <Clock className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Session</span>
              </div>
              <div className="text-xl font-extrabold text-slate-100 font-['Outfit']">
                {Math.floor(stats.uptimeSeconds / 3600)}h {Math.floor((stats.uptimeSeconds % 3600) / 60)}m
              </div>
              <div className="mt-1 text-[11px] font-mono text-emerald-400">
                Live Tracking
              </div>
            </div>
          </div>

          {/* SECTION 1: LOOTED CHESTS (Gambar 1 Rebuild with Dynamic Sniffer Tabs) */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            {/* Header */}
            <div 
              onClick={() => setCollapseChests(!collapseChests)}
              className="h-12 px-4 bg-slate-900/70 border-b border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-900/90 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <img src="/assets/static_chest.png" alt="Chests" className="w-5 h-5 object-contain" />
                <span className="text-sm font-bold text-slate-100 font-['Outfit']">
                  Looted Chests
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {detectedActiveContents.length} Content Types Active
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-slate-400">
                  Total Chests: <strong className="text-slate-100">{overallChestTotals.totalCount}</strong>
                </span>
                <span className="text-amber-400 font-bold">
                  {formatNumber(overallChestTotals.totalLootValue)} Silver
                </span>
                {collapseChests ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
              </div>
            </div>

            {!collapseChests && (
              <div className="p-4 space-y-4">
                {/* Dynamic Sniffer-Driven Tabs Row */}
                <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* All Active Tab */}
                    <button
                      onClick={() => setSelectedChestTab("all_active")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        selectedChestTab === "all_active"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>All Active ({detectedActiveContents.length})</span>
                    </button>

                    {/* Detected Active Content Tabs from Sniffer */}
                    {detectedActiveContents.map((catName) => {
                      const catData = chestsData[catName];
                      const count = catData ? (catData.green + catData.blue + catData.purple + catData.gold) : 0;
                      const isSelected = selectedChestTab === catName;
                      const icon = ALL_CONTENT_CATEGORIES.find((c) => c.name === catName)?.icon || "/assets/static_chest.png";

                      return (
                        <button
                          key={catName}
                          onClick={() => setSelectedChestTab(catName)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                            isSelected
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                              : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
                          }`}
                        >
                          <img src={icon} alt="" className="w-3.5 h-3.5 object-contain" />
                          <span>{catName}</span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${isSelected ? "bg-amber-500/30 text-amber-200" : "bg-slate-800 text-slate-400"}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Browse / Switch to Any Other Category Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-sans">Browse:</span>
                    <select
                      value={selectedChestTab}
                      onChange={(e) => setSelectedChestTab(e.target.value)}
                      className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="all_active">All Active Content</option>
                      {ALL_CONTENT_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} {detectedActiveContents.includes(c.name) ? "(Active)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Display Cards */}
                <div className="space-y-3">
                  {selectedChestTab === "all_active" ? (
                    <div className="grid grid-cols-1 gap-3">
                      {detectedActiveContents.length > 0 ? (
                        detectedActiveContents.map((catName) => renderChestCard(catName))
                      ) : (
                        <div className="py-10 text-center text-slate-500 text-xs bg-slate-900/30 rounded-xl border border-slate-800/80 space-y-1.5">
                          <img src="/assets/static_chest.png" alt="" className="w-8 h-8 object-contain mx-auto opacity-50 mb-1" />
                          <p className="font-semibold text-slate-300">No Active Content Detected in This Session</p>
                          <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                            Looted chests and active activities will automatically show up when detected by the sniffer. You can also pick a specific category from the Browse selector above.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    renderChestCard(selectedChestTab)
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: IMPORTANT LOOT (Gambar 2 Rebuild) */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            {/* Header */}
            <div 
              onClick={() => setCollapseImportantLoot(!collapseImportantLoot)}
              className="h-12 px-4 bg-slate-900/70 border-b border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-900/90 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Coins className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-bold text-slate-100 font-['Outfit']">
                  Important Loot
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {recentLoot.length} Items Captured
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-slate-400">
                  Total Value: <strong className="text-amber-400">{formatNumber(totalLootedValue)} Silver</strong>
                </span>
                {collapseImportantLoot ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
              </div>
            </div>

            {!collapseImportantLoot && (
              <div className="p-4 space-y-4">
                {/* Top Summary KPI Cards (Total Looted Value & Average Loot Value) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Total Looted Value */}
                  <div className="glass-card p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
                    <img src="/assets/silver.png" alt="Looted Value" className="w-7 h-7 object-contain" />
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                        Total Looted Value
                      </span>
                      <div className="text-lg font-extrabold text-slate-100 font-mono">
                        {formatNumber(totalLootedValue)} Silver
                      </div>
                      <div className="text-[11px] font-mono text-amber-400">
                        +{formatNumber(lootPerHour)} / h
                      </div>
                    </div>
                  </div>

                  {/* Average Loot Value */}
                  <div className="glass-card p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
                    <img src="/assets/treasure.png" alt="Average Value" className="w-7 h-7 object-contain" />
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                        Average Loot Value
                      </span>
                      <div className="text-lg font-extrabold text-slate-100 font-mono">
                        {formatNumber(avgLootValue)} Silver
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Per item drop across session
                      </div>
                    </div>
                  </div>

                  {/* Most Valuable Drop Banner */}
                  <div className="glass-card p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
                    <Trophy className="w-7 h-7 text-amber-400" />
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                        Top Jackpot Drop
                      </span>
                      <div className="text-sm font-bold text-slate-100 truncate">
                        {mostValuableLoot[0] ? mostValuableLoot[0].name : "No Drops Yet"}
                      </div>
                      <div className="text-[11px] font-mono text-amber-400 font-bold">
                        {mostValuableLoot[0] ? `${formatNumber(mostValuableLoot[0].estimatedValue * mostValuableLoot[0].amount)} Silver` : "0 Silver"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-tabs Selector & Filters Bar */}
                <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLootSubTab("recent")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        lootSubTab === "recent"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
                      }`}
                    >
                      Recently Looted Items ({filteredRecentLoot.length})
                    </button>

                    <button
                      onClick={() => setLootSubTab("valuable")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        lootSubTab === "valuable"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
                      }`}
                    >
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Most Valuable Loot ({mostValuableLoot.length})</span>
                    </button>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                      <input
                        type="text"
                        value={lootSearchQuery}
                        onChange={(e) => setLootSearchQuery(e.target.value)}
                        placeholder="Filter item name..."
                        className="bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 w-44"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span>Min Value:</span>
                      <select
                        value={minLootValue}
                        onChange={(e) => setMinLootValue(Number(e.target.value))}
                        className="bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono cursor-pointer"
                      >
                        <option value={0}>All Drops</option>
                        <option value={5000}>&gt; 5k Silver</option>
                        <option value={25000}>&gt; 25k Silver</option>
                        <option value={50000}>&gt; 50k Silver</option>
                        <option value={100000}>&gt; 100k Silver</option>
                        <option value={500000}>&gt; 500k Silver</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Sub-tab 1: Recently Looted Items Table */}
                {lootSubTab === "recent" && (
                  <div>
                    {filteredRecentLoot.length === 0 ? (
                      <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                        <Package className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="font-semibold text-slate-300">No loot recorded matching your filter.</p>
                        <p className="text-slate-500 max-w-sm mx-auto">
                          Looted mob drops and opened dungeon coffers will automatically display in this feed.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-800">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 uppercase text-[10px] font-semibold">
                              <th className="py-2.5 px-3">Item Details</th>
                              <th className="py-2.5 px-3">Source</th>
                              <th className="py-2.5 px-3 text-center">Amount</th>
                              <th className="py-2.5 px-3 text-right">Est. Unit Price</th>
                              <th className="py-2.5 px-3 text-right">Total Silver Value</th>
                              <th className="py-2.5 px-3 text-center">Looter</th>
                              <th className="py-2.5 px-3 text-right">Time</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-mono">
                            {filteredRecentLoot.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                                <td className="py-2.5 px-3 font-sans">
                                  <div className="flex items-center gap-2">
                                    {item.tier > 0 && (
                                      <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-amber-400 font-mono">
                                        T{item.tier}.{item.enchantment}
                                      </span>
                                    )}
                                    <span className="font-medium text-slate-200">{item.name}</span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px]">{item.source}</td>
                                <td className="py-2.5 px-3 text-center font-bold text-slate-300">{item.amount}</td>
                                <td className="py-2.5 px-3 text-right text-slate-400">{formatNumber(item.estimatedValue)}</td>
                                <td className="py-2.5 px-3 text-right font-bold text-amber-400">
                                  {formatNumber(item.estimatedValue * item.amount)}
                                </td>
                                <td className="py-2.5 px-3 text-center font-sans text-slate-300 text-[11px]">
                                  {item.looterName || "You"}
                                </td>
                                <td className="py-2.5 px-3 text-right text-slate-400 text-[11px]">{item.timestamp}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-tab 2: Most Valuable Loot Leaderboard */}
                {lootSubTab === "valuable" && (
                  <div>
                    {mostValuableLoot.length === 0 ? (
                      <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                        <Trophy className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="font-semibold text-slate-300">No valuable loot recorded yet.</p>
                        <p className="text-slate-500 max-w-sm mx-auto">
                          Top-tier gear, rare artifacts, and coffer jackpots will rank here automatically.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {mostValuableLoot.map((item, idx) => {
                          const isGold = idx === 0;
                          const isSilver = idx === 1;
                          const isBronze = idx === 2;

                          return (
                            <div
                              key={item.id}
                              className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                                isGold 
                                  ? "bg-amber-500/10 border-amber-500/40 shadow-sm"
                                  : isSilver
                                  ? "bg-slate-800/40 border-slate-600/50"
                                  : isBronze
                                  ? "bg-orange-950/20 border-orange-700/40"
                                  : "bg-slate-900/60 border-slate-800"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                                  isGold
                                    ? "bg-amber-500 text-slate-950"
                                    : isSilver
                                    ? "bg-slate-300 text-slate-950"
                                    : isBronze
                                    ? "bg-amber-700 text-slate-100"
                                    : "bg-slate-800 text-slate-400"
                                }`}>
                                  #{idx + 1}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    {item.tier > 0 && (
                                      <span className="text-[10px] font-bold font-mono px-1 rounded bg-slate-800 text-amber-400 border border-slate-700">
                                        T{item.tier}.{item.enchantment}
                                      </span>
                                    )}
                                    <span className="font-bold text-xs text-slate-100 truncate">
                                      {item.name}
                                    </span>
                                  </div>
                                  <div className="text-[11px] font-mono text-slate-400">
                                    Qty: <strong className="text-slate-200">{item.amount}</strong> | Source: {item.source}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right font-mono flex-shrink-0">
                                <div className="text-sm font-bold text-amber-400">
                                  {formatNumber(item.estimatedValue * item.amount)} Silver
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {item.timestamp}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 3: HISTORY (Gambar 2 Rebuild with Interactive Vector Line Chart) */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            {/* Header */}
            <div 
              onClick={() => setCollapseHistory(!collapseHistory)}
              className="h-12 px-4 bg-slate-900/70 border-b border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-900/90 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-bold text-slate-100 font-['Outfit']">
                  History
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Telemetry Timeline
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-xs text-slate-400 font-mono">
                  Points: <strong className="text-slate-200">{sessionHistory.length || 7}</strong>
                </div>
                {collapseHistory ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
              </div>
            </div>

            {!collapseHistory && (
              <div className="p-4 space-y-3">
                <HistoryChart stats={stats} history={sessionHistory} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LOOT BREAKDOWN (Full Filterable Table) */}
      {activeTab === "loot" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between glass-panel p-3.5 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Min Estimated Value:</span>
                <select
                  value={minLootValue}
                  onChange={(e) => setMinLootValue(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono cursor-pointer"
                >
                  <option value={0}>All Drops</option>
                  <option value={5000}>&gt; 5,000 Silver</option>
                  <option value={10000}>&gt; 10,000 Silver</option>
                  <option value={50000}>&gt; 50,000 Silver</option>
                  <option value={100000}>&gt; 100,000 Silver</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Quality:</span>
                <select
                  value={selectedQuality}
                  onChange={(e) => setSelectedQuality(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 cursor-pointer"
                >
                  <option value="all">All Qualities</option>
                  <option value="1">Normal</option>
                  <option value="2">Good</option>
                  <option value="3">Outstanding</option>
                  <option value="4">Excellent</option>
                  <option value="5">Masterpiece</option>
                </select>
              </div>
            </div>

            <span className="font-mono text-slate-400">
              Showing {filteredRecentLoot.length} of {recentLoot.length} items
            </span>
          </div>

          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            {filteredRecentLoot.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs space-y-2">
                <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="font-semibold text-slate-300">No Loot Recorded Yet</p>
                <p className="text-slate-500 max-w-sm mx-auto">
                  Open mob chests, solo dungeon coffers, or collect loot drops in Albion Online to populate this feed.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase text-[10px] font-semibold">
                    <th className="py-3 px-4">Item Details</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4 text-center">Amount</th>
                    <th className="py-3 px-4 text-right">Est. Unit Price</th>
                    <th className="py-3 px-4 text-right">Total Silver Value</th>
                    <th className="py-3 px-4 text-center">Looter</th>
                    <th className="py-3 px-4 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredRecentLoot.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-sans">
                        <div className="flex items-center gap-2.5">
                          {item.tier > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-amber-400 font-mono">
                              T{item.tier}.{item.enchantment}
                            </span>
                          )}
                          <span className="font-medium text-slate-200">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-400">{item.source}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-300">{item.amount}</td>
                      <td className="py-3 px-4 text-right text-slate-400">{formatNumber(item.estimatedValue)}</td>
                      <td className="py-3 px-4 text-right font-bold text-amber-400">
                        {formatNumber(item.estimatedValue * item.amount)}
                      </td>
                      <td className="py-3 px-4 text-center font-sans text-slate-300">{item.looterName || "You"}</td>
                      <td className="py-3 px-4 text-right text-slate-400 text-[11px]">{item.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: COMBAT STATISTICS */}
      {activeTab === "combat" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="glass-card p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
              <img src="/assets/combat_swords.png" alt="Kills" className="w-8 h-8 object-contain" />
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Kills</span>
                <div className="text-xl font-extrabold text-emerald-400 font-mono">0</div>
              </div>
            </div>

            <div className="glass-card p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
              <img src="/assets/skull_red.png" alt="Deaths" className="w-8 h-8 object-contain" />
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Deaths</span>
                <div className="text-xl font-extrabold text-rose-400 font-mono">0</div>
              </div>
            </div>

            <div className="glass-card p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
              <img src="/assets/combat_swords.png" alt="Knockouts" className="w-8 h-8 object-contain" />
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Knockouts</span>
                <div className="text-xl font-extrabold text-yellow-400 font-mono">0</div>
              </div>
            </div>

            <div className="glass-card p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
              <img src="/assets/skull_gold.png" alt="Knocked Out" className="w-8 h-8 object-contain" />
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Knocked Out</span>
                <div className="text-xl font-extrabold text-sky-400 font-mono">0</div>
              </div>
            </div>

            <div className="glass-card p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
              <img src="/assets/skull.png" alt="K/D" className="w-8 h-8 object-contain" />
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">K/D Ratio</span>
                <div className="text-xl font-extrabold text-slate-100 font-mono">0.00</div>
              </div>
            </div>

            <div className="glass-card p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
              <img src="/assets/fame.png" alt="PvP Fame" className="w-8 h-8 object-contain" />
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">PvP Fame Gain</span>
                <div className="text-xl font-extrabold text-amber-400 font-mono">0</div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-100 font-['Outfit']">Recent PvP Encounters</h3>
            <div className="py-12 text-center text-slate-500 text-xs">
              No PvP kills or deaths recorded in the current session.
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ECONOMY */}
      {activeTab === "economy" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ReSpec Silver Cost Card */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <img src="/assets/respec.png" alt="ReSpec" className="w-7 h-7 object-contain" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 font-['Outfit']">Auto-ReSpec Costs</h3>
                    <p className="text-[11px] text-slate-400">Combat fame credits converted into ReSpec points</p>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs font-bold text-amber-400">
                    {formatNumber(stats.reSpecPoints)} Points
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Silver Incurred</span>
                  <div className="text-lg font-bold text-slate-100 font-mono mt-0.5">
                    {formatNumber(Math.round(stats.reSpecPoints * 1.8))} Silver
                  </div>
                  <span className="text-[10px] text-amber-400 font-mono">
                    +{formatNumber(Math.round(stats.reSpecPerHour * 1.8))} / h
                  </span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Spent ReSpec Points</span>
                  <div className="text-lg font-bold text-slate-100 font-mono mt-0.5">0</div>
                  <span className="text-[10px] text-slate-500 font-mono">Manual mastery upgrades</span>
                </div>
              </div>
            </div>

            {/* Repair Costs Card */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <img src="/assets/repair_cross.png" alt="Repair Costs" className="w-7 h-7 object-contain" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 font-['Outfit']">Repair Costs</h3>
                    <p className="text-[11px] text-slate-400">Gear durability restorations and knockdowns</p>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs font-bold text-rose-400">0 Silver</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Highest Single Repair</span>
                  <div className="text-lg font-bold text-slate-100 font-mono mt-0.5">0 Silver</div>
                  <span className="text-[10px] text-slate-500 font-mono">No repair events recorded</span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Durability Loss Incidents</span>
                  <div className="text-lg font-bold text-slate-100 font-mono mt-0.5">0</div>
                  <span className="text-[10px] text-emerald-400 font-mono">Equipment in prime condition</span>
                </div>
              </div>
            </div>

            {/* Item Quality Refinement */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <img src="/assets/quality_border.png" alt="Quality Reroll" className="w-7 h-7 object-contain" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 font-['Outfit']">Item Quality Reroll</h3>
                    <p className="text-[11px] text-slate-400">Repair station equipment quality upgrading</p>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs font-bold text-slate-400">0 Attempts</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center font-mono">
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-1">Good</span>
                  <span className="text-sm font-bold text-slate-200">0</span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-1">Outstanding</span>
                  <span className="text-sm font-bold text-slate-200">0</span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-1">Excellent</span>
                  <span className="text-sm font-bold text-slate-200">0</span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-amber-400 block mb-1">Masterpiece</span>
                  <span className="text-sm font-bold text-amber-400">0</span>
                </div>
              </div>
            </div>

            {/* Awakened Weapons */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 font-['Outfit']">Awakened Weapons</h3>
                    <p className="text-[11px] text-slate-400">Trait rolls, strain points, and attunements</p>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs font-bold text-purple-400">0 Upgrades</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Attunement Cost</span>
                  <div className="text-lg font-bold text-slate-100 font-mono mt-0.5">0 Silver</div>
                  <span className="text-[10px] text-slate-500 font-mono">No awakenings performed</span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Trait Roll Procs</span>
                  <div className="text-lg font-bold text-slate-100 font-mono mt-0.5">0</div>
                  <span className="text-[10px] text-slate-500 font-mono">0 max trait procs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MOBS */}
      {activeTab === "mobs" && (
        <div className="space-y-6">
          {/* Top 3 KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Most Killed Mob */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-center overflow-hidden">
                <img src="/assets/skull_gold.png" alt="Most Killed" className="w-8 h-8 object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Most Killed Mob</span>
                <div className="text-sm font-bold text-slate-100 truncate mt-0.5">
                  {mapHistory.length > 0 && stats.totalFame > 0 ? "Open World Mob" : "None recorded"}
                </div>
                <span className="text-xs font-mono text-amber-400">
                  {mapHistory.reduce((acc, m) => acc + (m.mobKills || 0), 0)} kills
                </span>
              </div>
            </div>

            {/* Last Killed Mob */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-center overflow-hidden">
                <img src="/assets/skull.png" alt="Last Killed" className="w-8 h-8 object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Last Slain Mob</span>
                <div className="text-sm font-bold text-slate-100 truncate mt-0.5">
                  {mapHistory.length > 0 ? "Creature" : "None"}
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {mapHistory.length > 0 ? (mapHistory[0]?.enteredAt || "Recently") : "No kills"}
                </span>
              </div>
            </div>

            {/* Total Mob Kills */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-center overflow-hidden">
                <img src="/assets/skull_red.png" alt="Total Kills" className="w-8 h-8 object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Mob Kills</span>
                <div className="text-lg font-extrabold text-slate-100 font-mono mt-0.5">
                  {mapHistory.reduce((acc, m) => acc + (m.mobKills || 0), 0)}
                </div>
                <span className="text-xs font-mono text-emerald-400">
                  +{formatNumber(stats.totalFame)} PvE Fame
                </span>
              </div>
            </div>
          </div>

          {/* Mobs Kill Breakdown Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 font-['Outfit']">Mob Defeat Breakdown</h3>
              <span className="text-xs font-mono text-slate-400">
                Session PvE Tracking
              </span>
            </div>

            {mapHistory.length === 0 || mapHistory.reduce((acc, m) => acc + (m.mobKills || 0), 0) === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No mob kills recorded in this session yet. Defeat mobs in the open world or dungeons to populate.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60 font-mono text-xs">
                {mapHistory
                  .filter((m) => (m.mobKills || 0) > 0)
                  .map((m) => (
                    <div key={m.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3 font-sans">
                        <img src="/assets/skull_green.png" alt="Mob" className="w-5 h-5 object-contain" />
                        <div>
                          <span className="font-semibold text-slate-200">{m.clusterName} Mobs</span>
                          <span className="text-[11px] text-slate-400 block">{m.tier} ({m.danger})</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 font-mono text-right">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Kills</span>
                          <span className="text-slate-200 font-bold">{m.mobKills}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Fame</span>
                          <span className="text-amber-400 font-bold">+{formatNumber(m.fameGained)}</span>
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          {m.enteredAt}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
