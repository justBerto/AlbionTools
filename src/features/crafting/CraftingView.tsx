import React, { useState, useEffect } from "react";
import { 
  Hammer, 
  Sparkles, 
  Coins, 
  TrendingUp, 
  Scale, 
  ArrowRight, 
  RefreshCw, 
  Percent, 
  Flame, 
  ShieldCheck 
} from "lucide-react";
import { fetchLiveMarketPrices } from "../../services/albionDataApi";

interface CraftRecipe {
  id: string;
  name: string;
  tier: number;
  enchantment: number;
  materialName: string;
  materialsPerItem: number;
  baseFocusCost: number;
}

const RECIPES: CraftRecipe[] = [
  { id: "T8_MAIN_SWORD", name: "Elder's Broadsword", tier: 8, enchantment: 0, materialName: "Elder's Steel Bar", materialsPerItem: 16, baseFocusCost: 520 },
  { id: "T8_2H_BOW", name: "Elder's Warbow", tier: 8, enchantment: 0, materialName: "Elder's Planks", materialsPerItem: 32, baseFocusCost: 780 },
  { id: "T7_ARMOR_CLOTH_SET3@1", name: "Cultist Robe 7.1", tier: 7, enchantment: 1, materialName: "Grandmaster's Cloth 7.1", materialsPerItem: 16, baseFocusCost: 450 },
  { id: "T8_BAG@1", name: "Elder's Bag 8.1", tier: 8, enchantment: 1, materialName: "Elder's Leather 8.1", materialsPerItem: 8, baseFocusCost: 320 },
];

