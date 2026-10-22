import React, { useState, useEffect, useMemo } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { DashboardView } from "./features/dashboard/DashboardView";
import { DamageMeterView } from "./features/damage-meter/DamageMeterView";
import { DungeonView } from "./features/dungeon/DungeonView";
import { ItemSearchView } from "./features/item-search/ItemSearchView";
import { CraftingView } from "./features/crafting/CraftingView";
import { TradeView } from "./features/trade/TradeView";
import { GatheringView } from "./features/gathering/GatheringView";
import { PartyView } from "./features/party/PartyView";
import { GuildView } from "./features/guild/GuildView";
import { StorageView } from "./features/storage/StorageView";
import { MapHistoryView, ZoneHistoryEntry } from "./features/map-history/MapHistoryView";
import { PlayerInfoView } from "./features/player-info/PlayerInfoView";
import { LossExplorerView } from "./features/loss-explorer/LossExplorerView";
import { LoggingView } from "./features/logging/LoggingView";
import { SettingsView } from "./features/settings/SettingsView";
import { 
  NavigationTab, 
  GameStatus, 
  SessionStats, 
  PartyMember, 
  LootItem,
  ServerRegion,
  ChestCategoryData,
  ChestOpenedEvent,
  SessionHistoryPoint,
  SavedSession
} from "./types";


import { useAlbionSocket } from "./hooks/useAlbionSocket";
import { MiniDamageOverlay } from "./components/overlay/MiniDamageOverlay";
import { FirstStartGuideModal } from "./components/setup-wizard/FirstStartGuideModal";

const isDev = import.meta.env.DEV;

const isOverlayStandalone = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("overlay") === "true";

function OverlayStandaloneApp() {
  const [partyMembers, setPartyMembers] = useState<PartyMember[]>([]);

  const { sendCommand } = useAlbionSocket({
    onPartyUpdate: (members) => setPartyMembers(members),
  });

  return (
    <MiniDamageOverlay
      party={partyMembers}
      onClose={() => window.close()}
      onResetCombat={() => sendCommand("RESET_COMBAT")}
      isStandalone={true}
    />
  );
}

const INITIAL_CHESTS_DATA: Record<string, ChestCategoryData> = {
  "Solo Dungeon": {
    category: "Solo Dungeon",
    icon: "/assets/dungeon.png",
    green: 0,
    blue: 0,
    purple: 0,
    gold: 0,
    totalLootValue: 0,
    mapsCount: 0,
  },
  "Standard Dungeon": {
    category: "Standard Dungeon",
    icon: "/assets/static_chest.png",
    green: 0,
    blue: 0,
    purple: 0,
    gold: 0,
    totalLootValue: 0,
    mapsCount: 0,
  },
  "Avalonian Dungeon": {
    category: "Avalonian Dungeon",
    icon: "/assets/ava_chest.png",
    green: 0,
    blue: 0,
    purple: 0,
    gold: 0,
    totalLootValue: 0,
    mapsCount: 0,
  },
  "Static Dungeons": {
    category: "Static Dungeons",
    icon: "/assets/static_chest.png",
    green: 0,
    blue: 0,
    purple: 0,
    gold: 0,
    totalLootValue: 0,
    mapsCount: 0,
  },
  "Ancient Lands": {
    category: "Ancient Lands",
    icon: "/assets/ancient_lands_portal_small.png",
    green: 0,
    blue: 0,
    purple: 0,
    gold: 0,
    totalLootValue: 0,
    mapsCount: 0,
  },
  "Avalonian Roads": {
    category: "Avalonian Roads",
    icon: "/assets/ava_chest.png",
    green: 0,
    blue: 0,
    purple: 0,
    gold: 0,
    totalLootValue: 0,
    mapsCount: 0,
  },
  "Open World": {
    category: "Open World",
    icon: "/assets/openworld_chests.png",
    green: 0,
    blue: 0,
    purple: 0,
    gold: 0,
    totalLootValue: 0,
    mapsCount: 0,
  },
  "Hellgate": {
    category: "Hellgate",
    icon: "/assets/hellgate.png",
    green: 0,
    blue: 0,
    purple: 0,
    gold: 0,
    totalLootValue: 0,
    mapsCount: 0,
  },
  "Corrupted Dungeon": {
    category: "Corrupted Dungeon",
    icon: "/assets/corrupted_dungeon.png",
    green: 0,
    blue: 0,
    purple: 0,
    gold: 0,
    totalLootValue: 0,
    mapsCount: 0,
  },
};

