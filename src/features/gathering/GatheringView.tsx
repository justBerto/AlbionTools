import React, { useState } from "react";
import { 
  Pickaxe, 
  TreePine, 
  Mountain, 
  Sparkles, 
  Fish, 
  Layers, 
  TrendingUp, 
  Award, 
  Coins, 
  CheckCircle2, 
  Clock 
} from "lucide-react";

interface GatheringEntry {
  id: string;
  resourceType: "Wood" | "Ore" | "Hide" | "Fiber" | "Stone" | "Fishing";
  tier: number;
  enchantment: number;
  amount: number;
  bonusAmount: number;
  fameGained: number;
  estimatedValue: number;
  timestamp: string;
}

export const GatheringView: React.FC = () => {
  const [selectedProfession, setSelectedProfession] = useState<string>("All");
  const [timeRange, setTimeRange] = useState<"all" | "session" | "today" | "week">("session");

  // Empty initial state - populated when resource nodes are harvested
  const [harvestHistory] = useState<GatheringEntry[]>([]);

  const filtered = selectedProfession === "All"
    ? harvestHistory
    : harvestHistory.filter((h) => h.resourceType === selectedProfession);

  const totalGatheringFame = harvestHistory.reduce((acc, h) => acc + h.fameGained, 0);
  const totalGatheringSilver = harvestHistory.reduce((acc, h) => acc + h.estimatedValue, 0);
  const totalYield = harvestHistory.reduce((acc, h) => acc + h.amount + h.bonusAmount, 0);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-80px)]">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 font-['Outfit'] flex items-center gap-2">
            <img src="/assets/pickaxe.png" alt="Pickaxe" className="w-5 h-5 object-contain" />
            <span>Gathering & Fishing Telemetry</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time tracking of resource nodes, gathering gear bonuses, yield breakdown, and fame earned per hour.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Activity Time Range Filter */}
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Activity:</span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="bg-transparent text-slate-200 font-semibold outline-none cursor-pointer"
            >
              <option value="session" className="bg-slate-900">Current Session</option>
              <option value="today" className="bg-slate-900">Today</option>
              <option value="week" className="bg-slate-900">Past 7 Days</option>
              <option value="all" className="bg-slate-900">All Time</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400">Pork Pie Bonus:</span>
            <span className="font-bold text-emerald-400">+15% Yield Active</span>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">Gathering Fame</span>
            <img src="/assets/fame.png" alt="Fame" className="w-4 h-4 object-contain" />
          </div>
          <div className="text-xl font-bold text-slate-100 font-mono">
            +{totalGatheringFame.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-400 font-mono mt-1">
            ~{(totalGatheringFame * 2.8).toLocaleString()} / hour
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">Est. Resource Value</span>
            <img src="/assets/silver.png" alt="Silver" className="w-4 h-4 object-contain" />
          </div>
          <div className="text-xl font-bold text-slate-100 font-mono">
            {totalGatheringSilver.toLocaleString()} silver
          </div>
          <div className="text-[11px] text-yellow-400 font-mono mt-1">
            ~{(totalGatheringSilver * 2.8).toLocaleString()} / hour
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">Total Harvested</span>
            <Layers className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-bold text-slate-100 font-mono">
            {totalYield} items
          </div>
          <div className="text-[11px] text-sky-400 font-mono mt-1">
            incl. bonus yield
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">Active Gear Bonus</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-slate-100 font-mono">
            +67.5%
          </div>
          <div className="text-[11px] text-purple-400 font-mono mt-1">
            T8 Gathering Set + Pie
          </div>
        </div>
      </div>

      {/* Profession Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-slate-400 font-semibold shrink-0">Filter Profession:</span>
        {["All", "Wood", "Ore", "Hide", "Fiber", "Stone", "Fishing"].map((prof) => (
          <button
            key={prof}
            onClick={() => setSelectedProfession(prof)}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors ${
              selectedProfession === prof
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {prof}
          </button>
        ))}
      </div>

      {/* Harvest Log Table */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
            Node Harvesting Log (This Session)
          </h3>
          <span className="text-xs text-slate-400 font-mono">{filtered.length} nodes harvested</span>
        </div>

        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-xs space-y-2">
              <Pickaxe className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-400">No Gathering Activity Recorded</p>
              <p className="text-slate-500 max-w-sm mx-auto">
                Harvest resource nodes (Wood, Ore, Hide, Fiber, Stone) or fish in Albion Online to log yields, gathering fame, and gear bonuses.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Resource Type</th>
                <th className="py-2.5 px-3">Tier</th>
                <th className="py-2.5 px-3">Base Harvest</th>
                <th className="py-2.5 px-3">Bonus Yield (Gear/Pie)</th>
                <th className="py-2.5 px-3">Fame Gained</th>
                <th className="py-2.5 px-3">Est. Value</th>
                <th className="py-2.5 px-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 font-medium font-mono">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-100 flex items-center gap-2 font-sans">
                    {item.resourceType === "Wood" && <TreePine className="w-4 h-4 text-emerald-400" />}
                    {item.resourceType === "Ore" && <Mountain className="w-4 h-4 text-sky-400" />}
                    {item.resourceType === "Fishing" && <Fish className="w-4 h-4 text-blue-400" />}
                    {item.resourceType !== "Wood" && item.resourceType !== "Ore" && item.resourceType !== "Fishing" && (
                      <Pickaxe className="w-4 h-4 text-amber-400" />
                    )}
                    <span>{item.resourceType} Node</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      item.tier >= 8 ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                      item.tier >= 7 ? 'bg-sky-950 text-sky-300 border border-sky-800' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      T{item.tier}{item.enchantment > 0 ? `.${item.enchantment}` : ''}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-200">
                    {item.amount}x
                  </td>
                  <td className="py-3 px-3 text-emerald-400">
                    +{item.bonusAmount}x bonus
                  </td>
                  <td className="py-3 px-3 text-amber-400 font-semibold">
                    +{item.fameGained.toLocaleString()} Fame
                  </td>
                  <td className="py-3 px-3 text-yellow-400 font-semibold">
                    {item.estimatedValue.toLocaleString()} silver
                  </td>
                  <td className="py-3 px-3 text-slate-400 text-[11px]">
                    {item.timestamp}
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
