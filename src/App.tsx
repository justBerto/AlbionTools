import React, { useState, useEffect } from "react";
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
import { MapHistoryView } from "./features/map-history/MapHistoryView";
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
  ServerRegion 
} from "./types";


import { useAlbionSocket } from "./hooks/useAlbionSocket";
import { MiniDamageOverlay } from "./components/overlay/MiniDamageOverlay";
import { FirstStartGuideModal } from "./components/setup-wizard/FirstStartGuideModal";

const isDev = import.meta.env.DEV;

const isOverlayStandalone = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("overlay") === "true";

function OverlayStandaloneApp() {
  const [partyMembers, setPartyMembers] = useState<PartyMember[]>([]);

  useAlbionSocket({
    onPartyUpdate: (members) => setPartyMembers(members),
  });

  return (
    <MiniDamageOverlay
      party={partyMembers}
      onClose={() => window.close()}
      isStandalone={true}
    />
  );
}

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

  // Uptime ticker (only counts when sniffer is actively receiving game data)
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

  // Real-time Sniffer Daemon IPC Bridge
  useAlbionSocket({
    onGameStatusUpdate: (status) => setGameStatus((prev) => ({ ...prev, ...status, isSnifferActive: true })),
    onSessionStatsUpdate: (stats) => setSessionStats((prev) => ({ ...prev, ...stats })),
    onPartyUpdate: (members) => setPartyMembers(members),
    onLootReceived: (loot) => setRecentLoot((prev) => [loot, ...prev.slice(0, 49)]),
  });

  // Render active tab content
  const renderTabContent = () => {
    switch (currentTab) {
      case "dashboard":
        return <DashboardView stats={sessionStats} recentLoot={recentLoot} />;
      case "damage-meter":
        return <DamageMeterView party={partyMembers} />;
      case "dungeon":
        return <DungeonView />;
      case "item-search":
        return <ItemSearchView />;
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
        return <MapHistoryView />;
      case "player-info":
        return <PlayerInfoView />;
      case "loss-explorer":
        return <LossExplorerView />;
      case "logging":
        return <LoggingView />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardView stats={sessionStats} recentLoot={recentLoot} />;
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
