import React, { useState } from "react";
import { 
  Users, 
  Coins, 
  Copy, 
  ShieldCheck, 
  Calculator, 
  UserPlus, 
  Trash2, 
  Heart, 
  Swords, 
  CheckCircle2,
  Percent,
  Sparkles
} from "lucide-react";
import { PartyMember } from "../../types";
import { useToast } from "../../context/ToastContext";

interface PartyViewProps {
  party: PartyMember[];
  onUpdateParty?: (party: PartyMember[]) => void;
}

export const PartyView: React.FC<PartyViewProps> = ({ party, onUpdateParty }) => {
  const { showToast } = useToast();
  const [totalLootSilver, setTotalLootSilver] = useState(4_200_000);
  const [bagSilverDrop, setBagSilverDrop] = useState(650_000);
  const [repairDeduction, setRepairDeduction] = useState(120_000);
  const [guildTaxPercent, setGuildTaxPercent] = useState(5);
  const [applyTax, setApplyTax] = useState(true);

  const grossTotal = totalLootSilver + bagSilverDrop;
  const guildTaxAmount = applyTax ? grossTotal * (guildTaxPercent / 100) : 0;
  const netPool = grossTotal - repairDeduction - guildTaxAmount;
  const sharePerMember = party.length > 0 ? Math.floor(netPool / party.length) : 0;

  const copySplitInstructions = () => {
    const lines = party.map(
      (p) => `/w ${p.name} Payout: ${sharePerMember.toLocaleString()} silver`
    );
    const text = `[AlbionTools Dungeon Loot Split] (Party of ${party.length}):\nTotal Gross: ${grossTotal.toLocaleString()} | Net Pool: ${netPool.toLocaleString()}\nEach Member Receives: ${sharePerMember.toLocaleString()} silver\n\nCommands:\n${lines.join("\n")}`;
    navigator.clipboard.writeText(text);
    showToast("Dungeon split whisper commands copied to clipboard", "success");
  };

  const copyPartyList = () => {
    const text = party.map((p, i) => `${i + 1}. ${p.name} [${p.role}]`).join("\n");
    navigator.clipboard.writeText(`AlbionTools Party Roster:\n${text}`);
    showToast("Party roster copied to clipboard for Discord", "info");
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-80px)]">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 font-['Outfit'] flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <span>Party Management & Loot Splitter</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time party roster tracking, role balance, and automated group dungeon loot & silver distribution calculator.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyPartyList}
            className="flex items-center gap-1.5 text-xs bg-slate-900/80 hover:bg-slate-800 text-slate-200 px-3.5 py-1.5 rounded-xl border border-slate-800 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Discord Roster</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Party Members List (2 Cols) */}
        <div className="col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
                Active Party Members
              </h3>
              <span className="text-xs font-mono bg-slate-800 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                {party.length} / 20
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xs text-slate-400">
                <span className="text-amber-400 font-semibold">{party.filter(p => p.role === 'DPS').length} DPS</span> • <span className="text-emerald-400 font-semibold">{party.filter(p => p.role === 'Healer').length} Healer</span> • <span className="text-sky-400 font-semibold">{party.filter(p => p.role === 'Tank').length} Tank</span>
              </div>

              {onUpdateParty && (
                <button
                  onClick={() => {
                    const newName = `Adventurer_${party.length + 1}`;
                    const newMember: PartyMember = {
                      id: `p_${Date.now()}`,
                      name: newName,
                      guild: "Black Rose Vanguard",
                      currentHp: 3200,
                      maxHp: 3200,
                      dps: 650,
                      damagePercentage: 10,
                      hps: 0,
                      role: "DPS",
                    };
                    onUpdateParty([...party, newMember]);
                  }}
                  className="flex items-center gap-1 text-[11px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg transition-colors font-semibold"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Member</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {party.map((member) => (
              <div
                key={member.id}
                className="glass-card p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-sm text-amber-300">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-100 flex items-center gap-2">
                      <span>{member.name}</span>
                      <button
                        onClick={() => {
                          if (!onUpdateParty) return;
                          const nextRole: Record<string, "DPS" | "Healer" | "Tank" | "Support"> = {
                            DPS: "Healer",
                            Healer: "Tank",
                            Tank: "Support",
                            Support: "DPS",
                          };
                          const updated = party.map((p) =>
                            p.id === member.id ? { ...p, role: nextRole[p.role] || "DPS" } : p
                          );
                          onUpdateParty(updated);
                        }}
                        title="Click to cycle role"
                        className={`text-[10px] px-1.5 py-0.2 rounded font-semibold cursor-pointer hover:opacity-80 transition-opacity ${
                          member.role === 'Healer' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          member.role === 'Tank' ? 'bg-sky-950 text-sky-300 border border-sky-800' :
                          member.role === 'Support' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                          'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {member.role} ↻
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {member.guild ? `<${member.guild}>` : 'No Guild'}
                    </div>

                    {/* HP Bar */}
                    <div className="w-32 bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${(member.currentHp / member.maxHp) * 100}%` }} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-xs">
                    <span className="font-mono font-bold text-slate-200 block">{member.dps} DPS</span>
                    <span className="text-[10px] text-slate-400 font-mono">{member.damagePercentage}% share</span>
                  </div>

                  {onUpdateParty && (
                    <button
                      onClick={() => onUpdateParty(party.filter((p) => p.id !== member.id))}
                      className="text-slate-600 hover:text-rose-400 p-1 transition-colors"
                      title="Remove from party"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Silver & Loot Splitter Tool (1 Col) */}
        <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <Coins className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
              Loot & Silver Splitter
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 font-semibold block mb-1">Total Chest / Gear Value</label>
              <input
                type="number"
                value={totalLootSilver}
                onChange={(e) => setTotalLootSilver(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1">Silver Drops Picked Up</label>
              <input
                type="number"
                value={bagSilverDrop}
                onChange={(e) => setBagSilverDrop(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1">Repair Cost Deduction</label>
              <input
                type="number"
                value={repairDeduction}
                onChange={(e) => setRepairDeduction(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <input
                  type="checkbox"
                  checked={applyTax}
                  onChange={(e) => setApplyTax(e.target.checked)}
                  className="rounded accent-amber-500"
                />
                <div className="flex justify-between w-full pr-1">
                  <span className="font-semibold text-slate-200">Guild Tax Deduction</span>
                  <span className="font-mono text-amber-400">{guildTaxPercent}%</span>
                </div>
              </label>
            </div>

            {/* Split Calculation Summary Card */}
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2 mt-2">
              <div className="flex justify-between text-slate-400 text-xs">
                <span>Net Pool for Party:</span>
                <span className="font-mono font-bold text-slate-200">{netPool.toLocaleString()} silver</span>
              </div>
              <div className="flex justify-between text-slate-400 text-xs">
                <span>Total Members:</span>
                <span className="font-mono font-bold text-slate-200">{party.length} players</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between items-baseline">
                <span className="font-bold text-xs text-amber-400">Payout / Member:</span>
                <span className="font-mono text-base font-extrabold text-emerald-400">
                  {sharePerMember.toLocaleString()} s
                </span>
              </div>
            </div>

            <button
              onClick={copySplitInstructions}
              className="w-full flex items-center justify-center gap-2 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold p-2.5 rounded-xl transition-colors shadow-lg shadow-amber-500/20"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Ingame Whisper Commands</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
