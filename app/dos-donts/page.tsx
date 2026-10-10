"use client";

import React, { useState } from "react";

interface PhaseGuide {
  before: string[];
  during: string[];
  after: string[];
}

interface SafetyGuide {
  id: string;
  category: "FLOOD" | "CYCLONE" | "EARTHQUAKE" | "FIRE" | "FIRST_AID";
  title: string;
  icon: string;
  phases: PhaseGuide;
  helpline: string;
}

const guidesData: SafetyGuide[] = [
  {
    id: "GUIDE-01",
    category: "FLOOD",
    title: "Floods & Submergence Protocol",
    icon: "🌊",
    phases: {
      before: [
        "Know your local flood elevation level and safe evacuation routes.",
        "Keep emergency kit ready (medicines, torch, clean drinking water, food).",
        "Secure essential documents in waterproof pouches.",
      ],
      during: [
        "Move immediately to upper floors or high ground. Do NOT enter floodwater.",
        "Turn off main gas valves and main electrical circuit breakers.",
        "Do NOT walk or drive through submerged underpasses or moving currents.",
      ],
      after: [
        "Boil drinking water or use purification tablets before consumption.",
        "Avoid touching fallen power lines or electrical poles in damp areas.",
        "Report structural cracks or gas leakage to emergency desk.",
      ],
    },
    helpline: "Flood Emergency Helpline: 1070 / 1078",
  },
  {
    id: "GUIDE-02",
    category: "CYCLONE",
    title: "Cyclones & Windstorms",
    icon: "🌪️",
    phases: {
      before: [
        "Trim dead tree branches near rooflines and secure outdoor items.",
        "Board up windows or apply protective tape across glass panes.",
        "Charge mobile phones, power banks, and emergency radios.",
      ],
      during: [
        "Remain indoors in an interior room away from glass windows.",
        "Beware of the eye of the cyclone; stay inside as winds resume suddenly.",
        "Disconnect electrical appliances.",
      ],
      after: [
        "Watch out for dangling electrical cables and unstable fallen trees.",
        "Stay away from beaches until official all-clear is broadcast.",
        "Inspect building roof and walls for structural damage before entering.",
      ],
    },
    helpline: "Cyclone Control Desk: 1093 / 112",
  },
  {
    id: "GUIDE-03",
    category: "EARTHQUAKE",
    title: "Earthquakes & Seismic Hazards",
    icon: "🏚️",
    phases: {
      before: [
        "Fasten heavy furniture and bookcases securely to wall studs.",
        "Identify safe interior drop zones under sturdy desks or tables.",
        "Keep emergency flashlight and sturdy shoes near your bed.",
      ],
      during: [
        "DROP to hands and knees. COVER under sturdy table. HOLD ON tight.",
        "If outdoors, move into an open area away from tall buildings and power lines.",
        "Do NOT use elevators or stairwells during ground shaking.",
      ],
      after: [
        "Check for gas leaks; do NOT light matches if smell is present.",
        "Expect aftershocks; stay prepared to drop and cover again.",
        "Tune into official situation reports via mobile or radio.",
      ],
    },
    helpline: "Seismic Emergency Line: 112 / Fire: 101",
  },
  {
    id: "GUIDE-04",
    category: "FIRE",
    title: "Structural & Forest Fires",
    icon: "🔥",
    phases: {
      before: [
        "Install and test smoke detectors on every building floor.",
        "Keep fire extinguishers accessible and maintain clear emergency exits.",
        "Practice family escape routes.",
      ],
      during: [
        "Crawl low under smoke towards the nearest emergency exit.",
        "Cover nose and mouth with a wet cloth or shirt.",
        "Feel doors with back of hand before opening; do NOT open if hot.",
      ],
      after: [
        "Do NOT re-enter burnt structures until fire officers give official clearance.",
        "Seek medical treatment for burn injuries or smoke inhalation immediately.",
        "Notify emergency responders of any missing individuals.",
      ],
    },
    helpline: "Fire Brigade Helpline: 101 / 112",
  },
  {
    id: "GUIDE-05",
    category: "FIRST_AID",
    title: "Emergency First Aid Protocols",
    icon: "🩺",
    phases: {
      before: [
        "Maintain a fully stocked First Aid Kit with sterile gauze, antiseptics, and bandages.",
        "Learn CPR and basic wound pressure techniques.",
        "Keep emergency medical contact numbers posted visibly.",
      ],
      during: [
        "For severe bleeding: Apply firm, continuous direct pressure using clean cloth.",
        "For unconscious victims: Check breathing and place in safe recovery position.",
        "For burns: Flush immediately with cool clean water for 10 minutes.",
      ],
      after: [
        "Hand over patient medical details and timeline to responding trauma paramedics.",
        "Keep victim warm, calm, and lying flat on their back.",
        "Do NOT offer food or drink if emergency surgery might be required.",
      ],
    },
    helpline: "Trauma Ambulance Desk: 108 / 112",
  },
];

