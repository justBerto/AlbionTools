import React, { useState } from "react";
import { 
  Clock, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  ShieldAlert,
  SlidersHorizontal,
  Flame,
  Swords,
  TrendingUp,
  Award,
  Layers,
  Sparkles
} from "lucide-react";
import { SessionStats, LootItem } from "../../types";

interface DashboardViewProps {
  stats: SessionStats;
  recentLoot: LootItem[];
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
  {
    id: "bridgewatch",
    name: "Bridgewatch",
    seal: "/assets/seal_bridgewatch.png",
    coin: "/assets/factioncoin_bridgewatch.png",
    points: 48_500,
    pointsPerHour: 45_200,
    standing: 125_000,
    standingPerHour: 110_000,
  },
  {
    id: "martlock",
    name: "Martlock",
    seal: "/assets/seal_martlock.png",
    coin: "/assets/factioncoin_martlock.png",
    points: 12_400,
    pointsPerHour: 11_500,
    standing: 64_000,
    standingPerHour: 58_000,
  },
  {
    id: "lymhurst",
    name: "Lymhurst",
    seal: "/assets/seal_lymhurst.png",
    coin: "/assets/factioncoin_lymhurst.png",
    points: 32_800,
    pointsPerHour: 30_200,
    standing: 89_000,
    standingPerHour: 81_000,
  },
  {
    id: "fortsterling",
    name: "Fort Sterling",
    seal: "/assets/seal_fortsterling.png",
    coin: "/assets/factioncoin_fortsterling.png",
    points: 54_200,
    pointsPerHour: 50_100,
    standing: 142_000,
    standingPerHour: 128_000,
  },
  {
    id: "thetford",
    name: "Thetford",
    seal: "/assets/seal_thetford.png",
    coin: "/assets/factioncoin_thetford.png",
    points: 18_900,
    pointsPerHour: 17_400,
    standing: 72_000,
    standingPerHour: 65_000,
  },
  {
    id: "caerleon",
    name: "Caerleon",
    seal: "/assets/seal_caerleon.png",
    coin: "/assets/factioncoin_caerleon.png",
    points: 6_200,
    pointsPerHour: 5_800,
    standing: 31_000,
    standingPerHour: 28_000,
  },
];

interface ContentRanking {
  content: string;
  fame: number;
  percentage: number;
  color: string;
}

interface SilverSourceRanking {
  source: string;
  silver: number;
  percentage: number;
  color: string;
}

