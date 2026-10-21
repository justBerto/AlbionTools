import React, { useState } from "react";
import { Package, Search, MapPin, Layers, Coins, Filter, Building2 } from "lucide-react";

interface StorageItem {
  id: string;
  itemId: string;
  name: string;
  tier: number;
  enchantment: number;
  amount: number;
  location: string;
  tabName: string;
  estimatedValue: number;
}

export const StorageView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedTier, setSelectedTier] = useState<number | "All">("All");
  const [sortBy, setSortBy] = useState<"value_desc" | "value_asc" | "qty" | "name">("value_desc");

  const [storageItems] = useState<StorageItem[]>([]);

  const filtered = storageItems
    .filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCity = selectedCity === "All" || item.location === selectedCity;
      const matchesTier = selectedTier === "All" || item.tier === selectedTier;
      return matchesSearch && matchesCity && matchesTier;
    })
    .sort((a, b) => {
      if (sortBy === "value_desc") return b.estimatedValue - a.estimatedValue;
      if (sortBy === "value_asc") return a.estimatedValue - b.estimatedValue;
      if (sortBy === "qty") return b.amount - a.amount;
      return a.name.localeCompare(b.name);
    });

  const totalVaultValue = storageItems.reduce((acc, i) => acc + i.estimatedValue, 0);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-80px)]">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 font-['Outfit'] flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            <span>Cross-City Bank & Storage History</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Search your indexed bank tabs, chests, and hideout vaults across all cities in Albion Online.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="text-slate-400">Total Indexed Value:</span>
          <span className="font-bold text-slate-100 font-mono">
            {totalVaultValue.toLocaleString()} silver
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search item across all city vaults (e.g. Cultist, Bow, Cloth)..."
            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none"
          />
        </div>

        {/* Tier Buttons */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
          {(["All", 4, 5, 6, 7, 8] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTier(t)}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-colors ${
                selectedTier === t
                  ? "bg-amber-500 text-slate-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t === "All" ? "All Tiers" : `T${t}`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Building2 className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none font-medium"
          >
            <option value="All">All Cities & Vaults</option>
            <option value="Fort Sterling">Fort Sterling</option>
            <option value="Lymhurst">Lymhurst</option>
            <option value="Bridgewatch">Bridgewatch</option>
            <option value="Martlock">Martlock</option>
            <option value="Thetford">Thetford</option>
            <option value="Caerleon">Caerleon</option>
            <option value="Brecilien">Brecilien</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="flex items-center gap-2 text-xs">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none font-medium"
          >
            <option value="value_desc">Value: High → Low</option>
            <option value="value_asc">Value: Low → High</option>
            <option value="qty">Highest Quantity</option>
            <option value="name">Item Name A-Z</option>
          </select>
        </div>
      </div>

      {/* Storage Items Table */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
            Indexed Storage Items
          </h3>
          <span className="text-xs text-slate-400 font-mono">{filtered.length} entries found</span>
        </div>

        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-xs space-y-2">
              <Package className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-400">No Storage Vaults Indexed Yet</p>
              <p className="text-slate-500 max-w-sm mx-auto">
                Open any city bank vault, personal island chest, or guild territory storage in Albion Online to automatically index and search all items.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Item</th>
                <th className="py-2.5 px-3">Tier</th>
                <th className="py-2.5 px-3">Quantity</th>
                <th className="py-2.5 px-3">Storage Location</th>
                <th className="py-2.5 px-3">Tab Name</th>
                <th className="py-2.5 px-3">Estimated Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 font-medium font-mono">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 flex items-center gap-2 font-sans">
                    <div className="w-8 h-8 rounded bg-slate-900 border border-slate-800 p-0.5 flex items-center justify-center shrink-0">
                      <img
                        src={`https://render.albiononline.com/v1/item/${item.itemId}.png`}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="font-semibold text-slate-100">{item.name}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      item.tier >= 8 ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                      item.tier >= 7 ? 'bg-sky-950 text-sky-300 border border-sky-800' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      T{item.tier}{item.enchantment > 0 ? `.${item.enchantment}` : ''}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-200">
                    {item.amount}x
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{item.location}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 font-sans">
                    {item.tabName}
                  </td>
                  <td className="py-2.5 px-3 text-yellow-400 font-semibold">
                    {item.estimatedValue.toLocaleString()} silver
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
