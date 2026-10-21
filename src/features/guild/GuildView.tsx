import React, { useState } from "react";
import { ShieldAlert, Users, Award, Coins, TrendingUp, Calendar, Trophy } from "lucide-react";

export const GuildView: React.FC = () => {
  const [guildInfo] = useState({
    name: "Black Rose Vanguard",
    alliance: "ROSE",
    memberCount: 84,
    maxMembers: 100,
    seasonPoints: 48500,
    seasonRank: 14,
    dailyTaxIncome: 1450000,
  });

  const [taxLogs] = useState([
    { id: "1", player: "LordAlbion", action: "Silver Deposit", amount: 500000, time: "10:45:12" },
    { id: "2", player: "GuildTaxBot", action: "Siphoned Energy Tax", amount: 180000, time: "10:00:00" },
    { id: "3", player: "IronBastion", action: "Territory Maintenance Fee", amount: -250000, time: "09:30:15" },
    { id: "4", player: "ShadowStrike", action: "Dungeon Run 5% Tax", amount: 48500, time: "09:12:40" },
  ]);

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
          <span className="font-bold text-amber-400 font-mono">#{guildInfo.seasonRank} Gold</span>
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
        </div>
      </div>
    </div>
  );
};
