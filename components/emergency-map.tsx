"use client";

import React, { useState, useEffect } from "react";

interface CAPAlertItem {
  id: string;
  type: "AVALANCHE" | "THUNDERSTORM" | "MODERATE_THUNDERSTORM" | "LIGHT_THUNDERSTORM" | "LIGHT_RAIN" | "FLOOD_ALERT";
  title: string;
  districts: string;
  severity: "HIGHEST" | "HIGH" | "MODERATE" | "LOW" | "ADVISORY";
  icon: string;
  badgeBg: string;
  badgeText: string;
  topPct: string;
  leftPct: string;
  locationName: string;
}

const sampleCapAlerts: CAPAlertItem[] = [
  {
    id: "CAP-01",
    type: "THUNDERSTORM",
    title: "Thunderstorm with Lightning",
    districts: "Haora, Jhargram, Pashchim Medinipur, Purba Medinipur",
    severity: "LOW",
    icon: "🌩️⚡",
    badgeBg: "bg-[#FEF08A]",
    badgeText: "text-[#1F2A44]",
    topPct: "52%",
    leftPct: "62%",
    locationName: "West Bengal Coast",
  },
  {
    id: "CAP-02",
    type: "MODERATE_THUNDERSTORM",
    title: "Moderate Thunderstorms with surface wind",
    districts: "Balod, Balodabazar, Bemetara, Bilaspur, Dhamtari",
    severity: "MODERATE",
    icon: "💨⛈️",
    badgeBg: "bg-[#FDBA74]",
    badgeText: "text-[#1F2A44]",
    topPct: "58%",
    leftPct: "50%",
    locationName: "Chhattisgarh Sector",
  },
  {
    id: "CAP-03",
    type: "LIGHT_THUNDERSTORM",
    title: "Light Thunderstorm with surface wind",
    districts: "5 districts of West Bengal",
    severity: "LOW",
    icon: "🌦️",
    badgeBg: "bg-[#FEF08A]",
    badgeText: "text-[#1F2A44]",
    topPct: "45%",
    leftPct: "66%",
    locationName: "North Bengal",
  },
  {
    id: "CAP-04",
    type: "LIGHT_RAIN",
    title: "Light Rain",
    districts: "Sepahijala district of Tripura",
    severity: "LOW",
    icon: "🌧️",
    badgeBg: "bg-[#FEF08A]",
    badgeText: "text-[#1F2A44]",
    topPct: "54%",
    leftPct: "72%",
    locationName: "Tripura",
  },
  {
    id: "CAP-05",
    type: "MODERATE_THUNDERSTORM",
    title: "Moderate Thunderstorms",
    districts: "MTSL Sector & Odisha Coast",
    severity: "MODERATE",
    icon: "⛈️",
    badgeBg: "bg-[#FDBA74]",
    badgeText: "text-[#1F2A44]",
    topPct: "64%",
    leftPct: "58%",
    locationName: "Odisha Coast",
  },
  {
    id: "CAP-06",
    type: "THUNDERSTORM",
    title: "Thunderstorm with Lightning",
    districts: "Birbhum, Nadia, Purba Bardhaman districts of West Bengal",
    severity: "LOW",
    icon: "⚡☔",
    badgeBg: "bg-[#FEF08A]",
    badgeText: "text-[#1F2A44]",
    topPct: "50%",
    leftPct: "64%",
    locationName: "Gangetic Plain",
  },
  {
    id: "CAP-07",
    type: "LIGHT_RAIN",
    title: "Light Rain",
    districts: "North Tripura district of Tripura",
    severity: "LOW",
    icon: "🌧️",
    badgeBg: "bg-[#FEF08A]",
    badgeText: "text-[#1F2A44]",
    topPct: "51%",
    leftPct: "74%",
    locationName: "North Tripura",
  },
  {
    id: "CAP-08",
    type: "THUNDERSTORM",
    title: "Thunderstorm with Lightning",
    districts: "Gyalshing, Mangan, Namchi, Soreng districts of Sikkim",
    severity: "LOW",
    icon: "🌩️",
    badgeBg: "bg-[#FEF08A]",
    badgeText: "text-[#1F2A44]",
    topPct: "42%",
    leftPct: "65%",
    locationName: "Sikkim",
  },
  {
    id: "CAP-09",
    type: "FLOOD_ALERT",
    title: "Heavy Downpour & Flash Flood Warning",
    districts: "Hyderabad Urban Sector & Begumpet Basin",
    severity: "HIGH",
    icon: "🌊🚨",
    badgeBg: "bg-[#FCA5A5]",
    badgeText: "text-[#1F2A44]",
    topPct: "68%",
    leftPct: "43%",
    locationName: "Hyderabad HQ",
  },
  {
    id: "CAP-10",
    type: "AVALANCHE",
    title: "Glacial Risk & Heavy Snow Avalanche Alert",
    districts: "North Leh, Ladakh & Pir Panjal Sector",
    severity: "HIGHEST",
    icon: "🏔️❄️",
    badgeBg: "bg-[#1F2A44] text-[#E9E7E1] border border-[#E9E7E1]/40",
    badgeText: "text-[#E9E7E1]",
    topPct: "22%",
    leftPct: "34%",
    locationName: "Ladakh Avalanche Zone",
  },
];

