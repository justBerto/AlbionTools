export type NavigationTab =
  | "dashboard"
  | "damage-meter"
  | "dungeon"
  | "item-search"
  | "trade"
  | "crafting"
  | "gathering"
  | "party"
  | "guild"
  | "storage"
  | "map-history"
  | "player-info"
  | "loss-explorer"
  | "logging"
  | "settings";

export type ServerRegion = "Americas (Washington)" | "Asia (Singapore)" | "Europe (Amsterdam)";

export interface GameStatus {
  isGameDataLoaded: boolean;
  isSnifferActive: boolean;
  isServerDetected: boolean;
  serverRegion: ServerRegion;
  isCharacterDetected: boolean;
  characterName: string;
  guildName?: string;
  allianceName?: string;
  isLocationDetected: boolean;
  currentZone: string;
  zoneTier: string;
  zoneDanger: "Blue" | "Yellow" | "Red" | "Black" | "Mists" | "Avalon";
}

export interface SessionStats {
  uptimeSeconds: number;
  totalFame: number;
  famePerHour: number;
  totalSilver: number;
  silverPerHour: number;
  reSpecPoints: number;
  reSpecPerHour: number;
  might: number;
  mightPerHour: number;
  favor: number;
  favorPerHour: number;
}

export interface CombatantSpell {
  id: string;
  name: string;
  slot: "Q" | "W" | "E" | "Passive" | "Auto Attack";
  damage: number;
  hits: number;
  critRate?: number;
}

export interface PartyMember {
  id: string;
  name: string;
  guild?: string;
  currentHp: number;
  maxHp: number;
  dps: number;
  damagePercentage: number;
  hps: number;
  role: "Tank" | "Healer" | "DPS" | "Support";
  weapon?: string;
  weaponIcon?: string;
  spells?: CombatantSpell[];
}

export interface LootItem {
  id: string;
  itemId: string;
  name: string;
  tier: number;
  enchantment: number;
  quality: number;
  amount: number;
  estimatedValue: number;
  source: "Chest" | "Mob" | "Player" | "Unknown";
  timestamp: string;
  looterName?: string;
}

export interface CombatSnapshot {
  id: string;
  targetName: string;
  durationSeconds: number;
  totalDamage: number;
  groupDps: number;
  timestamp: string;
  players: {
    id?: string;
    name: string;
    role: "Tank" | "Healer" | "DPS" | "Support";
    weapon?: string;
    weaponIcon?: string;
    damage: number;
    dps: number;
    healing: number;
    hps: number;
    damagePercentage: number;
    damageTaken?: number;
    spells?: CombatantSpell[];
  }[];
}

export interface DungeonTimerState {
  isActive: boolean;
  dungeonType: "Solo" | "Group" | "Corrupted" | "Hellgate" | "Avalonian";
  clusterName: string;
  remainingSeconds: number;
  totalSeconds: number;
  isSafelyClosed: boolean;
}

export interface ChestCategoryData {
  category: string;
  icon: string;
  green: number;
  blue: number;
  purple: number;
  gold: number;
  totalLootValue: number;
  mapsCount: number;
  lastActive?: string;
}

export interface ChestOpenedEvent {
  objectId: number;
  chestType: string;
  category: string;
  rarity: "green" | "blue" | "purple" | "gold";
  location: string;
  timestamp: string;
}

export interface SessionHistoryPoint {
  timestamp: string;
  timeSeconds: number;
  fame: number;
  silver: number;
  respec: number;
  factionStanding: number;
  factionPoints: number;
  might: number;
  favor: number;
}

export interface SavedSession {
  id: string;
  name: string;
  startedAt: string;
  endedAt?: string;
  characterName: string;
  serverLocation?: string;
  durationSeconds: number;
  stats: SessionStats;
  recentLoot: LootItem[];
  chestsData: Record<string, ChestCategoryData>;
  activeContents: string[];
  sessionHistory: SessionHistoryPoint[];
}

export interface EconomyStats {
  reSpecSilverCost: number;
  spentReSpec: number;
  repairCosts: number;
  highestRepairCost: number;
  qualityRerollCosts: number;
  awakenedWeaponCosts: number;
  awakenedTraitUpgradeCount: number;
  awakenedTraitUpgradeProcCount: number;
}

export interface MobKillEntry {
  id: string;
  mobName: string;
  category: string;
  kills: number;
  fame: number;
  lastKilled: string;
  avatar?: string;
}



