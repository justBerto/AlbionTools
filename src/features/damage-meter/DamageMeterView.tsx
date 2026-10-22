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
  Info,
  Camera,
  Trash2,
  Bookmark,
  Calendar,
  Clock
} from "lucide-react";
import { PartyMember, CombatSnapshot, CombatantSpell } from "../../types";
import { useToast } from "../../context/ToastContext";
import { resolveWeaponIcon, DEFAULT_WEAPON_ASSET, formatDamageReportToClipboard } from "../../utils/weaponResolver";

interface DamageMeterViewProps {
  party: PartyMember[];
  onResetCombat?: () => void;
}

const SNAPSHOTS_STORAGE_KEY = "albiontools_damage_snapshots";

export const DamageMeterView: React.FC<DamageMeterViewProps> = ({ party, onResetCombat }) => {
  const [activeTab, setActiveTab] = useState<"live" | "snapshots">("live");
  const [metricMode, setMetricMode] = useState<"dps" | "hps" | "taken">("dps");
  const [fightSeconds, setFightSeconds] = useState(0);
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  // Snapshots storage state
  const [snapshots, setSnapshots] = useState<CombatSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem(SNAPSHOTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(snapshots));
    } catch (err) {
      console.error("Failed to persist combat snapshots:", err);
    }
  }, [snapshots]);

  // If a snapshot was selected or default to the most recent one
  useEffect(() => {
    if (snapshots.length > 0 && (!selectedSnapshotId || !snapshots.some(s => s.id === selectedSnapshotId))) {
      setSelectedSnapshotId(snapshots[0].id);
    }
  }, [snapshots, selectedSnapshotId]);

  // Automatic combat detection based on party damage/healing activity
  const hasCombatActivity = party.some((p) => p.dps > 0 || p.hps > 0);
  const [inCombat, setInCombat] = useState(false);

  useEffect(() => {
    let inactivityTimer: any = null;
    if (hasCombatActivity) {
      setInCombat(true);
    } else if (inCombat) {
      inactivityTimer = setTimeout(() => {
        setInCombat(false);
      }, 6000);
    }
    return () => clearTimeout(inactivityTimer);
  }, [hasCombatActivity, inCombat]);

  // Fight timer ticks ONLY while in combat
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
    onResetCombat?.();
    showToast("Combat session reset. Awaiting next damage event.", "info");
  };

  const copyCombatReport = () => {
    if (party.length === 0) {
      showToast("No combat data available to copy", "info");
      return;
    }
    const report = formatDamageReportToClipboard(party, totalDps, formatFightTime(fightSeconds));
    navigator.clipboard.writeText(report);
    showToast("Combat DPS report copied to clipboard", "success");
  };

  const handleTakeSnapshot = () => {
    if (party.length === 0) {
      showToast("Cannot take snapshot: No combat participants recorded", "info");
      return;
    }

    const duration = Math.max(1, fightSeconds);
    const newSnapshot: CombatSnapshot = {
      id: `snap_${Date.now()}`,
      targetName: "Combat Encounter",
      durationSeconds: duration,
      totalDamage: party.reduce((sum, p) => sum + (p.dps * duration), 0),
      groupDps: totalDps,
      timestamp: new Date().toISOString(),
      players: party.map((p) => ({
        id: p.id,
        name: p.name,
        role: p.role,
        weapon: p.weapon,
        weaponIcon: p.weaponIcon,
        damage: p.dps * duration,
        dps: p.dps,
        healing: p.hps * duration,
        hps: p.hps,
        damagePercentage: p.damagePercentage,
        spells: p.spells,
      })),
    };

    setSnapshots((prev) => [newSnapshot, ...prev].slice(0, 50));
    setSelectedSnapshotId(newSnapshot.id);
    showToast("Combat snapshot saved successfully", "success");
  };

  const handleDeleteSnapshot = (id: string) => {
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
    showToast("Snapshot deleted", "info");
  };

  const handleDeleteAllSnapshots = () => {
    if (window.confirm("Delete all saved combat snapshots?")) {
      setSnapshots([]);
      setSelectedSnapshotId(null);
      showToast("All snapshots deleted", "info");
    }
  };

  const copySnapshotReport = (snapshot: CombatSnapshot) => {
    const lines = snapshot.players
      .sort((a, b) => b.dps - a.dps)
      .map((p, idx) => `${idx + 1}. ${p.name}: ${p.dps.toLocaleString()} DPS (${p.damagePercentage.toFixed(1)}%)`);
    const report = `[AlbionTools Combat Snapshot] (Duration: ${formatFightTime(snapshot.durationSeconds)})\n${lines.join("\n")}\nTotal Group DPS: ${snapshot.groupDps.toLocaleString()} /s`;
    navigator.clipboard.writeText(report);
    showToast("Snapshot report copied to clipboard", "success");
  };

  const selectedSnapshot = snapshots.find((s) => s.id === selectedSnapshotId);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-80px)]">
      {/* Top Navigation & Controls Bar */}
      <div className="flex items-center justify-between glass-panel p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100 font-['Outfit']">
              Combat Statistics
            </h2>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Sub-tabs: Live Meter vs Snapshots */}
          <div className="flex items-center bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("live")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                activeTab === "live"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${inCombat ? "bg-rose-500 animate-pulse" : "bg-emerald-400"}`} />
              <span>Live Meter</span>
            </button>
            <button
              onClick={() => setActiveTab("snapshots")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                activeTab === "snapshots"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Snapshots ({snapshots.length})</span>
            </button>
          </div>

          {activeTab === "live" && (
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
                <div className={`w-2 h-2 rounded-full ${inCombat ? "bg-rose-500 animate-ping" : "bg-slate-500"}`} />
                <span className={`font-semibold ${inCombat ? "text-rose-400" : "text-slate-400"}`}>
                  {inCombat ? "IN COMBAT" : "OUT OF COMBAT"}
                </span>
              </div>

              <span className="font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                Duration: <strong className="text-slate-100">{formatFightTime(fightSeconds)}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Center: Mode Toggles (DPS / HPS / Taken) */}
        {activeTab === "live" && (
          <div className="flex items-center bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setMetricMode("dps")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                metricMode === "dps" ? "bg-amber-500 text-slate-950 font-bold shadow-md" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>DPS</span>
            </button>
            <button
              onClick={() => setMetricMode("hps")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                metricMode === "hps" ? "bg-emerald-500 text-slate-950 font-bold shadow-md" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>HPS</span>
            </button>
            <button
              onClick={() => setMetricMode("taken")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                metricMode === "taken" ? "bg-purple-500 text-slate-950 font-bold shadow-md" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Taken</span>
            </button>
          </div>
        )}

        {/* Right Toolbar Action Buttons */}
        <div className="flex items-center gap-2">
          {activeTab === "live" && (
            <>
              {/* Copy to Clipboard */}
              <button
                onClick={copyCombatReport}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-slate-100 bg-slate-900/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 transition-colors"
                title="Copy formatted DPS table to clipboard"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy DPS</span>
              </button>

              {/* Take Snapshot */}
              <button
                onClick={handleTakeSnapshot}
                className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/30 transition-colors"
                title="Save current combat state as snapshot"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Save Snapshot</span>
              </button>

              {/* Reset Combat */}
              <button
                onClick={handleReset}
                className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-900/80 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
                title="Reset current fight"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Launch Floating HUD */}
          <button
            onClick={async () => {
              try {
                const isTauri = typeof window !== "undefined" && Boolean((window as any).__TAURI_INTERNALS__);
                if (isTauri) {
                  const { invoke } = await import("@tauri-apps/api/core");
                  await invoke("show_overlay_window");
                  showToast("Floating DPS Meter launched", "success");
                } else {
                  window.open("/index.html?overlay=true", "AlbionToolsDPS", "width=360,height=340");
                  showToast("Floating DPS Meter opened in popout window", "info");
                }
              } catch (err) {
                console.error("Overlay launch error:", err);
                window.open("/index.html?overlay=true", "AlbionToolsDPS", "width=360,height=340");
                showToast("Floating DPS Meter opened in popout window", "info");
              }
            }}
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/30 transition-colors"
            title="Launch floating overlay over game"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Floating HUD</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LIVE COMBAT METER                                                  */}
      {/* ========================================================================= */}
      {activeTab === "live" && (
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column: Player DPS Bars with Weapon Icons (2 Cols) */}
          <div className="col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-2 pb-2 border-b border-slate-800">
              <span>Rank, Weapon & Player (Click to inspect abilities)</span>
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
                    Enter combat with mobs or hostile players in Albion Online. Your group DPS, healing output, equipped weapon, and ability casts will be recorded in real-time.
                  </p>
                </div>
              ) : (
                party
                  .sort((a, b) => (metricMode === "hps" ? b.hps - a.hps : b.dps - a.dps))
                  .map((player, index) => {
                    const value = metricMode === "hps" ? player.hps : player.dps;
                    const percentage = player.damagePercentage;
                    const isExpanded = expandedPlayerId === player.id;
                    const weaponSrc = resolveWeaponIcon(player);
                    const spells = player.spells || [];

                    return (
                      <div key={player.id} className="space-y-1">
                        <div
                          onClick={() => setExpandedPlayerId(isExpanded ? null : player.id)}
                          className={`relative overflow-hidden rounded-xl bg-slate-900/70 border p-3 cursor-pointer transition-all ${
                            isExpanded
                              ? "border-amber-500/60 shadow-lg shadow-amber-500/5"
                              : "border-slate-800/80 hover:border-slate-700"
                          }`}
                        >
                          {/* Animated Progress Bar Fill */}
                          <div
                            className={`absolute left-0 top-0 bottom-0 opacity-25 transition-all duration-300 ${
                              index === 0
                                ? "bg-gradient-to-r from-amber-500 to-amber-700"
                                : index === 1
                                ? "bg-gradient-to-r from-sky-500 to-sky-700"
                                : "bg-gradient-to-r from-purple-500 to-purple-700"
                            }`}
                            style={{ width: `${percentage}%` }}
                          />

                          {/* Content Row */}
                          <div className="relative z-10 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className={`w-5 text-center font-mono font-bold shrink-0 ${
                                  index === 0 ? "text-amber-400" : index === 1 ? "text-sky-400" : "text-slate-400"
                                }`}
                              >
                                #{index + 1}
                              </span>

                              {/* Weapon Icon beside nickname */}
                              <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-700/60 overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
                                <img
                                  src={weaponSrc}
                                  alt="Weapon"
                                  className="w-full h-full object-contain p-0.5"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = DEFAULT_WEAPON_ASSET;
                                  }}
                                />
                              </div>

                              <div className="truncate">
                                <div className="font-bold text-slate-100 flex items-center gap-2">
                                  <span className="truncate">{player.name}</span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-normal shrink-0">
                                    {player.role}
                                  </span>
                                </div>
                                {player.guild && (
                                  <span className="text-[10px] text-slate-400 truncate block">
                                    &lt;{player.guild}&gt;
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-6 shrink-0">
                              <div className="text-right">
                                <div className="font-bold text-sm text-slate-100 font-mono">
                                  {value.toLocaleString()}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {metricMode === "dps"
                                    ? `${(value * fightSeconds).toLocaleString()} total`
                                    : "live"}
                                </div>
                              </div>

                              <div className="w-12 text-right font-mono font-bold text-slate-300 flex items-center justify-end gap-1">
                                <span>{percentage}%</span>
                                {isExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Spell Details (Real sniffer data only, no fake mock abilities) */}
                        {isExpanded && (
                          <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 text-xs space-y-2 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 pb-1 border-b border-slate-800">
                              <span>Ability Breakdown ({player.name})</span>
                              <span>Hits • Share % • Total Dmg</span>
                            </div>
                            {spells.length === 0 ? (
                              <div className="py-3 text-center text-slate-500 text-xs">
                                No ability damage recorded yet for {player.name} in this combat.
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {spells
                                  .sort((a, b) => b.damage - a.damage)
                                  .map((spell) => {
                                    const totalPlayerDmg = player.dps * fightSeconds || player.damagePercentage || 1;
                                    const share = Math.min(100, Math.round((spell.damage / totalPlayerDmg) * 100));

                                    return (
                                      <div
                                        key={spell.id}
                                        className="flex items-center justify-between text-[11px] text-slate-300"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="w-5 text-center px-1 rounded bg-slate-800 font-mono font-bold text-amber-400 text-[10px]">
                                            {spell.slot?.charAt(0) || "Q"}
                                          </span>
                                          <span className="font-medium text-slate-200">{spell.name}</span>
                                        </div>
                                        <div className="font-mono text-slate-400 flex items-center gap-4">
                                          <span>{spell.hits} hits</span>
                                          <span className="text-amber-400">{share}% share</span>
                                          <span className="font-bold text-slate-100 w-16 text-right">
                                            {spell.damage.toLocaleString()}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            )}
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
                <span>Snapshots & Controls</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Click <strong>Save Snapshot</strong> above to save your encounter. Saved fights can be reviewed, compared, and exported from the <strong>Snapshots</strong> tab anytime!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: COMBAT SNAPSHOTS (Matches Upstream)                                 */}
      {/* ========================================================================= */}
      {activeTab === "snapshots" && (
        <div className="space-y-6">
          {snapshots.length === 0 ? (
            <div className="glass-panel p-16 rounded-2xl border border-slate-800 text-center space-y-3">
              <Camera className="w-12 h-12 text-slate-700 mx-auto" />
              <h3 className="text-base font-bold text-slate-200">No Saved Snapshots</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                You have not saved any combat snapshots yet. While in combat, click <strong>Save Snapshot</strong> in the Live Meter toolbar to save a permanent record of the fight.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Snapshot Selector & Action Bar */}
              <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xs font-semibold text-slate-400 shrink-0">
                    Select Encounter:
                  </span>
                  <select
                    value={selectedSnapshotId || ""}
                    onChange={(e) => setSelectedSnapshotId(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-amber-500 flex-1 max-w-xl"
                  >
                    {snapshots.map((snap) => {
                      const dateStr = new Date(snap.timestamp).toLocaleString();
                      return (
                        <option key={snap.id} value={snap.id}>
                          {dateStr} - Duration: {formatFightTime(snap.durationSeconds)} - Total Dmg: {snap.totalDamage.toLocaleString()} ({snap.players.length} Players)
                        </option>
                      );
                    })}
                  </select>
                </div>

                {selectedSnapshot && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copySnapshotReport(selectedSnapshot)}
                      className="flex items-center gap-1.5 text-xs text-slate-200 hover:text-white bg-slate-900/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 transition-colors"
                      title="Copy snapshot DPS report to clipboard"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Snapshot</span>
                    </button>

                    <button
                      onClick={() => handleDeleteSnapshot(selectedSnapshot.id)}
                      className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg border border-rose-500/30 transition-colors"
                      title="Delete this snapshot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>

                    <button
                      onClick={handleDeleteAllSnapshots}
                      className="text-xs text-slate-500 hover:text-rose-400 px-2 py-1.5 transition-colors"
                      title="Delete all snapshots"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>

              {/* Selected Snapshot Details */}
              {selectedSnapshot && (
                <div className="grid grid-cols-3 gap-6">
                  {/* Left Column: Player Stats for Snapshot */}
                  <div className="col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-2 pb-2 border-b border-slate-800">
                      <span>Player & Weapon (Click to view abilities)</span>
                      <div className="flex items-center gap-6">
                        <span>DPS</span>
                        <span className="w-12 text-right">Share</span>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {selectedSnapshot.players
                        .sort((a, b) => b.dps - a.dps)
                        .map((player, index) => {
                          const isExpanded = expandedPlayerId === (player.id || player.name);
                          const weaponSrc = resolveWeaponIcon(player as any);
                          const spells = player.spells || [];

                          return (
                            <div key={player.id || player.name} className="space-y-1">
                              <div
                                onClick={() =>
                                  setExpandedPlayerId(
                                    isExpanded ? null : player.id || player.name
                                  )
                                }
                                className={`relative overflow-hidden rounded-xl bg-slate-900/70 border p-3 cursor-pointer transition-all ${
                                  isExpanded
                                    ? "border-amber-500/60 shadow-lg shadow-amber-500/5"
                                    : "border-slate-800/80 hover:border-slate-700"
                                }`}
                              >
                                {/* Fill bar */}
                                <div
                                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-amber-500 to-amber-700 opacity-25"
                                  style={{ width: `${player.damagePercentage}%` }}
                                />

                                <div className="relative z-10 flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <span className="w-5 text-center font-mono font-bold text-amber-400 shrink-0">
                                      #{index + 1}
                                    </span>

                                    {/* Weapon icon */}
                                    <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-700/60 overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
                                      <img
                                        src={weaponSrc}
                                        alt="Weapon"
                                        className="w-full h-full object-contain p-0.5"
                                        onError={(e) => {
                                          (e.currentTarget as HTMLImageElement).src = DEFAULT_WEAPON_ASSET;
                                        }}
                                      />
                                    </div>

                                    <div className="truncate">
                                      <div className="font-bold text-slate-100 flex items-center gap-2">
                                        <span className="truncate">{player.name}</span>
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-normal shrink-0">
                                          {player.role}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-6 shrink-0">
                                    <div className="text-right">
                                      <div className="font-bold text-sm text-slate-100 font-mono">
                                        {player.dps.toLocaleString()}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono">
                                        {player.damage.toLocaleString()} total
                                      </div>
                                    </div>

                                    <div className="w-12 text-right font-mono font-bold text-slate-300 flex items-center justify-end gap-1">
                                      <span>{player.damagePercentage.toFixed(1)}%</span>
                                      {isExpanded ? (
                                        <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Expanded spells for snapshot player */}
                              {isExpanded && (
                                <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 text-xs space-y-2 animate-in fade-in duration-150">
                                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 pb-1 border-b border-slate-800">
                                    <span>Ability Breakdown ({player.name})</span>
                                    <span>Hits • Total Dmg</span>
                                  </div>
                                  {spells.length === 0 ? (
                                    <div className="py-2 text-center text-slate-500 text-xs">
                                      No ability hits recorded in this snapshot.
                                    </div>
                                  ) : (
                                    <div className="space-y-1.5">
                                      {spells.map((s) => (
                                        <div
                                          key={s.id}
                                          className="flex items-center justify-between text-[11px] text-slate-300"
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="w-5 text-center px-1 rounded bg-slate-800 font-mono font-bold text-amber-400 text-[10px]">
                                              {s.slot?.charAt(0) || "Q"}
                                            </span>
                                            <span className="font-medium text-slate-200">{s.name}</span>
                                          </div>
                                          <div className="font-mono text-slate-400 flex items-center gap-4">
                                            <span>{s.hits} hits</span>
                                            <span className="font-bold text-slate-100">
                                              {s.damage.toLocaleString()}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Right Column: Snapshot Summary Metrics */}
                  <div className="space-y-4">
                    <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
                      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        <Bookmark className="w-4 h-4 text-amber-400" />
                        <span>Snapshot Overview</span>
                      </h3>

                      <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>Duration</span>
                          </span>
                          <span className="font-bold text-slate-100 font-mono">
                            {formatFightTime(selectedSnapshot.durationSeconds)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                          <span className="text-slate-400">Total Damage</span>
                          <span className="font-bold text-amber-400 font-mono text-sm">
                            {selectedSnapshot.totalDamage.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                          <span className="text-slate-400">Group DPS</span>
                          <span className="font-bold text-amber-400 font-mono text-sm">
                            {selectedSnapshot.groupDps.toLocaleString()} /s
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>Saved At</span>
                          </span>
                          <span className="text-slate-300 font-mono text-[11px]">
                            {new Date(selectedSnapshot.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
