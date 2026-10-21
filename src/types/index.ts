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
    name: string;
    damage: number;
    dps: number;
    healing: number;
    hps: number;
    damageTaken: number;
    topSpell?: string;
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
