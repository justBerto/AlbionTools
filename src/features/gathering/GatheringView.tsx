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

  const [harvestHistory] = useState<GatheringEntry[]>([
    {
      id: "1",
      resourceType: "Wood",
      tier: 8,
      enchantment: 1,
      amount: 6,
      bonusAmount: 4,
      fameGained: 4800,
      estimatedValue: 45000,
      timestamp: "10:52:12",
    },
    {
      id: "2",
      resourceType: "Wood",
      tier: 7,
      enchantment: 0,
      amount: 15,
      bonusAmount: 8,
      fameGained: 6750,
      estimatedValue: 32000,
      timestamp: "10:48:40",
    },
    {
      id: "3",
      resourceType: "Fishing",
      tier: 7,
      enchantment: 0,
      amount: 3,
      bonusAmount: 2,
      fameGained: 3600,
      estimatedValue: 28000,
      timestamp: "10:44:15",
    },
    {
      id: "4",
      resourceType: "Ore",
      tier: 6,
      enchantment: 2,
      amount: 8,
      bonusAmount: 5,
      fameGained: 5200,
      estimatedValue: 38000,
      timestamp: "10:39:02",
    },
    {
      id: "5",
      resourceType: "Fiber",
      tier: 7,
      enchantment: 1,
      amount: 10,
      bonusAmount: 6,
      fameGained: 7100,
      estimatedValue: 41000,
      timestamp: "10:32:50",
    },
  ]);

  const filtered = selectedProfession === "All"
    ? harvestHistory
    : harvestHistory.filter((h) => h.resourceType === selectedProfession);

  const totalGatheringFame = harvestHistory.reduce((acc, h) => acc + h.fameGained, 0);
  const totalGatheringSilver = harvestHistory.reduce((acc, h) => acc + h.estimatedValue, 0);
  const totalYield = harvestHistory.reduce((acc, h) => acc + h.amount + h.bonusAmount, 0);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-80px)]">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 font-['Outfit'] flex items-center gap-2">
            <img src="/assets/pickaxe.png" alt="Pickaxe" className="w-5 h-5 object-contain" />
            <span>Gathering & Fishing Telemetry</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time tracking of resource nodes, gathering gear bonuses, yield breakdown, and fame earned per hour.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400">Pork Pie Bonus:</span>
          <span className="font-bold text-emerald-400">+15% Yield Active</span>
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
        </div>
      </div>
    </div>
  );
};
