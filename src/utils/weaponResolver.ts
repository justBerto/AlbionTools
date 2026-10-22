import { PartyMember } from "../types";

export const DEFAULT_WEAPON_ASSET = "/assets/combat_swords.png";

/**
 * Resolves the weapon icon URL for a player based on packet data or role archetypes.
 */
export function resolveWeaponIcon(player: Partial<PartyMember>): string {
  if (player.weaponIcon && typeof player.weaponIcon === "string" && player.weaponIcon.trim().length > 0) {
    return player.weaponIcon;
  }

  if (player.weapon && typeof player.weapon === "string" && player.weapon.trim().length > 0) {
    const trimmed = player.weapon.trim();
    if (!trimmed.includes("ITEM_0") && !trimmed.includes("0")) {
      const unique = trimmed.startsWith("ITEM_") || trimmed.startsWith("T") ? trimmed : `T4_${trimmed}`;
      return `https://render.albiononline.com/v1/item/${unique}.png`;
    }
  }

  // Role archetype fallback
  if (player.role === "Healer") {
    return "https://render.albiononline.com/v1/item/T4_2H_HOLYSTAFF.png";
  }
  if (player.role === "Tank") {
    return "https://render.albiononline.com/v1/item/T4_MAIN_MACE.png";
  }

  return "https://render.albiononline.com/v1/item/T4_MAIN_SWORD.png";
}

/**
 * Formats party combat performance into a Discord / clipboard text report.
 * Matches upstream AlbionOnline-StatisticsAnalysis formatting.
 */
export function formatDamageReportToClipboard(
  party: PartyMember[],
  totalDps: number,
  durationString: string
): string {
  if (party.length === 0) return "";

  const lines = [...party]
    .sort((a, b) => b.dps - a.dps)
    .map((p, idx) => {
      const share = p.damagePercentage.toFixed(1);
      return `${idx + 1}. ${p.name}: ${p.dps.toLocaleString()} DPS (${share}%)`;
    });

  return `[AlbionTools DPS] (Duration: ${durationString})\n${lines.join("\n")}\nTotal Group DPS: ${totalDps.toLocaleString()} /s`;
}
