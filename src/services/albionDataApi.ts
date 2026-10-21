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

export const COMPLETE_ITEM_CATALOG: CatalogItem[] = [
  // ==========================================
  // MATERIALS - RAW RESOURCES
  // ==========================================
  {
    id: "WOOD",
    name: "Wood (Logs)",
    category: "Materials",
    subCategory: "Raw Resources",
    hasTiers: true,
    minTier: 1,
    maxTier: 8,
    hasEnchantments: true,
    tierNames: {
      1: "Rough Logs",
      2: "Birch Logs",
      3: "Chestnut Logs",
      4: "Pine Logs",
      5: "Cedar Logs",
      6: "Bloodoak Logs",
      7: "Ashenbark Logs",
      8: "Whitewood Logs",
    },
  },
  {
    id: "FIBER",
    name: "Fiber",
    category: "Materials",
    subCategory: "Raw Resources",
    hasTiers: true,
    minTier: 2,
    maxTier: 8,
    hasEnchantments: true,
    tierNames: {
      2: "Cotton",
      3: "Flax",
      4: "Hemp",
      5: "Skyflower",
      6: "Redleaf Cotton",
      7: "Sunflax",
      8: "Ghost Hemp",
    },
  },
  {
    id: "HIDE",
    name: "Hide",
    category: "Materials",
    subCategory: "Raw Resources",
    hasTiers: true,
    minTier: 1,
    maxTier: 8,
    hasEnchantments: true,
    tierNames: {
      1: "Scraps of Hide",
      2: "Rugged Hide",
      3: "Thin Hide",
      4: "Medium Hide",
      5: "Heavy Hide",
      6: "Robust Hide",
      7: "Thick Hide",
      8: "Hardened Hide",
    },
  },
  {
    id: "ORE",
    name: "Ore",
    category: "Materials",
    subCategory: "Raw Resources",
    hasTiers: true,
    minTier: 2,
    maxTier: 8,
    hasEnchantments: true,
    tierNames: {
      2: "Copper Ore",
      3: "Tin Ore",
      4: "Iron Ore",
      5: "Titanium Ore",
      6: "Runite Ore",
      7: "Meteorite Ore",
      8: "Adamantium Ore",
    },
  },
  {
    id: "ROCK",
    name: "Rock / Stone",
    category: "Materials",
    subCategory: "Raw Resources",
    hasTiers: true,
    minTier: 1,
    maxTier: 8,
    hasEnchantments: false,
    tierNames: {
      1: "Rough Stone",
      2: "Limestone",
      3: "Sandstone",
      4: "Travertine",
      5: "Granite",
      6: "Slate",
      7: "Basalt",
      8: "Marble",
    },
  },

  // ==========================================
  // MATERIALS - REFINED MATERIALS
  // ==========================================
  {
    id: "PLANKS",
    name: "Refined Planks",
    category: "Materials",
    subCategory: "Refined Materials",
    hasTiers: true,
    minTier: 2,
    maxTier: 8,
    hasEnchantments: true,
    tierNames: {
      2: "Birch Planks",
      3: "Chestnut Planks",
      4: "Pine Planks",
      5: "Cedar Planks",
      6: "Bloodoak Planks",
      7: "Ashenbark Planks",
      8: "Whitewood Planks",
    },
  },
  {
    id: "CLOTH",
    name: "Refined Cloth",
    category: "Materials",
    subCategory: "Refined Materials",
    hasTiers: true,
    minTier: 2,
    maxTier: 8,
    hasEnchantments: true,
    tierNames: {
      2: "Simple Cloth",
      3: "Neat Cloth",
      4: "Fine Cloth",
      5: "Ornate Cloth",
      6: "Lavish Cloth",
      7: "Opulent Cloth",
      8: "Baroque Cloth",
    },
  },
  {
    id: "LEATHER",
    name: "Refined Leather",
    category: "Materials",
    subCategory: "Refined Materials",
    hasTiers: true,
    minTier: 2,
    maxTier: 8,
    hasEnchantments: true,
    tierNames: {
      2: "Stiff Leather",
      3: "Thick Leather",
      4: "Worked Leather",
      5: "Cured Leather",
      6: "Hardened Leather",
      7: "Reinforced Leather",
      8: "Fortified Leather",
    },
  },
  {
    id: "METALBAR",
    name: "Refined Metal Bar",
    category: "Materials",
    subCategory: "Refined Materials",
    hasTiers: true,
    minTier: 2,
    maxTier: 8,
    hasEnchantments: true,
    tierNames: {
      2: "Bronze Bar",
      3: "Iron Bar",
      4: "Steel Bar",
      5: "Titanium Bar",
      6: "Runite Bar",
      7: "Meteorite Bar",
      8: "Adamantium Bar",
    },
  },
  {
    id: "STONEBLOCK",
    name: "Refined Stone Block",
    category: "Materials",
    subCategory: "Refined Materials",
    hasTiers: true,
    minTier: 2,
    maxTier: 8,
    hasEnchantments: false,
    tierNames: {
      2: "Limestone Block",
      3: "Sandstone Block",
      4: "Travertine Block",
      5: "Granite Block",
      6: "Slate Block",
      7: "Basalt Block",
      8: "Marble Block",
    },
  },
  {
    id: "RUNE",
    name: "Rune",
    category: "Materials",
    subCategory: "Artifacts & Runes",
    hasTiers: true,
    minTier: 4,
    maxTier: 8,
    hasEnchantments: false,
  },
  {
    id: "SOUL",
    name: "Soul",
    category: "Materials",
    subCategory: "Artifacts & Runes",
    hasTiers: true,
    minTier: 4,
    maxTier: 8,
    hasEnchantments: false,
  },
  {
    id: "RELIC",
    name: "Relic",
    category: "Materials",
    subCategory: "Artifacts & Runes",
    hasTiers: true,
    minTier: 4,
    maxTier: 8,
    hasEnchantments: false,
  },
  {
    id: "SHARD_AVALONIAN",
    name: "Avalonian Shard",
    category: "Materials",
    subCategory: "Artifacts & Runes",
    hasTiers: true,
    minTier: 4,
    maxTier: 8,
    hasEnchantments: false,
  },

  // ==========================================
  // MATERIALS - GATHERING TOOLS
  // ==========================================
  { id: "2H_TOOL_AXE", name: "Woodcutter's Axe", category: "Materials", subCategory: "Gathering Tools", hasTiers: true, minTier: 2, maxTier: 8, hasEnchantments: false },
  { id: "2H_TOOL_PICK", name: "Pickaxe", category: "Materials", subCategory: "Gathering Tools", hasTiers: true, minTier: 2, maxTier: 8, hasEnchantments: false },
  { id: "2H_TOOL_SICKLE", name: "Sickle", category: "Materials", subCategory: "Gathering Tools", hasTiers: true, minTier: 2, maxTier: 8, hasEnchantments: false },
  { id: "2H_TOOL_KNIFE", name: "Skinning Knife", category: "Materials", subCategory: "Gathering Tools", hasTiers: true, minTier: 2, maxTier: 8, hasEnchantments: false },
  { id: "2H_TOOL_HAMMER", name: "Stone Hammer", category: "Materials", subCategory: "Gathering Tools", hasTiers: true, minTier: 2, maxTier: 8, hasEnchantments: false },
  { id: "2H_TOOL_FISHINGROD", name: "Fishing Rod", category: "Materials", subCategory: "Gathering Tools", hasTiers: true, minTier: 3, maxTier: 8, hasEnchantments: false },

  // ==========================================
  // WEAPONS - SWORDS
  // ==========================================
  { id: "MAIN_SWORD", name: "Broadsword", category: "Weapons", subCategory: "Swords", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_CLAYMORE", name: "Claymore", category: "Weapons", subCategory: "Swords", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_DUALSWORD", name: "Dual Swords", category: "Weapons", subCategory: "Swords", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "MAIN_SCIMITAR_MORGANA", name: "Clarent Blade", category: "Weapons", subCategory: "Swords", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_CLEAVER", name: "Carving Sword", category: "Weapons", subCategory: "Swords", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_DUALSCIMITAR_UNDEAD", name: "Galatine Pair", category: "Weapons", subCategory: "Swords", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_CLAYMORE_AVALON", name: "Kingmaker", category: "Weapons", subCategory: "Swords", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },

  // ==========================================
  // WEAPONS - AXES
  // ==========================================
  { id: "MAIN_AXE", name: "Battleaxe", category: "Weapons", subCategory: "Axes", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_AXE", name: "Greataxe", category: "Weapons", subCategory: "Axes", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_HALBERD", name: "Halberd", category: "Weapons", subCategory: "Axes", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_HALBERD_MORGANA", name: "Carrioncaller", category: "Weapons", subCategory: "Axes", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_SCYTHE_HELL", name: "Infernal Scythe", category: "Weapons", subCategory: "Axes", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_DUALAXE_KEEPER", name: "Bear Paws", category: "Weapons", subCategory: "Axes", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_AXE_AVALON", name: "Realmbreaker", category: "Weapons", subCategory: "Axes", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },

  // ==========================================
  // WEAPONS - MACES & HAMMERS
  // ==========================================
  { id: "MAIN_MACE", name: "1H Mace", category: "Weapons", subCategory: "Maces", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_MACE", name: "Heavy Mace", category: "Weapons", subCategory: "Maces", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_FLAIL", name: "Morning Star", category: "Weapons", subCategory: "Maces", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "MAIN_ROCKMACE_KEEPER", name: "Bedrock Mace", category: "Weapons", subCategory: "Maces", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "MAIN_MACE_HELL", name: "Incubus Mace", category: "Weapons", subCategory: "Maces", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_MACE_MORGANA", name: "Camlann Mace", category: "Weapons", subCategory: "Maces", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_DUALMACE_AVALON", name: "Oathkeepers", category: "Weapons", subCategory: "Maces", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "MAIN_HAMMER", name: "1H Hammer", category: "Weapons", subCategory: "Hammers", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_POLEHAMMER", name: "Polehammer", category: "Weapons", subCategory: "Hammers", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_HAMMER", name: "Great Hammer", category: "Weapons", subCategory: "Hammers", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_HAMMER_UNDEAD", name: "Tombhammer", category: "Weapons", subCategory: "Hammers", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_RAM_KEEPER", name: "Grovekeeper", category: "Weapons", subCategory: "Hammers", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_HAMMER_AVALON", name: "Hand of Justice", category: "Weapons", subCategory: "Hammers", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },

  // ==========================================
  // WEAPONS - BOWS & CROSSBOWS
  // ==========================================
  { id: "2H_BOW", name: "Bow", category: "Weapons", subCategory: "Bows", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_WARBOW", name: "Warbow", category: "Weapons", subCategory: "Bows", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_LONGBOW", name: "Longbow", category: "Weapons", subCategory: "Bows", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_LONGBOW_UNDEAD", name: "Whispering Bow", category: "Weapons", subCategory: "Bows", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_BOW_HELL", name: "Wailing Bow", category: "Weapons", subCategory: "Bows", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_BOW_KEEPER", name: "Bow of Badon", category: "Weapons", subCategory: "Bows", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_BOW_AVALON", name: "Mistpiercer", category: "Weapons", subCategory: "Bows", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "MAIN_1HCROSSBOW", name: "Light Crossbow", category: "Weapons", subCategory: "Crossbows", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_CROSSBOW", name: "Crossbow", category: "Weapons", subCategory: "Crossbows", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_CROSSBOWLARGE", name: "Heavy Crossbow", category: "Weapons", subCategory: "Crossbows", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_REPEATINGCROSSBOW_UNDEAD", name: "Weeping Repeater", category: "Weapons", subCategory: "Crossbows", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_DUALCROSSBOW_HELL", name: "Boltcasters", category: "Weapons", subCategory: "Crossbows", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_SIEGEBOW_HELL", name: "Siegebow", category: "Weapons", subCategory: "Crossbows", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_CROSSBOW_CANNON_AVALON", name: "Energy Shaper", category: "Weapons", subCategory: "Crossbows", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },

  // ==========================================
  // WEAPONS - DAGGERS & SPEARS
  // ==========================================
  { id: "MAIN_DAGGER", name: "1H Dagger", category: "Weapons", subCategory: "Daggers", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_DAGGERPAIR", name: "Dagger Pair", category: "Weapons", subCategory: "Daggers", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_CLAWPAIR", name: "Claws", category: "Weapons", subCategory: "Daggers", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "MAIN_RAPIER_MORGANA", name: "Bloodletter", category: "Weapons", subCategory: "Daggers", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "MAIN_DAGGER_HELL", name: "Demonfang", category: "Weapons", subCategory: "Daggers", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_DUALSICKLE_UNDEAD", name: "Deathgivers", category: "Weapons", subCategory: "Daggers", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_DUALDAGGER_AVALON", name: "Bridled Fury", category: "Weapons", subCategory: "Daggers", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "MAIN_SPEAR", name: "1H Spear", category: "Weapons", subCategory: "Spears", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_SPEAR", name: "Pike", category: "Weapons", subCategory: "Spears", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_GLAIVE", name: "Glaive", category: "Weapons", subCategory: "Spears", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "MAIN_SPEAR_KEEPER", name: "Heron Spear", category: "Weapons", subCategory: "Spears", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_HARPOON_HELL", name: "Spirithunter", category: "Weapons", subCategory: "Spears", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_TRIDENT_UNDEAD", name: "Trinity Spear", category: "Weapons", subCategory: "Spears", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_SPEAR_AVALON", name: "Daybreaker", category: "Weapons", subCategory: "Spears", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },

  // ==========================================
  // WEAPONS - MAGIC (FIRE, FROST, CURSED, HOLY, NATURE, ARCANE, SHAPESHIFTER)
  // ==========================================
  { id: "MAIN_FIRESTAFF", name: "1H Fire Staff", category: "Weapons", subCategory: "Fire Staffs", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_FIRESTAFF", name: "Great Fire Staff", category: "Weapons", subCategory: "Fire Staffs", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_INFERNALSTAFF", name: "Infernal Staff", category: "Weapons", subCategory: "Fire Staffs", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "MAIN_FIRESTAFF_KEEPER", name: "Wildfire Staff", category: "Weapons", subCategory: "Fire Staffs", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_FIRE_RING_AVALON", name: "Dawnsong", category: "Weapons", subCategory: "Fire Staffs", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "MAIN_FROSTSTAFF", name: "1H Frost Staff", category: "Weapons", subCategory: "Frost Staffs", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_FROSTSTAFF", name: "Great Frost Staff", category: "Weapons", subCategory: "Frost Staffs", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_GLACIALSTAFF", name: "Glacial Staff", category: "Weapons", subCategory: "Frost Staffs", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_ICEGAUNTLETS_HELL", name: "Permafrost Prism", category: "Weapons", subCategory: "Frost Staffs", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "MAIN_FROSTSTAFF_AVALON", name: "Chillhowl", category: "Weapons", subCategory: "Frost Staffs", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "MAIN_CURSEDSTAFF", name: "1H Cursed Staff", category: "Weapons", subCategory: "Cursed Staffs", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_CURSEDSTAFF", name: "Great Cursed Staff", category: "Weapons", subCategory: "Cursed Staffs", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_DEMONICSTAFF", name: "Demonic Staff", category: "Weapons", subCategory: "Cursed Staffs", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_CURSEDSTAFF_MORGANA", name: "Shadowcaller", category: "Weapons", subCategory: "Cursed Staffs", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "MAIN_HOLYSTAFF", name: "1H Holy Staff", category: "Weapons", subCategory: "Holy Staffs", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_HOLYSTAFF", name: "Great Holy Staff", category: "Weapons", subCategory: "Holy Staffs", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_DIVINESTAFF", name: "Divine Staff", category: "Weapons", subCategory: "Holy Staffs", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_HOLYSTAFF_HELL", name: "Fallen Staff", category: "Weapons", subCategory: "Holy Staffs", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "MAIN_HOLYSTAFF_AVALON", name: "Hallowfall", category: "Weapons", subCategory: "Holy Staffs", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "MAIN_NATURESTAFF", name: "1H Nature Staff", category: "Weapons", subCategory: "Nature Staffs", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_NATURESTAFF", name: "Great Nature Staff", category: "Weapons", subCategory: "Nature Staffs", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_WILDSTAFF", name: "Wild Staff", category: "Weapons", subCategory: "Nature Staffs", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_NATURESTAFF_HELL", name: "Blight Staff", category: "Weapons", subCategory: "Nature Staffs", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_NATURESTAFF_AVALON", name: "Ironroot Staff", category: "Weapons", subCategory: "Nature Staffs", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "MAIN_ARCANESTAFF", name: "1H Arcane Staff", category: "Weapons", subCategory: "Arcane Staffs", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_ENIGMATICSTAFF", name: "Enigmatic Staff", category: "Weapons", subCategory: "Arcane Staffs", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_ARCANE_RING_AVALON", name: "Evocation Staff", category: "Weapons", subCategory: "Arcane Staffs", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_SHAPESHIFTER_PANTHER", name: "Prowling Staff", category: "Weapons", subCategory: "Shapeshifter Staffs", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_SHAPESHIFTER_BEAST", name: "Primal Staff", category: "Weapons", subCategory: "Shapeshifter Staffs", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "2H_SHAPESHIFTER_WOLF", name: "Bloodmoon Staff", category: "Weapons", subCategory: "Shapeshifter Staffs", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },

  // ==========================================
  // ARMOR - PLATE
  // ==========================================
  { id: "ARMOR_PLATE_SET1", name: "Soldier Armor", category: "Armor", subCategory: "Plate Armor", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "ARMOR_PLATE_SET2", name: "Knight Armor", category: "Armor", subCategory: "Plate Armor", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "ARMOR_PLATE_SET3", name: "Guardian Armor", category: "Armor", subCategory: "Plate Armor", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "ARMOR_PLATE_ROYAL", name: "Royal Armor", category: "Armor", subCategory: "Plate Armor", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "ARMOR_PLATE_HELL", name: "Demon Armor", category: "Armor", subCategory: "Plate Armor", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "ARMOR_PLATE_KEEPER", name: "Judicator Armor", category: "Armor", subCategory: "Plate Armor", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "ARMOR_PLATE_AVALON", name: "Armor of Valor", category: "Armor", subCategory: "Plate Armor", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "HEAD_PLATE_SET1", name: "Soldier Helmet", category: "Armor", subCategory: "Plate Helmets", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "HEAD_PLATE_SET2", name: "Knight Helmet", category: "Armor", subCategory: "Plate Helmets", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "HEAD_PLATE_SET3", name: "Guardian Helmet", category: "Armor", subCategory: "Plate Helmets", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "HEAD_PLATE_HELL", name: "Demon Helmet", category: "Armor", subCategory: "Plate Helmets", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "HEAD_PLATE_AVALON", name: "Helmet of Valor", category: "Armor", subCategory: "Plate Helmets", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "SHOES_PLATE_SET1", name: "Soldier Boots", category: "Armor", subCategory: "Plate Boots", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "SHOES_PLATE_SET2", name: "Knight Boots", category: "Armor", subCategory: "Plate Boots", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "SHOES_PLATE_SET3", name: "Guardian Boots", category: "Armor", subCategory: "Plate Boots", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "SHOES_PLATE_ROYAL", name: "Royal Boots", category: "Armor", subCategory: "Plate Boots", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "SHOES_PLATE_AVALON", name: "Boots of Valor", category: "Armor", subCategory: "Plate Boots", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },

  // ==========================================
  // ARMOR - LEATHER
  // ==========================================
  { id: "ARMOR_LEATHER_SET1", name: "Mercenary Jacket", category: "Armor", subCategory: "Leather Armor", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "ARMOR_LEATHER_SET2", name: "Hunter Jacket", category: "Armor", subCategory: "Leather Armor", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "ARMOR_LEATHER_SET3", name: "Assassin Jacket", category: "Armor", subCategory: "Leather Armor", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "ARMOR_LEATHER_ROYAL", name: "Royal Jacket", category: "Armor", subCategory: "Leather Armor", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "ARMOR_LEATHER_MORGANA", name: "Stalker Jacket", category: "Armor", subCategory: "Leather Armor", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "ARMOR_LEATHER_HELL", name: "Hellion Jacket", category: "Armor", subCategory: "Leather Armor", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "ARMOR_LEATHER_UNDEAD", name: "Specter Jacket", category: "Armor", subCategory: "Leather Armor", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "ARMOR_LEATHER_FEY", name: "Mistwalker Jacket", category: "Armor", subCategory: "Leather Armor", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "HEAD_LEATHER_SET1", name: "Mercenary Hood", category: "Armor", subCategory: "Leather Hoods", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "HEAD_LEATHER_SET2", name: "Hunter Hood", category: "Armor", subCategory: "Leather Hoods", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "HEAD_LEATHER_SET3", name: "Assassin Hood", category: "Armor", subCategory: "Leather Hoods", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "HEAD_LEATHER_HELL", name: "Hellion Hood", category: "Armor", subCategory: "Leather Hoods", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "HEAD_LEATHER_UNDEAD", name: "Specter Hood", category: "Armor", subCategory: "Leather Hoods", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "HEAD_LEATHER_FEY", name: "Mistwalker Hood", category: "Armor", subCategory: "Leather Hoods", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "SHOES_LEATHER_SET1", name: "Mercenary Shoes", category: "Armor", subCategory: "Leather Shoes", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "SHOES_LEATHER_SET2", name: "Hunter Shoes", category: "Armor", subCategory: "Leather Shoes", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "SHOES_LEATHER_SET3", name: "Assassin Shoes", category: "Armor", subCategory: "Leather Shoes", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "SHOES_LEATHER_ROYAL", name: "Royal Shoes", category: "Armor", subCategory: "Leather Shoes", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "SHOES_LEATHER_HELL", name: "Hellion Shoes", category: "Armor", subCategory: "Leather Shoes", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },

  // ==========================================
  // ARMOR - CLOTH
  // ==========================================
  { id: "ARMOR_CLOTH_SET1", name: "Scholar Robe", category: "Armor", subCategory: "Cloth Armor", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "ARMOR_CLOTH_SET2", name: "Cleric Robe", category: "Armor", subCategory: "Cloth Armor", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "ARMOR_CLOTH_SET3", name: "Mage Robe", category: "Armor", subCategory: "Cloth Armor", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "ARMOR_CLOTH_ROYAL", name: "Royal Robe", category: "Armor", subCategory: "Cloth Armor", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "ARMOR_CLOTH_KEEPER", name: "Druid Robe", category: "Armor", subCategory: "Cloth Armor", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "ARMOR_CLOTH_HELL", name: "Fiend Robe", category: "Armor", subCategory: "Cloth Armor", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "ARMOR_CLOTH_MORGANA", name: "Cultist Robe", category: "Armor", subCategory: "Cloth Armor", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "ARMOR_CLOTH_FEY", name: "Feyscale Robe", category: "Armor", subCategory: "Cloth Armor", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "ARMOR_CLOTH_AVALON", name: "Robe of Purity", category: "Armor", subCategory: "Cloth Armor", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "HEAD_CLOTH_SET1", name: "Scholar Cowl", category: "Armor", subCategory: "Cloth Cowls", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "HEAD_CLOTH_SET2", name: "Cleric Cowl", category: "Armor", subCategory: "Cloth Cowls", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "HEAD_CLOTH_SET3", name: "Mage Cowl", category: "Armor", subCategory: "Cloth Cowls", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "HEAD_CLOTH_MORGANA", name: "Cultist Cowl", category: "Armor", subCategory: "Cloth Cowls", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "HEAD_CLOTH_AVALON", name: "Cowl of Purity", category: "Armor", subCategory: "Cloth Cowls", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "SHOES_CLOTH_SET1", name: "Scholar Sandals", category: "Armor", subCategory: "Cloth Sandals", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "SHOES_CLOTH_SET2", name: "Cleric Sandals", category: "Armor", subCategory: "Cloth Sandals", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "SHOES_CLOTH_SET3", name: "Mage Sandals", category: "Armor", subCategory: "Cloth Sandals", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "SHOES_CLOTH_ROYAL", name: "Royal Sandals", category: "Armor", subCategory: "Cloth Sandals", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "SHOES_CLOTH_MORGANA", name: "Cultist Sandals", category: "Armor", subCategory: "Cloth Sandals", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },

  // ==========================================
  // ARMOR - SHIELDS & OFFHANDS
  // ==========================================
  { id: "OFF_SHIELD", name: "Shield", category: "Armor", subCategory: "Shields & Offhands", hasTiers: true, minTier: 3, maxTier: 8, hasEnchantments: true },
  { id: "OFF_TOWERSHIELD_UNDEAD", name: "Sarcophagus", category: "Armor", subCategory: "Shields & Offhands", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "OFF_SHIELD_HELL", name: "Caitiff Shield", category: "Armor", subCategory: "Shields & Offhands", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "OFF_SPIKEDSHIELD_MORGANA", name: "Facebreaker", category: "Armor", subCategory: "Shields & Offhands", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "OFF_SHIELD_AVALON", name: "Astral Aegis", category: "Armor", subCategory: "Shields & Offhands", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "OFF_BOOK", name: "Tome of Spells", category: "Armor", subCategory: "Shields & Offhands", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "OFF_ORB_MORGANA", name: "Eye of Secrets", category: "Armor", subCategory: "Shields & Offhands", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "OFF_DEMONSKULL_HELL", name: "Muisak", category: "Armor", subCategory: "Shields & Offhands", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "OFF_TOTEM_KEEPER", name: "Taproot", category: "Armor", subCategory: "Shields & Offhands", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "OFF_CANDLE_MORGANA", name: "Cryptcandle", category: "Armor", subCategory: "Shields & Offhands", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "OFF_TORCH", name: "Torch", category: "Armor", subCategory: "Shields & Offhands", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "OFF_HORN_KEEPER", name: "Mistcaller", category: "Armor", subCategory: "Shields & Offhands", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "OFF_JESTERCANE_HELL", name: "Leering Cane", category: "Armor", subCategory: "Shields & Offhands", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },

  // ==========================================
  // ACCESSORIES - BAGS & CAPES
  // ==========================================
  { id: "BAG", name: "Bag", category: "Accessories", subCategory: "Bags", hasTiers: true, minTier: 2, maxTier: 8, hasEnchantments: true },
  { id: "BAG_INSIGHT", name: "Satchel of Insight", category: "Accessories", subCategory: "Bags", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "CAPE", name: "Standard Cape", category: "Accessories", subCategory: "Regular Capes", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "CAPEITEM_FW_THETFORD", name: "Thetford Cape", category: "Accessories", subCategory: "Faction Capes", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "CAPEITEM_FW_FORTSTERLING", name: "Fort Sterling Cape", category: "Accessories", subCategory: "Faction Capes", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "CAPEITEM_FW_LYMHURST", name: "Lymhurst Cape", category: "Accessories", subCategory: "Faction Capes", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "CAPEITEM_FW_BRIDGEWATCH", name: "Bridgewatch Cape", category: "Accessories", subCategory: "Faction Capes", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "CAPEITEM_FW_MARTLOCK", name: "Martlock Cape", category: "Accessories", subCategory: "Faction Capes", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "CAPEITEM_FW_CAERLEON", name: "Caerleon Cape", category: "Accessories", subCategory: "Faction Capes", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "CAPEITEM_FW_BRECILIEN", name: "Brecilien Cape", category: "Accessories", subCategory: "Faction Capes", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "CAPEITEM_HERETIC", name: "Heretic Cape", category: "Accessories", subCategory: "Faction Capes", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "CAPEITEM_UNDEAD", name: "Undead Cape", category: "Accessories", subCategory: "Faction Capes", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "CAPEITEM_MORGANA", name: "Morgana Cape", category: "Accessories", subCategory: "Faction Capes", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "CAPEITEM_DEMON", name: "Demon Cape", category: "Accessories", subCategory: "Faction Capes", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "CAPEITEM_KEEPER", name: "Keeper Cape", category: "Accessories", subCategory: "Faction Capes", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },

  // ==========================================
  // CONSUMABLES - FOOD & POTIONS
  // ==========================================
  { id: "MEAL_STEW", name: "Beef Stew", category: "Consumables", subCategory: "Food & Meals", hasTiers: false, minTier: 8, maxTier: 8, hasEnchantments: true },
  { id: "MEAL_OMELETTE", name: "Pork Omelette", category: "Consumables", subCategory: "Food & Meals", hasTiers: false, minTier: 7, maxTier: 7, hasEnchantments: true },
  { id: "MEAL_ROAST", name: "Roast Pork", category: "Consumables", subCategory: "Food & Meals", hasTiers: false, minTier: 7, maxTier: 7, hasEnchantments: true },
  { id: "MEAL_SANDWICH", name: "Beef Sandwich", category: "Consumables", subCategory: "Food & Meals", hasTiers: false, minTier: 8, maxTier: 8, hasEnchantments: true },
  { id: "MEAL_PIE", name: "Pork Pie", category: "Consumables", subCategory: "Food & Meals", hasTiers: false, minTier: 7, maxTier: 7, hasEnchantments: true },
  { id: "MEAL_SALAD", name: "Potato Salad", category: "Consumables", subCategory: "Food & Meals", hasTiers: false, minTier: 6, maxTier: 6, hasEnchantments: true },
  { id: "POTION_HEAL", name: "Healing Potion", category: "Consumables", subCategory: "Potions", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "POTION_ENERGY", name: "Energy Potion", category: "Consumables", subCategory: "Potions", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "POTION_STONESKIN", name: "Resistance Potion", category: "Consumables", subCategory: "Potions", hasTiers: true, minTier: 5, maxTier: 7, hasEnchantments: true },
  { id: "POTION_REVIVE", name: "Gigantify Potion", category: "Consumables", subCategory: "Potions", hasTiers: true, minTier: 5, maxTier: 7, hasEnchantments: true },
  { id: "POTION_COOLDOWN", name: "Poison Potion", category: "Consumables", subCategory: "Potions", hasTiers: true, minTier: 4, maxTier: 8, hasEnchantments: true },
  { id: "POTION_CLEANSE", name: "Invisibility Potion", category: "Consumables", subCategory: "Potions", hasTiers: false, minTier: 8, maxTier: 8, hasEnchantments: false },
  { id: "QUESTITEM_EXP_BOOK", name: "Tome of Insight", category: "Consumables", subCategory: "Tomes of Insight", hasTiers: false, minTier: 4, maxTier: 4, hasEnchantments: false },

  // ==========================================
  // MOUNTS
  // ==========================================
  { id: "MOUNT_HORSE", name: "Riding Horse", category: "Mounts", subCategory: "Riding Horses", hasTiers: true, minTier: 3, maxTier: 8, hasEnchantments: false },
  { id: "MOUNT_ARMORED_HORSE", name: "Armored Horse", category: "Mounts", subCategory: "Armored Horses", hasTiers: true, minTier: 5, maxTier: 8, hasEnchantments: false },
  { id: "MOUNT_OX", name: "Transport Ox", category: "Mounts", subCategory: "Transport Oxen", hasTiers: true, minTier: 3, maxTier: 8, hasEnchantments: false },
  { id: "MOUNT_SWIFTCLAW", name: "Swiftclaw", category: "Mounts", subCategory: "Rare & Faction Mounts", hasTiers: false, minTier: 5, maxTier: 5, hasEnchantments: false },
  { id: "MOUNT_DIREWOLF", name: "Direwolf", category: "Mounts", subCategory: "Rare & Faction Mounts", hasTiers: false, minTier: 6, maxTier: 6, hasEnchantments: false },
  { id: "MOUNT_BOAR", name: "Direboar", category: "Mounts", subCategory: "Rare & Faction Mounts", hasTiers: false, minTier: 7, maxTier: 7, hasEnchantments: false },
  { id: "MOUNT_BEAR", name: "Direbear", category: "Mounts", subCategory: "Rare & Faction Mounts", hasTiers: false, minTier: 8, maxTier: 8, hasEnchantments: false },
  { id: "MOUNT_MOOSE", name: "Giant Stag", category: "Mounts", subCategory: "Rare & Faction Mounts", hasTiers: false, minTier: 4, maxTier: 4, hasEnchantments: false },
  { id: "MOUNT_SALAMANDER", name: "Swamp Salamander", category: "Mounts", subCategory: "Rare & Faction Mounts", hasTiers: false, minTier: 7, maxTier: 7, hasEnchantments: false },
  { id: "MOUNT_MAMMOTH", name: "Transport Mammoth", category: "Mounts", subCategory: "Rare & Faction Mounts", hasTiers: false, minTier: 8, maxTier: 8, hasEnchantments: false },
];

/**
 * Builds the canonical Albion item unique name from tier, base ID, and enchantment
 * Correctly distinguishes materials (_LEVELx@x) vs gear (@x)
 */
export function buildItemUniqueName(tier: number, baseId: string, enchantment: number = 0): string {
  // If baseId already has a full tier prefix (e.g. T4_...), use it
  let prefix = baseId.startsWith("T") && baseId.includes("_") ? baseId : `T${tier}_${baseId}`;

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
  let baseName = item.tierNames && item.tierNames[tier] ? item.tierNames[tier] : item.name;

  if (item.hasTiers && (!item.tierNames || !item.tierNames[tier])) {
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

