"use client";

import React, { useState } from "react";

interface WhatsAppCallBarProps {
  onOpenSOSModal?: () => void;
}

export function WhatsAppCallBar({ onOpenSOSModal }: WhatsAppCallBarProps) {
  const [phone, setPhone] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("SOS Rescue");
  const [customMsg, setCustomMsg] = useState("URGENT: Requiring emergency disaster rescue assistance.");
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [botReply, setBotReply] = useState<string | null>(null);

  const emergencyContacts = [
    { name: "112 National Helpline", number: "112", icon: "🚨", badge: "24/7 Universal" },
    { name: "108 Medical / Ambulance", number: "108", icon: "🚑", badge: "Trauma Care" },
    { name: "1078 NDRF Disaster Desk", number: "1078", icon: "🌊", badge: "Flood & Rescue" },
    { name: "101 Fire Brigade", number: "101", icon: "🚒", badge: "Fire & Hazmat" },
    { name: "100 Police Command", number: "100", icon: "👮", badge: "Security" },
  ];

  const whatsappGroups = [
    {
      name: "🌊 Hyderabad Emergency Flood Relief Group",
      link: "https://chat.whatsapp.com/invite/DRERFloodReliefHyd",
      desc: "Live rescue boat coordination, stranded citizen help, and rescue updates.",
      badge: "ACTIVE GROUP",
    },
    {
      name: "📦 Volunteers & Rations Distribution Channel",
      link: "https://chat.whatsapp.com/invite/DRERVolunteersRations",
      desc: "Community food packets, clean water, blankets, and supply distribution.",
      badge: "COMMUNITY HUB",
    },
    {
      name: "🏥 Hospital ICU Bed & Medical Help Desk",
      link: "https://chat.whatsapp.com/invite/DRERMedicalTraumaDesk",
      desc: "Real-time blood bank availability, ICU beds, and emergency doctor guidance.",
      badge: "MEDICAL DESK",
    },
  ];

  const helperTopics = [
    { id: "SOS Rescue", label: "🚨 Urgent Rescue & SOS", defaultMsg: "URGENT SOS: Trapped in flood sector, requiring immediate NDRF/TGDRF rescue boat." },
    { id: "Shelter Location", label: "🏠 Find Nearest Shelter", defaultMsg: "SHELTER QUERY: Please provide direction to the nearest safe relief shelter with available beds." },
    { id: "Hospital ICU", label: "🏥 Hospital ICU Beds", defaultMsg: "HOSPITAL QUERY: Need immediate information on available ICU beds and trauma care emergency." },
    { id: "Weather Alert", label: "⛈️ Live Weather Alert", defaultMsg: "WEATHER QUERY: What is the current rainfall, flood inundation status, and weather warning?" },
    { id: "Food & Rations", label: "📦 Water & Food Rations", defaultMsg: "SUPPLY QUERY: Requesting emergency drinking water, rations, and first-aid kits." },
  ];

  const handleSelectTopic = (topic: typeof helperTopics[0]) => {
    setSelectedTopic(topic.id);
    setCustomMsg(topic.defaultMsg);
    setBotReply(`[WhatsApp Customer Helper]: Topic '${topic.label}' selected. Sending text without GPS location.`);
  };

  const handleWhatsAppShare = () => {
    const encodedText = encodeURIComponent(
      `💬 *DRER WHATSAPP CUSTOMER HELPER ASSISTANCE* 💬\n\n*Category:* ${selectedTopic}\n*Details:* ${customMsg}\n*Timestamp:* ${new Date().toLocaleString()}`
    );
    const target = phone ? phone.replace(/[^0-9]/g, "") : "";
    const url = target
      ? `https://wa.me/${target}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;
    window.open(url, "_blank");
  };

  const copyToClipboard = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  return (
    <div className="w-full bg-[#182137] border border-[#E9E7E1]/20 rounded-3xl p-5 md:p-6 shadow-2xl space-y-6 text-[#E9E7E1]" suppressHydrationWarning>
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E9E7E1]/15 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E9E7E1] animate-pulse" />
            <span className="text-xs font-mono font-bold text-[#E9E7E1] uppercase tracking-wider">
              24/7 WHATSAPP CUSTOMER HELP GROUPS & DIRECT ASSISTANCE
            </span>
          </div>
          <h3 className="text-xl font-black text-[#E9E7E1] mt-1">WhatsApp Emergency Customer Help Groups & Chat Support</h3>
          <p className="text-xs text-[#E9E7E1]/70 mt-0.5">
            Join official WhatsApp disaster relief groups or message direct customer support without sharing location.
          </p>
        </div>

        {onOpenSOSModal && (
          <button
            onClick={onOpenSOSModal}
            className="self-start md:self-auto bg-[#E9E7E1] hover:bg-white text-[#1F2A44] font-black text-xs px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition"
          >
            <span>🚨</span> LAUNCH EMERGENCY SOS SIREN
          </button>
        )}
      </div>

      {/* WhatsApp Groups Banner Section */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-[#E9E7E1] uppercase tracking-wider block font-mono flex items-center gap-2">
          <span>💬</span> JOIN OFFICIAL WHATSAPP EMERGENCY HELPER GROUPS (NO LOCATION REQUIRED)
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {whatsappGroups.map((group, idx) => (
            <div
              key={idx}
              className="bg-[#273452] border border-[#E9E7E1]/20 hover:border-[#E9E7E1]/40 p-4 rounded-2xl space-y-2 flex flex-col justify-between transition group"
            >
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] bg-[#1F2A44] text-[#E9E7E1] border border-[#E9E7E1]/30 px-2 py-0.5 rounded font-mono font-bold">
                    {group.badge}
                  </span>
                  <span className="text-[#E9E7E1]/80 text-xs">💬 WhatsApp Group</span>
                </div>
                <h4 className="font-extrabold text-[#E9E7E1] text-xs pt-1">{group.name}</h4>
                <p className="text-[11px] text-[#E9E7E1]/75 leading-relaxed">{group.desc}</p>
              </div>

              <a
                href={group.link}
                target="_blank"
                rel="noreferrer"
                className="w-full mt-2 bg-[#E9E7E1] hover:bg-white text-[#1F2A44] font-bold text-xs py-2 rounded-xl text-center transition flex items-center justify-center gap-1.5 shadow-md"
              >
                <span>💬</span> Join WhatsApp Help Group
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Direct Messaging & Hotline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Left Column: Direct Phone Hotlines */}
        <div className="lg:col-span-5 space-y-3">
          <span className="text-xs font-bold text-[#E9E7E1]/80 uppercase tracking-wider block font-mono">
            📞 1-Click Hotline Direct Calling
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
            {emergencyContacts.map((contact) => (
              <div
                key={contact.number}
                className="bg-[#273452] border border-[#E9E7E1]/20 hover:border-[#E9E7E1]/40 p-3 rounded-xl flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="text-xl bg-[#1F2A44] p-2 rounded-lg border border-[#E9E7E1]/20">
                    {contact.icon}
                  </div>
                  <div>
                    <strong className="text-sm font-extrabold text-[#E9E7E1] block">{contact.name}</strong>
                    <span className="text-[10px] text-[#E9E7E1]/70 font-mono bg-[#1F2A44] px-1.5 py-0.5 rounded border border-[#E9E7E1]/20">
                      {contact.badge}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => copyToClipboard(contact.number)}
                    className="text-[10px] bg-[#1F2A44] hover:bg-[#182137] text-[#E9E7E1] border border-[#E9E7E1]/20 px-2 py-1 rounded font-mono transition"
                    title="Copy number"
                  >
                    {copiedNumber === contact.number ? "✓ Copied" : "Copy"}
                  </button>

                  <a
                    href={`tel:${contact.number}`}
                    className="bg-[#E9E7E1] hover:bg-white text-[#1F2A44] font-black text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-md transition"
                  >
                    <span>📞</span> Call {contact.number}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Interactive WhatsApp Customer Support Message Generator */}
        <div className="lg:col-span-7 bg-[#273452] border border-[#E9E7E1]/20 p-4 md:p-5 rounded-2xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#E9E7E1] uppercase tracking-wider flex items-center gap-2 font-mono">
                <span className="w-2 h-2 rounded-full bg-[#E9E7E1] animate-ping" />
                💬 WhatsApp Support Message (No Location Sent)
              </span>
              <span className="text-[10px] bg-[#1F2A44] text-[#E9E7E1] font-mono px-2 py-0.5 rounded border border-[#E9E7E1]/20">
                Location Privacy Secured ✓
              </span>
            </div>

            {/* Quick Assistance Category Chips */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#E9E7E1]/80 block uppercase">
                Select Assistance Need:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {helperTopics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => handleSelectTopic(topic)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                      selectedTopic === topic.id
                        ? "bg-[#E9E7E1] text-[#1F2A44] border-[#E9E7E1] shadow-md"
                        : "bg-[#1F2A44] text-[#E9E7E1] border-[#E9E7E1]/20 hover:bg-[#182137]"
                    }`}
                  >
                    {topic.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-bold text-[#E9E7E1]/70 block mb-1">
                  Recipient WhatsApp Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#1F2A44] border border-[#E9E7E1]/20 text-xs text-[#E9E7E1] p-2.5 rounded-xl focus:outline-none focus:border-[#E9E7E1] font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#E9E7E1]/70 block mb-1">
                  Custom Requirement Message
                </label>
                <input
                  type="text"
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  className="w-full bg-[#1F2A44] border border-[#E9E7E1]/20 text-xs text-[#E9E7E1] p-2.5 rounded-xl focus:outline-none focus:border-[#E9E7E1]"
                />
              </div>
            </div>

            {/* Payload Preview */}
            <div className="bg-[#1F2A44] border border-[#E9E7E1]/20 p-3 rounded-xl text-xs font-mono text-[#E9E7E1] space-y-1">
              <div className="text-[10px] text-[#E9E7E1]/60 uppercase font-bold">WhatsApp Payload Preview (Location Excluded):</div>
              <div className="text-[#E9E7E1] font-semibold break-words">
                💬 *DRER WHATSAPP CUSTOMER HELPER ASSISTANCE* 💬<br />
                *Category:* {selectedTopic}<br />
                *Details:* {customMsg}
              </div>
            </div>

            {botReply && (
              <div className="bg-[#1F2A44] border border-[#E9E7E1]/30 p-2.5 rounded-xl text-[11px] text-[#E9E7E1] font-mono">
                {botReply}
              </div>
            )}
          </div>

          <button
            onClick={handleWhatsAppShare}
            className="w-full mt-3 bg-[#E9E7E1] hover:bg-white text-[#1F2A44] font-black text-xs py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition uppercase font-mono tracking-wider"
          >
            <span>💬</span> SEND MESSAGE VIA WHATSAPP (NO LOCATION)
          </button>
        </div>
      </div>
    </div>
  );
}
