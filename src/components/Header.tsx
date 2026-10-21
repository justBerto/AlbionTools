import React, { useState } from "react";
import {
  Shield,
  Wifi,
  WifiOff,
  User,
  MapPin,
  Users,
  Copy,
  ChevronDown,
  Minus,
  Square,
  X,
  Pin,
  TrendingUp,
  Coins,
  Sparkles,
  Award,
  Zap,
  ExternalLink
} from "lucide-react";
import { GameStatus, SessionStats, PartyMember } from "../types";
import { useToast } from "../context/ToastContext";

interface HeaderProps {
  status: GameStatus;
  stats: SessionStats;
  party: PartyMember[];
}

export const Header: React.FC<HeaderProps> = ({
  status,
  stats,
  party
}) => {
  const { showToast } = useToast();
  const [showStatsDropdown, setShowStatsDropdown] = useState(false);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "k";
    return num.toLocaleString();
  };

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyPartyToClipboard = () => {
    const text = party.map((p, i) => `${i + 1}. ${p.name} (${p.role}) - DPS: ${p.dps}`).join("\n");
    navigator.clipboard.writeText(`AlbionTools Party List:\n${text}`);
    showToast("Party roster copied to clipboard", "info");
  };

  return (
    <header className="h-20 bg-[#0B0F19] border-b border-slate-800 flex flex-col justify-between px-4 select-none relative z-50">
      {/* Top Row: App Title, Server Region on Left, Window Controls on Right */}
      <div className="h-10 flex items-center justify-between border-b border-slate-800/40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <img 
              src="/assets/albion_icon.png" 
              alt="Albion Online" 
              className="w-7 h-7 object-contain drop-shadow" 
            />
            <span className="font-extrabold tracking-wider text-base text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 font-['Outfit']">
              AlbionTools
            </span>
          </div>

          <div className="h-3.5 w-px bg-slate-800" />

          {/* Server Region moved to Left */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800">
            <Wifi className="w-3 h-3 text-sky-400" />
            <span className="text-[11px] text-slate-300 font-medium">{status.serverRegion}</span>
          </div>
        </div>

        {/* Right Window Controls */}
        <div className="flex items-center gap-1">
          <div className="text-[11px] font-mono text-slate-400 mr-2 px-2.5 py-0.5 bg-slate-900/90 rounded border border-slate-800">
            {formatUptime(stats.uptimeSeconds)}
          </div>
          <button
            onClick={() => setIsAlwaysOnTop(!isAlwaysOnTop)}
            className={`p-1.5 rounded hover:bg-slate-800 transition-colors ${isAlwaysOnTop ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400'}`}
            title="Always on top"
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 text-slate-400 hover:bg-slate-800 rounded transition-colors" title="Minimize">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 text-slate-400 hover:bg-slate-800 rounded transition-colors" title="Maximize">
            <Square className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 text-slate-400 hover:bg-rose-600 hover:text-white rounded transition-colors" title="Close">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Row: Character Info, Party Bar & Stats Toggle */}
      <div className="h-10 flex items-center justify-between">
        {/* Character, Guild, Zone Info */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-slate-100 leading-tight">
                {status.characterName || "No Character Detected"}
              </span>
              {status.guildName && (
                <span className="text-[10px] text-slate-400 leading-none">
                  &lt;{status.guildName}&gt;
                </span>
              )}
            </div>
          </div>

          <div className="h-3.5 w-px bg-slate-800" />

          {/* Map Zone with Danger Level */}
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium text-slate-200">{status.currentZone}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${status.zoneDanger === 'Black' ? 'bg-red-950/80 text-red-300 border-red-800/80' :
                status.zoneDanger === 'Red' ? 'bg-orange-950/80 text-orange-300 border-orange-800/80' :
                  status.zoneDanger === 'Yellow' ? 'bg-yellow-950/80 text-yellow-300 border-yellow-800/80' :
                    'bg-blue-950/80 text-blue-300 border-blue-800/80'
              }`}>
              {status.zoneTier} • {status.zoneDanger} Zone
            </span>
          </div>
        </div>

        {/* Center: Party Strip */}
        <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Party ({party.length}/20)</span>
          </div>

          <div className="flex items-center -space-x-1.5 overflow-hidden max-w-[200px]">
            {party.slice(0, 6).map((member, i) => (
              <div
                key={member.id}
                className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-200"
                title={`${member.name} (${member.role})`}
              >
                {member.name.charAt(0)}
              </div>
            ))}
            {party.length > 6 && (
              <div className="w-5 h-5 rounded-full bg-amber-900/80 border border-amber-600/80 flex items-center justify-center text-[9px] font-bold text-amber-200">
                +{party.length - 6}
              </div>
            )}
          </div>

          <button
            onClick={copyPartyToClipboard}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Copy party members to clipboard"
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>

        {/* Right: Quick Stats Pills + Dropdown Trigger */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-xs bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800/80">
            {/* Fame */}
            <div className="flex items-center gap-1.5" title="Total Fame (Session)">
              <img src="/assets/fame.png" alt="Fame" className="w-4 h-4 object-contain" />
              <span className="font-semibold text-slate-100">{formatNumber(stats.totalFame)}</span>
              <span className="text-[10px] text-amber-400 font-mono">+{formatNumber(stats.famePerHour)}/h</span>
            </div>

            <div className="h-3 w-px bg-slate-800" />

            {/* Silver */}
            <div className="flex items-center gap-1.5" title="Total Silver (Session)">
              <img src="/assets/silver.png" alt="Silver" className="w-4 h-4 object-contain" />
              <span className="font-semibold text-slate-100">{formatNumber(stats.totalSilver)}</span>
              <span className="text-[10px] text-yellow-400 font-mono">+{formatNumber(stats.silverPerHour)}/h</span>
            </div>
          </div>

          <button
            onClick={() => setShowStatsDropdown(!showStatsDropdown)}
            className={`p-1 rounded hover:bg-slate-800 text-slate-400 transition-transform ${showStatsDropdown ? 'rotate-180 text-amber-400' : ''}`}
            title="Toggle Detailed Session Metrics"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Dropdown Quick Stats Panel */}
      {showStatsDropdown && (
        <div className="absolute top-[80px] right-4 bg-slate-900 border border-slate-700/80 rounded-xl p-4 shadow-2xl w-[500px] grid grid-cols-5 gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
          <div className="flex flex-col items-center bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <img src="/assets/fame.png" alt="Fame" className="w-5 h-5 object-contain mb-1" />
            <span className="text-[10px] uppercase font-bold text-slate-400">Fame</span>
            <span className="font-bold text-sm text-slate-100">{formatNumber(stats.totalFame)}</span>
            <span className="text-[10px] text-amber-400 font-mono">+{formatNumber(stats.famePerHour)}/h</span>
          </div>

          <div className="flex flex-col items-center bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <img src="/assets/silver.png" alt="Silver" className="w-5 h-5 object-contain mb-1" />
            <span className="text-[10px] uppercase font-bold text-slate-400">Silver</span>
            <span className="font-bold text-sm text-slate-100">{formatNumber(stats.totalSilver)}</span>
            <span className="text-[10px] text-yellow-400 font-mono">+{formatNumber(stats.silverPerHour)}/h</span>
          </div>

          <div className="flex flex-col items-center bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <img src="/assets/respec.png" alt="ReSpec" className="w-5 h-5 object-contain mb-1" />
            <span className="text-[10px] uppercase font-bold text-slate-400">ReSpec</span>
            <span className="font-bold text-sm text-slate-100">{formatNumber(stats.reSpecPoints)}</span>
            <span className="text-[10px] text-purple-400 font-mono">+{formatNumber(stats.reSpecPerHour)}/h</span>
          </div>

          <div className="flex flex-col items-center bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <img src="/assets/might.png" alt="Might" className="w-5 h-5 object-contain mb-1" />
            <span className="text-[10px] uppercase font-bold text-slate-400">Might</span>
            <span className="font-bold text-sm text-slate-100">{formatNumber(stats.might)}</span>
            <span className="text-[10px] text-sky-400 font-mono">+{formatNumber(stats.mightPerHour)}/h</span>
          </div>

          <div className="flex flex-col items-center bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <img src="/assets/favor.png" alt="Favor" className="w-5 h-5 object-contain mb-1" />
            <span className="text-[10px] uppercase font-bold text-slate-400">Favor</span>
            <span className="font-bold text-sm text-slate-100">{formatNumber(stats.favor)}</span>
            <span className="text-[10px] text-emerald-400 font-mono">+{formatNumber(stats.favorPerHour)}/h</span>
          </div>
        </div>
      )}
    </header>
  );
};
