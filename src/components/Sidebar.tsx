import React from "react";
import { 
  LayoutDashboard, 
  Swords, 
  Clock, 
  Search, 
  Scale, 
  Hammer, 
  Pickaxe, 
  Users, 
  ShieldAlert, 
  Package, 
  Map, 
  UserCheck, 
  Skull, 
  Terminal, 
  Settings,
  ChevronLeft,
  ChevronRight,
  HeartHandshake
} from "lucide-react";
import { NavigationTab } from "../types";

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  dungeonTimerActive?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  dungeonTimerActive = false,
}) => {
  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "damage-meter", label: "Damage Meter", icon: <Swords className="w-4 h-4" />, badge: "LIVE" },
    { id: "dungeon", label: "Dungeons", icon: <Clock className="w-4 h-4" />, badge: dungeonTimerActive ? "90s" : undefined },
    { id: "item-search", label: "Item Database", icon: <Search className="w-4 h-4" /> },
    { id: "crafting", label: "Crafting & Focus", icon: <Hammer className="w-4 h-4" /> },
    { id: "trade", label: "Market & Trade", icon: <Scale className="w-4 h-4" /> },
    { id: "gathering", label: "Gathering Stats", icon: <Pickaxe className="w-4 h-4" /> },
    { id: "party", label: "Party & Split", icon: <Users className="w-4 h-4" /> },
    { id: "guild", label: "Guild & GvG", icon: <ShieldAlert className="w-4 h-4" /> },
    { id: "storage", label: "Storage History", icon: <Package className="w-4 h-4" /> },
    { id: "map-history", label: "Map History", icon: <Map className="w-4 h-4" /> },
    { id: "player-info", label: "Player & Killboard", icon: <UserCheck className="w-4 h-4" /> },
    { id: "loss-explorer", label: "Loss Explorer", icon: <Skull className="w-4 h-4" /> },
    { id: "logging", label: "Event Logger", icon: <Terminal className="w-4 h-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className={`h-[calc(100vh-80px)] bg-[#0A0E18] border-r border-slate-800/80 flex flex-col justify-between transition-all duration-200 select-none ${
      isCollapsed ? 'w-16' : 'w-56'
    }`}>
      {/* Navigation List */}
      <div className="flex-1 py-3 px-2 overflow-y-auto space-y-1">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium transition-all group relative ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500/15 to-transparent text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <div className={`transition-colors ${isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                {item.icon}
              </div>

              {!isCollapsed && (
                <span className="flex-1 text-left truncate font-medium">
                  {item.label}
                </span>
              )}

              {!isCollapsed && item.badge && (
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                  item.badge === 'LIVE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  item.badge === '90s' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-slate-800 text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}

              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-amber-400 shadow-lg shadow-amber-500/50" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Area: Collapse button & Fork Credits */}
      <div className="p-2 border-t border-slate-800/60 space-y-2">
        {!isCollapsed && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-2.5 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between text-slate-300 font-medium">
              <span className="flex items-center gap-1.5 text-amber-400">
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Open Source Fork</span>
              </span>
              <span className="text-[10px] text-slate-500">GPL-3.0</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Rebuilt from <a href="https://github.com/Triky313/AlbionOnline-StatisticsAnalysis" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">Triky313's project</a> for modern performance.
            </p>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