export function App() {
  if (isOverlayStandalone) {
    return <OverlayStandaloneApp />;
  }

  const [currentTab, setCurrentTab] = useState<NavigationTab>("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Initial First Start Guide Wizard state
  const [showSetupWizard, setShowSetupWizard] = useState<boolean>(() => {
    return localStorage.getItem("albiontools_setup_completed") !== "true";
  });

  // Helper to load persistent server choice
  const getInitialServer = (): ServerRegion => {
    return (localStorage.getItem("albiontools_server") as ServerRegion) || "Asia (Singapore)";
  };

  // Live game status state
  const [gameStatus, setGameStatus] = useState<GameStatus>({
    isGameDataLoaded: false,
    isSnifferActive: false,
    isServerDetected: false,
    serverRegion: getInitialServer(),
    isCharacterDetected: false,
    characterName: "Waiting for Albion Online...",
    guildName: undefined,
    allianceName: undefined,
    isLocationDetected: false,
    currentZone: "Not in World",
    zoneTier: "T0",
    zoneDanger: "Blue",
  });

  // Sync settings when modified from SettingsView
  useEffect(() => {
    const handleSettingsChange = (e: any) => {
      if (e.detail?.server) {
        setGameStatus((prev) => ({ ...prev, serverRegion: e.detail.server }));
      }
    };
    window.addEventListener("albiontools_settings_changed", handleSettingsChange);
    return () => window.removeEventListener("albiontools_settings_changed", handleSettingsChange);
  }, []);

  // Session stats state with live timer
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    uptimeSeconds: 0,
    totalFame: 0,
    famePerHour: 0,
    totalSilver: 0,
    silverPerHour: 0,
    reSpecPoints: 0,
    reSpecPerHour: 0,
    might: 0,
    mightPerHour: 0,
    favor: 0,
    favorPerHour: 0,
  });

  // Uptime ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionStats((prev) => {
        if (!gameStatus.isSnifferActive && prev.uptimeSeconds === 0) {
          return prev;
        }
        return {
          ...prev,
          uptimeSeconds: prev.uptimeSeconds + 1,
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStatus.isSnifferActive]);

  // Live party members for DPS meter & Header
  const [partyMembers, setPartyMembers] = useState<PartyMember[]>([]);

  // Live recent loot feed
  const [recentLoot, setRecentLoot] = useState<LootItem[]>([]);

  // Map History State with localStorage persistence
  const [mapHistory, setMapHistory] = useState<ZoneHistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem("albiontools_map_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("albiontools_map_history", JSON.stringify(mapHistory.slice(0, 100)));
    } catch {}
  }, [mapHistory]);

  // Chests Tracking Data
  const [chestsData, setChestsData] = useState<Record<string, ChestCategoryData>>(() => {
    try {
      const saved = localStorage.getItem("albiontools_chests_data");
      return saved ? { ...INITIAL_CHESTS_DATA, ...JSON.parse(saved) } : INITIAL_CHESTS_DATA;
    } catch {
      return INITIAL_CHESTS_DATA;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("albiontools_chests_data", JSON.stringify(chestsData));
    } catch {}
  }, [chestsData]);

  // Active Contents tracked by sniffer in this session
  const [activeContents, setActiveContents] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("albiontools_active_contents");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("albiontools_active_contents", JSON.stringify(activeContents));
    } catch {}
  }, [activeContents]);

  // Saved Sessions persistence
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>(() => {
    try {
      const saved = localStorage.getItem("albiontools_saved_sessions");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedSessionId, setSelectedSessionId] = useState<string>("live");

  const [sessionStartTime, setSessionStartTime] = useState<number>(() => {
    const saved = localStorage.getItem("albiontools_session_start_time");
    if (saved) {
      const t = parseInt(saved, 10);
      if (!isNaN(t)) return t;
    }
    const now = Date.now();
    localStorage.setItem("albiontools_session_start_time", now.toString());
    return now;
  });

  const [resetOnMapChange, setResetOnMapChange] = useState<boolean>(() => {
    return localStorage.getItem("albiontools_reset_on_map_change") === "true";
  });

  useEffect(() => {
    try {
      localStorage.setItem("albiontools_saved_sessions", JSON.stringify(savedSessions));
    } catch {}
  }, [savedSessions]);

  useEffect(() => {
    try {
      localStorage.setItem("albiontools_reset_on_map_change", resetOnMapChange ? "true" : "false");
    } catch {}
  }, [resetOnMapChange]);

  // Session Telemetry History Points
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryPoint[]>(() => {
    try {
      const saved = localStorage.getItem("albiontools_session_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("albiontools_session_history", JSON.stringify(sessionHistory));
    } catch {}
  }, [sessionHistory]);

  // Periodic Telemetry History Sampler
  useEffect(() => {
    const interval = setInterval(() => {
      if (sessionStats.uptimeSeconds > 0 || sessionStats.totalFame > 0 || sessionStats.totalSilver > 0) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setSessionHistory((prev) => {
          if (prev.length > 0 && prev[prev.length - 1].timestamp === timeStr) {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              fame: sessionStats.totalFame,
              silver: sessionStats.totalSilver,
              respec: sessionStats.reSpecPoints,
              might: sessionStats.might,
              favor: sessionStats.favor,
            };
            return updated;
          }
          return [
            ...prev.slice(-30),
            {
              timestamp: timeStr,
              timeSeconds: sessionStats.uptimeSeconds,
              fame: sessionStats.totalFame,
              silver: sessionStats.totalSilver,
              respec: sessionStats.reSpecPoints,
              factionStanding: 0,
              factionPoints: 0,
              might: sessionStats.might,
              favor: sessionStats.favor,
            },
          ];
        });
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [sessionStats]);

  const handleClearMapHistory = () => {
    setMapHistory([]);
    localStorage.removeItem("albiontools_map_history");
  };

  const handleResetSession = () => {
    // If current session had data or activity, archive it to savedSessions
    const hasActivity =
      sessionStats.uptimeSeconds > 5 ||
      sessionStats.totalFame > 0 ||
      sessionStats.totalSilver > 0 ||
      recentLoot.length > 0;

    if (hasActivity) {
      const charName =
        gameStatus.characterName !== "Waiting for Albion Online..."
          ? gameStatus.characterName
          : "Unknown";
      const startDate = new Date(sessionStartTime);
      const sessionName = `${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })} | ${charName} | ${gameStatus.serverRegion || "Live"}`;

      const archived: SavedSession = {
        id: `session_${Date.now()}`,
        name: sessionName,
        startedAt: startDate.toISOString(),
        endedAt: new Date().toISOString(),
        characterName: charName,
        serverLocation: gameStatus.serverRegion,
        durationSeconds: sessionStats.uptimeSeconds,
        stats: { ...sessionStats },
        recentLoot: [...recentLoot],
        chestsData: { ...chestsData },
        activeContents: [...activeContents],
        sessionHistory: [...sessionHistory],
      };
      setSavedSessions((prev) => [archived, ...prev]);
    }

    const now = Date.now();
    setSessionStartTime(now);
    localStorage.setItem("albiontools_session_start_time", now.toString());

    setSessionStats({
      uptimeSeconds: 0,
      totalFame: 0,
      famePerHour: 0,
      totalSilver: 0,
      silverPerHour: 0,
      reSpecPoints: 0,
      reSpecPerHour: 0,
      might: 0,
      mightPerHour: 0,
      favor: 0,
      favorPerHour: 0,
    });
    setRecentLoot([]);
    setChestsData(INITIAL_CHESTS_DATA);
    setActiveContents([]);
    setSessionHistory([]);
    setSelectedSessionId("live");

    localStorage.removeItem("albiontools_chests_data");
    localStorage.removeItem("albiontools_active_contents");
    localStorage.removeItem("albiontools_session_history");
    sendCommand("RESET_SESSION");
  };

  const handleDeleteSession = (id: string) => {
    setSavedSessions((prev) => prev.filter((s) => s.id !== id));
    if (selectedSessionId === id) {
      setSelectedSessionId("live");
    }
  };

  const handleZoneEntered = (zone: { clusterIndex: string; clusterName: string; tier: string; danger: any; enteredAt: string }) => {
    setMapHistory((prev) => {
      if (prev.length > 0) {
        const top = prev[0];
        if (
          top.clusterName.toLowerCase() === zone.clusterName.toLowerCase() ||
          (zone.clusterIndex && top.clusterIndex === zone.clusterIndex)
        ) {
          return prev;
        }

        // Auto reset session on map change if enabled
        if (resetOnMapChange) {
          handleResetSession();
        }
      }

      const enteredTime = new Date(zone.enteredAt).toLocaleTimeString();
      const updated = [...prev];
      if (updated.length > 0 && updated[0].duration === "Active") {
        updated[0] = { ...updated[0], duration: "Visited" };
      }
      return [
        {
          id: `${Date.now()}-${Math.random()}`,
          clusterIndex: zone.clusterIndex,
          clusterName: zone.clusterName,
          tier: zone.tier,
          danger: zone.danger || "Blue",
          enteredAt: enteredTime,
          duration: "Active",
          fameGained: 0,
          silverGained: 0,
          mobKills: 0,
        },
        ...updated,
      ];
    });

    // Detect and classify content type from cluster
    let contentCat = "Open World";
    const zoneName = zone.clusterName || "";
    const danger = zone.danger || "";
    if (zoneName.toLowerCase().includes("random dungeon") || zoneName.toLowerCase().includes("solo")) {
      contentCat = "Solo Dungeon";
    } else if (zoneName.toLowerCase().includes("corrupted")) {
      contentCat = "Corrupted Dungeon";
    } else if (zoneName.toLowerCase().includes("hellgate")) {
      contentCat = "Hellgate";
    } else if (danger === "Mists" || zoneName.toLowerCase().includes("mists") || zoneName.toLowerCase().includes("brecilien")) {
      contentCat = "Ancient Lands";
    } else if (danger === "Avalon" || zoneName.toLowerCase().includes("roads")) {
      contentCat = "Avalonian Roads";
    } else if (zoneName.toLowerCase().includes("avalonian dungeon")) {
      contentCat = "Avalonian Dungeon";
    } else if (zoneName.toLowerCase().includes("static")) {
      contentCat = "Static Dungeons";
    } else if (zoneName.toLowerCase().includes("group dungeon") || zoneName.toLowerCase().includes("expedition")) {
      contentCat = "Standard Dungeon";
    }

    setActiveContents((prev) => (prev.includes(contentCat) ? prev : [...prev, contentCat]));
    setChestsData((prev) => {
      const current = prev[contentCat] || INITIAL_CHESTS_DATA[contentCat];
      if (!current) return prev;
      return {
        ...prev,
        [contentCat]: {
          ...current,
          mapsCount: current.mapsCount + 1,
          lastActive: new Date().toLocaleTimeString(),
        },
      };
    });
  };

  const handleChestOpened = (chest: ChestOpenedEvent) => {
    const cat = chest.category || "Open World";
    const rarity = chest.rarity || "green";
    setChestsData((prev) => {
      const current = prev[cat] || INITIAL_CHESTS_DATA[cat] || {
        category: cat,
        icon: "/assets/openworld_chests.png",
        green: 0,
        blue: 0,
        purple: 0,
        gold: 0,
        totalLootValue: 0,
        mapsCount: 1,
      };
      return {
        ...prev,
        [cat]: {
          ...current,
          [rarity]: current[rarity] + 1,
          lastActive: chest.timestamp || new Date().toLocaleTimeString(),
        },
      };
    });
    setActiveContents((prev) => (prev.includes(cat) ? prev : [...prev, cat]));
  };

  const handleLootReceived = (loot: LootItem) => {
    setRecentLoot((prev) => [loot, ...prev.slice(0, 99)]);
    const isChest = loot.source && (loot.source.toLowerCase().includes("chest") || loot.source.toLowerCase().includes("coffer"));
    if (isChest) {
      const activeCat = activeContents[activeContents.length - 1] || "Solo Dungeon";
      setChestsData((prev) => {
        const current = prev[activeCat] || INITIAL_CHESTS_DATA[activeCat];
        if (!current) return prev;
        return {
          ...prev,
          [activeCat]: {
            ...current,
            totalLootValue: current.totalLootValue + (loot.estimatedValue * loot.amount),
          },
        };
      });
    }
  };

  // Real-time Sniffer Daemon IPC Bridge
  const { sendCommand } = useAlbionSocket({
    onGameStatusUpdate: (status) => setGameStatus((prev) => ({ ...prev, ...status, isSnifferActive: true })),
    onSessionStatsUpdate: (stats) => setSessionStats((prev) => ({ ...prev, ...stats })),
    onPartyUpdate: (members) => {
      const seen = new Set<string>();
      const unique = members.filter((m) => {
        const key = m.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setPartyMembers(unique);
    },
    onLootReceived: handleLootReceived,
    onChestOpened: handleChestOpened,
    onZoneEntered: handleZoneEntered,
  });

  // Active dashboard session aggregation / selection
  const activeDashboardData = useMemo(() => {
    if (selectedSessionId === "live") {
      return {
        stats: sessionStats,
        recentLoot,
        chestsData,
        activeContents,
        sessionHistory,
        isLive: true,
      };
    }

    if (selectedSessionId === "all") {
      const aggregatedStats: SessionStats = {
        uptimeSeconds: sessionStats.uptimeSeconds,
        totalFame: sessionStats.totalFame,
        famePerHour: 0,
        totalSilver: sessionStats.totalSilver,
        silverPerHour: 0,
        reSpecPoints: sessionStats.reSpecPoints,
        reSpecPerHour: 0,
        might: sessionStats.might,
        mightPerHour: 0,
        favor: sessionStats.favor,
        favorPerHour: 0,
      };

      const combinedLoot = [...recentLoot];
      const combinedHistory = [...sessionHistory];
      const allActiveContents = new Set<string>(activeContents);
      const aggregatedChests: Record<string, ChestCategoryData> = JSON.parse(JSON.stringify(chestsData));

      savedSessions.forEach((s) => {
        aggregatedStats.uptimeSeconds += s.durationSeconds || s.stats?.uptimeSeconds || 0;
        aggregatedStats.totalFame += s.stats?.totalFame || 0;
        aggregatedStats.totalSilver += s.stats?.totalSilver || 0;
        aggregatedStats.reSpecPoints += s.stats?.reSpecPoints || 0;
        aggregatedStats.might += s.stats?.might || 0;
        aggregatedStats.favor += s.stats?.favor || 0;

        if (Array.isArray(s.recentLoot)) {
          combinedLoot.push(...s.recentLoot);
        }
        if (Array.isArray(s.activeContents)) {
          s.activeContents.forEach((c) => allActiveContents.add(c));
        }
        if (s.chestsData) {
          Object.keys(s.chestsData).forEach((cat) => {
            if (!aggregatedChests[cat]) {
              aggregatedChests[cat] = { ...s.chestsData[cat] };
            } else {
              aggregatedChests[cat].green += s.chestsData[cat].green || 0;
              aggregatedChests[cat].blue += s.chestsData[cat].blue || 0;
              aggregatedChests[cat].purple += s.chestsData[cat].purple || 0;
              aggregatedChests[cat].gold += s.chestsData[cat].gold || 0;
              aggregatedChests[cat].totalLootValue += s.chestsData[cat].totalLootValue || 0;
              aggregatedChests[cat].mapsCount += s.chestsData[cat].mapsCount || 0;
            }
          });
        }
      });

      const hours = aggregatedStats.uptimeSeconds / 3600;
      if (hours > 0) {
        aggregatedStats.famePerHour = Math.round(aggregatedStats.totalFame / hours);
        aggregatedStats.silverPerHour = Math.round(aggregatedStats.totalSilver / hours);
        aggregatedStats.reSpecPerHour = Math.round(aggregatedStats.reSpecPoints / hours);
        aggregatedStats.mightPerHour = Math.round(aggregatedStats.might / hours);
        aggregatedStats.favorPerHour = Math.round(aggregatedStats.favor / hours);
      }

      return {
        stats: aggregatedStats,
        recentLoot: combinedLoot,
        chestsData: aggregatedChests,
        activeContents: Array.from(allActiveContents),
        sessionHistory: combinedHistory,
        isLive: false,
      };
    }

    const target = savedSessions.find((s) => s.id === selectedSessionId);
    if (target) {
      return {
        stats: target.stats,
        recentLoot: target.recentLoot || [],
        chestsData: target.chestsData || INITIAL_CHESTS_DATA,
        activeContents: target.activeContents || [],
        sessionHistory: target.sessionHistory || [],
        isLive: false,
      };
    }

    return {
      stats: sessionStats,
      recentLoot,
      chestsData,
      activeContents,
      sessionHistory,
      isLive: true,
    };
  }, [selectedSessionId, sessionStats, recentLoot, chestsData, activeContents, sessionHistory, savedSessions]);

  // Render active tab content
  const renderTabContent = () => {
    switch (currentTab) {
      case "dashboard":
        return (
          <DashboardView
            stats={activeDashboardData.stats}
            recentLoot={activeDashboardData.recentLoot}
            onResetSession={handleResetSession}
            gameStatus={gameStatus}
            mapHistory={mapHistory}
            chestsData={activeDashboardData.chestsData}
            activeContents={activeDashboardData.activeContents}
            sessionHistory={activeDashboardData.sessionHistory}
            savedSessions={savedSessions}
            selectedSessionId={selectedSessionId}
            onSelectSession={setSelectedSessionId}
            onDeleteSession={handleDeleteSession}
            resetOnMapChange={resetOnMapChange}
            onToggleResetOnMapChange={setResetOnMapChange}
            isLiveSession={activeDashboardData.isLive}
          />
        );
      case "damage-meter":
        return <DamageMeterView party={partyMembers} onResetCombat={() => sendCommand("RESET_COMBAT")} />;
      case "dungeon":
        return <DungeonView />;
      case "item-search":
        return <ItemSearchView onNavigateToTrade={() => setCurrentTab("trade")} />;
      case "crafting":
        return <CraftingView />;
      case "trade":
        return <TradeView />;
      case "gathering":
        return <GatheringView />;
      case "party":
        return <PartyView party={partyMembers} onUpdateParty={setPartyMembers} />;
      case "guild":
        return <GuildView guildName={gameStatus.guildName} allianceName={gameStatus.allianceName} />;
      case "storage":
        return <StorageView />;
      case "map-history":
        return <MapHistoryView history={mapHistory} onClearHistory={handleClearMapHistory} />;
      case "player-info":
        return <PlayerInfoView />;
      case "loss-explorer":
        return <LossExplorerView />;
      case "logging":
        return <LoggingView />;
      case "settings":
        return <SettingsView />;
      default:
        return (
          <DashboardView
            stats={activeDashboardData.stats}
            recentLoot={activeDashboardData.recentLoot}
            onResetSession={handleResetSession}
            gameStatus={gameStatus}
            mapHistory={mapHistory}
            chestsData={activeDashboardData.chestsData}
            activeContents={activeDashboardData.activeContents}
            sessionHistory={activeDashboardData.sessionHistory}
            savedSessions={savedSessions}
            selectedSessionId={selectedSessionId}
            onSelectSession={setSelectedSessionId}
            onDeleteSession={handleDeleteSession}
            resetOnMapChange={resetOnMapChange}
            onToggleResetOnMapChange={setResetOnMapChange}
            isLiveSession={activeDashboardData.isLive}
          />
        );
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#080B11] text-slate-100 font-['Inter']">
      {/* Top Main Navigation & Status Header */}
      <Header
        status={gameStatus}
        stats={sessionStats}
        party={partyMembers}
      />

      {/* Main App Body with Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          dungeonTimerActive={true}
        />

        <main className="flex-1 bg-[#080B11] overflow-hidden relative">
          {renderTabContent()}

          {/* Initial First Start Setup Wizard */}
          {showSetupWizard && (
            <FirstStartGuideModal
              isOpen={showSetupWizard}
              onComplete={(settings) => {
                setShowSetupWizard(false);
                setGameStatus((prev) => ({
                  ...prev,
                  serverRegion: settings.serverRegion,
                }));
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
