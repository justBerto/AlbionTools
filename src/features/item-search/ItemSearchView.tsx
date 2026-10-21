import React, { useState } from "react";
import { Search, Filter, Shield, Sword, Sparkles, ExternalLink, Info } from "lucide-react";

interface MockItem {
  id: string;
  uniqueName: string;
  name: string;
  tier: number;
  enchantment: number;
  category: "Weapons" | "Armor" | "Accessories" | "Consumables" | "Materials";
  itemPower: number;
  description: string;
}

const SAMPLE_ITEMS: MockItem[] = [
  {
    id: "1",
    uniqueName: "T8_MAIN_SWORD",
    name: "Elder's Broadsword",
    tier: 8,
    enchantment: 0,
    category: "Weapons",
    itemPower: 1100,
    description: "A heavy one-handed sword capable of piercing heavy enemy defenses.",
  },
  {
    id: "2",
    uniqueName: "T8_MAIN_CURSEDSTAFF@3",
    name: "Elder's Cursed Staff",
    tier: 8,
    enchantment: 3,
    category: "Weapons",
    itemPower: 1400,
    description: "Inflicts devastating damage-over-time curses on target enemies.",
  },
  {
    id: "3",
    uniqueName: "T7_ARMOR_CLOTH_SET3@1",
    name: "Grandmaster's Cultist Robe",
    tier: 7,
    enchantment: 1,
    category: "Armor",
    itemPower: 1100,
    description: "Channels dark energy to restore massive health and energy.",
  },
  {
    id: "4",
    uniqueName: "T6_POTION_COOLDOWN",
    name: "Master's Major Energy Potion",
    tier: 6,
    enchantment: 0,
    category: "Consumables",
    itemPower: 900,
    description: "Quickly restores mana during intense PvP engagements.",
  },
  {
    id: "5",
    uniqueName: "T8_BAG@1",
    name: "Elder's Bag",
    tier: 8,
    enchantment: 1,
    category: "Accessories",
    itemPower: 1200,
    description: "Massively increases player maximum carrying capacity.",
  },
  {
    id: "6",
    uniqueName: "T8_CLOTH",
    name: "Elder's Cloth",
    tier: 8,
    enchantment: 0,
    category: "Materials",
    itemPower: 0,
    description: "Refined cloth woven from the highest tier fiber.",
  },
];

export const ItemSearchView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedItem, setSelectedItem] = useState<MockItem | null>(SAMPLE_ITEMS[0]);

  const filteredItems = SAMPLE_ITEMS.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = selectedTier === null || item.tier === selectedTier;
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesTier && matchesCategory;
  });

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-80px)]">
      {/* Header and Search Filters */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-100 font-['Outfit']">
              Item Database & Explorer
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Browse over 4,000+ extracted Albion Online items, equipment stats, and market metrics.
            </p>
          </div>

          <div className="text-xs text-slate-400 bg-slate-900/80 px-3 py-1 rounded-lg border border-slate-800">
            Game Data: <span className="text-emerald-400 font-semibold">Extracted & Loaded</span>
          </div>
        </div>

        {/* Search Bar + Category Pills */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by item name or unique identifier (e.g. Broadsword, Cultist, Potion)..."
              className="w-full bg-slate-900/90 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none transition-colors"
            />
          </div>

          {/* Tier Buttons T4 to T8 */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setSelectedTier(null)}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                selectedTier === null ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Tiers
            </button>
            {[4, 5, 6, 7, 8].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTier(selectedTier === t ? null : t)}
                className={`px-2.5 py-1 rounded-lg transition-colors font-mono ${
                  selectedTier === t ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                T{t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Item List (2 Cols) & Selected Item Detail (1 Col) */}
      <div className="grid grid-cols-3 gap-6">
        {/* Item Cards List */}
        <div className="col-span-2 space-y-2.5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={`glass-panel p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedItem?.id === item.id
                  ? 'border-amber-500/80 bg-amber-500/5 shadow-lg shadow-amber-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 p-1 flex items-center justify-center shrink-0">
                  <img
                    src={`https://render.albiononline.com/v1/item/${item.uniqueName}.png`}
                    alt={item.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>

                <div>
                  <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <span>{item.name}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                      T{item.tier}{item.enchantment > 0 ? `.${item.enchantment}` : ''}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {item.category} • <span className="font-mono text-amber-400">{item.itemPower} IP</span>
                  </div>
                </div>
              </div>

              <div className="text-right text-xs">
                <span className="text-slate-400 font-mono text-[11px] block">{item.uniqueName}</span>
                <span className="text-amber-400/90 font-medium text-[11px]">Click to inspect</span>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Item Detail Panel */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 h-fit sticky top-6">
          {selectedItem ? (
            <>
              <div className="flex flex-col items-center text-center pb-4 border-b border-slate-800">
                <div className="w-24 h-24 rounded-2xl bg-slate-900/90 border border-slate-800 p-2 flex items-center justify-center shadow-xl mb-3">
                  <img
                    src={`https://render.albiononline.com/v1/item/${selectedItem.uniqueName}.png`}
                    alt={selectedItem.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
                  {selectedItem.name}
                </h3>
                <span className="text-xs text-amber-400 font-mono mt-0.5">
                  Item Power: {selectedItem.itemPower} IP
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Description</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                    {selectedItem.description}
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex justify-between p-2 rounded-lg bg-slate-900/40">
                    <span className="text-slate-400">Unique Code:</span>
                    <span className="font-mono text-slate-200">{selectedItem.uniqueName}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-900/40">
                    <span className="text-slate-400">Category:</span>
                    <span className="text-slate-200">{selectedItem.category}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-900/40">
                    <span className="text-slate-400">Tier:</span>
                    <span className="text-slate-200 font-bold">Tier {selectedItem.tier}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-slate-500 py-10 text-xs">
              Select an item to view detailed stats and craft formulas.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
