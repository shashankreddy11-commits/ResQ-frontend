"use client";

import React, { useState } from "react";

export default function CapFeedPage() {
  const [selectedState, setSelectedState] = useState("ALL");
  const [selectedDisaster, setSelectedDisaster] = useState("ALL");
  const [feedFormat, setFeedFormat] = useState<"XML" | "JSON">("XML");
  const [copiedFeedUrl, setCopiedFeedUrl] = useState(false);

  const sampleFeeds = [
    {
      id: "CAP-FEED-101",
      agency: "IMD (India Meteorological Dept)",
      title: "Severe Thunderstorm with Lightning & High Wind Gusts",
      state: "West Bengal & Odisha",
      disasterType: "THUNDERSTORM",
      severity: "HIGH",
      pubDate: "2026-09-22T20:30:00+05:30",
      description: "Severe thunderstorm with lightning strikes, surface wind speed reaching 50-60 kmph expected over Haora, Medinipur and coastal Odisha.",
    },
    {
      id: "CAP-FEED-102",
      agency: "CWC (Central Water Commission)",
      title: "Flash Flood Warning & Reservoir Inflow Alert",
      state: "Telangana & Andhra Pradesh",
      disasterType: "FLOOD",
      severity: "MODERATE",
      pubDate: "2026-09-22T19:45:00+05:30",
      description: "River Musi and Krishna tributaries experiencing sharp water rise +1.4m. Low-lying areas in Begumpet and Vijayawada on high alert.",
    },
    {
      id: "CAP-FEED-103",
      agency: "INCOIS (Indian National Centre for Ocean Info Services)",
      title: "High Swell Surge & Coastal Rough Sea Advisory",
      state: "Kerala & Lakshadweep",
      disasterType: "CYCLONE",
      severity: "MODERATE",
      pubDate: "2026-09-22T18:15:00+05:30",
      description: "High swell waves of 2.5 - 3.2 meters forecasted along Kerala coast. Fishermen advised not to venture into deep sea for 48 hours.",
    },
    {
      id: "CAP-FEED-104",
      agency: "DGRE (Defense Geo-Informatics Research Est)",
      title: "Snow Avalanche Hazard Alert - Level 4",
      state: "Ladakh & Jammu & Kashmir",
      disasterType: "AVALANCHE",
      severity: "HIGHEST",
      pubDate: "2026-09-22T16:00:00+05:30",
      description: "Avalanche warning issued for high altitude slopes above 3000m in Leh, Kargil, and Pir Panjal range. Movement prohibited.",
    },
  ];

  const filteredFeeds = sampleFeeds.filter((feed) => {
    const matchesState = selectedState === "ALL" || feed.state.includes(selectedState);
    const matchesDisaster = selectedDisaster === "ALL" || feed.disasterType === selectedDisaster;
    return matchesState && matchesDisaster;
  });

  const getFeedUrl = () => {
    return `https://sachet.ndma.gov.in/api/cap-feed?format=${feedFormat.toLowerCase()}&state=${selectedState}&disaster=${selectedDisaster}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getFeedUrl());
    setCopiedFeedUrl(true);
    setTimeout(() => setCopiedFeedUrl(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-[#E9E7E1] font-sans pb-16">

      {/* Main Container */}
      <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-8">
        {/* Banner Section */}
        <div className="bg-[#182137] border border-[#E9E7E1]/20 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
          <div className="flex flex-wrap justify-between items-center gap-4 border-b border-[#E9E7E1]/15 pb-6">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E9E7E1]/70 bg-[#273452] px-3 py-1 rounded-full border border-[#E9E7E1]/20">
                PAN-INDIA CAP v1.2 RSS / ATOM DISSEMINATION FEED
              </span>
              <h1 className="text-2xl sm:text-4xl font-black text-[#E9E7E1] mt-2">
                India CAP Emergency Alert RSS Feed
              </h1>
              <p className="text-xs sm:text-sm text-[#E9E7E1]/80 max-w-3xl mt-1">
                Official real-time disaster alerts published by NDMA, IMD, CWC, INCOIS, DGRE, FSI, and 36 State/UT Disaster Authorities formatted in OASIS Common Alerting Protocol (CAP) standards.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setFeedFormat("XML")}
                className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition border ${
                  feedFormat === "XML"
                    ? "bg-[#E9E7E1] text-[#1F2A44] border-[#E9E7E1]"
                    : "bg-[#273452] text-[#E9E7E1] border-[#E9E7E1]/20"
                }`}
              >
                XML FEED
              </button>
              <button
                onClick={() => setFeedFormat("JSON")}
                className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition border ${
                  feedFormat === "JSON"
                    ? "bg-[#E9E7E1] text-[#1F2A44] border-[#E9E7E1]"
                    : "bg-[#273452] text-[#E9E7E1] border-[#E9E7E1]/20"
                }`}
              >
                JSON FEED
              </button>
            </div>
          </div>

          {/* Interactive URL Endpoint Box */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-[#E9E7E1]/70 font-bold uppercase">
              YOUR SUBSCRIBER RSS ENDPOINT URL:
            </label>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <input
                type="text"
                readOnly
                value={getFeedUrl()}
                className="flex-1 bg-[#1F2A44] border border-[#E9E7E1]/30 rounded-2xl px-4 py-3 text-xs font-mono text-[#E9E7E1] focus:outline-none"
              />
              <button
                onClick={copyToClipboard}
                className="bg-[#E9E7E1] hover:bg-white text-[#1F2A44] font-black text-xs px-6 py-3 rounded-2xl transition shadow-lg whitespace-nowrap"
              >
                {copiedFeedUrl ? "✓ COPIED TO CLIPBOARD!" : "📋 COPY FEED URL"}
              </button>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-[#182137] border border-[#E9E7E1]/20 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#E9E7E1]/70 font-bold">STATE / UT:</span>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="bg-[#1F2A44] border border-[#E9E7E1]/30 rounded-xl px-3 py-1.5 text-xs text-[#E9E7E1] font-bold focus:outline-none"
              >
                <option value="ALL">All 36 States & UTs</option>
                <option value="West Bengal">West Bengal</option>
                <option value="Telangana">Telangana</option>
                <option value="Kerala">Kerala</option>
                <option value="Ladakh">Ladakh</option>
                <option value="Odisha">Odisha</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#E9E7E1]/70 font-bold">DISASTER TYPE:</span>
              <select
                value={selectedDisaster}
                onChange={(e) => setSelectedDisaster(e.target.value)}
                className="bg-[#1F2A44] border border-[#E9E7E1]/30 rounded-xl px-3 py-1.5 text-xs text-[#E9E7E1] font-bold focus:outline-none"
              >
                <option value="ALL">All Disaster Types</option>
                <option value="THUNDERSTORM">Thunderstorm & Lightning</option>
                <option value="FLOOD">Flood & Inundation</option>
                <option value="CYCLONE">Cyclone & Coastal Surge</option>
                <option value="AVALANCHE">Glacial Avalanche</option>
              </select>
            </div>
          </div>

          <div className="text-xs font-mono text-[#E9E7E1]/70 font-bold">
            SHOWING <span className="text-[#E9E7E1] font-black">{filteredFeeds.length}</span> ACTIVE CAP ALERTS
          </div>
        </div>

        {/* Live Feed List Grid */}
        <div className="space-y-4">
          {filteredFeeds.map((feed) => (
            <div
              key={feed.id}
              className="bg-[#182137] border border-[#E9E7E1]/20 rounded-2xl p-5 space-y-3 shadow-lg hover:border-[#E9E7E1]/50 transition"
            >
              <div className="flex flex-wrap justify-between items-start gap-2 border-b border-[#E9E7E1]/15 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-[#1F2A44] text-[#E9E7E1] px-2.5 py-1 rounded-lg border border-[#E9E7E1]/20">
                    {feed.id}
                  </span>
                  <span className="text-xs font-extrabold text-[#E9E7E1]/80">
                    {feed.agency}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full ${
                      feed.severity === "HIGHEST"
                        ? "bg-black text-white border border-white"
                        : feed.severity === "HIGH"
                        ? "bg-[#EF4444] text-white"
                        : "bg-[#F97316] text-white"
                    }`}
                  >
                    {feed.severity} SEVERITY
                  </span>
                  <span className="text-[11px] font-mono text-[#E9E7E1]/60">
                    {new Date(feed.pubDate).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black text-[#E9E7E1]">{feed.title}</h3>
                <div className="text-xs font-bold text-[#E9E7E1]/70">
                  📍 Affected Zone: <span className="text-[#E9E7E1]">{feed.state}</span>
                </div>
                <p className="text-xs text-[#E9E7E1]/80 leading-relaxed pt-1">
                  {feed.description}
                </p>
              </div>

              <div className="flex justify-between items-center pt-2 text-xs font-mono text-[#E9E7E1]/60 border-t border-[#E9E7E1]/10">
                <span>FORMAT: OASIS CAP v1.2 XML / ATOM</span>
                <span className="text-[#E9E7E1] font-bold cursor-pointer hover:underline">
                  View Raw CAP Protocol Payload →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