export const CraftingView: React.FC = () => {
  const [selectedRecipe, setSelectedRecipe] = useState<CraftRecipe>(RECIPES[0]);
  const [selectedCity, setSelectedCity] = useState("Lymhurst");
  const [useFocus, setUseFocus] = useState(true);
  const [craftQuantity, setCraftQuantity] = useState(10);
  const [materialUnitPrice, setMaterialUnitPrice] = useState(14500);
  const [targetSellPrice, setTargetSellPrice] = useState(265000);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);

  // Return rates based on city crafting bonus & focus
  const getReturnRate = (city: string, focus: boolean) => {
    let base = 15.2; // base RRR without bonus
    if (city === "Lymhurst" || city === "Fort Sterling" || city === "Martlock" || city === "Thetford") {
      base = 24.8; // City production bonus
    }
    if (focus) {
      base += 23.1; // Focus points boost
    }
    return base;
  };

  const loadLivePrice = async (itemId: string) => {
    setIsLoadingPrices(true);
    const records = await fetchLiveMarketPrices(itemId, "Europe");
    const royal = records.find((r) => r.city === selectedCity) || records[0];
    if (royal && royal.sell_price_min > 0) {
      setTargetSellPrice(royal.sell_price_min);
    }
    setIsLoadingPrices(false);
  };

  useEffect(() => {
    loadLivePrice(selectedRecipe.id);
  }, [selectedRecipe, selectedCity]);

  const returnRate = getReturnRate(selectedCity, useFocus);
  const totalMaterials = selectedRecipe.materialsPerItem * craftQuantity;
  const rawMaterialCost = totalMaterials * materialUnitPrice;
  const grossSellRevenue = targetSellPrice * craftQuantity;
  const returnedMaterialUnits = Math.round(totalMaterials * (returnRate / 100));
  const returnedMaterialValue = returnedMaterialUnits * materialUnitPrice;
  const totalFocusConsumed = useFocus ? selectedRecipe.baseFocusCost * craftQuantity : 0;

  // After 4% market tax
  const netSellRevenue = grossSellRevenue * 0.96;
  const netProfit = (netSellRevenue + returnedMaterialValue) - rawMaterialCost;
  const profitPerFocus = totalFocusConsumed > 0 ? (netProfit / totalFocusConsumed) : 0;
  const roi = (netProfit / rawMaterialCost) * 100;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-80px)]">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 font-['Outfit'] flex items-center gap-2">
            <Hammer className="w-5 h-5 text-amber-400" />
            <span>Crafting, Refining & Focus Calculator</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Calculate exact Resource Return Rates (RRR), profit per focus point, and market arbitrage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Available Focus:</span>
            <span className="font-bold text-emerald-400 font-mono">30,000 / 30,000</span>
          </div>

          <button
            onClick={() => loadLivePrice(selectedRecipe.id)}
            disabled={isLoadingPrices}
            className="flex items-center gap-1.5 text-xs bg-slate-900/80 hover:bg-slate-800 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPrices ? 'animate-spin text-amber-400' : ''}`} />
            <span>Update Prices</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left: Input Parameters (1 Col) */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-2">
            Recipe & Production Setup
          </h3>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="text-slate-400 font-semibold block mb-1">Target Recipe</label>
              <select
                value={selectedRecipe.id}
                onChange={(e) => {
                  const r = RECIPES.find((rec) => rec.id === e.target.value);
                  if (r) setSelectedRecipe(r);
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500 font-medium"
              >
                {RECIPES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (T{r.tier})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1">Crafting City</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500 font-medium"
              >
                <option value="Fort Sterling">Fort Sterling (Wood & Hammer Bonus)</option>
                <option value="Lymhurst">Lymhurst (Fiber & Bow Bonus)</option>
                <option value="Bridgewatch">Bridgewatch (Stone & Crossbow Bonus)</option>
                <option value="Martlock">Martlock (Hide & Axe Bonus)</option>
                <option value="Thetford">Thetford (Ore & Mage Staff Bonus)</option>
                <option value="Caerleon">Caerleon (Food & Tool Bonus)</option>
                <option value="Brecilien">Brecilien (Cape Bonus)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={craftQuantity}
                  onChange={(e) => setCraftQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Material Price</label>
                <input
                  type="number"
                  value={materialUnitPrice}
                  onChange={(e) => setMaterialUnitPrice(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1">Selling Price per Item (Silver)</label>
              <input
                type="number"
                value={targetSellPrice}
                onChange={(e) => setTargetSellPrice(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 outline-none focus:border-amber-500 font-mono font-bold"
              />
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <input
                  type="checkbox"
                  checked={useFocus}
                  onChange={(e) => setUseFocus(e.target.checked)}
                  className="rounded accent-amber-500"
                />
                <div>
                  <span className="font-semibold text-slate-200 block">Use Crafting Focus</span>
                  <span className="text-[10px] text-slate-400">Boosts RRR to {returnRate.toFixed(1)}% (+23.1% bonus)</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right: Profit & Breakdown (2 Cols) */}
        <div className="col-span-2 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center justify-between border-b border-slate-800 pb-2">
              <span>Financial Return & Efficiency</span>
              <span className="text-emerald-400 font-mono text-xs">
                Resource Return Rate (RRR): {returnRate.toFixed(1)}%
              </span>
            </h3>

            <div className="grid grid-cols-4 gap-3">
              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-xs block mb-1">Total Cost</span>
                <span className="font-bold text-sm text-slate-100 font-mono">
                  {rawMaterialCost.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{totalMaterials}x materials</span>
              </div>

              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-xs block mb-1">Returned Mats</span>
                <span className="font-bold text-sm text-sky-400 font-mono">
                  +{returnedMaterialValue.toLocaleString()}
                </span>
                <span className="text-[10px] text-sky-400/80 block mt-0.5">+{returnedMaterialUnits}x mats back</span>
              </div>

              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-xs block mb-1">Net Silver Profit</span>
                <span className={`font-bold text-sm font-mono ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {netProfit >= 0 ? `+${Math.round(netProfit).toLocaleString()}` : Math.round(netProfit).toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-400/80 block mt-0.5">{roi.toFixed(1)}% ROI</span>
              </div>

              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-xs block mb-1">Profit / Focus</span>
                <span className="font-bold text-sm text-purple-400 font-mono">
                  {useFocus ? `${Math.round(profitPerFocus)} s/focus` : 'N/A'}
                </span>
                <span className="text-[10px] text-purple-400/80 block mt-0.5">{totalFocusConsumed} focus total</span>
              </div>
            </div>
          </div>

          {/* Arbitrage Comparison */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-amber-400" />
                <span>Market Comparison</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Live API Feed</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Sell at {selectedCity} Market</span>
                  <span className="font-mono text-slate-200 font-bold">{targetSellPrice.toLocaleString()} s</span>
                </div>
                <div className="text-[10px] text-slate-500">Standard 4% tax applies. Safe local sale without transport.</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-amber-500/30">
                <div className="flex justify-between text-slate-400 mb-1">
                  <span className="text-amber-400 font-semibold">Caerleon Black Market</span>
                  <span className="font-mono text-amber-400 font-bold">{Math.round(targetSellPrice * 1.25).toLocaleString()} s</span>
                </div>
                <div className="text-[10px] text-amber-300/80">
                  +25% higher profit. Requires Red Zone transport.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
