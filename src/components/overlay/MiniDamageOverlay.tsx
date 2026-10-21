import React, { useState, useEffect } from "react";
import { Swords, Heart, ShieldAlert, X, Move, Pin } from "lucide-react";
import { PartyMember } from "../../types";

interface MiniDamageOverlayProps {
  party: PartyMember[];
  onClose: () => void;
  fightTime?: string;
  inCombat?: boolean;
  isStandalone?: boolean;
}

export const MiniDamageOverlay: React.FC<MiniDamageOverlayProps> = ({
  party,
  onClose,
  fightTime = "01:42",
  inCombat = true,
  isStandalone = false,
}) => {
  const [metricMode, setMetricMode] = useState<"dps" | "hps" | "taken">("dps");
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(true);
  const totalDps = party.reduce((acc, p) => acc + p.dps, 0);

  // Toggle Always on Top if in Tauri environment
  const toggleAlwaysOnTop = async () => {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const current = getCurrentWindow();
      const next = !isAlwaysOnTop;
      await current.setAlwaysOnTop(next);
      setIsAlwaysOnTop(next);
    } catch {
      setIsAlwaysOnTop(!isAlwaysOnTop);
    }
  };

  const handleClose = async () => {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const current = getCurrentWindow();
      await current.hide();
    } catch {
      if (isStandalone) {
        window.close();
      } else {
        onClose();
      }
    }
  };

  // Keyboard accessibility: Escape closes overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const containerClasses = isStandalone
    ? "h-screen w-screen bg-[#090D16] border border-slate-800 flex flex-col justify-between select-none overflow-hidden"
    : "fixed bottom-6 right-6 z-[999] w-80 bg-[#090D16] rounded-2xl shadow-2xl overflow-hidden select-none border border-slate-800";

  return (
    <div className={containerClasses}>
      {/* Mini Overlay Header - draggable over desktop via data-tauri-drag-region */}
      <div 
        data-tauri-drag-region 
        className="h-10 bg-slate-900/90 border-b border-slate-800 px-3 flex items-center justify-between text-xs cursor-move select-none"
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <div className="text-slate-400">
            <Move className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5 font-bold text-slate-100 font-['Outfit']">
            <Swords className="w-3.5 h-3.5 text-amber-400" />
            <span className="tracking-wide">Albion DPS Meter</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-300 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50">
            <span className={`w-1.5 h-1.5 rounded-full ${inCombat ? "bg-rose-500 animate-pulse" : "bg-slate-500"}`} />
            <span>{fightTime}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 pointer-events-auto">
          {/* Always on top toggle */}
          <button
            onClick={toggleAlwaysOnTop}
            className={`p-1 rounded transition-colors ${
              isAlwaysOnTop ? "text-amber-400 bg-amber-500/10" : "text-slate-400 hover:bg-slate-800"
            }`}
            title={isAlwaysOnTop ? "Floating always on top (Active)" : "Pin always on top"}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setMetricMode(metricMode === "dps" ? "hps" : "dps")}
            className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors uppercase font-mono border border-slate-700/40"
            title="Toggle DPS / HPS"
          >
            {metricMode}
          </button>
          
          <button
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
            title="Close floating overlay"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mini List */}
      <div className="p-3 space-y-1.5 flex-1 overflow-y-auto">
        {party.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            Awaiting combat data in Albion Online...
          </div>
        ) : (
          party
            .sort((a, b) => (metricMode === "hps" ? b.hps - a.hps : b.dps - a.dps))
            .map((player, index) => {
            const value = metricMode === "hps" ? player.hps : player.dps;
            const percentage = player.damagePercentage;

            return (
              <div
                key={player.id}
                className="relative overflow-hidden rounded-lg bg-slate-900/60 border border-slate-800/80 p-2 text-xs"
              >
                {/* Bar Fill */}
                <div
                  className={`absolute left-0 top-0 bottom-0 opacity-20 transition-all duration-300 ${
                    index === 0
                      ? "bg-gradient-to-r from-amber-500 to-amber-700"
                      : index === 1
                      ? "bg-gradient-to-r from-sky-500 to-sky-700"
                      : "bg-gradient-to-r from-purple-500 to-purple-700"
                  }`}
                  style={{ width: `${percentage}%` }}
                />

                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 text-[10px] font-mono font-bold text-slate-400">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-slate-200 truncate max-w-[120px]">
                      {player.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono">
                    <span className="font-bold text-slate-100">
                      {value.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 w-9 text-right">
                      {percentage}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Total */}
      <div className="h-8 bg-slate-900/90 border-t border-slate-800 px-3 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>Party DPS:</span>
        <span className="font-bold text-amber-400">{totalDps.toLocaleString()} /s</span>
      </div>
    </div>
  );
};
