import React, { useState, useEffect } from "react";
import { 
  Swords, 
  Heart, 
  ShieldAlert, 
  RotateCcw, 
  ExternalLink, 
  Copy, 
  Zap, 
  Flame, 
  ChevronRight,
  ChevronDown,
  Info
} from "lucide-react";
import { PartyMember } from "../../types";
import { useToast } from "../../context/ToastContext";

interface DamageMeterViewProps {
  party: PartyMember[];
  onToggleOverlay?: () => void;
}

interface SpellDetail {
  id: string;
  name: string;
  slot: "Q" | "W" | "E" | "Passive" | "Auto Attack";
  damage: number;
  hits: number;
  critRate: number;
}

export const DamageMeterView: React.FC<DamageMeterViewProps> = ({ party, onToggleOverlay }) => {
  const [metricMode, setMetricMode] = useState<"dps" | "hps" | "taken">("dps");
  const [fightSeconds, setFightSeconds] = useState(0);
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  // Automatic combat detection based on party damage/healing activity
  const hasCombatActivity = party.some((p) => p.dps > 0 || p.hps > 0);
  const [inCombat, setInCombat] = useState(false);

  useEffect(() => {
    let inactivityTimer: any = null;
    if (hasCombatActivity) {
      setInCombat(true);
    } else if (inCombat) {
      // 6 second combat dropoff timeout
      inactivityTimer = setTimeout(() => {
        setInCombat(false);
      }, 6000);
    }
    return () => clearTimeout(inactivityTimer);
  }, [hasCombatActivity, inCombat]);

  // Fight timer ticks ONLY while genuinely in combat
  useEffect(() => {
    let timer: any = null;
    if (inCombat) {
      timer = setInterval(() => setFightSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [inCombat]);

  const formatFightTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const { showToast } = useToast();
  const totalDps = party.reduce((acc, p) => acc + p.dps, 0);
  const totalHps = party.reduce((acc, p) => acc + p.hps, 0);

  const handleReset = () => {
    setFightSeconds(0);
    setInCombat(false);
    setExpandedPlayerId(null);
    showToast("Combat session reset. Awaiting next damage event.", "info");
  };

  const copyCombatReport = () => {
    if (party.length === 0) {
      showToast("No combat data available to copy", "info");
      return;
    }
    const lines = party
      .sort((a, b) => b.dps - a.dps)
      .map((p, idx) => `${idx + 1}. ${p.name} - ${p.dps.toLocaleString()} DPS (${p.damagePercentage}%)`);
    const report = `[AlbionTools Combat DPS Report]\n${lines.join("\n")}\nTotal Group DPS: ${totalDps.toLocaleString()} | Duration: ${formatFightTime(fightSeconds)}`;
    navigator.clipboard.writeText(report);
    showToast("Combat DPS report copied to clipboard for Discord", "success");
  };

  // Spell breakdown for expanded player
  const sampleSpells: SpellDetail[] = [
    { id: "1", name: "Heroic Strike", slot: "Q", damage: 48500, hits: 32, critRate: 24.5 },
    { id: "2", name: "Iron Will", slot: "W", damage: 12200, hits: 8, critRate: 12.0 },
    { id: "3", name: "Mighty Blow", slot: "E", damage: 78900, hits: 14, critRate: 35.7 },
    { id: "4", name: "Auto Attack", slot: "Auto Attack", damage: 32100, hits: 45, critRate: 18.2 },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-80px)]">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between glass-panel p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100 font-['Outfit']">
              Live Combat Tracker
            </h2>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Automatic Combat State Badge & Fight Timer */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
              <div className={`w-2 h-2 rounded-full ${inCombat ? 'bg-rose-500 animate-ping' : 'bg-slate-500'}`} />
              <span className={`font-semibold ${inCombat ? "text-rose-400" : "text-slate-400"}`}>
                {inCombat ? "IN COMBAT" : "OUT OF COMBAT"}
              </span>
            </div>

            <span className="font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
              Duration: <strong className="text-slate-100">{formatFightTime(fightSeconds)}</strong>
            </span>
          </div>
        </div>

        {/* Center: Mode Toggles (DPS / HPS / Damage Taken) */}
        <div className="flex items-center bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setMetricMode("dps")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              metricMode === "dps" ? 'bg-amber-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Damage (DPS)</span>
          </button>
          <button
            onClick={() => setMetricMode("hps")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              metricMode === "hps" ? 'bg-emerald-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Healing (HPS)</span>
          </button>
          <button
            onClick={() => setMetricMode("taken")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              metricMode === "taken" ? 'bg-purple-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Damage Taken</span>
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={copyCombatReport}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-slate-100 bg-slate-900/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 transition-colors"
            title="Copy formatted DPS table for Discord"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Discord Report</span>
          </button>

          <button
            onClick={async () => {
              try {
                const isTauri = typeof window !== "undefined" && Boolean((window as any).__TAURI_INTERNALS__);
                if (isTauri) {
                  const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
                  let overlay = await WebviewWindow.getByLabel("overlay");
                  if (overlay) {
                    await overlay.show();
                    await overlay.setFocus();
                    await overlay.setAlwaysOnTop(true);
                  } else {
                    overlay = new WebviewWindow("overlay", {
                      url: "/?overlay=true",
                      title: "AlbionTools DPS Meter",
                      width: 360,
                      height: 340,
                      alwaysOnTop: true,
                      decorations: false,
                      transparent: true,
                    });
                    await overlay.show();
                    await overlay.setFocus();
                  }
                  showToast("Floating DPS Meter launched (Always On Top)", "success");
                } else if (onToggleOverlay) {
                  onToggleOverlay();
                  showToast("In-app floating DPS meter overlay enabled", "info");
                } else {
                  window.open("/?overlay=true", "AlbionToolsDPS", "width=360,height=340");
                  showToast("Floating DPS Meter opened in popout window", "info");
                }
              } catch (err) {
                console.error("Overlay launch error:", err);
                onToggleOverlay?.();
                showToast("Floating DPS Meter active in overlay mode", "info");
              }
            }}
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/30 transition-colors"
            title="Launch floating always-on-top overlay over games and desktop"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Floating HUD</span>
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-900/80 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
            title="Reset current fight"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main DPS Meter List */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column: Player DPS Bars (2 Cols) */}
        <div className="col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-2 pb-2 border-b border-slate-800">
            <span>Rank & Player (Click to inspect abilities)</span>
            <div className="flex items-center gap-6">
              <span>{metricMode === "dps" ? "DPS" : metricMode === "hps" ? "HPS" : "Taken"}</span>
              <span className="w-12 text-right">Share</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {party.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <Swords className="w-10 h-10 text-slate-700 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">No Combat Data Recorded</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Enter combat with mobs or hostile players in Albion Online. Your group DPS, healing output, and ability casts will be recorded in real-time.
                </p>
              </div>
            ) : (
              party
                .sort((a, b) => (metricMode === "hps" ? b.hps - a.hps : b.dps - a.dps))
                .map((player, index) => {
                const value = metricMode === "hps" ? player.hps : player.dps;
                const percentage = player.damagePercentage;
                const isExpanded = expandedPlayerId === player.id;

                return (
                  <div key={player.id} className="space-y-1">
                    <div
                      onClick={() => setExpandedPlayerId(isExpanded ? null : player.id)}
                      className={`relative overflow-hidden rounded-xl bg-slate-900/70 border p-3 cursor-pointer transition-all ${
                        isExpanded ? 'border-amber-500/60 shadow-lg shadow-amber-500/5' : 'border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      {/* Animated Progress Bar Fill */}
                      <div
                        className={`absolute left-0 top-0 bottom-0 opacity-25 transition-all duration-300 ${
                          index === 0
                            ? 'bg-gradient-to-r from-amber-500 to-amber-700'
                            : index === 1
                            ? 'bg-gradient-to-r from-sky-500 to-sky-700'
                            : 'bg-gradient-to-r from-purple-500 to-purple-700'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />

                      {/* Content Row */}
                      <div className="relative z-10 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className={`w-5 text-center font-mono font-bold ${
                            index === 0 ? 'text-amber-400' : index === 1 ? 'text-sky-400' : 'text-slate-400'
                          }`}>
                            #{index + 1}
                          </span>

                          <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-amber-300">
                            {player.role.charAt(0)}
                          </div>

                          <div>
                            <div className="font-bold text-slate-100 flex items-center gap-2">
                              <span>{player.name}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-normal">
                                {player.role}
                              </span>
                            </div>
                            {player.guild && (
                              <span className="text-[10px] text-slate-400">&lt;{player.guild}&gt;</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="font-bold text-sm text-slate-100 font-mono">
                              {value.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {metricMode === "dps" ? `${(value * fightSeconds).toLocaleString()} total` : 'live'}
                            </div>
                          </div>

                          <div className="w-12 text-right font-mono font-bold text-slate-300 flex items-center justify-end gap-1">
                            <span>{percentage}%</span>
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-amber-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Spell Details */}
                    {isExpanded && (
                      <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 text-xs space-y-2 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 pb-1 border-b border-slate-800">
                          <span>Ability Breakdown ({player.name})</span>
                          <span>Hits • Crit % • Total Dmg</span>
                        </div>
                        <div className="space-y-1.5">
                          {sampleSpells.map((spell) => (
                            <div key={spell.id} className="flex items-center justify-between text-[11px] text-slate-300">
                              <div className="flex items-center gap-2">
                                <span className="w-5 text-center px-1 rounded bg-slate-800 font-mono font-bold text-amber-400 text-[10px]">
                                  {spell.slot.charAt(0)}
                                </span>
                                <span className="font-medium text-slate-200">{spell.name}</span>
                              </div>
                              <div className="font-mono text-slate-400 flex items-center gap-4">
                                <span>{spell.hits} hits</span>
                                <span className="text-amber-400">{spell.critRate}% crit</span>
                                <span className="font-bold text-slate-100 w-16 text-right">{spell.damage.toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Group Stats (1 Col) */}
        <div className="space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Group Combat Summary</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Total Group DPS</span>
                <span className="font-bold text-amber-400 font-mono text-sm">
                  {totalDps.toLocaleString()} /s
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Total Group HPS</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">
                  {totalHps.toLocaleString()} /s
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Current Fight Time</span>
                <span className="font-bold text-slate-100 font-mono">
                  {formatFightTime(fightSeconds)}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl border border-slate-800 text-xs space-y-2">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-400" />
              <span>Overlay Shortcut</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Click <strong>Overlay Mode</strong> above to minimize AlbionTools into a compact HUD that floats cleanly in the corner of your screen while playing!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
