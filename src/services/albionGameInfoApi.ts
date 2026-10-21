// Official Albion Online Gameinfo REST API Client with Tauri IPC bridge to bypass CORS

export interface PlayerSearchResult {
  Id: string;
  Name: string;
  GuildId?: string;
  GuildName?: string;
  AllianceId?: string;
  AllianceName?: string;
  KillFame: number;
  DeathFame: number;
  FameRatio: number;
  TotalKills?: number;
  AverageItemPower?: number;
  PvE?: {
    Total: number;
    Royal: number;
    Outlands: number;
    Avalon: number;
    Hellgate: number;
    CorruptedDungeon: number;
    Mists: number;
  };
  Crafting?: {
    Total: number;
  };
  Gathering?: {
    All: { Total: number };
  };
}

export interface KillEvent {
  EventId: number;
  TimeStamp: string;
  Killer: {
    Id: string;
    Name: string;
    GuildName?: string;
    AverageItemPower: number;
    Equipment: {
      MainHand?: { Type: string };
      Armor?: { Type: string };
      Head?: { Type: string };
      Shoes?: { Type: string };
    };
  };
  Victim: {
    Id: string;
    Name: string;
    GuildName?: string;
    AverageItemPower: number;
    Equipment: {
      MainHand?: { Type: string };
      Armor?: { Type: string };
      Head?: { Type: string };
      Shoes?: { Type: string };
    };
  };
  TotalVictimKillFame: number;
  Location?: string;
}

// Low-level HTTP executor using Tauri curl bridge first, fetch second
async function executeApiRequest(url: string): Promise<any> {
  const isTauri = typeof window !== "undefined" && Boolean((window as any).__TAURI_INTERNALS__);
  if (isTauri) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const rawText = await invoke<string>("fetch_gameinfo", { url });
      return JSON.parse(rawText);
    } catch (err) {
      console.warn("[AlbionGameInfoApi] Tauri invoke failed, trying browser fetch fallback:", err);
    }
  }

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

function getBaseUrl(region: "Europe" | "Americas" | "Asia"): string {
  if (region === "Europe") return "https://gameinfo-ams.albiononline.com/api/gameinfo";
  if (region === "Asia") return "https://gameinfo-sgp.albiononline.com/api/gameinfo";
  return "https://gameinfo.albiononline.com/api/gameinfo";
}

export async function searchAlbionPlayer(
  query: string,
  region: "Europe" | "Americas" | "Asia" = "Asia"
): Promise<{ players: PlayerSearchResult[]; guilds: any[] }> {
  if (!query.trim()) return { players: [], guilds: [] };
  const baseUrl = getBaseUrl(region);
  const url = `${baseUrl}/search?q=${encodeURIComponent(query.trim())}`;

  try {
    const data = await executeApiRequest(url);
    const rawPlayers = data.players || [];
    return {
      players: rawPlayers.map((p: any) => ({
        Id: p.Id,
        Name: p.Name,
        GuildId: p.GuildId || undefined,
        GuildName: p.GuildName || undefined,
        AllianceId: p.AllianceId || undefined,
        AllianceName: p.AllianceName || undefined,
        KillFame: p.KillFame || 0,
        DeathFame: p.DeathFame || 0,
        FameRatio: p.FameRatio || 0,
        TotalKills: p.totalKills || 0,
      })),
      guilds: data.guilds || [],
    };
  } catch (err) {
    console.error("[AlbionGameInfoApi] Search error:", err);
    return { players: [], guilds: [] };
  }
}

export async function getPlayerDetails(
  playerId: string,
  region: "Europe" | "Americas" | "Asia" = "Asia"
): Promise<PlayerSearchResult | null> {
  const baseUrl = getBaseUrl(region);
  const url = `${baseUrl}/players/${playerId}`;

  try {
    const data = await executeApiRequest(url);
    const stats = data.LifetimeStatistics || {};
    return {
      Id: data.Id,
      Name: data.Name,
      GuildId: data.GuildId || undefined,
      GuildName: data.GuildName || undefined,
      AllianceId: data.AllianceId || undefined,
      AllianceName: data.AllianceName || undefined,
      KillFame: data.KillFame || 0,
      DeathFame: data.DeathFame || 0,
      FameRatio: data.FameRatio || 0,
      AverageItemPower: data.AverageItemPower || 0,
      PvE: stats.PvE ? {
        Total: stats.PvE.Total || 0,
        Royal: stats.PvE.Royal || 0,
        Outlands: stats.PvE.Outlands || 0,
        Avalon: stats.PvE.Avalon || 0,
        Hellgate: stats.PvE.Hellgate || 0,
        CorruptedDungeon: stats.PvE.CorruptedDungeon || 0,
        Mists: stats.PvE.Mists || 0,
      } : undefined,
      Crafting: stats.Crafting ? { Total: stats.Crafting.Total || 0 } : undefined,
      Gathering: stats.Gathering?.All ? { All: { Total: stats.Gathering.All.Total || 0 } } : undefined,
    };
  } catch (err) {
    console.error("[AlbionGameInfoApi] getPlayerDetails error:", err);
    return null;
  }
}

export async function getPlayerKills(
  playerId: string,
  region: "Europe" | "Americas" | "Asia" = "Asia"
): Promise<KillEvent[]> {
  const baseUrl = getBaseUrl(region);
  const url = `${baseUrl}/players/${playerId}/kills`;

  try {
    const data = await executeApiRequest(url);
    if (!Array.isArray(data)) return [];
    return data.slice(0, 20).map((evt: any) => ({
      EventId: evt.EventId,
      TimeStamp: evt.TimeStamp ? new Date(evt.TimeStamp).toLocaleTimeString() : "Recent",
      Killer: {
        Id: evt.Killer?.Id || "",
        Name: evt.Killer?.Name || "Unknown",
        GuildName: evt.Killer?.GuildName || undefined,
        AverageItemPower: Math.round(evt.Killer?.AverageItemPower || 0),
        Equipment: {
          MainHand: evt.Killer?.Equipment?.MainHand ? { Type: evt.Killer.Equipment.MainHand.Type } : undefined,
          Armor: evt.Killer?.Equipment?.Armor ? { Type: evt.Killer.Equipment.Armor.Type } : undefined,
          Head: evt.Killer?.Equipment?.Head ? { Type: evt.Killer.Equipment.Head.Type } : undefined,
          Shoes: evt.Killer?.Equipment?.Shoes ? { Type: evt.Killer.Equipment.Shoes.Type } : undefined,
        },
      },
      Victim: {
        Id: evt.Victim?.Id || "",
        Name: evt.Victim?.Name || "Unknown",
        GuildName: evt.Victim?.GuildName || undefined,
        AverageItemPower: Math.round(evt.Victim?.AverageItemPower || 0),
        Equipment: {
          MainHand: evt.Victim?.Equipment?.MainHand ? { Type: evt.Victim.Equipment.MainHand.Type } : undefined,
          Armor: evt.Victim?.Equipment?.Armor ? { Type: evt.Victim.Equipment.Armor.Type } : undefined,
          Head: evt.Victim?.Equipment?.Head ? { Type: evt.Victim.Equipment.Head.Type } : undefined,
          Shoes: evt.Victim?.Equipment?.Shoes ? { Type: evt.Victim.Equipment.Shoes.Type } : undefined,
        },
      },
      TotalVictimKillFame: evt.TotalVictimKillFame || 0,
      Location: evt.Location || evt.KillArea || "Open World",
    }));
  } catch (err) {
    console.error("[AlbionGameInfoApi] getPlayerKills error:", err);
    return [];
  }
}