export default function SafetyGuidePage() {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [activePhase, setActivePhase] = useState<"before" | "during" | "after">("during");

  const filteredGuides = guidesData.filter(
    (g) => activeCategory === "ALL" || g.category === activeCategory
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="saas-card p-6 border border-[#E4E7EC] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#667085]">
              ACTIONABLE SAFETY PROCEDURES
            </span>
            <h1 className="text-2xl font-extrabold text-[#172033]">
              Safety Guide & Protocols
            </h1>
            <p className="text-xs text-[#667085] mt-0.5">
              Actionable Before, During, and After disaster phase instructions.
            </p>
          </div>

          <span className="text-xs font-mono font-bold bg-[#EAF3FF] border border-[#1677FF]/20 text-[#1677FF] px-3 py-1.5 rounded-full">
            ● PROTOCOLS ACTIVE
          </span>
        </div>

        {/* Phase Selector Tabs */}
        <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-xl border border-[#E4E7EC]">
          <button
            onClick={() => setActivePhase("before")}
            className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition ${
              activePhase === "before"
                ? "bg-white text-[#172033] shadow-xs font-extrabold"
                : "text-[#667085] hover:text-[#172033]"
            }`}
          >
            📋 BEFORE (PREPARE)
          </button>
          <button
            onClick={() => setActivePhase("during")}
            className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition ${
              activePhase === "during"
                ? "bg-[#DC2626] text-white shadow-xs font-extrabold"
                : "text-[#667085] hover:text-[#172033]"
            }`}
          >
            🚨 DURING (RESPOND)
          </button>
          <button
            onClick={() => setActivePhase("after")}
            className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition ${
              activePhase === "after"
                ? "bg-[#16A34A] text-white shadow-xs font-extrabold"
                : "text-[#667085] hover:text-[#172033]"
            }`}
          >
            🛠️ AFTER (RECOVER)
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          {["ALL", "FLOOD", "CYCLONE", "EARTHQUAKE", "FIRE", "FIRST_AID"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeCategory === cat
                  ? "bg-[#1677FF] text-white shadow-xs"
                  : "bg-slate-100 text-[#667085] hover:text-[#172033]"
              }`}
            >
              {cat.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Guides Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredGuides.map((guide) => (
          <div
            key={guide.id}
            className="saas-card p-6 space-y-4 border border-[#E4E7EC] flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-[#E4E7EC] pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{guide.icon}</span>
                  <div>
                    <h2 className="text-base font-extrabold text-[#172033]">{guide.title}</h2>
                    <span className="text-[10px] font-mono text-[#667085]">GUIDE #{guide.id}</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono uppercase font-bold bg-[#FFF7E6] text-[#F59E0B] border border-[#F59E0B]/30 px-2.5 py-1 rounded-md">
                  {activePhase} PHASE
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-mono font-bold text-[#172033] uppercase tracking-wider">
                  {activePhase === "before"
                    ? "📋 PREPAREDNESS STEPS:"
                    : activePhase === "during"
                    ? "🚨 EMERGENCY RESPONSE STEPS:"
                    : "🛠️ RECOVERY STEPS:"}
                </h3>
                <ul className="space-y-2">
                  {guide.phases[activePhase].map((step, sIdx) => (
                    <li
                      key={sIdx}
                      className="text-xs text-[#172033] flex items-start gap-2 leading-relaxed bg-slate-50 p-3 rounded-xl border border-[#E4E7EC]"
                    >
                      <span className="text-[#1677FF] font-bold">•</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-[#EAF3FF] p-3 rounded-xl border border-[#1677FF]/20 text-xs font-mono text-[#1677FF] flex justify-between items-center font-bold">
              <span>📞 {guide.helpline}</span>
              <span className="text-[10px] text-[#667085]">24/7 HELPLINE</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
