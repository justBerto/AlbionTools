import React, { useState, useEffect } from "react";
import { Swords, Heart, ShieldAlert, X, Move, Camera, Copy, RotateCcw, Check } from "lucide-react";
import { PartyMember, CombatSnapshot } from "../../types";
import { resolveWeaponIcon, DEFAULT_WEAPON_ASSET, formatDamageReportToClipboard } from "../../utils/weaponResolver";

interface MiniDamageOverlayProps {
  party: PartyMember[];
  onClose: () => void;
  onResetCombat?: () => void;
  fightTime?: string;
  inCombat?: boolean;
  isStandalone?: boolean;
}

export const MiniDamageOverlay: React.FC<MiniDamageOverlayProps> = ({
  party,
  onClose,
  onResetCombat,
  fightTime = "00:00",
  inCombat = false,
  isStandalone = false,
}) => {
  const [metricMode, setMetricMode] = useState<"dps" | "hps">("dps");
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [snapshotFeedback, setSnapshotFeedback] = useState(false);
  const totalDps = party.reduce((acc, p) => acc + p.dps, 0);

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

  const handleCopy = () => {
    if (party.length === 0) return;
    const text = formatDamageReportToClipboard(party, totalDps, fightTime);
    if (text) {
      navigator.clipboard.writeText(text);
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 2000);
    }
  };

  const handleSaveSnapshot = () => {
    if (party.length === 0) return;

    // Estimate total damage from DPS and fight time
    const parts = fightTime.split(":").map(Number);
    const secs = (parts[0] || 0) * 60 + (parts[1] || 0);
    const totalFightSeconds = Math.max(1, secs);

    const snapshot: CombatSnapshot = {
      id: `snap_${Date.now()}`,
      targetName: "Combat Encounter",
      durationSeconds: totalFightSeconds,
      totalDamage: party.reduce((sum, p) => sum + (p.dps * totalFightSeconds), 0),
      groupDps: totalDps,
      timestamp: new Date().toISOString(),
      players: party.map((p) => ({
        id: p.id,
        name: p.name,
        role: p.role,
        weapon: p.weapon,
        weaponIcon: p.weaponIcon,
        damage: p.dps * totalFightSeconds,
        dps: p.dps,
        healing: p.hps * totalFightSeconds,
        hps: p.hps,
        damagePercentage: p.damagePercentage,
        spells: p.spells,
      })),
    };

    try {
      const raw = localStorage.getItem("albiontools_damage_snapshots");
      const existing: CombatSnapshot[] = raw ? JSON.parse(raw) : [];
      const updated = [snapshot, ...existing].slice(0, 30);
      localStorage.setItem("albiontools_damage_snapshots", JSON.stringify(updated));
      setSnapshotFeedback(true);
      setTimeout(() => setSnapshotFeedback(false), 2000);
    } catch (err) {
      console.error("Failed to save snapshot from overlay:", err);
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
    : "fixed bottom-6 right-6 z-[999] w-84 bg-[#090D16] rounded-2xl shadow-2xl overflow-hidden select-none border border-slate-800";

  return (
    <div className={containerClasses}>
      {/* Mini Overlay Header: draggable via data-tauri-drag-region */}
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
            <span className="tracking-wide">Albion DPS</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-300 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50">
            <span className={`w-1.5 h-1.5 rounded-full ${inCombat ? "bg-rose-500 animate-pulse" : "bg-slate-500"}`} />
            <span>{fightTime}</span>
          </div>
        </div>

        {/* Action Controls: Copy, Snapshot, Reset, Mode Toggle, Close (No Pin) */}
        <div className="flex items-center gap-1 pointer-events-auto">
          {/* Copy to Clipboard */}
          <button
            onClick={handleCopy}
            className={`p-1 rounded transition-colors ${
              copiedFeedback ? "text-emerald-400 bg-emerald-500/20" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
            title={copiedFeedback ? "Copied!" : "Copy DPS to clipboard"}
          >
            {copiedFeedback ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Take Snapshot */}
          <button
            onClick={handleSaveSnapshot}
            className={`p-1 rounded transition-colors ${
              snapshotFeedback ? "text-amber-400 bg-amber-500/20" : "text-slate-400 hover:text-amber-300 hover:bg-slate-800"
            }`}
            title={snapshotFeedback ? "Snapshot saved!" : "Save combat snapshot"}
          >
            {snapshotFeedback ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Camera className="w-3.5 h-3.5" />}
          </button>

          {/* Reset Combat */}
          <button
            onClick={() => onResetCombat?.()}
            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
            title="Reset combat"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Mode Toggle (DPS / HPS) */}
          <button
            onClick={() => setMetricMode(metricMode === "dps" ? "hps" : "dps")}
            className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors uppercase font-mono border border-slate-700/40"
            title="Toggle DPS / HPS"
          >
            {metricMode}
          </button>
          
          {/* Close */}
          <button
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
            title="Close floating overlay"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mini Player List with Weapon Icons */}
      <div className="p-2.5 space-y-1.5 flex-1 overflow-y-auto">
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
            const weaponSrc = resolveWeaponIcon(player);

            return (
              <div
                key={player.id}
                className="relative overflow-hidden rounded-lg bg-slate-900/70 border border-slate-800/80 p-2 text-xs"
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

                <div className="relative z-10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-3.5 text-[10px] font-mono font-bold text-slate-400 shrink-0">
                      {index + 1}
                    </span>

                    {/* Weapon Icon beside nickname */}
                    <div className="w-6 h-6 rounded bg-slate-950 border border-slate-700/60 overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
                      <img
                        src={weaponSrc}
                        alt="Weapon"
                        className="w-full h-full object-contain p-0.5"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = DEFAULT_WEAPON_ASSET;
                        }}
                      />
                    </div>

                    <span className="font-semibold text-slate-200 truncate text-xs">
                      {player.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 font-mono shrink-0">
                    <span className="font-bold text-slate-100">
                      {value.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 w-10 text-right">
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
        <span>Party Total:</span>
        <span className="font-bold text-amber-400">{totalDps.toLocaleString()} /s</span>
      </div>
    </div>
  );
};
