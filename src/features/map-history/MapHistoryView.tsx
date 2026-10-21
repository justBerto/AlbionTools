import React, { useState } from "react";
import { Map, MapPin, Clock, Sparkles, Coins, Skull, ShieldCheck } from "lucide-react";

interface ZoneHistoryEntry {
  id: string;
  clusterName: string;
  tier: string;
  danger: "Blue" | "Yellow" | "Red" | "Black" | "Avalon" | "Mists";
  enteredAt: string;
  duration: string;
  fameGained: number;
  silverGained: number;
  mobKills: number;
}

export const MapHistoryView: React.FC = () => {
  const [history] = useState<ZoneHistoryEntry[]>([]);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-80px)]">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 font-['Outfit'] flex items-center gap-2">
            <Map className="w-5 h-5 text-amber-400" />
            <span>Map & Zone Transition History</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Timeline of clusters visited, danger levels, duration spent, and total rewards accumulated per zone.
          </p>
        </div>

        <div className="text-xs text-slate-400 font-mono bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
          Total Zones Visited: <span className="text-amber-400 font-bold">{history.length}</span>
        </div>
      </div>

      {/* Timeline List */}
      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-xs space-y-2 glass-panel rounded-2xl border border-slate-800">
            <Map className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-400">No Zone Transitions Recorded</p>
            <p className="text-slate-500 max-w-sm mx-auto">
              Travel across clusters, red/black zones, mists, and roads of Avalon in Albion Online to log transition history and danger levels.
            </p>
          </div>
        ) : (
          history.map((entry, idx) => (
            <div
              key={entry.id}
              className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-bold text-slate-400 shrink-0">
                  #{idx + 1}
                </div>

                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-base text-slate-100 font-['Outfit']">
                      {entry.clusterName}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      entry.danger === "Black" ? "bg-red-950 text-red-300 border-red-800" :
                      entry.danger === "Avalon" ? "bg-sky-950 text-sky-300 border-sky-800" :
                      entry.danger === "Red" ? "bg-orange-950 text-orange-300 border-orange-800" :
                      "bg-blue-950 text-blue-300 border-blue-800"
                    }`}>
                      {entry.tier} • {entry.danger} Zone
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-4 font-mono">
                    <span>Entered: {entry.enteredAt}</span>
                    <span>Duration: {entry.duration}</span>
                    <span>Mob Kills: {entry.mobKills}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs font-mono">
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Zone Fame</span>
                  <span className="font-bold text-amber-400 text-sm">+{entry.fameGained.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Zone Silver</span>
                  <span className="font-bold text-yellow-400 text-sm">+{entry.silverGained.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