interface ChestTrackerRow {
  category: string;
  green: number;
  blue: number;
  purple: number;
  gold: number;
  totalLootValue: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ stats, recentLoot }) => {
  const [activeTab, setActiveTab] = useState<"overview" | "loot" | "combat">("overview");
  const [selectedFaction, setSelectedFaction] = useState<FactionOption>(FACTIONS[0]);
  const [timeRange, setTimeRange] = useState("all-time");
  const [resetOnMapChange, setResetOnMapChange] = useState(false);
  const [minLootValue, setMinLootValue] = useState(10_000);
  const [selectedQuality, setSelectedQuality] = useState("all");

  const [collapseFaction, setCollapseFaction] = useState(false);
  const [collapseRankings, setCollapseRankings] = useState(false);
  const [collapseChests, setCollapseChests] = useState(false);
  const [collapseHistory, setCollapseHistory] = useState(false);

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "k";
    return num.toLocaleString();
  };

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Top Fame Sources data mapped from upstream
  const fameSources: ContentRanking[] = [
    { content: "Open World Mobs", fame: 785_000, percentage: 42.6, color: "from-amber-500 to-amber-700" },
    { content: "Solo Random Dungeons", fame: 420_000, percentage: 22.8, color: "from-sky-500 to-sky-700" },
    { content: "Corrupted Dungeons", fame: 295_000, percentage: 16.0, color: "from-rose-500 to-rose-700" },
    { content: "The Mists", fame: 185_500, percentage: 10.1, color: "from-emerald-500 to-emerald-700" },
    { content: "Hellgates (2v2)", fame: 105_000, percentage: 5.7, color: "from-purple-500 to-purple-700" },
    { content: "Avalonian Roads", fame: 50_000, percentage: 2.8, color: "from-indigo-500 to-indigo-700" },
  ];

  // Top Silver Sources data mapped from upstream
  const silverSources: SilverSourceRanking[] = [
    { source: "Looted Chests", silver: 310_000, percentage: 50.0, color: "from-amber-400 to-amber-600" },
    { source: "Mob Drops", silver: 175_000, percentage: 28.2, color: "from-yellow-400 to-yellow-600" },
    { source: "Bags of Silver", silver: 85_000, percentage: 13.7, color: "from-lime-400 to-lime-600" },
    { source: "Open World Ground Pickups", silver: 32_000, percentage: 5.2, color: "from-teal-400 to-teal-600" },
    { source: "Black Market Sales", silver: 18_000, percentage: 2.9, color: "from-sky-400 to-sky-600" },
  ];

  // Looted Chests Matrix across content types
  const chestTrackerData: ChestTrackerRow[] = [
    { category: "Solo Random Dungeon", green: 14, blue: 7, purple: 3, gold: 1, totalLootValue: 385_000 },
    { category: "Standard Dungeon", green: 6, blue: 4, purple: 2, gold: 0, totalLootValue: 142_000 },
    { category: "Corrupted Dungeon", green: 8, blue: 5, purple: 2, gold: 1, totalLootValue: 295_000 },
    { category: "Hellgate", green: 4, blue: 3, purple: 3, gold: 1, totalLootValue: 310_000 },
    { category: "Mists Dungeon / Camps", green: 11, blue: 6, purple: 2, gold: 0, totalLootValue: 180_000 },
    { category: "Open World Chests", green: 5, blue: 2, purple: 1, gold: 0, totalLootValue: 95_000 },
    { category: "Avalonian Roads", green: 3, blue: 2, purple: 2, gold: 1, totalLootValue: 240_000 },
  ];

  const totalChests = chestTrackerData.reduce(
    (acc, row) => ({
      green: acc.green + row.green,
      blue: acc.blue + row.blue,
      purple: acc.purple + row.purple,
      gold: acc.gold + row.gold,
      totalValue: acc.totalValue + row.totalLootValue,
    }),
    { green: 0, blue: 0, purple: 0, gold: 0, totalValue: 0 }
  );

  // Filtered loot list
  const filteredLoot = recentLoot.filter((item) => {
    const passesValue = item.estimatedValue * item.amount >= minLootValue;
    const passesQuality = selectedQuality === "all" || item.quality.toString() === selectedQuality;
    return passesValue && passesQuality;
  });

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-80px)] select-none">
      {/* Top Filter Bar (Time Range, Content, Session Reset) */}
      <div className="glass-panel p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Time Range
            </span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all-time">All Time</option>
              <option value="today">Today</option>
              <option value="last-7-days">Last 7 Days</option>
              <option value="last-30-days">Last 30 Days</option>
            </select>
          </div>

          <div className="h-7 w-px bg-slate-800" />

          {/* Reset on Map Change toggle */}
          <div className="flex items-center gap-2 pt-3">
            <input
              type="checkbox"
              id="mapReset"
              checked={resetOnMapChange}
              onChange={(e) => setResetOnMapChange(e.target.checked)}
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
            onClick={() => {}}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-slate-100 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/70 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Session</span>
          </button>
        </div>
      </div>

      {/* Main Tab Selector (Dashboard / Loot / Combat) */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "overview"
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Dashboard Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("loot")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "loot"
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
          }`}
        >
          <img src="/assets/static_chest.png" alt="Loot" className="w-3.5 h-3.5 object-contain" />
          <span>Loot Breakdown</span>
        </button>

        <button
          onClick={() => setActiveTab("combat")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "combat"
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
          }`}
        >
          <img src="/assets/combat_swords.png" alt="Combat" className="w-3.5 h-3.5 object-contain" />
          <span>Combat Statistics</span>
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
            <div className="glass-card p-3.5 rounded-xl border border-slate-800 hover:border-teal-500/40 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <img src="/assets/favor.png" alt="Favor" className="w-5 h-5 object-contain" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Favor</span>
              </div>
              <div className="text-xl font-extrabold text-slate-100 font-['Outfit']">
                {formatNumber(stats.favor)}
              </div>
              <div className="mt-1 text-[11px] font-mono text-teal-400">
                +{formatNumber(stats.favorPerHour)} / h
              </div>
            </div>

            {/* Session Time */}
            <div className="glass-card p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Session</span>
              </div>
              <div className="text-xl font-extrabold text-slate-100 font-['Outfit'] font-mono">
                {formatUptime(stats.uptimeSeconds)}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                Active tracking
              </div>
            </div>
          </div>

          {/* Faction Standing Card (Bridgewatch, Martlock, etc.) */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div 
              onClick={() => setCollapseFaction(!collapseFaction)}
              className="h-11 px-4 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between cursor-pointer hover:bg-slate-900/80 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <img src={selectedFaction.seal} alt={selectedFaction.name} className="w-6 h-6 object-contain" />
                <span className="text-sm font-bold text-slate-100 font-['Outfit']">
                  Faction Standing & Warfare ({selectedFaction.name})
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  Select city banner to view faction progress
                </span>
                {collapseFaction ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
              </div>
            </div>

            {!collapseFaction && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                {/* Big Faction Seal */}
                <div className="flex items-center gap-3">
                  <img src={selectedFaction.seal} alt={selectedFaction.name} className="w-16 h-16 object-contain drop-shadow-md" />
                  <div>
                    <h3 className="font-extrabold text-slate-100 text-base font-['Outfit']">
                      {selectedFaction.name}
                    </h3>
                    <p className="text-xs text-slate-400">Active Warfare Allegiance</p>
                  </div>
                </div>

                {/* Faction Points */}
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                  <img src={selectedFaction.coin} alt="Coins" className="w-7 h-7 object-contain" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Faction Points</span>
                    <div className="text-lg font-bold text-slate-100 font-mono">
                      {formatNumber(selectedFaction.points)}
                    </div>
                    <span className="text-[10px] text-amber-400 font-mono">
                      +{formatNumber(selectedFaction.pointsPerHour)} / h
                    </span>
                  </div>
                </div>

                {/* Faction Standing */}
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                  <img src={selectedFaction.seal} alt="Standing" className="w-7 h-7 object-contain opacity-90" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Faction Standing</span>
                    <div className="text-lg font-bold text-slate-100 font-mono">
                      {formatNumber(selectedFaction.standing)}
                    </div>
                    <span className="text-[10px] text-sky-400 font-mono">
                      +{formatNumber(selectedFaction.standingPerHour)} / h
                    </span>
                  </div>
                </div>

                {/* Faction City Dropdown */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Switch Faction City</span>
                  <select
                    value={selectedFaction.id}
                    onChange={(e) => {
                      const f = FACTIONS.find((x) => x.id === e.target.value);
                      if (f) setSelectedFaction(f);
                    }}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
                  >
                    {FACTIONS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Top Content Rankings (Side by Side: Top Fame Sources & Top Silver Sources) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Fame Sources */}
            <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden flex flex-col justify-between">
              <div>
                <div 
                  onClick={() => setCollapseRankings(!collapseRankings)}
                  className="h-11 px-4 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between cursor-pointer hover:bg-slate-900/80 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <img src="/assets/fame.png" alt="Fame" className="w-5 h-5 object-contain" />
                    <span className="text-sm font-bold text-slate-100 font-['Outfit']">
                      Top Fame Sources
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Total: {formatNumber(stats.totalFame)}
                  </span>
                </div>

                {!collapseRankings && (
                  <div className="p-4 space-y-3">
                    {fameSources.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-300">{item.content}</span>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="font-bold text-slate-100">{formatNumber(item.fame)}</span>
                            <span className="text-slate-400 text-[11px]">({item.percentage}%)</span>
                          </div>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800/80">
                          <div 
                            className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-500`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-9 px-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Total Fame by Content:</span>
                <span className="font-bold text-amber-400">{formatNumber(stats.totalFame)}</span>
              </div>
            </div>

            {/* Top Silver Sources */}
            <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden flex flex-col justify-between">
              <div>
                <div 
                  onClick={() => setCollapseRankings(!collapseRankings)}
                  className="h-11 px-4 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between cursor-pointer hover:bg-slate-900/80 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <img src="/assets/silver.png" alt="Silver" className="w-5 h-5 object-contain" />
                    <span className="text-sm font-bold text-slate-100 font-['Outfit']">
                      Top Silver Sources
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Total: {formatNumber(stats.totalSilver)}
                  </span>
                </div>

                {!collapseRankings && (
                  <div className="p-4 space-y-3">
                    {silverSources.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-300">{item.source}</span>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="font-bold text-slate-100">{formatNumber(item.silver)}</span>
                            <span className="text-slate-400 text-[11px]">({item.percentage}%)</span>
                          </div>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800/80">
                          <div 
                            className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-500`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-9 px-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Total Silver by Content:</span>
                <span className="font-bold text-yellow-400">{formatNumber(stats.totalSilver)}</span>
              </div>
            </div>
          </div>

          {/* Looted Chests Matrix (Upstream LootedChests) */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div 
              onClick={() => setCollapseChests(!collapseChests)}
              className="h-11 px-4 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between cursor-pointer hover:bg-slate-900/80 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <img src="/assets/static_chest.png" alt="Chests" className="w-5 h-5 object-contain" />
                <span className="text-sm font-bold text-slate-100 font-['Outfit']">
                  Looted Chests Breakdown
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-slate-400">
                  Total Chests: <strong className="text-slate-200">{totalChests.green + totalChests.blue + totalChests.purple + totalChests.gold}</strong>
                </span>
                <span className="text-amber-400">
                  Estimated Value: <strong>{formatNumber(totalChests.totalValue)} Silver</strong>
                </span>
                {collapseChests ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
              </div>
            </div>

            {!collapseChests && (
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                      <th className="py-2 px-3">Content / Category</th>
                      <th className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <img src="/assets/chest_green.png" alt="Standard" className="w-4 h-4 object-contain" />
                          <span>Green</span>
                        </div>
                      </th>
                      <th className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <img src="/assets/chest_blue.png" alt="Uncommon" className="w-4 h-4 object-contain" />
                          <span>Blue</span>
                        </div>
                      </th>
                      <th className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <img src="/assets/chest_purple.png" alt="Rare" className="w-4 h-4 object-contain" />
                          <span>Purple</span>
                        </div>
                      </th>
                      <th className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <img src="/assets/chest_gold.png" alt="Legendary" className="w-4 h-4 object-contain" />
                          <span>Gold</span>
                        </div>
                      </th>
                      <th className="py-2 px-3 text-right">Estimated Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {chestTrackerData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                          {row.category}
                        </td>
                        <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">
                          {row.green}
                        </td>
                        <td className="py-2.5 px-3 text-center text-sky-400 font-bold">
                          {row.blue}
                        </td>
                        <td className="py-2.5 px-3 text-center text-purple-400 font-bold">
                          {row.purple}
                        </td>
                        <td className="py-2.5 px-3 text-center text-amber-400 font-bold">
                          {row.gold}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-100">
                          {formatNumber(row.totalLootValue)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-900/80 font-bold border-t border-slate-700">
                      <td className="py-2.5 px-3 font-sans text-slate-100">Total</td>
                      <td className="py-2.5 px-3 text-center text-emerald-400">{totalChests.green}</td>
                      <td className="py-2.5 px-3 text-center text-sky-400">{totalChests.blue}</td>
                      <td className="py-2.5 px-3 text-center text-purple-400">{totalChests.purple}</td>
                      <td className="py-2.5 px-3 text-center text-amber-400">{totalChests.gold}</td>
                      <td className="py-2.5 px-3 text-right text-amber-400">
                        {formatNumber(totalChests.totalValue)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Activity History Chart / Hourly Breakdown */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div 
              onClick={() => setCollapseHistory(!collapseHistory)}
              className="h-11 px-4 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between cursor-pointer hover:bg-slate-900/80 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-100 font-['Outfit']">
                  Session Activity History (Hourly Breakdown)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">Fame</span>
                  <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">Silver</span>
                  <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30">ReSpec</span>
                </div>
                {collapseHistory ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
              </div>
            </div>

            {!collapseHistory && (
              <div className="p-5">
                <div className="grid grid-cols-6 gap-3">
                  {[
                    { hour: "10:00", fame: "320k", silver: "110k", respec: "24k" },
                    { hour: "11:00", fame: "410k", silver: "145k", respec: "31k" },
                    { hour: "12:00", fame: "290k", silver: "95k", respec: "20k" },
                    { hour: "13:00", fame: "480k", silver: "160k", respec: "38k" },
                    { hour: "14:00", fame: "190k", silver: "65k", respec: "14k" },
                    { hour: "Current", fame: "150k", silver: "45k", respec: "11k" },
                  ].map((bar, idx) => (
                    <div key={idx} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center space-y-2">
                      <span className="text-[11px] font-mono text-slate-400">{bar.hour}</span>
                      <div className="space-y-1 font-mono text-xs">
                        <div className="text-amber-400 font-bold">{bar.fame}</div>
                        <div className="text-yellow-400 font-semibold">{bar.silver}</div>
                        <div className="text-sky-400 text-[10px]">{bar.respec}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LOOT BREAKDOWN */}
      {activeTab === "loot" && (
        <div className="space-y-4">
          {/* Filters Bar for Loot */}
          <div className="flex items-center justify-between glass-panel p-3.5 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Min Estimated Value:</span>
                <select
                  value={minLootValue}
                  onChange={(e) => setMinLootValue(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
                >
                  <option value={0}>All Drops</option>
                  <option value={5000}>&gt; 5,000 Silver</option>
                  <option value={10000}>&gt; 10,000 Silver</option>
                  <option value={50000}>&gt; 50,000 Silver</option>
                  <option value={100000}>&gt; 100,000 Silver (Valuable)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Quality:</span>
                <select
                  value={selectedQuality}
                  onChange={(e) => setSelectedQuality(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
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
              Showing {filteredLoot.length} of {recentLoot.length} items
            </span>
          </div>

          {/* Loot Items Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
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
                {filteredLoot.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-sans">
                      <div className="flex items-center gap-2.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-amber-400 font-mono">
                          T{item.tier}.{item.enchantment}
                        </span>
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
                <div className="text-xl font-extrabold text-emerald-400 font-mono">14</div>
              </div>
            </div>

            <div className="glass-card p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
              <img src="/assets/skull_red.png" alt="Deaths" className="w-8 h-8 object-contain" />
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Deaths</span>
                <div className="text-xl font-extrabold text-rose-400 font-mono">2</div>
              </div>
            </div>

            <div className="glass-card p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
              <img src="/assets/combat_swords.png" alt="Knockouts" className="w-8 h-8 object-contain" />
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Knockouts</span>
                <div className="text-xl font-extrabold text-yellow-400 font-mono">8</div>
              </div>
            </div>

            <div className="glass-card p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
              <img src="/assets/skull_gold.png" alt="Knocked Out" className="w-8 h-8 object-contain" />
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Knocked Out</span>
                <div className="text-xl font-extrabold text-sky-400 font-mono">1</div>
              </div>
            </div>

            <div className="glass-card p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
              <img src="/assets/skull.png" alt="K/D" className="w-8 h-8 object-contain" />
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">K/D Ratio</span>
                <div className="text-xl font-extrabold text-slate-100 font-mono">7.00</div>
              </div>
            </div>

            <div className="glass-card p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
              <img src="/assets/fame.png" alt="PvP Fame" className="w-8 h-8 object-contain" />
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">PvP Fame Gain</span>
                <div className="text-xl font-extrabold text-amber-400 font-mono">428k</div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-100 font-['Outfit']">Recent PvP Encounters</h3>
            <div className="space-y-2 text-xs font-mono">
              {[
                { time: "10:14:10", action: "KILL", target: "GankSquad_Leader", guild: "Arch Alliance", fame: "+182,500", zone: "Deathstone Valley" },
                { time: "10:02:44", action: "KILL", target: "ShadowScout", guild: "PoE", fame: "+94,200", zone: "Deathstone Valley" },
                { time: "09:48:12", action: "DEATH", target: "ZvZ_Clapper", guild: "Escalation", fame: "-0", zone: "Redtree Enclave" },
                { time: "09:30:05", action: "KILL", target: "DungeonCrawler99", guild: "Solo", fame: "+151,300", zone: "Glacierfall Pass" },
              ].map((pvp, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      pvp.action === "KILL" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                    }`}>
                      {pvp.action}
                    </span>
                    <span className="font-semibold text-slate-200">{pvp.target}</span>
                    <span className="text-slate-500">[{pvp.guild}]</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400">{pvp.zone}</span>
                    <span className={`font-bold ${pvp.action === "KILL" ? "text-amber-400" : "text-rose-400"}`}>
                      {pvp.fame} PvP Fame
                    </span>
                    <span className="text-slate-500">{pvp.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
