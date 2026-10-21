// Albion Online Data Project API Client (West, East, Europe)
// Reference: https://www.albion-online-data.com/developer

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

export interface MarketHistoryItem {
  item_amount: number;
  silver_amount: number;
  timestamp: string;
}

export interface MarketHistoryRecord {
  item_id: string;
  location: string;
  quality: number;
  data: MarketHistoryItem[];
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

export interface CatalogItem {
  id: string; // Base id e.g. "MAIN_SWORD"
  name: string; // Clean display name e.g. "Broadsword"
  category: "Weapons" | "Armor" | "Accessories" | "Materials" | "Consumables" | "Mounts";
  hasTiers: boolean;
  minTier: number;
  maxTier: number;
}

export const POPULAR_CATALOG: CatalogItem[] = [
  // Weapons - Swords
  { id: "MAIN_SWORD", name: "Broadsword", category: "Weapons", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "2H_CLAYMORE", name: "Claymore", category: "Weapons", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "2H_DUALSWORD", name: "Dual Swords", category: "Weapons", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "2H_CLEAVER", name: "Carving Sword", category: "Weapons", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "2H_CLAYMORE_AVALON", name: "Kingmaker", category: "Weapons", hasTiers: true, minTier: 4, maxTier: 8 },

  // Weapons - Bows
  { id: "2H_BOW", name: "Bow", category: "Weapons", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "2H_WARBOW", name: "Warbow", category: "Weapons", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "2H_LONGBOW", name: "Longbow", category: "Weapons", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "2H_BOW_AVALON", name: "Mistpiercer", category: "Weapons", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "2H_BOW_HELL", name: "Badon Bow", category: "Weapons", hasTiers: true, minTier: 4, maxTier: 8 },

  // Weapons - Daggers
  { id: "MAIN_DAGGER", name: "1H Dagger", category: "Weapons", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "2H_DAGGERPAIR", name: "Dagger Pair", category: "Weapons", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "2H_CLAWPAIR", name: "Claws", category: "Weapons", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "MAIN_RAPIER_MORGANA", name: "Bloodletter", category: "Weapons", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "2H_DUALSICKLE_UNDEAD", name: "Deathgivers", category: "Weapons", hasTiers: true, minTier: 4, maxTier: 8 },

  // Weapons - Axes
  { id: "MAIN_AXE", name: "Battleaxe", category: "Weapons", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "2H_AXE", name: "Greataxe", category: "Weapons", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "2H_HALBERD", name: "Halberd", category: "Weapons", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "2H_DUALAXE_KEEPER", name: "Bear Paws", category: "Weapons", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "2H_AXE_AVALON", name: "Realmbreaker", category: "Weapons", hasTiers: true, minTier: 4, maxTier: 8 },

  // Weapons - Magic
  { id: "MAIN_CURSEDSTAFF", name: "1H Cursed Staff", category: "Weapons", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "2H_CURSEDSTAFF_MORGANA", name: "Shadowcaller", category: "Weapons", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "MAIN_FROSTSTAFF", name: "1H Frost Staff", category: "Weapons", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "2H_ICEGAUNTLETS_HELL", name: "Permafrost Prism", category: "Weapons", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "MAIN_FIRESTAFF", name: "1H Fire Staff", category: "Weapons", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "2H_FIRE_RING_AVALON", name: "Dawnsong", category: "Weapons", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "MAIN_HOLYSTAFF", name: "1H Holy Staff", category: "Weapons", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "MAIN_HOLYSTAFF_AVALON", name: "Hallowfall", category: "Weapons", hasTiers: true, minTier: 4, maxTier: 8 },

  // Armor
  { id: "ARMOR_LEATHER_SET1", name: "Mercenary Jacket", category: "Armor", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "ARMOR_LEATHER_SET3", name: "Assassin Jacket", category: "Armor", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "ARMOR_LEATHER_MORGANA", name: "Stalker Jacket", category: "Armor", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "ARMOR_CLOTH_SET1", name: "Scholar Robe", category: "Armor", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "ARMOR_CLOTH_SET2", name: "Cleric Robe", category: "Armor", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "ARMOR_CLOTH_SET3", name: "Mage Robe", category: "Armor", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "ARMOR_CLOTH_KEEPER", name: "Druid Robe", category: "Armor", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "ARMOR_CLOTH_MORGANA", name: "Cultist Robe", category: "Armor", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "ARMOR_PLATE_SET1", name: "Soldier Armor", category: "Armor", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "ARMOR_PLATE_SET2", name: "Knight Armor", category: "Armor", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "ARMOR_PLATE_SET3", name: "Guardian Armor", category: "Armor", hasTiers: true, minTier: 4, maxTier: 8 },

  // Accessories
  { id: "BAG", name: "Bag", category: "Accessories", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "CAPE", name: "Cape", category: "Accessories", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "CAPEITEM_FW_THETFORD", name: "Thetford Cape", category: "Accessories", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "CAPEITEM_FW_FORTSTERLING", name: "Fort Sterling Cape", category: "Accessories", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "CAPEITEM_FW_LYMHURST", name: "Lymhurst Cape", category: "Accessories", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "CAPEITEM_FW_BRIDGEWATCH", name: "Bridgewatch Cape", category: "Accessories", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "CAPEITEM_FW_MARTLOCK", name: "Martlock Cape", category: "Accessories", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "CAPEITEM_FW_CAERLEON", name: "Caerleon Cape", category: "Accessories", hasTiers: true, minTier: 4, maxTier: 8 },

  // Materials
  { id: "PLANKS", name: "Refined Planks", category: "Materials", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "METALBAR", name: "Refined Metal Bar", category: "Materials", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "LEATHER", name: "Refined Leather", category: "Materials", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "CLOTH", name: "Refined Cloth", category: "Materials", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "STONEBLOCK", name: "Refined Stone Block", category: "Materials", hasTiers: true, minTier: 4, maxTier: 8 },

  // Consumables & Mounts
  { id: "POTION_HEAL", name: "Healing Potion", category: "Consumables", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "POTION_ENERGY", name: "Energy Potion", category: "Consumables", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "MEAL_STEW", name: "Beef Stew", category: "Consumables", hasTiers: false, minTier: 8, maxTier: 8 },
  { id: "MEAL_OMELETTE", name: "Pork Omelette", category: "Consumables", hasTiers: false, minTier: 7, maxTier: 7 },
  { id: "MOUNT_ARMORED_HORSE", name: "Armored Horse", category: "Mounts", hasTiers: true, minTier: 5, maxTier: 8 },
  { id: "MOUNT_OX", name: "Transport Ox", category: "Mounts", hasTiers: true, minTier: 4, maxTier: 8 },
  { id: "MOUNT_DIREWOLF", name: "Direwolf", category: "Mounts", hasTiers: false, minTier: 6, maxTier: 6 },
  { id: "MOUNT_SWIFTCLAW", name: "Swiftclaw", category: "Mounts", hasTiers: false, minTier: 5, maxTier: 5 },
];

/**
 * Builds the canonical Albion item unique name from tier, base ID, and enchantment
 * Example: tier 8, base "MAIN_SWORD", enchant 2 -> "T8_MAIN_SWORD@2"
 */
export function buildItemUniqueName(tier: number, baseId: string, enchantment: number = 0): string {
  // If baseId already starts with T\d_, use it as is
  let name = baseId.startsWith("T") && baseId.includes("_") ? baseId : `T${tier}_${baseId}`;
  if (enchantment > 0 && !name.includes("@")) {
    name = `${name}@${enchantment}`;
  }
  return name;
}
