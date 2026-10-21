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

export function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Initial First Start Guide Wizard state
  const [showSetupWizard, setShowSetupWizard] = useState<boolean>(() => {
    return localStorage.getItem("albiontools_setup_completed") !== "true";
  });

  // Standalone floating overlay window check (Tauri or popout window)
  const isOverlayStandalone = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("overlay") === "true";

  // Helper to load persistent server choice
  const getInitialServer = (): ServerRegion => {
    return (localStorage.getItem("albiontools_server") as ServerRegion) || "Asia (Singapore)";
  };

  // Live game status state
  const [gameStatus, setGameStatus] = useState<GameStatus>(
    isDev
      ? {
          isGameDataLoaded: true,
          isSnifferActive: true,
          isServerDetected: true,
          serverRegion: getInitialServer(),
          isCharacterDetected: true,
          characterName: "LordAlbion",
          guildName: "Black Rose Vanguard",
          allianceName: "ROSE",
          isLocationDetected: true,
          currentZone: "Deathstone Valley",
          zoneTier: "Tier 7",
          zoneDanger: "Black",
        }
      : {
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
        }
  );

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
  const [sessionStats, setSessionStats] = useState<SessionStats>(
    isDev
      ? {
          uptimeSeconds: 3840, // 01:04:00
          totalFame: 1_840_500,
          famePerHour: 1_725_000,
          totalSilver: 620_000,
          silverPerHour: 581_000,
          reSpecPoints: 124_000,
          reSpecPerHour: 116_000,
          might: 4_250,
          mightPerHour: 3_980,
          favor: 2_100,
          favorPerHour: 1_960,
        }
      : {
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
        }
  );

  // Uptime ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionStats((prev) => {
        if (!isDev && !gameStatus.isSnifferActive && prev.uptimeSeconds === 0) {
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
  const [partyMembers, setPartyMembers] = useState<PartyMember[]>(isDev ? [
    {
      id: "1",
      name: "LordAlbion",
      guild: "Black Rose Vanguard",
      currentHp: 3850,
      maxHp: 3850,
      dps: 1845,
      damagePercentage: 38.4,
      hps: 0,
      role: "DPS",
    },
    {
      id: "2",
      name: "ValkyrieHeals",
      guild: "Black Rose Vanguard",
      currentHp: 2900,
      maxHp: 2900,
      dps: 120,
      damagePercentage: 2.5,
      hps: 1250,
      role: "Healer",
    },
    {
      id: "3",
      name: "IronBastion",
      guild: "Black Rose Vanguard",
      currentHp: 5200,
      maxHp: 5200,
      dps: 450,
      damagePercentage: 9.4,
      hps: 0,
      role: "Tank",
    },
    {
      id: "4",
      name: "ShadowStrike",
      guild: "Black Rose Vanguard",
      currentHp: 3100,
      maxHp: 3100,
      dps: 1420,
      damagePercentage: 29.5,
      hps: 0,
      role: "DPS",
    },
    {
      id: "5",
      name: "FrostArchon",
      guild: "Black Rose Vanguard",
      currentHp: 2850,
      maxHp: 2850,
      dps: 975,
      damagePercentage: 20.2,
      hps: 80,
      role: "Support",
    },
  ] : []);

  // Live recent loot feed
  const [recentLoot, setRecentLoot] = useState<LootItem[]>(isDev ? [
    {
      id: "1",
      itemId: "T8_MAIN_SWORD",
      name: "Elder's Broadsword",
      tier: 8,
      enchantment: 0,
      quality: 1,
      amount: 1,
      estimatedValue: 245_000,
      source: "Chest",
      timestamp: "10:14:22",
      looterName: "LordAlbion",
    },
    {
      id: "2",
      itemId: "T7_ARMOR_CLOTH_SET3@1",
      name: "Grandmaster's Cultist Robe",
      tier: 7,
      enchantment: 1,
      quality: 2,
      amount: 1,
      estimatedValue: 180_000,
      source: "Mob",
      timestamp: "10:12:05",
      looterName: "ShadowStrike",
    },
    {
      id: "3",
      itemId: "T6_POTION_COOLDOWN",
      name: "Master's Major Energy Potion",
      tier: 6,
      enchantment: 0,
      quality: 1,
      amount: 5,
      estimatedValue: 6_200,
      source: "Chest",
      timestamp: "10:08:44",
      looterName: "ValkyrieHeals",
    },
    {
      id: "4",
      itemId: "T8_CLOTH",
      name: "Elder's Cloth",
      tier: 8,
      enchantment: 0,
      quality: 1,
      amount: 12,
      estimatedValue: 8_500,
      source: "Chest",
      timestamp: "10:04:19",
      looterName: "LordAlbion",
    },
  ] : []);

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

  // If this window was launched specifically as a floating overlay, render only the HUD
  if (isOverlayStandalone) {
    return (
      <MiniDamageOverlay
        party={partyMembers}
        onClose={() => window.close()}
        isStandalone={true}
      />
    );
  }

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