export function EmergencyMap() {
  const [activeCapTab, setActiveCapTab] = useState<"LOCATION" | "ALL_INDIA" | "STATE_WISE" | "FORECAST">("ALL_INDIA");
  const [capAlerts, setCapAlerts] = useState<CAPAlertItem[]>(sampleCapAlerts);
  const [selectedCapAlert, setSelectedCapAlert] = useState<CAPAlertItem | null>(sampleCapAlerts[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLegend, setShowLegend] = useState(true);

  const apiBaseUrl = "";

  useEffect(() => {
    // Fetch Live Google Weather Alerts from Spring Boot API proxy
    const fetchLiveAlerts = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/weather/alerts?lat=19.0760&lon=72.8777`);
        if (res.ok) {
          const liveAlerts = await res.json();
          if (Array.isArray(liveAlerts) && liveAlerts.length > 0) {
            const mapped: CAPAlertItem[] = liveAlerts.map((a: { id?: string; severity?: string; title?: string; description?: string; source?: string }, idx: number) => ({
              id: a.id || `LIVE-ALT-${idx}`,
              type: a.severity === "SEVERE" ? "FLOOD_ALERT" : "THUNDERSTORM",
              title: a.title || "Public Weather Advisory",
              districts: a.description || "Coastal & Inland Sectors",
              severity: a.severity === "SEVERE" ? "HIGH" : "MODERATE",
              icon: a.severity === "SEVERE" ? "🌊🚨" : "🌩️⚡",
              badgeBg: a.severity === "SEVERE" ? "bg-[#FCA5A5]" : "bg-[#FDBA74]",
              badgeText: "text-[#1F2A44]",
              topPct: `${50 + (idx * 6)}%`,
              leftPct: `${45 + (idx * 8)}%`,
              locationName: a.source || "IMD Telemetry",
            }));
            setCapAlerts([...mapped, ...sampleCapAlerts]);
            setSelectedCapAlert(mapped[0]);
          }
        }
      } catch {
        console.log("Using static CAP alerts list.");
      }
    };

    fetchLiveAlerts();
  }, [apiBaseUrl]);

  const openGoogleMapsDirections = (lat: number, lng: number) => {
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(googleMapsUrl, "_blank");
  };

  const filteredAlerts = capAlerts.filter(alert =>
    alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    alert.districts.toLowerCase().includes(searchQuery.toLowerCase()) ||
    alert.locationName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="emergency-map-wrapper border border-[#E9E7E1]/20 rounded-2xl overflow-hidden bg-[#1F2A44] text-[#E9E7E1] space-y-3 p-3 sm:p-4 shadow-2xl" suppressHydrationWarning>
      {/* 1. Top 4 Action Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <button
          onClick={() => setActiveCapTab("LOCATION")}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition ${
            activeCapTab === "LOCATION"
              ? "bg-[#E9E7E1] text-[#1F2A44] border-[#E9E7E1] shadow-lg font-black"
              : "bg-[#182137] text-[#E9E7E1] border-[#E9E7E1]/20 hover:bg-[#273452]"
          }`}
        >
          <span className="text-xl mb-1">🎯</span>
          <span className="text-xs font-extrabold uppercase tracking-wider text-center">CURRENT LOCATION CAP ALERT</span>
        </button>

        <button
          onClick={() => setActiveCapTab("ALL_INDIA")}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition ${
            activeCapTab === "ALL_INDIA"
              ? "bg-[#E9E7E1] text-[#1F2A44] border-[#E9E7E1] shadow-lg font-black"
              : "bg-[#182137] text-[#E9E7E1] border-[#E9E7E1]/20 hover:bg-[#273452]"
          }`}
        >
          <span className="text-xl mb-1">🇮🇳</span>
          <span className="text-xs font-extrabold uppercase tracking-wider text-center">ALL INDIA CAP ALERT</span>
        </button>

        <button
          onClick={() => setActiveCapTab("STATE_WISE")}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition ${
            activeCapTab === "STATE_WISE"
              ? "bg-[#E9E7E1] text-[#1F2A44] border-[#E9E7E1] shadow-lg font-black"
              : "bg-[#182137] text-[#E9E7E1] border-[#E9E7E1]/20 hover:bg-[#273452]"
          }`}
        >
          <span className="text-xl mb-1">🔍</span>
          <span className="text-xs font-extrabold uppercase tracking-wider text-center">STATE WISE CAP ALERT</span>
        </button>

        <button
          onClick={() => setActiveCapTab("FORECAST")}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition ${
            activeCapTab === "FORECAST"
              ? "bg-[#E9E7E1] text-[#1F2A44] border-[#E9E7E1] shadow-lg font-black"
              : "bg-[#182137] text-[#E9E7E1] border-[#E9E7E1]/20 hover:bg-[#273452]"
          }`}
        >
          <span className="text-xl mb-1">🌦️</span>
          <span className="text-xs font-extrabold uppercase tracking-wider text-center">FORECAST & RADAR</span>
        </button>
      </div>

      {/* 2. Main Weather Map & Alert List Sidebar Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left Interactive Google Maps Live Viewport (8 Cols) */}
        <div className="lg:col-span-8 bg-[#182137] border border-[#E9E7E1]/20 rounded-2xl overflow-hidden flex flex-col justify-between relative min-h-[520px]">
          {/* Map Top Status Bar */}
          <div className="p-3 bg-[#1F2A44] border-b border-[#E9E7E1]/15 flex flex-wrap items-center justify-between gap-2 z-10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E9E7E1] animate-ping" />
              <span className="text-xs font-black text-[#E9E7E1] uppercase tracking-wider font-mono">
                LIVE IMD / NDMA CAP WEATHER MAP — GOOGLE MAPS ENGINE
              </span>
            </div>

            <div className="relative min-w-[200px]">
              <input
                type="text"
                placeholder="🔍 Search state / district..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#182137] border border-[#E9E7E1]/20 rounded-lg px-3 py-1 text-xs text-[#E9E7E1] placeholder-[#E9E7E1]/50 focus:outline-none focus:border-[#E9E7E1]"
              />
            </div>
          </div>

          {/* Embedded Live Google Maps Viewport Centered on India */}
          <div className="w-full h-full min-h-[460px] relative overflow-hidden">
            <iframe
              title="Google Live Weather CAP Map View"
              src={`https://maps.google.com/maps?q=${
                activeCapTab === "LOCATION"
                  ? "17.4062,78.4772"
                  : selectedCapAlert
                  ? "20.5937,78.9629"
                  : "20.5937,78.9629"
              }&z=${activeCapTab === "LOCATION" ? "12" : "5"}&output=embed`}
              className="w-full h-full min-h-[460px] border-0 filter brightness-95 contrast-110 pointer-events-auto"
              loading="lazy"
              allowFullScreen
            />

            {/* Weather Logos Overlaid on Map */}
            <div className="absolute inset-0 pointer-events-none z-20">
              {capAlerts.map((alertItem) => {
                const isSelected = selectedCapAlert?.id === alertItem.id;
                return (
                  <div
                    key={alertItem.id}
                    style={{ top: alertItem.topPct, left: alertItem.leftPct }}
                    onClick={() => setSelectedCapAlert(alertItem)}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto group transition-all duration-300 ${
                      isSelected ? "scale-125 z-30" : "hover:scale-115 hover:z-25"
                    }`}
                  >
                    <div className="relative flex items-center justify-center">
                      <span className="absolute -inset-1 rounded-full bg-yellow-400/40 animate-ping" />
                      
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xl border backdrop-blur-md transition-all duration-300 ${
                          alertItem.severity === "HIGHEST"
                            ? "bg-[#182137]/95 text-white border-white/60 ring-2 ring-white/20"
                            : alertItem.severity === "HIGH"
                            ? "bg-[#EF4444]/95 text-white border-white/60 ring-2 ring-[#EF4444]/40"
                            : alertItem.severity === "MODERATE"
                            ? "bg-[#F97316]/95 text-white border-white/60 ring-2 ring-[#F97316]/40"
                            : alertItem.severity === "LOW"
                            ? "bg-[#EAB308] text-[#1F2A44] border-black/30 ring-2 ring-[#EAB308]/40 font-black"
                            : "bg-[#22C55E]/95 text-white border-white/60 ring-2 ring-[#22C55E]/40"
                        } ${isSelected ? "scale-125 ring-4 ring-white shadow-2xl z-30" : ""}`}
                      >
                        <span className="text-lg select-none filter drop-shadow-md">
                          {alertItem.icon}
                        </span>
                      </div>

                      <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none whitespace-nowrap bg-[#1F2A44]/95 text-[#E9E7E1] border border-[#E9E7E1]/30 rounded-lg px-2 py-1 text-[11px] shadow-2xl font-bold flex flex-col items-center">
                        <span>{alertItem.title}</span>
                        <span className="text-[9px] text-[#E9E7E1]/70">{alertItem.locationName}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CAP Feed Live Status Badge (Top-Left) */}
            <div className="absolute top-4 left-4 z-20 bg-[#182137]/90 border border-[#E9E7E1]/20 backdrop-blur-md p-2.5 rounded-xl text-xs text-[#E9E7E1] space-y-1 max-w-xs shadow-2xl">
              <div className="flex justify-between items-center gap-3">
                <span className="font-mono font-bold text-[#E9E7E1] text-[11px]">CAP FEED STATUS</span>
                <span className="text-[10px] bg-[#1F2A44] text-[#E9E7E1] px-2 py-0.5 rounded font-bold border border-[#E9E7E1]/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> LIVE CONNECTED
                </span>
              </div>
            </div>

            {/* Map Severity Legend Overlay Box */}
            <div className="absolute bottom-4 left-4 z-30">
              <div className="bg-[#4B5563]/90 dark:bg-[#182137]/95 border border-white/20 backdrop-blur-md p-3 sm:p-4 rounded-xl shadow-2xl space-y-2 min-w-[260px] text-[#E9E7E1]">
                <div className="flex justify-between items-center border-b border-white/10 pb-1.5 mb-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider font-mono text-white">
                    SEVERITY LEGEND
                  </span>
                  <button
                    onClick={() => setShowLegend(!showLegend)}
                    className="text-[10px] text-white/70 hover:text-white font-mono"
                  >
                    {showLegend ? "[Hide]" : "[Show]"}
                  </button>
                </div>

                {showLegend && (
                  <div className="space-y-2 font-sans">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-4 bg-black rounded-xs inline-block border border-white/30 flex-shrink-0" />
                      <span className="text-xs font-bold text-white leading-tight">
                        Highest (In case of Avalanche Alert only)
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-4 bg-[#EF4444] rounded-xs inline-block flex-shrink-0" />
                      <span className="text-xs font-bold text-white leading-tight">
                        High
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-4 bg-[#F97316] rounded-xs inline-block flex-shrink-0" />
                      <span className="text-xs font-bold text-white leading-tight">
                        Moderate
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-4 bg-[#EAB308] rounded-xs inline-block flex-shrink-0" />
                      <span className="text-xs font-bold text-white leading-tight">
                        Low
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-4 bg-[#22C55E] rounded-xs inline-block flex-shrink-0" />
                      <span className="text-xs font-bold text-white leading-tight">
                        Advisory
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right ALERT LIST Sidebar Panel (4 Cols) */}
        <div className="lg:col-span-4 bg-[#182137] border border-[#E9E7E1]/20 rounded-2xl p-3.5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="bg-[#1F2A44] border border-[#E9E7E1]/20 p-2.5 rounded-xl text-center flex justify-between items-center px-4">
              <h3 className="text-sm font-black text-[#E9E7E1] uppercase tracking-wider font-mono">
                ALERT LIST
              </h3>
              <span className="text-xs font-mono font-bold bg-[#E9E7E1] text-[#1F2A44] px-2 py-0.5 rounded-full">
                {filteredAlerts.length}
              </span>
            </div>

            <div className="space-y-2.5 max-h-[430px] overflow-y-auto pr-1">
              {filteredAlerts.map((alertItem) => {
                const isSelected = selectedCapAlert?.id === alertItem.id;
                return (
                  <div
                    key={alertItem.id}
                    onClick={() => setSelectedCapAlert(alertItem)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 space-y-1.5 shadow-md ${
                      alertItem.badgeBg
                    } ${
                      isSelected
                        ? "ring-4 ring-white border-black scale-[1.02] shadow-2xl"
                        : "opacity-95 hover:opacity-100 hover:scale-[1.01]"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-lg">{alertItem.icon}</span>
                      <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-black/80 text-white uppercase tracking-wider">
                        {alertItem.severity}
                      </span>
                    </div>

                    <h4 className={`font-black text-xs sm:text-sm leading-snug ${alertItem.badgeText}`}>
                      {alertItem.title}
                    </h4>

                    <p className={`text-[11px] font-medium leading-tight ${alertItem.badgeText} opacity-90`}>
                      {alertItem.districts}
                    </p>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openGoogleMapsDirections(20.5937, 78.9629);
                      }}
                      className="w-full mt-1.5 bg-[#1F2A44] hover:bg-[#182137] text-[#E9E7E1] font-bold text-[10px] py-1.5 rounded-lg transition flex items-center justify-center gap-1 uppercase tracking-wider shadow"
                    >
                      <span>🗺️</span> View Google Directions
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedCapAlert && (
            <div className="bg-[#1F2A44] border border-[#E9E7E1]/20 p-3 rounded-xl text-xs text-[#E9E7E1] space-y-1 shadow-inner">
              <div className="text-[10px] text-[#E9E7E1]/60 uppercase font-mono font-bold flex justify-between">
                <span>ACTIVE SELECTION:</span>
                <span>{selectedCapAlert.locationName}</span>
              </div>
              <div className="font-bold text-[#E9E7E1] text-xs">{selectedCapAlert.title}</div>
              <div className="text-[11px] text-[#E9E7E1]/75">{selectedCapAlert.districts}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
