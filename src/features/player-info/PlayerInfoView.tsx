import React, { useState } from "react";
import { 
  UserCheck, 
  Search, 
  ShieldAlert, 
  Skull, 
  Sparkles, 
  Award, 
  ExternalLink, 
  Crosshair, 
  TrendingUp, 
  Sword,
  Pickaxe,
  Hammer
} from "lucide-react";
import { 
  searchAlbionPlayer, 
  getPlayerDetails, 
  getPlayerKills, 
  PlayerSearchResult, 
  KillEvent 
} from "../../services/albionGameInfoApi";
import { useToast } from "../../context/ToastContext";

export const PlayerInfoView: React.FC = () => {
  const { showToast } = useToast();

  const getInitialRegion = (): "Europe" | "Americas" | "Asia" => {
    const saved = localStorage.getItem("albiontools_server");
    if (saved?.includes("Asia")) return "Asia";
    if (saved?.includes("Europe")) return "Europe";
    return "Americas";
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<"Europe" | "Americas" | "Asia">(getInitialRegion);
  const [activeTab, setActiveTab] = useState<"overview" | "kills">("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [player, setPlayer] = useState<PlayerSearchResult | null>(null);
  const [recentKills, setRecentKills] = useState<KillEvent[]>([]);

  const handleSearch = async (queryToSearch = searchQuery) => {
    if (!queryToSearch.trim()) return;
    setIsLoading(true);
    try {
      const result = await searchAlbionPlayer(queryToSearch, selectedRegion);
      if (result.players.length > 0) {
        const found = result.players[0];
        // Fetch detailed LifetimeStatistics (PvE, Gathering, Crafting)
        const detailed = await getPlayerDetails(found.Id, selectedRegion);
        setPlayer(detailed || found);

        // Fetch real kills/deaths
        const kills = await getPlayerKills(found.Id, selectedRegion);
        setRecentKills(kills);
        showToast(`Loaded player data for ${found.Name}`, "success");
      } else {
        showToast(`No player found matching "${queryToSearch}" on ${selectedRegion} server.`, "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error querying official Albion servers", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num?: number) => {
    if (!num) return "0";
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "k";
    return num.toLocaleString();
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-80px)]">
      {/* Search Header */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-100 font-['Outfit'] flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-400" />
              <span>Official Albion Online Player & Killboard Explorer</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Search any player or guild directly on the official Albion Online game servers via REST API.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Server:</span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value as any)}
              className="text-xs font-mono bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-amber-300 outline-none"
            >
              <option value="Europe">Europe (Amsterdam)</option>
              <option value="Americas">Americas (Washington)</option>
              <option value="Asia">Asia (Singapore)</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search player username (e.g. Robinhoodrs, Nausk, Shozen)..."
              className="w-full bg-slate-900/90 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none transition-colors"
            />
          </div>

          <button
            onClick={() => handleSearch()}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl transition-colors shadow-lg shadow-amber-500/20"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{isLoading ? "Searching..." : "Inspect Player"}</span>
          </button>
        </div>

        {/* Quick Search Tags */}
        <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
          <span>Popular searches:</span>
          {["Savage", "Robinhoodrs", "Nausk", "Shozen"].map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setSearchQuery(tag);
                handleSearch(tag);
              }}
              className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors font-mono"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Empty Search Prompt */}
      {!player && !isLoading && (
        <div className="py-24 text-center text-slate-500 text-xs space-y-3 glass-panel rounded-2xl border border-slate-800">
          <UserCheck className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">Search Any Albion Online Player</p>
          <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
            Enter your character username above and select your server ({selectedRegion}) to inspect official player stats, PvE fame breakdown, kill ratio, and live killboard events.
          </p>
        </div>
      )}

      {/* Player Profile Details */}
      {player && (
        <div className="space-y-6">
          {/* Main Hero Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/30 to-slate-900 border border-amber-500/40 flex items-center justify-center font-bold text-2xl text-amber-300 font-['Outfit'] shadow-xl">
                {player.Name.charAt(0)}
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-extrabold text-slate-100 font-['Outfit']">
                    {player.Name}
                  </h3>
                  {player.GuildName && (
                    <span className="text-xs bg-amber-500/10 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-semibold">
                      &lt;{player.GuildName}&gt;
                    </span>
                  )}
                  {player.AllianceName && (
                    <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                      [{player.AllianceName}]
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-4">
                  <span>Player ID: <strong className="font-mono text-slate-300">{player.Id}</strong></span>
                  <span>Total Kills: <strong className="font-mono text-amber-400">{player.TotalKills}</strong></span>
                  <span>PvP KDR Ratio: <strong className="font-mono text-emerald-400">{player.FameRatio}x</strong></span>
                  <span>Server: <strong className="font-mono text-sky-400">{selectedRegion}</strong></span>
                </div>
              </div>
            </div>

            <a
              href={`https://albiononline.com/killboard/player/${player.Id}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 px-3 py-1.5 rounded-xl border border-sky-500/30 transition-colors"
            >
              <span>Official Killboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* KPI Fame Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="glass-card p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-slate-400 mb-1">
                <span className="text-xs font-semibold uppercase">PvP Kill Fame</span>
                <Crosshair className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-xl font-bold text-rose-400 font-mono">
                {formatNumber(player.KillFame)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                Deaths: {formatNumber(player.DeathFame)} Fame
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-slate-400 mb-1">
                <span className="text-xs font-semibold uppercase">Total PvE Fame</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-bold text-slate-100 font-mono">
                {formatNumber(player.PvE?.Total)}
              </div>
              <div className="text-[10px] text-amber-400/80 mt-1 font-mono">
                Outlands: {formatNumber(player.PvE?.Outlands)}
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-slate-400 mb-1">
                <span className="text-xs font-semibold uppercase">Gathering Fame</span>
                <Pickaxe className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-emerald-400 font-mono">
                {formatNumber(player.Gathering?.All?.Total)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">All resource nodes</div>
            </div>

            <div className="glass-card p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-slate-400 mb-1">
                <span className="text-xs font-semibold uppercase">Crafting Fame</span>
                <Hammer className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-xl font-bold text-purple-400 font-mono">
                {formatNumber(player.Crafting?.Total)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Equipment crafted</div>
            </div>
          </div>

          {/* Sub Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "overview"
                  ? "bg-amber-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              PvE Activity Breakdown
            </button>
            <button
              onClick={() => setActiveTab("kills")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "kills"
                  ? "bg-amber-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              Recent Killboard Events ({recentKills.length})
            </button>
          </div>

          {activeTab === "overview" ? (
            /* PvE Sub-category Breakdown Grid */
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-2">
                PvE Activity Distribution
              </h4>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Outlands (Black Zone)</span>
                  <span className="font-bold font-mono text-slate-200 text-sm">
                    {formatNumber(player.PvE?.Outlands)} Fame
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Roads of Avalon</span>
                  <span className="font-bold font-mono text-sky-400 text-sm">
                    {formatNumber(player.PvE?.Avalon)} Fame
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Mists & Brecilien</span>
                  <span className="font-bold font-mono text-purple-400 text-sm">
                    {formatNumber(player.PvE?.Mists)} Fame
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Hellgates (PvPvE)</span>
                  <span className="font-bold font-mono text-rose-400 text-sm">
                    {formatNumber(player.PvE?.Hellgate)} Fame
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Corrupted Dungeons</span>
                  <span className="font-bold font-mono text-amber-400 text-sm">
                    {formatNumber(player.PvE?.CorruptedDungeon)} Fame
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Royal Continent</span>
                  <span className="font-bold font-mono text-slate-200 text-sm">
                    {formatNumber(player.PvE?.Royal)} Fame
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Recent Kills List */
            <div className="space-y-3">
              {recentKills.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs">
                  No recent PvP kills or deaths recorded on the killboard for this player.
                </div>
              ) : (
                recentKills.map((kill) => (
                <div
                  key={kill.EventId}
                  className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/80 flex items-center justify-center text-rose-400">
                      <Sword className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-slate-100">{kill.Killer.Name}</span>
                        <span className="text-rose-400 font-mono font-bold">vs</span>
                        <span className="font-semibold text-slate-400">{kill.Victim.Name}</span>
                        {kill.Victim.GuildName && (
                          <span className="text-[10px] text-slate-500">&lt;{kill.Victim.GuildName}&gt;</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3 font-mono">
                        <span>{kill.Location}</span>
                        <span>•</span>
                        <span>Killer IP: <strong className="text-amber-300">{kill.Killer.AverageItemPower}</strong></span>
                        <span>•</span>
                        <span>Victim IP: {kill.Victim.AverageItemPower}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block font-mono">Kill Fame</span>
                    <span className="font-bold text-sm text-emerald-400 font-mono">
                      +{kill.TotalVictimKillFame.toLocaleString()}
                    </span>
                  </div>
                </div>
              )))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
