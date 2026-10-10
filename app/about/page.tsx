"use client";

import React from "react";

export default function AboutSachetPage() {
  const participatingAgencies = [
    { name: "India Meteorological Department (IMD)", role: "Monsoons, Heavy Rainfall, Thunderstorm, Cyclone Warnings", logo: "🌤️" },
    { name: "Central Water Commission (CWC)", role: "River Basin Water Levels, Dam Discharge & Flash Flood Alerts", logo: "🌊" },
    { name: "Indian National Centre for Ocean Information Services (INCOIS)", role: "Tsunami, High Swell Surge & Coastal Ocean Advisories", logo: "⚓" },
    { name: "Defence Geo-Informatics Research Establishment (DGRE)", role: "Himalayan Snow Avalanche Warnings & Glacial Hazards", logo: "🏔️" },
    { name: "Forest Survey of India (FSI)", role: "Wildfire Telemetry & Forest Fire Risk Warnings", logo: "🔥" },
    { name: "36 State & UT Disaster Management Authorities", role: "Local Emergency Control Rooms & Evacuation Commands", logo: "🏛️" },
  ];

  const disseminationChannels = [
    { title: "Targeted Geo-SMS (XX-NDMAEW)", desc: "Direct SMS alert broadcast to citizens present inside affected geographic boundaries without requiring app installation.", icon: "📱" },
    { title: "Cell Broadcast Warning System", desc: "High-priority emergency alerts overriding silent mode on cellphones with distinct siren sound during critical disasters.", icon: "🚨" },
    { title: "NavIC / GAGAN Satellite Terminals", desc: "Direct satellite alert dissemination to deep-sea fishermen and remote border regions using ISRO satellite payload.", icon: "🛰️" },
    { title: "TV & Radio Broadcast Overrides", desc: "Automated emergency crawl ticker and interruption feeds on All India Radio and Doordarshan channels.", icon: "📻" },
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-[#E9E7E1] font-sans pb-16">
      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-10">
        {/* Hero Banner */}
        <div className="bg-[#182137] border border-[#E9E7E1]/20 rounded-3xl p-8 space-y-4 shadow-2xl">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E9E7E1]/70 bg-[#273452] px-3 py-1 rounded-full border border-[#E9E7E1]/20">
            DISASTER MANAGEMENT FRAMEWORK
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-[#E9E7E1]">
            About Disaster Resilience and Emergency Response
          </h1>
          <p className="text-sm sm:text-base text-[#E9E7E1]/85 max-w-4xl leading-relaxed">
            Disaster Resilience and Emergency Response is a 24/7 disaster management, one-click SOS distress dispatch, GIS evacuation routing, and emergency services coordination platform.
          </p>
        </div>

        {/* Core Architecture Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#182137] border border-[#E9E7E1]/20 p-6 rounded-3xl space-y-2">
            <span className="text-3xl">📡</span>
            <h3 className="text-lg font-black text-[#E9E7E1]">OASIS CAP Standards</h3>
            <p className="text-xs text-[#E9E7E1]/80 leading-relaxed">
              Employs international OASIS Common Alerting Protocol standards to aggregate early warnings from technical agencies and broadcast them seamlessly across all 36 States and Union Territories.
            </p>
          </div>

          <div className="bg-[#182137] border border-[#E9E7E1]/20 p-6 rounded-3xl space-y-2">
            <span className="text-3xl">🗺️</span>
            <h3 className="text-lg font-black text-[#E9E7E1]">Geo-Targeted Dissemination</h3>
            <p className="text-xs text-[#E9E7E1]/80 leading-relaxed">
              Delivers area-specific alerts precisely to citizens located within threatened geographic zones, preventing false alarms in unaffected districts.
            </p>
          </div>

          <div className="bg-[#182137] border border-[#E9E7E1]/20 p-6 rounded-3xl space-y-2">
            <span className="text-3xl">🗣️</span>
            <h3 className="text-lg font-black text-[#E9E7E1]">Multi-Language Accessibility</h3>
            <p className="text-xs text-[#E9E7E1]/80 leading-relaxed">
              Supports 12 major Indian regional languages with read-out loud text-to-speech functionality catering to specially-abled citizens across all corners of India.
            </p>
          </div>
        </div>

        {/* Participating Agencies Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-[#E9E7E1] font-mono">
            🏛️ AUTHORIZED ALERT GENERATING AGENCIES
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {participatingAgencies.map((agency, idx) => (
              <div
                key={idx}
                className="bg-[#182137] border border-[#E9E7E1]/20 p-5 rounded-2xl space-y-2 hover:border-[#E9E7E1]/50 transition"
              >
                <span className="text-2xl">{agency.logo}</span>
                <h4 className="font-extrabold text-sm text-[#E9E7E1]">{agency.name}</h4>
                <p className="text-xs text-[#E9E7E1]/75">{agency.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Multi-Modal Dissemination Channels */}
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-[#E9E7E1] font-mono">
            ⚡ MULTI-MODAL EMERGENCY ALERT CHANNELS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {disseminationChannels.map((channel, idx) => (
              <div
                key={idx}
                className="bg-[#182137] border border-[#E9E7E1]/20 p-6 rounded-2xl flex items-start gap-4"
              >
                <span className="text-3xl p-3 bg-[#1F2A44] rounded-2xl border border-[#E9E7E1]/20">
                  {channel.icon}
                </span>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-[#E9E7E1]">{channel.title}</h4>
                  <p className="text-xs text-[#E9E7E1]/75 leading-relaxed">{channel.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
