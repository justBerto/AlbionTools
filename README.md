# 🛡️ AlbionTools — Companion & Telemetry Suite

<p align="center">
  <img src="public/assets/albion_icon.png" width="160" height="160" alt="AlbionTools Logo" />
</p>

<p align="center">
  <strong>A modern, ultra-fast, and lightweight companion application for Albion Online players.</strong>
  <br />
  Real-time telemetry, live combat DPS meter with a floating always-on-top HUD, comprehensive dungeon analytics, market tracking, and gathering statistics.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-2.0-blue?logo=tauri" alt="Tauri 2.0" />
  <img src="https://img.shields.io/badge/React-19-61dafb?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178c6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Platform-Windows-0078d7?logo=windows" alt="Platform Windows" />
</p>

---

## 📖 Origin & Attribution

This project is a modern ground-up rebuild of the renowned open-source companion tool **[AlbionOnline-StatisticsAnalysis](https://github.com/Triky313/AlbionOnline-StatisticsAnalysis)** created by **[Triky313](https://github.com/Triky313)**.

* **Original Upstream Project:** [Triky313/AlbionOnline-StatisticsAnalysis](https://github.com/Triky313/AlbionOnline-StatisticsAnalysis)
* **Goal of this Rebuild:** Porting the classic C# WPF architecture to a high-performance **Tauri 2.0 + React 19 + TypeScript** stack for near-instant boot times, minimal RAM footprint, and modern desktop features like a true floating always-on-top Mini HUD overlay.

---

## ✨ Features Overview

### 1. 📊 Telemetry Dashboard
* **Real-Time KPI Cards**: Total Fame, ReSpec Points (Fame Credits), Silver, Might, Favor, and active session duration.
* **Top Fame Sources**: Breakdown and percentage progress bars ranking fame gained from Open World, Solo Dungeons, Corrupted Dungeons, The Mists, and Hellgates.
* **Top Silver Sources**: Breakdown of silver gained from Chests, Mob Drops, Silver Bags, and Market sales.
* **Looted Chests Matrix**: Tracking looted chests categorized by tier rarity (Standard/Green, Uncommon/Blue, Rare/Purple, Legendary/Gold) across all dungeon and open-world content types.
* **Faction Warfare**: Dedicated standing and points progression for Bridgewatch, Martlock, Lymhurst, Fort Sterling, Thetford, and Caerleon.
* **Session Activity History**: Hourly progression breakdown.

### 2. 🏰 Dungeons Suite
* **Content Categories**: Solo Random Dungeons, Corrupted Dungeons, Hellgates (2v2 / 5v5), Mists Dungeons, Abyssal Depths, and Group Dungeons.
* **Profitability Analytics**: Automated detection of your *Most Profitable Tier/Enchantment* (Loot/h), *Most Played Tier*, *Top Valuable Drop*, and *Best Dungeon Map Location*.
* **Run Efficiency Matrix**: Visual score comparing Loot vs. Fame vs. Run Duration per tier.
* **Solo Dungeon Entrance 90s Despawn Timer**: Audio alert chime and visual countdown notifying you when the entrance portal safely closes behind you.
* **Content Run Logs**: Recorded history with Tier.Enchant, zone, duration, fame, silver, loot value, chest counts, and deaths.

### 3. ⚔️ Live Combat Tracker & Floating Mini HUD
* **Damage Meter**: Party DPS, HPS (Healing), and Damage Taken with player contribution percentage bars.
* **Ability Inspection**: Detailed spell breakdown per player (Q, W, E, Auto Attack damage, hits, crit rates).
* **Floating In-Game HUD**: Frameless, always-on-top draggable window that floats directly above Albion Online without interrupting gameplay.
* **Discord Report Export**: 1-click clipboard export formatted for Discord guild raid channels.

### 4. 🌲 Gathering, Crafting & Economy
* **Gathering Telemetry**: Node yield tracking, bonus yield (gear & pork pie), fame gained, and estimated silver value per hour for Wood, Ore, Hide, Fiber, Stone, and Fishing.
* **Crafting & Focus**: Focus point efficiency calculator, resource return rates, and crafting cost simulations.
* **Item Database**: Offline search of Albion Online items, tiers, enchantments, and qualities.
* **Market & Trade**: Real-time market monitoring and price discrepancy analysis.
* **Storage History**: Historical inventory snapshots across personal banks and guild vaults.

### 5. 🧙 First Start Setup Wizard
When you launch the application for the first time, a guided initial setup wizard helps you configure:
1. **Language Selection** (Bahasa Indonesia, English, Deutsch, Русский).
2. **Albion Online Game Folder** (One-click presets for Steam and Native Standalone client paths).
3. **Default Game Server** (Asia / Singapore, Europe / Amsterdam, Americas / Washington).
4. **Packet Capture Provider** (Npcap driver guidance).

---

## 📥 Installation

Download the latest release for Windows from the **[Releases](../../releases)** tab:

* **`AlbionTools_x.x.x_x64-setup.exe` (NSIS Installer)**: Recommended for most users. Includes a desktop shortcut and language setup.
* **`AlbionTools_x.x.x_x64.msi` (Windows Installer)**: Standard MSI installer package.

### Prerequisites:
* **Npcap**: For live packet capturing without high CPU usage, install the official [Npcap Driver](https://npcap.com/#download) (Select *"Install Npcap in WinPcap API-compatible Mode"* during installation).

---

## 🛠️ Building from Source

### Prerequisites
1. **Node.js** (v20 or higher) & **npm**
2. **Rust** (stable toolchain)
3. **Visual Studio C++ Build Tools** (with Desktop development with C++)

### Steps
```bash
# 1. Clone the repository
git clone https://github.com/your-username/AlbionTools.git
cd AlbionTools/AlbionTools

# 2. Install dependencies
npm install

# 3. Run in development mode (with live hot-reload)
npm run tauri dev

# 4. Build production installer (.exe and .msi)
npm run tauri build
```

The compiled installer will be located in:
`src-tauri/target/release/bundle/nsis/` and `src-tauri/target/release/bundle/msi/`.

---

## 🔒 Security & Privacy

AlbionTools operates strictly via **passive local network packet inspection** (reading incoming/outgoing UDP Photon packets on ports 5055/5056) and does **not** inject code, modify memory, or alter Albion Online game files in any way.

---

## 📜 License & Credits

* Rebuilt by the AlbionTools contributors.
* Original application concept, reverse engineering, and WPF architecture by **[Triky313](https://github.com/Triky313)** ([AlbionOnline-StatisticsAnalysis](https://github.com/Triky313/AlbionOnline-StatisticsAnalysis)).
* Albion Online is a registered trademark of Sandbox Interactive GmbH.
