// Albion Online Data Project API Client (West, East, Europe)
// Reference: https://www.albion-online-data.com/developer
import rawCatalog from "../data/completeItemCatalog.json";

export interface MarketPriceRecord {
  item_id: string;
  city: string;
  quality: number;
  sell_price_min: number;
  sell_price_min_date: string;
  sell_price_max: number;
  sell_price_max_date: string;
  buy_price_min: number;
  buy_price_min_date: string;
  buy_price_max: number;
  buy_price_max_date: string;
}

export interface GoldPriceRecord {
  price: number;
  timestamp: string;
}

export const CITIES = [
  "Bridgewatch",
  "Caerleon",
  "Fort Sterling",
  "Lymhurst",
  "Martlock",
  "Thetford",
  "Brecilien",
  "Black Market",
] as const;

export type AlbionServerRegion = "Europe" | "Americas" | "Asia";

export function getBaseApiUrl(server: AlbionServerRegion): string {
  switch (server) {
    case "Asia":
      return "https://east.albion-online-data.com/api/v2";
    case "Americas":
      return "https://west.albion-online-data.com/api/v2";
    case "Europe":
    default:
      return "https://europe.albion-online-data.com/api/v2";
  }
}

/**
 * Fetch live market prices directly from Albion Online Data Project API v2
 * Docs: https://www.albion-online-data.com/developer
 */
export async function fetchLiveMarketPrices(
  itemId: string,
  server: AlbionServerRegion = "Europe",
  qualities: number[] = [1, 2, 3, 4, 5]
): Promise<MarketPriceRecord[]> {
  const baseUrl = getBaseApiUrl(server);
  const locationParam = CITIES.join(",");
  const qualityParam = qualities.join(",");
  const url = `${baseUrl}/stats/prices/${encodeURIComponent(itemId)}.json?locations=${encodeURIComponent(locationParam)}&qualities=${qualityParam}`;

  try {
    const res = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      throw new Error(`AlbionDataApi returned HTTP ${res.status}`);
    }

    const data: MarketPriceRecord[] = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn(`[AlbionDataApi] Failed to fetch prices for ${itemId} on ${server}:`, err);
    return [];
  }
}

/**
 * Fetch gold prices directly from Albion Online Data Project API v2
 */
export async function fetchLiveGoldPrices(
  server: AlbionServerRegion = "Europe",
  count: number = 10
): Promise<GoldPriceRecord[]> {
  const baseUrl = getBaseApiUrl(server);
  const url = `${baseUrl}/stats/gold.json?count=${count}`;

  try {
    const res = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      throw new Error(`Gold API returned HTTP ${res.status}`);
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn(`[AlbionDataApi] Failed to fetch gold price on ${server}:`, err);
    return [];
  }
}

export interface MarketHistoryPoint {
  item_count: number;
  avg_price: number;
  timestamp: string;
}

export interface MarketHistoryLocationData {
  location: string;
  item_id: string;
  quality: number;
  data: MarketHistoryPoint[];
}

/**
 * Fetch item price history directly from Albion Online Data Project API v2
 * Docs: https://www.albion-online-data.com/developer
 */
export async function fetchItemPriceHistory(
  itemId: string,
  server: AlbionServerRegion = "Europe",
  quality: number = 1,
  timeScale: number = 24
): Promise<MarketHistoryLocationData[]> {
  const baseUrl = getBaseApiUrl(server);
  const locationParam = CITIES.join(",");
  const url = `${baseUrl}/stats/history/${encodeURIComponent(itemId)}.json?locations=${encodeURIComponent(locationParam)}&qualities=${quality}&time-scale=${timeScale}`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      throw new Error(`AlbionDataApi history returned HTTP ${res.status}`);
    }

    const data: MarketHistoryLocationData[] = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn(`[AlbionDataApi] Failed to fetch history for ${itemId} on ${server}:`, err);
    return [];
  }
}

export type MainCategory = "Weapons" | "Armor" | "Materials" | "Accessories" | "Consumables" | "Mounts";

export interface CatalogItem {
  id: string; // Base id e.g. "MAIN_SWORD" or "WOOD"
  name: string; // Base clean display name
  category: MainCategory;
  subCategory: string;
  hasTiers: boolean;
  minTier: number;
  maxTier: number;
  hasEnchantments?: boolean;
  tierNames?: Record<number, string>;
}

export const SUBCATEGORIES_BY_MAIN: Record<MainCategory, string[]> = {
  Weapons: [
    "All Weapons",
    "Swords",
    "Axes",
    "Maces",
    "Hammers",
    "Crossbows",
    "Bows",
    "Spears",
    "Daggers",
    "Quarterstaffs",
    "War Gloves",
    "Fire Staffs",
    "Frost Staffs",
    "Arcane Staffs",
    "Holy Staffs",
    "Nature Staffs",
    "Cursed Staffs",
    "Shapeshifter Staffs",
  ],
  Armor: [
    "All Armor",
    "Plate Armor",
    "Plate Helmets",
    "Plate Boots",
    "Leather Armor",
    "Leather Hoods",
    "Leather Shoes",
    "Cloth Armor",
    "Cloth Cowls",
    "Cloth Sandals",
    "Shields & Offhands",
  ],
  Materials: [
    "All Materials",
    "Raw Resources",
    "Refined Materials",
    "Artifacts & Runes",
    "Gathering Tools",
  ],
  Accessories: [
    "All Accessories",
    "Bags",
    "Regular Capes",
    "Faction Capes",
  ],
  Consumables: [
    "All Consumables",
    "Food & Meals",
    "Potions",
    "Tomes of Insight",
  ],
  Mounts: [
    "All Mounts",
    "Riding Horses",
    "Armored Horses",
    "Transport Oxen",
    "Rare & Faction Mounts",
  ],
};

