import React, { useState } from "react";
import { Skull, AlertTriangle, Coins, MapPin, ExternalLink, ShieldAlert } from "lucide-react";

interface DeathEventRecord {
  id: string;
  timestamp: string;
  location: string;
  zoneType: "Black Zone" | "Red Zone" | "Hellgate";
  killerName: string;
  killerGuild?: string;
  killerIp: number;
  deathFameGiven: number;
  totalSilverLost: number;
  lostGear: {
    slot: string;
    itemId: string;
    name: string;
    tier: number;
    ench: number;
    estValue: number;
  }[];
}

export const LossExplorerView: React.FC = () => {
  const [deaths] = useState<DeathEventRecord[]>([]);

  const totalSilverLostSession = deaths.reduce((acc, d) => acc + d.totalSilverLost, 0);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-80px)]">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 font-['Outfit'] flex items-center gap-2">
            <Skull className="w-5 h-5 text-rose-400" />
            <span>Loss Explorer (Lethal Deaths)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Detailed breakdown of inventory and equipment lost upon death in lethal PvP zones.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-rose-950/40 border border-rose-800/60 px-3.5 py-1.5 rounded-xl text-xs">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="text-slate-400">Total Lost Silver:</span>
          <span className="font-bold text-rose-400 font-mono">
            -{totalSilverLostSession.toLocaleString()} silver
          </span>
        </div>
      </div>

      {/* Deaths List */}
      <div className="space-y-4">
        {deaths.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl border border-slate-800/80 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
              <ShieldAlert className="w-6 h-6 text-slate-500" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-300">No Lethal Deaths Recorded</p>
              <p className="text-xs text-slate-500 max-w-sm">
                You haven't lost any gear in lethal PvP zones (Black Zone, Red Zone, Hellgates) during this session. Stay safe out there!
              </p>
            </div>
          </div>
        ) : (
          deaths.map((death) => (
            <div
              key={death.id}
              className="glass-panel p-5 rounded-2xl border border-rose-900/40 bg-rose-950/10 space-y-4"
            >
              {/* Death Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-800 flex items-center justify-center text-rose-400 shrink-0">
                    <Skull className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-100">Killed by: {death.killerName}</span>
                      {death.killerGuild && (
                        <span className="text-xs text-slate-400">&lt;{death.killerGuild}&gt;</span>
                      )}
                      <span className="text-[10px] font-mono text-amber-400 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                        {death.killerIp} IP
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-3 font-mono">
                      <span>{death.location}</span>
                      <span>•</span>
                      <span>Time: {death.timestamp}</span>
                      <span>•</span>
                      <span>Fame Given: -{death.deathFameGiven.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-rose-400 block font-mono">Estimated Loss</span>
                  <span className="font-bold text-base text-rose-400 font-mono">
                    -{death.totalSilverLost.toLocaleString()} silver
                  </span>
                </div>
              </div>

              {/* Lost Gear Grid */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 block">
                  Dropped / Destroyed Equipment
                </span>
                <div className="grid grid-cols-3 gap-3">
                  {death.lostGear.map((item) => (
                    <div
                      key={item.slot}
                      className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-slate-950 border border-slate-800 p-0.5 flex items-center justify-center">
                          <img
                            src={`https://render.albiononline.com/v1/item/${item.itemId}.png`}
                            alt={item.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200 truncate max-w-[130px]">{item.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">Slot: {item.slot}</div>
                        </div>
                      </div>
                      <div className="font-mono text-rose-400 font-medium text-right">
                        -{item.estValue.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
