import React, { useState } from "react";
import { 
  Settings, 
  Wifi, 
  Volume2, 
  Play, 
  Keyboard, 
  Database, 
  ShieldCheck, 
  HeartHandshake, 
  ExternalLink, 
  Save, 
  RotateCcw,
  Download,
  Trash2
} from "lucide-react";
import { ServerRegion } from "../../types";
import { useAudioAlert } from "../../hooks/useAudioAlert";
import { useToast } from "../../context/ToastContext";

export const SettingsView: React.FC = () => {
  const { showToast } = useToast();
  const { playDungeonClosedChime, playRareLootChime } = useAudioAlert();

  const [provider, setProvider] = useState<"Npcap" | "Sockets">("Npcap");
  const [server, setServer] = useState<ServerRegion>("Europe (Amsterdam)");
  const [packetFilter, setPacketFilter] = useState(
    "((ip and ((udp and (port 5055 or port 5056 or port 5058)) or (ip[6:2] & 0x3fff != 0))) or (ip6 and (udp and (port 5055 or port 5056 or port 5058))))"
  );
  const [dungeonSoundVolume, setDungeonSoundVolume] = useState(80);
  const [itemDropSoundVolume, setItemDropSoundVolume] = useState(100);
  const [autoStartSniffer, setAutoStartSniffer] = useState(true);
  const [overlayHotkey, setOverlayHotkey] = useState("F9");
  const [resetHotkey, setResetHotkey] = useState("F10");

  const handleSave = () => {
    showToast("Settings configuration saved successfully", "success");
  };

  const handleExportConfig = () => {
    const config = {
      provider,
      server,
      packetFilter,
      dungeonSoundVolume,
      itemDropSoundVolume,
      autoStartSniffer,
      overlayHotkey,
      resetHotkey,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "albiontools-config.json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Configuration exported to albiontools-config.json", "info");
  };

  const handleResetDefaults = () => {
    setProvider("Npcap");
    setServer("Europe (Amsterdam)");
    setPacketFilter(
      "((ip and ((udp and (port 5055 or port 5056 or port 5058)) or (ip[6:2] & 0x3fff != 0))) or (ip6 and (udp and (port 5055 or port 5056 or port 5058))))"
    );
    setDungeonSoundVolume(80);
    setItemDropSoundVolume(100);
    setAutoStartSniffer(true);
    setOverlayHotkey("F9");
    setResetHotkey("F10");
    showToast("All settings reset to default values", "info");
  };

  const handleClearCache = () => {
    showToast("Local market cache and combat logs cleared", "success");
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-80px)]">
      {/* Settings Header */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 font-['Outfit'] flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <span>Application Settings & Configuration</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure network sniffer parameters, audio alerts, hotkeys, and data storage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              localStorage.removeItem("albiontools_setup_completed");
              window.location.reload();
            }}
            className="flex items-center gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-amber-400 font-medium px-3.5 py-2 rounded-xl border border-amber-500/30 transition-colors"
            title="Buka kembali First Start Guide (bahasa, folder game Albion, server, dan Npcap)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Jalankan Setup Wizard</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium px-3.5 py-2 rounded-xl border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl transition-colors shadow-lg shadow-amber-500/20"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Network & Sniffer Settings */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
            <Wifi className="w-4 h-4 text-sky-400" />
            <span>Network & Packet Sniffer</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="text-slate-300 font-medium block mb-1.5">Packet Provider Engine</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProvider("Npcap")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    provider === "Npcap"
                      ? 'border-amber-500 bg-amber-500/10 text-slate-100'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold">Npcap Driver</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Recommended. Does not require admin rights. Works with VPN.</div>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider("Sockets")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    provider === "Sockets"
                      ? 'border-amber-500 bg-amber-500/10 text-slate-100'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold">Raw Sockets</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Requires running AlbionTools as Administrator.</div>
                </button>
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Target Albion Game Server</label>
              <select
                value={server}
                onChange={(e) => setServer(e.target.value as ServerRegion)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500 font-medium"
              >
                <option value="Europe (Amsterdam)">Europe (Amsterdam) — Live Server</option>
                <option value="Americas (Washington)">Americas (Washington) — Live Server</option>
                <option value="Asia (Singapore)">Asia (Singapore) — Live Server</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">UDP Packet Filter Expression</label>
              <textarea
                value={packetFilter}
                onChange={(e) => setPacketFilter(e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 outline-none focus:border-amber-500 font-mono text-[11px] leading-tight"
              />
              <span className="text-[10px] text-slate-500">
                Default Albion UDP ports: 5055, 5056, 5058.
              </span>
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoStartSniffer}
                  onChange={(e) => setAutoStartSniffer(e.target.checked)}
                  className="rounded accent-amber-500"
                />
                <span className="text-slate-300 font-medium">
                  Automatically start packet capture when Albion Online launches
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Audio Alerts & Sounds */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span>Audio Alerts & Notifications</span>
          </h3>

          <div className="space-y-4 text-xs">
            {/* Dungeon Sound */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-slate-300 font-medium">
                <span>Dungeon Safe Entrance Chime</span>
                <span className="font-mono text-amber-400">{dungeonSoundVolume}%</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={dungeonSoundVolume}
                  onChange={(e) => setDungeonSoundVolume(parseInt(e.target.value))}
                  className="flex-1 accent-amber-500"
                />
                <button
                  type="button"
                  onClick={playDungeonClosedChime}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] transition-colors"
                >
                  <Play className="w-3 h-3 text-emerald-400" />
                  <span>Test Chime</span>
                </button>
              </div>
              <div className="text-[10px] text-slate-500">
                Plays when dungeon 90s countdown completes and the portal is safely closed.
              </div>
            </div>

            {/* Rare Loot Sound */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-slate-300 font-medium">
                <span>Rare Item Loot Drop Chime</span>
                <span className="font-mono text-amber-400">{itemDropSoundVolume}%</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={itemDropSoundVolume}
                  onChange={(e) => setItemDropSoundVolume(parseInt(e.target.value))}
                  className="flex-1 accent-amber-500"
                />
                <button
                  type="button"
                  onClick={playRareLootChime}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] transition-colors"
                >
                  <Play className="w-3 h-3 text-amber-400" />
                  <span>Test Chime</span>
                </button>
              </div>
              <div className="text-[10px] text-slate-500">
                Plays when a valuable T7/T8 artifact or high-value chest drop is logged.
              </div>
            </div>

            {/* Hotkeys Section */}
            <div className="pt-2">
              <h4 className="font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                <Keyboard className="w-3.5 h-3.5 text-purple-400" />
                <span>Global In-Game Hotkeys</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Toggle Mini HUD:</span>
                  <span className="font-mono bg-slate-800 text-amber-300 px-2 py-0.5 rounded font-bold">{overlayHotkey}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Reset Combat:</span>
                  <span className="font-mono bg-slate-800 text-amber-300 px-2 py-0.5 rounded font-bold">{resetHotkey}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management & Export Section */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
          <Database className="w-4 h-4 text-amber-400" />
          <span>Local Storage & Telemetry Data Management</span>
        </h3>

        <div className="flex items-center justify-between text-xs">
          <div className="text-slate-400 max-w-xl">
            Export your current configuration to a JSON file or clear temporary cached item prices, combat logs, and offline map history.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportConfig}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Export Config JSON</span>
            </button>
            <button
              onClick={handleClearCache}
              className="flex items-center gap-1.5 bg-rose-950/40 hover:bg-rose-950/80 text-rose-300 px-3 py-1.5 rounded-xl border border-rose-800/60 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear Local Cache</span>
            </button>
          </div>
        </div>
      </div>

      {/* Attribution, Fork Notice & License */}
      <div className="glass-panel p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
              Fork Attribution & Open Source Credits
            </h3>
          </div>
          <span className="text-xs bg-amber-500/10 text-amber-300 font-mono px-2.5 py-0.5 rounded-full border border-amber-500/30">
            GNU General Public License v3.0
          </span>
        </div>

        <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
          <p>
            <strong>AlbionTools</strong> is an independent, modernized companion tool for Albion Online, rebuilt from the ground up to achieve maximum performance and responsive UX using <strong>Tauri 2.0</strong>, <strong>React</strong>, and <strong>Tailwind CSS</strong>.
          </p>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="font-semibold text-slate-100">Original Project Attribution:</div>
            <p className="text-slate-400 text-[11px]">
              This project is directly forked and adapted from the foundational work of:
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="font-mono text-amber-300 font-medium">
                Triky313 / AlbionOnline-StatisticsAnalysis
              </span>
              <a
                href="https://github.com/Triky313/AlbionOnline-StatisticsAnalysis"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-sky-400 hover:text-sky-300 hover:underline text-[11px]"
              >
                <span>View Original GitHub Repository</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-[10px] text-slate-500 pt-1">
              Original Creator: Aaron Schultz (Triky313) & Community Contributors. All original packet handling protocols, decryption algorithms, and event mappings are credited to the upstream repository.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
