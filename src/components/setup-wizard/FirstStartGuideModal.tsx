import React, { useState } from "react";
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  FolderSearch, 
  Globe, 
  Server, 
  Cpu, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { ServerRegion } from "../../types";

interface FirstStartGuideModalProps {
  isOpen: boolean;
  onComplete: (settings: {
    language: string;
    gameFolder: string;
    serverRegion: ServerRegion;
    packetProvider: "npcap" | "sockets";
  }) => void;
  onClose?: () => void;
}

export const FirstStartGuideModal: React.FC<FirstStartGuideModalProps> = ({
  isOpen,
  onComplete,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 4;

  const [language, setLanguage] = useState<string>(() => localStorage.getItem("albiontools_language") || "en");
  const [gameFolder, setGameFolder] = useState<string>(
    () => localStorage.getItem("albiontools_game_folder") || "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Albion Online\\game"
  );
  const [serverRegion, setServerRegion] = useState<ServerRegion>(
    () => (localStorage.getItem("albiontools_server") as ServerRegion) || "Asia (Singapore)"
  );
  const [packetProvider, setPacketProvider] = useState<"npcap" | "sockets">(
    () => (localStorage.getItem("albiontools_packet_provider") as any) || "npcap"
  );

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem("albiontools_setup_completed", "true");
      localStorage.setItem("albiontools_game_folder", gameFolder);
      localStorage.setItem("albiontools_server", serverRegion);
      localStorage.setItem("albiontools_language", language);
      localStorage.setItem("albiontools_packet_provider", packetProvider);
      onComplete({ language, gameFolder, serverRegion, packetProvider });
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const setPresetPath = (type: "steam" | "standalone") => {
    if (type === "steam") {
      setGameFolder("C:\\Program Files (x86)\\Steam\\steamapps\\common\\Albion Online\\game");
    } else {
      setGameFolder("C:\\Program Files\\AlbionOnline\\game");
    }
  };

  const isId = language === "id";

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0B0F19] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-['Inter']">
        {/* Wizard Header */}
        <div className="h-16 px-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/assets/albion_icon.png" 
              alt="AlbionTools" 
              className="w-8 h-8 object-contain drop-shadow" 
            />
            <div>
              <h2 className="text-base font-bold text-slate-100 font-['Outfit']">
                AlbionTools — Initial Setup Wizard
              </h2>
              <p className="text-xs text-slate-400">
                {isId
                  ? `Langkah ${currentStep} dari ${totalSteps}: Konfigurasi Awal Aplikasi`
                  : `Step ${currentStep} of ${totalSteps}: Initial Application Setup`}
              </p>
            </div>
          </div>

          {/* Step Pill Indicators */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentStep === step
                    ? "w-7 bg-amber-400"
                    : currentStep > step
                    ? "w-2 bg-emerald-500"
                    : "w-2 bg-slate-800"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Wizard Step Body */}
        <div className="p-6 space-y-6 flex-1 min-h-[380px] flex flex-col justify-between">
          {/* STEP 1: LANGUAGE SELECTION */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">
                  {isId ? "Pilih Bahasa Antarmuka / Language" : "Select Interface Language"}
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isId
                  ? "Pilih bahasa default untuk tampilan menu, statistik, dan navigasi AlbionTools. Anda dapat mengubahnya kapan saja melalui menu Pengaturan."
                  : "Choose the default language for AlbionTools menus, statistics, and navigation. You can change this anytime via the Settings menu."}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  { id: "en", label: "English", sub: "Global Language (Default)", flag: "EN" },
                  { id: "id", label: "Bahasa Indonesia", sub: "Indonesian", flag: "ID" },
                  { id: "de", label: "Deutsch", sub: "German", flag: "DE" },
                  { id: "ru", label: "Русский", sub: "Russian", flag: "RU" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setLanguage(item.id)}
                    className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      language === item.id
                        ? "bg-amber-500/10 border-amber-500/50 shadow-sm"
                        : "bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-sm text-slate-200">{item.label}</div>
                      <div className="text-[11px] text-slate-400">{item.sub}</div>
                    </div>
                    {language === item.id && (
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: ALBION INSTALLATION FOLDER */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FolderSearch className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">
                  {isId ? "Lokasi Folder Instalasi Albion Online" : "Albion Online Installation Directory"}
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isId
                  ? "AlbionTools membutuhkan akses folder /game untuk memverifikasi file biner dan sinkronisasi manifest data permainan. Pilih versi client yang Anda gunakan:"
                  : "AlbionTools requires access to your /game folder to verify game binaries and synchronize game manifest data. Select the client version you use:"}
              </p>

              {/* Tutorial / Visual Guide from Upstream */}
              <div className="grid grid-cols-2 gap-4">
                {/* Standalone Tutorial Card */}
                <div 
                  onClick={() => setPresetPath("standalone")}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    gameFolder.includes("AlbionOnline\\game") && !gameFolder.includes("Steam")
                      ? "bg-amber-500/10 border-amber-500/50"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-200">Standalone Native Launcher</span>
                    {gameFolder.includes("AlbionOnline\\game") && !gameFolder.includes("Steam") && (
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <img 
                    src="/assets/preparation_folder.png" 
                    alt="Standalone Client" 
                    className="w-full h-24 object-contain rounded-lg bg-slate-950/60 p-1 border border-slate-800/80 mb-2" 
                  />
                  <div className="text-[10px] text-slate-400 truncate font-mono">
                    C:\Program Files\AlbionOnline\game
                  </div>
                </div>

                {/* Steam Tutorial Card */}
                <div 
                  onClick={() => setPresetPath("steam")}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    gameFolder.includes("Steam")
                      ? "bg-amber-500/10 border-amber-500/50"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-200">Steam Client Launcher</span>
                    {gameFolder.includes("Steam") && (
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <img 
                    src="/assets/preparation_folder_steam.png" 
                    alt="Steam Client" 
                    className="w-full h-24 object-contain rounded-lg bg-slate-950/60 p-1 border border-slate-800/80 mb-2" 
                  />
                  <div className="text-[10px] text-slate-400 truncate font-mono">
                    ...\steamapps\common\Albion Online\game
                  </div>
                </div>
              </div>

              {/* Path Input Field */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-slate-300">
                  {isId ? "Path Direktori Terpilih:" : "Selected Directory Path:"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={gameFolder}
                    onChange={(e) => setGameFolder(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                    placeholder={isId ? "Contoh: C:\\Program Files\\AlbionOnline\\game" : "Example: C:\\Program Files\\AlbionOnline\\game"}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: DEFAULT SERVER REGION */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">
                  {isId ? "Pilih Server Default Albion Online" : "Select Default Game Server"}
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isId
                  ? "Pilih server utama tempat karakter Anda bermain untuk mengarahkan port sniffer dan kalkulator market:"
                  : "Choose your primary server realm to route network sniffer ports and market price analysis:"}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {[
                  {
                    id: "Asia (Singapore)" as ServerRegion,
                    title: "Asia Server",
                    city: "Singapore",
                    flag: "SG",
                    desc: "Albion East / Asia",
                  },
                  {
                    id: "Europe (Amsterdam)" as ServerRegion,
                    title: "Europe Server",
                    city: "Amsterdam",
                    flag: "EU",
                    desc: "Albion Europe",
                  },
                  {
                    id: "Americas (Washington)" as ServerRegion,
                    title: "Americas Server",
                    city: "Washington",
                    flag: "US",
                    desc: "Albion West / Americas",
                  },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setServerRegion(s.id)}
                    className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      serverRegion === s.id
                        ? "bg-amber-500/10 border-amber-500/50 shadow-sm"
                        : "bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-100">{s.title}</span>
                      {serverRegion === s.id && <Check className="w-4 h-4 text-amber-400" />}
                    </div>
                    <div className="text-xs font-semibold text-amber-400">{s.city}</div>
                    <div className="text-[11px] text-slate-400 mt-1">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: PACKET PROVIDER & NPCAP */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">
                  {isId ? "Metode Penyadapan Paket Jaringan (Sniffer Driver)" : "Network Packet Sniffing Driver"}
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isId
                  ? "AlbionTools membaca event permainan menggunakan penyadapan paket Photon UDP. Untuk kestabilan tertinggi dan zero latency, sangat disarankan memasang driver Npcap."
                  : "AlbionTools decodes live game events by monitoring Photon UDP packets. For maximum stability and zero latency, installing the Npcap driver is highly recommended."}
              </p>

              <div className="space-y-3 pt-1">
                <div
                  onClick={() => setPacketProvider("npcap")}
                  className={`p-3.5 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
                    packetProvider === "npcap"
                      ? "bg-amber-500/10 border-amber-500/50"
                      : "bg-slate-900/60 border-slate-800"
                  }`}
                >
                  <input
                    type="radio"
                    name="provider"
                    checked={packetProvider === "npcap"}
                    onChange={() => setPacketProvider("npcap")}
                    className="mt-1 text-amber-500 cursor-pointer"
                  />
                  <div className="flex-1 text-xs">
                    <div className="font-bold text-slate-100 flex items-center gap-2">
                      <span>{isId ? "Npcap Packet Driver (Sangat Direkomendasikan)" : "Npcap Packet Driver (Highly Recommended)"}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                        BEST PERFORMANCE
                      </span>
                    </div>
                    <p className="text-slate-400 mt-1">
                      {isId
                        ? "Membaca paket UDP secara instan tanpa membebani CPU. Jika belum terpasang di Windows Anda, Anda dapat mengunduhnya secara gratis."
                        : "Captures UDP packets with zero CPU overhead. If not installed on your system, you can download it for free."}
                    </p>
                    <a
                      href="https://npcap.com/#download"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 mt-2 font-medium"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>{isId ? "Unduh Npcap Installer Resmi (npcap.com)" : "Download Official Npcap Installer (npcap.com)"}</span>
                    </a>
                  </div>
                </div>

                <div
                  onClick={() => setPacketProvider("sockets")}
                  className={`p-3.5 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
                    packetProvider === "sockets"
                      ? "bg-amber-500/10 border-amber-500/50"
                      : "bg-slate-900/60 border-slate-800"
                  }`}
                >
                  <input
                    type="radio"
                    name="provider"
                    checked={packetProvider === "sockets"}
                    onChange={() => setPacketProvider("sockets")}
                    className="mt-1 text-amber-500 cursor-pointer"
                  />
                  <div className="flex-1 text-xs">
                    <div className="font-bold text-slate-100">
                      Raw Socket Telemetry (Fallback)
                    </div>
                    <p className="text-slate-400 mt-1">
                      {isId
                        ? "Menggunakan Windows socket bawaan tanpa driver eksternal. Mode ini membutuhkan aplikasi dijalankan sebagai Administrator pada sebagian sistem."
                        : "Uses built-in Windows raw sockets without external drivers. May require running as Administrator on some systems."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Wizard Footer Controls */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                currentStep === 1
                  ? "text-slate-600 bg-slate-900/30 cursor-not-allowed"
                  : "text-slate-300 hover:text-slate-100 bg-slate-900 hover:bg-slate-800 border border-slate-700/60"
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>{isId ? "Sebelumnya" : "Back"}</span>
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-amber-950/40"
            >
              <span>
                {currentStep === totalSteps
                  ? isId ? "Selesai & Buka Aplikasi" : "Finish & Launch AlbionTools"
                  : isId ? "Lanjutkan" : "Continue"}
              </span>
              {currentStep === totalSteps ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
