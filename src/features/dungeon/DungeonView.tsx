import React, { useState, useEffect } from "react";
import { 
  Clock, 
  RotateCcw, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Compass, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  Layers, 
  TrendingUp,
  Award,
  Filter,
  CheckCircle2,
  Trash2,
  UserCheck
} from "lucide-react";
import { useAudioAlert } from "../../hooks/useAudioAlert";

type DungeonType = "all" | "solo" | "corrupted" | "hellgate" | "mists" | "abyssal" | "group";

interface DungeonRun {
  id: string;
  type: string;
  tier: number;
  enchantment: number;
  mapName: string;
  startTime: string;
  durationSeconds: number;
  fame: number;
  respec: number;
  silver: number;
  lootValue: number;
  chests: { green: number; blue: number; purple: number; gold: number };
  deaths: number;
  status: "Completed" | "In-Progress";
}

export const DungeonView: React.FC = () => {
  const { playDungeonClosedChime } = useAudioAlert();

  // Filters state
  const [selectedDungeonType, setSelectedDungeonType] = useState<DungeonType>("all");
  const [timeRange, setTimeRange] = useState("all-time");
  const [selectedTiers, setSelectedTiers] = useState<number[]>([4, 5, 6, 7, 8]);
  const [selectedEnchants, setSelectedEnchants] = useState<number[]>([0, 1, 2, 3, 4]);
  const [isTrackingActive, setIsTrackingActive] = useState(true);

  // 90s Entrance Safe Timer (for Solo Dungeons)
  const [timerRemaining, setTimerRemaining] = useState(90);
  const [timerActive, setTimerActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    let interval: any = null;
    if (timerActive && timerRemaining > 0) {
      interval = setInterval(() => {
        setTimerRemaining((prev) => {
          const next = prev - 1;
          if (next === 0 && soundEnabled) {
            playDungeonClosedChime();
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerRemaining, soundEnabled, playDungeonClosedChime]);

  const resetTimer = () => {
    setTimerRemaining(90);
    setTimerActive(true);
  };

  const toggleTier = (t: number) => {
    if (selectedTiers.includes(t)) {
      if (selectedTiers.length > 1) setSelectedTiers(selectedTiers.filter((x) => x !== t));
    } else {
      setSelectedTiers([...selectedTiers, t].sort());
    }
  };

  const toggleEnchant = (e: number) => {
    if (selectedEnchants.includes(e)) {
      if (selectedEnchants.length > 1) setSelectedEnchants(selectedEnchants.filter((x) => x !== e));
    } else {
      setSelectedEnchants([...selectedEnchants, e].sort());
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "k";
    return num.toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, "0")}s`;
  };

  // Upstream-style Dungeon Runs Database (empty initial state)
  const [runs, setRuns] = useState<DungeonRun[]>([]);

  // Filter runs according to selected tab, tiers, and enchantments
  const filteredRuns = runs.filter((r) => {
    const matchesType =
      selectedDungeonType === "all" ||
      (selectedDungeonType === "solo" && r.type.includes("Solo")) ||
      (selectedDungeonType === "corrupted" && r.type.includes("Corrupted")) ||
      (selectedDungeonType === "hellgate" && r.type.includes("Hellgate")) ||
      (selectedDungeonType === "mists" && r.type.includes("Mists")) ||
      (selectedDungeonType === "abyssal" && r.type.includes("Abyssal")) ||
      (selectedDungeonType === "group" && r.type.includes("Group"));

    const matchesTier = selectedTiers.includes(r.tier);
    const matchesEnchant = selectedEnchants.includes(r.enchantment);
    return matchesType && matchesTier && matchesEnchant;
  });

  // Calculate aggregated analytics for the filtered runs
  const totalRunsCount = filteredRuns.length;
  const totalFame = filteredRuns.reduce((acc, r) => acc + r.fame, 0);
  const totalReSpec = filteredRuns.reduce((acc, r) => acc + r.respec, 0);
  const totalSilver = filteredRuns.reduce((acc, r) => acc + r.silver, 0);
  const totalLootValue = filteredRuns.reduce((acc, r) => acc + r.lootValue, 0);
  const totalDeaths = filteredRuns.reduce((acc, r) => acc + r.deaths, 0);
  const avgDurationSeconds =
    totalRunsCount > 0
      ? Math.round(filteredRuns.reduce((acc, r) => acc + r.durationSeconds, 0) / totalRunsCount)
      : 0;

  // Group runs by Tier & Enchantment for Efficiency Matrix
  const tierStatsMap = new Map<
    string,
    {
      tierEnchant: string;
      runsCount: number;
      totalLoot: number;
      totalFame: number;
      totalSeconds: number;
    }
  >();

  filteredRuns.forEach((r) => {
    const key = `T${r.tier}.${r.enchantment}`;
    const existing = tierStatsMap.get(key) || {
      tierEnchant: key,
      runsCount: 0,
      totalLoot: 0,
      totalFame: 0,
      totalSeconds: 0,
    };
    existing.runsCount += 1;
    existing.totalLoot += r.lootValue;
    existing.totalFame += r.fame;
    existing.totalSeconds += r.durationSeconds;
    tierStatsMap.set(key, existing);
  });

  const efficiencyEntriesRaw = Array.from(tierStatsMap.values()).map((entry) => {
    const avgLoot = Math.round(entry.totalLoot / entry.runsCount);
    const avgFame = Math.round(entry.totalFame / entry.runsCount);
    const avgSec = Math.round(entry.totalSeconds / entry.runsCount);
    return {
      tierEnchant: entry.tierEnchant,
      runsCount: entry.runsCount,
      avgLoot,
      avgFame,
      avgSec,
      hourlyRate: avgSec > 0 ? Math.round((avgLoot / avgSec) * 3600) : 0,
    };
  });

  const maxAvgLoot = Math.max(...efficiencyEntriesRaw.map((e) => e.avgLoot), 1);
  const maxAvgFame = Math.max(...efficiencyEntriesRaw.map((e) => e.avgFame), 1);

  const efficiencyEntries = efficiencyEntriesRaw
    .sort((a, b) => b.avgLoot - a.avgLoot)
    .map((e) => ({
      ...e,
      lootScore: Math.min(100, Math.round((e.avgLoot / maxAvgLoot) * 100)),
      fameScore: Math.min(100, Math.round((e.avgFame / maxAvgFame) * 100)),
    }));

  // Performance Highlights calculations
  const mostProfitable = [...efficiencyEntriesRaw].sort((a, b) => b.hourlyRate - a.hourlyRate)[0];
  const mostPlayed = [...efficiencyEntriesRaw].sort((a, b) => b.runsCount - a.runsCount)[0];
  const topLootRun = [...filteredRuns].sort((a, b) => b.lootValue - a.lootValue)[0];

  const mapStatsMap = new Map<string, { mapName: string; totalLoot: number; count: number }>();
  filteredRuns.forEach((r) => {
    const existing = mapStatsMap.get(r.mapName) || { mapName: r.mapName, totalLoot: 0, count: 0 };
    existing.totalLoot += r.lootValue;
    existing.count += 1;
    mapStatsMap.set(r.mapName, existing);
  });
  const bestMap = Array.from(mapStatsMap.values())
    .map((m) => ({ ...m, avgLoot: Math.round(m.totalLoot / m.count) }))
    .sort((a, b) => b.avgLoot - a.avgLoot)[0];

  const validDurationRuns = filteredRuns.filter((r) => r.durationSeconds > 0);
  const fastestRun = [...validDurationRuns].sort((a, b) => a.durationSeconds - b.durationSeconds)[0];

  const totalChests = filteredRuns.reduce(
    (acc, r) => acc + (r.chests.green + r.chests.blue + r.chests.purple + r.chests.gold),
    0
  );
  const avgChestsPerRun = totalRunsCount > 0 ? (totalChests / totalRunsCount).toFixed(2) : "0.00";

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-80px)] select-none">
      {/* 1. Top Filters Card (Tracking Active, Time Range, Tiers, Enchantments) */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-5 flex-wrap">
          {/* Tracking State Button */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Dungeon Tracking
            </span>
            <button
              onClick={() => setIsTrackingActive(!isTrackingActive)}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                isTrackingActive
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-slate-900 text-slate-500 border-slate-800"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isTrackingActive ? "bg-emerald-400" : "bg-slate-500"}`} />
              <span>{isTrackingActive ? "Active" : "Disabled"}</span>
            </button>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          {/* Time Range */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Time Range
            </span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
            >
              <option value="all-time">All Time</option>
              <option value="today">Today</option>
              <option value="last-7-days">Last 7 Days</option>
              <option value="last-30-days">Last 30 Days</option>
            </select>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          {/* Tier Filter Buttons (T4 to T8) */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Tier Filter
            </span>
            <div className="flex items-center gap-1">
              {[4, 5, 6, 7, 8].map((t) => {
                const isSelected = selectedTiers.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleTier(t)}
                    className={`w-7 h-7 rounded text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                        : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    T{t}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          {/* Enchantment Filter Buttons (.0 to .4) */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Enchantment
            </span>
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((e) => {
                const isSelected = selectedEnchants.includes(e);
                return (
                  <button
                    key={e}
                    onClick={() => toggleEnchant(e)}
                    className={`w-7 h-7 rounded text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-sky-500 text-slate-950 font-black shadow-sm"
                        : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    .{e}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Reset Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRuns([])}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg border border-rose-500/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Dungeons</span>
          </button>
        </div>
      </div>

      {/* 2. Dungeon Content Type Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
        {[
          { id: "all", name: "All Dungeons", icon: "/assets/dungeon.png" },
          { id: "solo", name: "Solo Random Dungeon", icon: "/assets/dungeon.png" },
          { id: "corrupted", name: "Corrupted Dungeon", icon: "/assets/corrupted_dungeon.png" },
          { id: "hellgate", name: "Hellgate (2v2 / 5v5)", icon: "/assets/hellgate.png" },
          { id: "mists", name: "Mists Dungeon", icon: "/assets/mists_dungeon.png" },
          { id: "abyssal", name: "Abyssal Depths", icon: "/assets/abyssal_depths.png" },
          { id: "group", name: "Group Dungeon", icon: "/assets/dungeon.png" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedDungeonType(tab.id as DungeonType)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedDungeonType === tab.id
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
            }`}
          >
            <img src={tab.icon} alt={tab.name} className="w-4 h-4 object-contain" />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* 3. Analytics Top Summary Metrics (9 Uniform Cards) */}
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
        {/* Total Runs */}
        <div className="glass-card p-3 rounded-xl border border-slate-800">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Runs</span>
          <div className="text-lg font-extrabold text-slate-100 font-mono mt-0.5">
            {totalRunsCount}
          </div>
          <span className="text-[10px] text-slate-500">Tracked</span>
        </div>

        {/* Total Fame */}
        <div className="glass-card p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1">
            <img src="/assets/fame.png" alt="Fame" className="w-3.5 h-3.5 object-contain" />
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Fame</span>
          </div>
          <div className="text-lg font-extrabold text-amber-400 font-mono mt-0.5">
            {formatNumber(totalFame)}
          </div>
          <span className="text-[10px] text-amber-500/80">+{formatNumber(totalFame / (totalRunsCount || 1))}/run</span>
        </div>

        {/* Total ReSpec */}
        <div className="glass-card p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1">
            <img src="/assets/respec.png" alt="ReSpec" className="w-3.5 h-3.5 object-contain" />
            <span className="text-[10px] font-bold uppercase text-slate-400">Total ReSpec</span>
          </div>
          <div className="text-lg font-extrabold text-sky-400 font-mono mt-0.5">
            {formatNumber(totalReSpec)}
          </div>
          <span className="text-[10px] text-sky-500/80">Credits</span>
        </div>

        {/* Total Might */}
        <div className="glass-card p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1">
            <img src="/assets/might.png" alt="Might" className="w-3.5 h-3.5 object-contain" />
            <span className="text-[10px] font-bold uppercase text-slate-400">Might</span>
          </div>
          <div className="text-lg font-extrabold text-purple-400 font-mono mt-0.5">
            {formatNumber(0)}
          </div>
          <span className="text-[10px] text-purple-500/80">Season</span>
        </div>

        {/* Total Favor */}
        <div className="glass-card p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1">
            <img src="/assets/favor.png" alt="Favor" className="w-3.5 h-3.5 object-contain" />
            <span className="text-[10px] font-bold uppercase text-slate-400">Favor</span>
          </div>
          <div className="text-lg font-extrabold text-teal-400 font-mono mt-0.5">
            {formatNumber(0)}
          </div>
          <span className="text-[10px] text-teal-500/80">Guild</span>
        </div>

        {/* Total Silver */}
        <div className="glass-card p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1">
            <img src="/assets/silver.png" alt="Silver" className="w-3.5 h-3.5 object-contain" />
            <span className="text-[10px] font-bold uppercase text-slate-400">Silver</span>
          </div>
          <div className="text-lg font-extrabold text-yellow-400 font-mono mt-0.5">
            {formatNumber(totalSilver)}
          </div>
          <span className="text-[10px] text-yellow-500/80">Drops</span>
        </div>

        {/* Loot Value */}
        <div className="glass-card p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1">
            <img src="/assets/static_chest.png" alt="Loot" className="w-3.5 h-3.5 object-contain" />
            <span className="text-[10px] font-bold uppercase text-slate-400">Loot Value</span>
          </div>
          <div className="text-lg font-extrabold text-slate-100 font-mono mt-0.5">
            {formatNumber(totalLootValue)}
          </div>
          <span className="text-[10px] text-slate-400">Market</span>
        </div>

        {/* Deaths */}
        <div className="glass-card p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1">
            <img src="/assets/skull.png" alt="Deaths" className="w-3.5 h-3.5 object-contain" />
            <span className="text-[10px] font-bold uppercase text-slate-400">Deaths</span>
          </div>
          <div className={`text-lg font-extrabold font-mono mt-0.5 ${totalDeaths > 0 ? "text-rose-400" : "text-emerald-400"}`}>
            {totalDeaths}
          </div>
          <span className="text-[10px] text-slate-500">In Dungeon</span>
        </div>

        {/* Avg Duration */}
        <div className="glass-card p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-bold uppercase text-slate-400">Avg Time</span>
          </div>
          <div className="text-lg font-extrabold text-slate-100 font-mono mt-0.5">
            {formatDuration(avgDurationSeconds)}
          </div>
          <span className="text-[10px] text-slate-500">Per Run</span>
        </div>
      </div>

      {/* 4. Dungeon Overview & Profitability Card + Run Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Profitability & Key Metrics */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden flex flex-col justify-between">
          <div className="h-11 px-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-100 font-['Outfit']">
              Dungeon Profitability & Analytics
            </span>
            <span className="text-xs text-amber-400 font-mono">Performance Highlights</span>
          </div>

          <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            {/* Most Profitable Tier */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Most Profitable</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold font-mono text-xs">
                  {mostProfitable ? mostProfitable.tierEnchant : "-"}
                </span>
                <span className="text-xs font-bold text-slate-100 font-mono">
                  {mostProfitable ? `${formatNumber(mostProfitable.hourlyRate)} / h` : "0 / h"}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Loot Value / Hour</span>
            </div>

            {/* Most Played Tier */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Most Played</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold font-mono text-xs">
                  {mostPlayed ? mostPlayed.tierEnchant : "-"}
                </span>
                <span className="text-xs font-bold text-slate-100 font-mono">
                  {mostPlayed ? `${mostPlayed.runsCount} Runs` : "0 Runs"}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Completed Sessions</span>
            </div>

            {/* Most Valuable Loot */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Top Loot Drop</span>
              <div className="text-xs font-bold text-amber-400 truncate mt-1">
                {topLootRun && topLootRun.lootValue > 0
                  ? `${topLootRun.type} (T${topLootRun.tier}.${topLootRun.enchantment})`
                  : "No Drops Recorded"}
              </div>
              <span className="text-[10px] text-slate-300 font-mono">
                {topLootRun && topLootRun.lootValue > 0
                  ? `${formatNumber(topLootRun.lootValue)} Silver`
                  : "0 Silver"}
              </span>
            </div>

            {/* Best Dungeon Map */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Best Map Location</span>
              <div className="text-xs font-bold text-slate-100 truncate mt-1">
                {bestMap ? bestMap.mapName : "No Data Recorded"}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {bestMap ? `Avg Loot: ${formatNumber(bestMap.avgLoot)} / run` : "Avg Loot: 0 / run"}
              </span>
            </div>

            {/* Fastest Run */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Fastest Run</span>
              <div className="text-xs font-bold text-slate-100 font-mono mt-1">
                {fastestRun ? formatDuration(fastestRun.durationSeconds) : "00m 00s"}
              </div>
              <span className="text-[10px] text-slate-400 truncate block">
                {fastestRun
                  ? `T${fastestRun.tier}.${fastestRun.enchantment} ${fastestRun.type}`
                  : "No Recorded Runs"}
              </span>
            </div>

            {/* Average Chests Per Run */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Chests / Run</span>
              <div className="text-xs font-bold text-slate-100 font-mono mt-1">
                {avgChestsPerRun} Chests
              </div>
              <span className="text-[10px] text-slate-400">
                {totalRunsCount > 0 ? "Avg across runs" : "No Chests Opened"}
              </span>
            </div>
          </div>

          <div className="h-8 bg-slate-900/80 border-t border-slate-800 px-4 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Tracking Engine:</span>
            <span className="text-emerald-400 font-bold">Photon UDP Parser Live</span>
          </div>
        </div>

        {/* Right: Run Efficiency per Tier */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden flex flex-col justify-between">
          <div className="h-11 px-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-100 font-['Outfit']">
              Run Efficiency by Tier & Enchantment
            </span>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="text-sky-400">Loot Score</span>
              <span className="text-amber-400">Fame Score</span>
            </div>
          </div>

          <div className="p-4 space-y-2.5">
            <div className="grid grid-cols-12 text-[10px] uppercase text-slate-400 font-semibold px-2">
              <span className="col-span-2">Tier</span>
              <span className="col-span-4 text-center">Avg Loot / Run</span>
              <span className="col-span-4 text-center">Avg Fame / Run</span>
              <span className="col-span-2 text-right">Avg Time</span>
            </div>

            {efficiencyEntries.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs font-mono">
                No dungeon run data recorded for selected filters
              </div>
            ) : (
              efficiencyEntries.map((entry, idx) => (
                <div key={idx} className="grid grid-cols-12 items-center bg-slate-900/40 p-2 rounded-lg border border-slate-800/80 text-xs font-mono">
                  <span className="col-span-2 font-bold text-slate-200">{entry.tierEnchant}</span>
                  
                  {/* Loot Score Bar */}
                  <div className="col-span-4 px-2">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-300 font-bold">{formatNumber(entry.avgLoot)}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-sky-500 rounded-full" style={{ width: `${entry.lootScore}%` }} />
                    </div>
                  </div>

                  {/* Fame Score Bar */}
                  <div className="col-span-4 px-2">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-amber-400 font-bold">{formatNumber(entry.avgFame)}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${entry.fameScore}%` }} />
                    </div>
                  </div>

                  <span className="col-span-2 text-right text-slate-400 text-[11px]">
                    {formatDuration(entry.avgSec)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="h-8 bg-slate-900/80 border-t border-slate-800 px-4 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Recommended Activity:</span>
            <span className="text-amber-400 font-semibold">
              {efficiencyEntries.length > 0
                ? `${efficiencyEntries[0].tierEnchant} for optimal Silver & Fame`
                : "Awaiting dungeon runs to calculate recommendation"}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Solo Dungeon Entrance 90s Safe Timer Utility */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1 max-w-lg">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100 font-['Outfit']">
              Solo Dungeon Entrance 90s Despawn Timer
            </h3>
            {timerRemaining === 0 ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Entrance Safely Closed
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Portal Open ({timerRemaining}s)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Wait inside the entrance until the timer hits 0 to guarantee that the portal has closed and no hostile gankers can follow you.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              soundEnabled ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-slate-900 text-slate-500 border-slate-800"
            }`}
            title="Toggle audio alert upon entrance closure"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setTimerActive(!timerActive)}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors"
            title="Pause / Resume timer"
          >
            {timerActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={resetTimer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset 90s</span>
          </button>

          <div className="text-xl font-black font-mono text-slate-100 bg-slate-900/90 px-3 py-1 rounded-lg border border-slate-800 min-w-[50px] text-center">
            {timerRemaining}s
          </div>
        </div>
      </div>

      {/* 6. Content Runs Table (Historical Recorded Runs) */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="h-11 px-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-slate-100 font-['Outfit']">
              Recorded Content Runs ({filteredRuns.length} Runs)
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Total Fame: {formatNumber(totalFame)} | Total Loot: {formatNumber(totalLootValue)}
          </span>
        </div>

        <div className="overflow-x-auto">
          {filteredRuns.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-xs space-y-2">
              <Layers className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-400">No Recorded Dungeon Runs</p>
              <p className="text-slate-500 max-w-sm mx-auto">
                Enter a Solo Random Dungeon, Corrupted Dungeon, Hellgate, or Group Dungeon in Albion Online. Time, fame, loot, and chest drops will be tracked automatically.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 uppercase text-[10px] font-semibold">
                  <th className="py-2.5 px-4">Run # & Type</th>
                  <th className="py-2.5 px-3">Tier</th>
                  <th className="py-2.5 px-3">Zone / Map</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3 text-right">Fame Earned</th>
                  <th className="py-2.5 px-3 text-right">Silver</th>
                  <th className="py-2.5 px-3 text-right">Loot Value</th>
                  <th className="py-2.5 px-3 text-center">Chests Looted</th>
                  <th className="py-2.5 px-3 text-center">Deaths</th>
                  <th className="py-2.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredRuns.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4 font-sans">
                      <div className="font-semibold text-slate-200 flex items-center gap-2">
                        <span className="text-slate-400 font-mono text-[11px]">{run.id}</span>
                        <span>{run.type}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">{run.startTime}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-400 font-bold">
                        T{run.tier}.{run.enchantment}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-300">{run.mapName}</td>
                    <td className="py-3 px-3 text-slate-300">{formatDuration(run.durationSeconds)}</td>
                    <td className="py-3 px-3 text-right text-amber-400 font-bold">
                      +{formatNumber(run.fame)}
                    </td>
                    <td className="py-3 px-3 text-right text-yellow-400 font-bold">
                      +{formatNumber(run.silver)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-100 font-bold">
                      {formatNumber(run.lootValue)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-[11px]">
                        {run.chests.green > 0 && <span className="text-emerald-400">{run.chests.green}G</span>}
                        {run.chests.blue > 0 && <span className="text-sky-400">{run.chests.blue}B</span>}
                        {run.chests.purple > 0 && <span className="text-purple-400">{run.chests.purple}P</span>}
                        {run.chests.gold > 0 && <span className="text-amber-400 font-bold">{run.chests.gold}L</span>}
                      </div>
                    </td>
                    <td className={`py-3 px-3 text-center ${run.deaths > 0 ? "text-rose-400 font-bold" : "text-slate-500"}`}>
                      {run.deaths}
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {run.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
