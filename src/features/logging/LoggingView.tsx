import React, { useState } from "react";
import { Terminal, Filter, Copy, Trash2, Search, CheckCircle2 } from "lucide-react";
import { useToast } from "../../context/ToastContext";

interface LogEntry {
  id: string;
  type: "COMBAT" | "LOOT" | "NETWORK" | "MARKET" | "SYSTEM";
  eventCode?: number;
  message: string;
  timestamp: string;
  payload: any;
}

export const LoggingView: React.FC = () => {
  const { showToast } = useToast();
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: "1", type: "LOOT", eventCode: 65, message: "NewEquipmentItem: Elder's Broadsword (T8.0) dropped from Chest", timestamp: "11:02:14.280", payload: { objectId: 657, itemId: 2036, amount: 1, quality: 1, marketVal: 245000 } },
    { id: "2", type: "COMBAT", eventCode: 11, message: "HealthUpdate: LordAlbion hit Mob (ID: 3405) with Heroic Strike for -1845 dmg", timestamp: "11:02:10.150", payload: { causerId: 101, affectedId: 3405, healthChange: -1845, spell: "Heroic Strike" } },
    { id: "3", type: "NETWORK", eventCode: 252, message: "PhotonFragmentAssembly: Reassembled 4 fragmented UDP packets successfully", timestamp: "11:02:08.010", payload: { totalBytes: 4120, channel: 0, sequence: 1420 } },
    { id: "4", type: "MARKET", eventCode: 253, message: "AuctionGetOffers: Fetched 50 market orders from Lymhurst Marketplace", timestamp: "11:01:45.890", payload: { location: "Lymhurst", count: 50 } },
    { id: "5", type: "SYSTEM", message: "AlbionTools Sniffer connected to Npcap Adapter (Ethernet)", timestamp: "11:00:00.000", payload: { adapter: "\\Device\\NPF_{1234}", speed: "1000Mbps" } },
  ]);

  const filteredLogs = logs.filter((log) => {
    const matchesType = filterType === "ALL" || log.type === filterType;
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const clearLogs = () => {
    setLogs([]);
    setSelectedLog(null);
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-80px)]">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 font-['Outfit'] flex items-center gap-2">
            <Terminal className="w-5 h-5 text-amber-400" />
            <span>Event & Packet Logger</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time terminal stream for inspecting parsed Photon protocol events, combat packets, and network telemetry.
          </p>
        </div>

        <button
          onClick={clearLogs}
          className="flex items-center gap-1.5 text-xs bg-slate-900/80 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-800 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Logs</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-3.5 rounded-xl border border-slate-800 flex items-center gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search log messages or event codes..."
            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-4 py-2 text-slate-100 placeholder-slate-500 outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 font-semibold">
          {["ALL", "COMBAT", "LOOT", "NETWORK", "MARKET", "SYSTEM"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 rounded-lg transition-colors font-mono ${
                filterType === type ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Main Terminal View */}
      <div className="grid grid-cols-3 gap-6 font-mono text-xs">
        {/* Logs Feed (2 Cols) */}
        <div className="col-span-2 glass-panel p-4 rounded-2xl border border-slate-800 space-y-2 max-h-[500px] overflow-y-auto">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              onClick={() => setSelectedLog(log)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedLog?.id === log.id
                  ? 'border-amber-500/80 bg-amber-500/10'
                  : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  log.type === "COMBAT" ? "bg-rose-950 text-rose-300 border border-rose-800" :
                  log.type === "LOOT" ? "bg-amber-950 text-amber-300 border border-amber-800" :
                  log.type === "NETWORK" ? "bg-sky-950 text-sky-300 border border-sky-800" :
                  log.type === "MARKET" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" :
                  "bg-slate-800 text-slate-300"
                }`}>
                  {log.type}
                </span>
                <span className="text-slate-200 truncate max-w-md font-sans">{log.message}</span>
              </div>
              <span className="text-[10px] text-slate-500 shrink-0">{log.timestamp}</span>
            </div>
          ))}
        </div>

        {/* Selected Log JSON Details (1 Col) */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 h-fit sticky top-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-100 font-sans">Packet Inspector</span>
            {selectedLog && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(selectedLog.payload, null, 2));
                  showToast("Packet JSON copied to clipboard", "success");
                }}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
              >
                <Copy className="w-3 h-3" />
                <span>Copy JSON</span>
              </button>
            )}
          </div>

          {selectedLog ? (
            <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-amber-300 overflow-x-auto max-h-[380px]">
              {JSON.stringify(selectedLog.payload, null, 2)}
            </pre>
          ) : (
            <div className="text-slate-500 text-center py-10 text-[11px] font-sans">
              Click a log entry to inspect raw Photon packet parameters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