export const COMPLETE_ITEM_CATALOG: CatalogItem[] = rawCatalog as unknown as CatalogItem[];

/**
 * Builds the canonical Albion item unique name from tier, base ID, and enchantment
 * Correctly distinguishes materials (_LEVELx@x) vs gear (@x)
 */
export function buildItemUniqueName(tier: number, baseId: string, enchantment: number = 0): string {
  // If baseId already has a full tier prefix (e.g. T4_...), use it
  let prefix = "";
  if (baseId.startsWith("T") && /T\d_/.test(baseId)) {
    prefix = baseId;
  } else if (tier > 0) {
    prefix = `T${tier}_${baseId}`;
  } else {
    prefix = baseId;
  }

  if (enchantment > 0) {
    const isMaterial = ["WOOD", "FIBER", "HIDE", "ORE", "ROCK", "PLANKS", "CLOTH", "LEATHER", "METALBAR", "STONEBLOCK"].some((m) =>
      prefix.endsWith(`_${m}`) || prefix === `T${tier}_${m}`
    );

    if (isMaterial) {
      return `${prefix}_LEVEL${enchantment}@${enchantment}`;
    }
    return `${prefix}@${enchantment}`;
  }

  return prefix;
}

/**
 * Generates an accurate, localized display title for the selected item
 */
export function getFormattedItemName(item: CatalogItem, tier: number, enchantment: number = 0): string {
  const tierMap = item.tierNames as Record<string | number, string> | undefined;
  let baseName = tierMap?.[tier] || tierMap?.[String(tier)] || item.name;

  if (item.hasTiers && !(tierMap?.[tier] || tierMap?.[String(tier)])) {
    baseName = `T${tier} ${baseName}`;
  }

  if (enchantment > 0) {
    const enchantLabel = enchantment === 1 ? "Uncommon" : enchantment === 2 ? "Rare" : enchantment === 3 ? "Exceptional" : "Pristine";
    return `${baseName} (.${enchantment} ${enchantLabel})`;
  }

  return baseName;
}

/**
 * Calculates approximate Base Item Power (IP) for equipment
 */
export function calculateItemPower(item: CatalogItem, tier: number, enchantment: number = 0): number {
  if (item.category === "Materials" || item.category === "Mounts" || item.category === "Consumables") {
    return 0;
  }
  
  // Base T4 is 700 IP. Each Tier is +100 IP. Each enchantment is +100 IP.
  let ip = 700 + (tier - 4) * 100 + enchantment * 100;
  
  // Artifact & Avalonian weapon bonuses
  if (item.id.includes("AVALON")) ip += 100;
  else if (item.id.includes("HELL") || item.id.includes("UNDEAD") || item.id.includes("MORGANA") || item.id.includes("KEEPER") || item.id.includes("FEY")) {
    ip += 50;
  }
  
  return Math.max(0, ip);
}

/**
 * Generates descriptive Albion gameplay notes for any catalog item
 */
export function getItemDescription(item: CatalogItem, tier: number): string {
  if (item.category === "Materials") {
    if (item.subCategory === "Raw Resources") {
      return `Tier ${tier} raw harvestable resource gathered from the wilderness with the appropriate tool. Refined into usable crafting materials at city refinement stations.`;
    }
    if (item.subCategory === "Refined Materials") {
      return `Tier ${tier} refined crafting material processed from raw gathered resources. Used as the essential component for crafting high-tier weapons, armor, and gear.`;
    }
    if (item.subCategory === "Gathering Tools") {
      return `Essential Tier ${tier} gathering equipment used by gatherers to harvest raw wilderness resources throughout the Royal Continent and Outlands.`;
    }
    return `Special artifact and rune used in the Artifact Foundry to enchant equipment, transmute items, or forge powerful faction gear.`;
  }
  
  if (item.category === "Weapons") {
    return `A formidable ${item.subCategory.toLowerCase()} providing unique combat abilities, Q/W skill selections, and devastating E ultimate spells for PvP and PvE engagements.`;
  }
  
  if (item.category === "Armor") {
    return `Protective ${item.subCategory.toLowerCase()} piece designed to bolster defensive resistances, crowd-control duration, maximum health, or spell damage output.`;
  }
  
  if (item.category === "Accessories") {
    return `A specialized gear piece equipped to enhance inventory carry weight capacity or trigger game-changing faction cape passives in combat.`;
  }
  
  if (item.category === "Consumables") {
    return `Consumable buff that temporarily empowers combat stats, restores health/energy, or grants valuable combat fame when ingested.`;
  }
  
  if (item.category === "Mounts") {
    return `Transport mount offering fast overland travel speeds, extra carry load, and defensive hit points when roaming the open world.`;
  }
  
  return `Official Albion Online item used for combat, crafting, or trade throughout the royal continents.`;
}

