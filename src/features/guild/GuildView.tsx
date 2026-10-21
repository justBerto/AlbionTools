import React, { useState } from "react";
import { ShieldAlert, Users, Award, Coins, TrendingUp, Calendar, Trophy } from "lucide-react";

interface GuildViewProps {
  guildName?: string;
  allianceName?: string;
}

export const GuildView: React.FC<GuildViewProps> = ({ guildName, allianceName }) => {
  const hasGuild = Boolean(guildName && guildName !== "Waiting for Albion Online...");
  const [guildInfo] = useState({
    name: guildName || "No Guild Detected",
    alliance: allianceName || "None",
    memberCount: 0,
    maxMembers: 300,
    seasonPoints: 0,
    seasonRank: 0,
    dailyTaxIncome: 0,
  });

  const [taxLogs] = useState<Array<{ id: string; player: string; action: string; amount: number; time: string }>>([]);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-80px)]">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 font-['Outfit'] flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span>Guild & Season Telemetry</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Guild roster, season point logs, territory maintenance, and account bank tax activity.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-slate-400">Season Rank:</span>
          <span className="font-bold text-amber-400 font-mono">
            {guildInfo.seasonRank > 0 ? `#${guildInfo.seasonRank}` : "Unranked"}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">Guild Name</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-slate-100 truncate">
            {guildInfo.name}
          </div>
          <div className="text-[11px] text-amber-400 mt-1 font-mono">
            Alliance: [{guildInfo.alliance}]
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">Total Members</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-bold text-slate-100 font-mono">
            {guildInfo.memberCount} / {guildInfo.maxMembers}
          </div>
          <div className="text-[11px] text-sky-400 mt-1">
            16 slots available
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">Season Points</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-400 font-mono">
            {guildInfo.seasonPoints.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Season 26
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">Daily Tax Silver</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono">
            +{guildInfo.dailyTaxIncome.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">
            5% Guild tax rate
          </div>
        </div>
      </div>

      {/* Tax Log Activity */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
            Guild Bank Account Activity Logs
          </h3>
          <span className="text-xs text-slate-400 font-mono">Real-time ledger</span>
        </div>

        <div className="overflow-x-auto">
          {taxLogs.length === 0 ? (
            <div className="py-14 text-center text-slate-500 text-xs space-y-2">
              <Users className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-400">No Guild Ledger Transactions Recorded</p>
              <p className="text-slate-500 max-w-sm mx-auto">
                Guild bank silver deposits, territory taxes, and maintenance fees will appear here once logged from Albion Online.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Player</th>
                  <th className="py-2.5 px-3">Transaction</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-medium font-mono">
                {taxLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-100 font-sans">
                      {log.player}
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-sans">
                      {log.action}
                    </td>
                    <td className="py-3 px-3">
                      <span className={log.amount >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                        {log.amount >= 0 ? `+${log.amount.toLocaleString()}` : log.amount.toLocaleString()} silver
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {log.time}
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
