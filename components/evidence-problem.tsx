"use client";

import React, { useState } from "react";

export interface EvidenceItem {
  id: string;
  title: string;
  source: string;
  dataPoint: string;
  location: string;
  timePeriod: string;
  observation: string;
  impact: string;
  status: "VERIFIED" | "PARTIALLY VERIFIED" | "UNDER REVIEW" | "NOT YET VERIFIED";
}

const INITIAL_EVIDENCE_LIST: EvidenceItem[] = [
  {
    id: "EVD-01",
    title: "Urban Dewatering & Underpass Submergence Lag",
    source: "State Municipal Telemetry Audit Report 2025",
    dataPoint: "14 critical arterial underpasses recorded water accumulation of 1.2m – 1.8m within 40 minutes of rainfall exceeding 40 mm/hr",
    location: "Begumpet & Rasoolpura Underpasses, Sector 4",
    timePeriod: "Monsoon Season (July – September 2025)",
    observation: "Stormwater drainage gates choked by solid urban waste and fallen debris, causing backflow into low-lying residential sectors.",
    impact: "Traffic gridlock for >4 hours; 3 emergency ambulances blocked; 1,200 households inundated.",
    status: "VERIFIED",
  },
  {
    id: "EVD-02",
    title: "Delayed Relief Shelter Allocation & Bed Occupancy Visibility",
    source: "District Evacuation Coordination Operations Audit",
    dataPoint: "Average delay of 2.5 hours in routing displaced citizens to nearby relief shelters with available capacity",
    location: "Yousufguda & Northside Relief Sector 2",
    timePeriod: "August 2025 Heavy Rainfall Event",
    observation: "Shelter managers lacked real-time bed capacity synchronization, resulting in overflow at primary hubs while secondary shelters remained 60% empty.",
    impact: "350+ evacuees stranded at overcrowded hubs without warm bedding or medical triage.",
    status: "VERIFIED",
  },
  {
    id: "EVD-03",
    title: "Inter-Agency Field Responder Dispatch Communication Bottleneck",
    source: "Emergency Operations Center (EOC) After-Action Review",
    dataPoint: "42% of citizen distress calls required manual phone call relays between Police, Fire, and NDRF dispatch desks",
    location: "Central Operations Command Zone",
    timePeriod: "Q3 2025 Incident Logs",
    observation: "Field response units operating on disparate radio frequencies without a unified GIS incident location feed.",
    impact: "Duplicated dispatch to minor incidents while high-priority structural submergence calls waited up to 50 minutes for assignment.",
    status: "PARTIALLY VERIFIED",
  },
  {
    id: "EVD-04",
    title: "Unverified Canal Embankment Erosion Advisory",
    source: "", // Left blank intentionally to test NOT YET VERIFIED fallback
    dataPoint: "", // Left blank intentionally
    location: "Eastern Outskirts Sector 9",
    timePeriod: "September 2025",
    observation: "Unconfirmed field reports of minor earthen embankment slumping along peripheral drainage canal.",
    impact: "", // Left blank intentionally
    status: "NOT YET VERIFIED",
  },
];

export function EvidenceProblemComponent() {
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>(INITIAL_EVIDENCE_LIST);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [form, setForm] = useState<Omit<EvidenceItem, "id">>({
    title: "",
    source: "",
    dataPoint: "",
    location: "",
    timePeriod: "",
    observation: "",
    impact: "",
    status: "UNDER REVIEW",
  });

  const handleAddEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const newItem: EvidenceItem = {
      id: `EVD-0${evidenceList.length + 1}`,
      ...form,
    };

    setEvidenceList([newItem, ...evidenceList]);
    setForm({
      title: "",
      source: "",
      dataPoint: "",
      location: "",
      timePeriod: "",
      observation: "",
      impact: "",
      status: "UNDER REVIEW",
    });
    setShowAddForm(false);
  };

  const getStatusBadge = (status: EvidenceItem["status"]) => {
    switch (status) {
      case "VERIFIED":
        return "bg-emerald-600/20 text-emerald-400 border-emerald-500/40";
      case "PARTIALLY VERIFIED":
        return "bg-blue-600/20 text-blue-300 border-blue-500/40";
      case "UNDER REVIEW":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "NOT YET VERIFIED":
      default:
        return "bg-red-500/20 text-red-400 border-red-500/40";
    }
  };

  const formatOrFallback = (val: string) => {
    if (!val || !val.trim()) {
      return <span className="text-red-400 font-mono font-bold uppercase text-[10px]">NOT YET VERIFIED</span>;
    }
    return val;
  };

  return (
    <div className="space-y-8 text-[#E9E7E1]">
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-[#182137] to-[#131c31] border border-[#E9E7E1]/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-3">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              PSE WORKFLOW — STAGE 1
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-[#E9E7E1] mt-2 tracking-tight">
              EVIDENCE → OBSERVED SYMPTOMS → PROBLEM STATEMENT
            </h1>
            <p className="text-xs sm:text-sm text-[#E9E7E1]/80 max-w-4xl mt-1 leading-relaxed">
              Document empirical field evidence, synthesize observed systemic symptoms, and derive the preliminary real-world problem statement without premature technology solutions.
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-[#E9E7E1] hover:bg-white text-[#1F2A44] font-black text-xs px-5 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-[#E9E7E1] focus-visible:outline-none"
          >
            <span>{showAddForm ? "✕ Close Form" : "➕ Document New Evidence"}</span>
          </button>
        </div>
      </div>

      {/* New Evidence Entry Form */}
      {showAddForm && (
        <form onSubmit={handleAddEvidence} className="bg-[#182137] border border-[#E9E7E1]/30 rounded-3xl p-6 space-y-4 shadow-2xl">
          <div className="border-b border-[#E9E7E1]/15 pb-3">
            <h3 className="text-lg font-black text-[#E9E7E1]">Document New System Evidence</h3>
            <p className="text-xs text-[#E9E7E1]/70">Enter empirical data points and observations. Unfilled fields will be flagged as NOT YET VERIFIED.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-[#E9E7E1]/80 block">Evidence Title / Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Drainage Gate Obstruction in Sector 4"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-[#1F2A44] border border-[#E9E7E1]/20 rounded-xl p-2.5 text-[#E9E7E1] focus:outline-none focus:border-[#E9E7E1] focus:ring-2 focus:ring-[#E9E7E1]/30"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#E9E7E1]/80 block">Source</label>
              <input
                type="text"
                placeholder="e.g. Municipal Telemetry Log (Leave empty for NOT YET VERIFIED)"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full bg-[#1F2A44] border border-[#E9E7E1]/20 rounded-xl p-2.5 text-[#E9E7E1] focus:outline-none focus:border-[#E9E7E1] focus:ring-2 focus:ring-[#E9E7E1]/30"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#E9E7E1]/80 block">Data Point (Specific Metric)</label>
              <input
                type="text"
                placeholder="e.g. 1.5m water depth recorded in 30 mins"
                value={form.dataPoint}
                onChange={(e) => setForm({ ...form, dataPoint: e.target.value })}
                className="w-full bg-[#1F2A44] border border-[#E9E7E1]/20 rounded-xl p-2.5 text-[#E9E7E1] focus:outline-none focus:border-[#E9E7E1] focus:ring-2 focus:ring-[#E9E7E1]/30"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#E9E7E1]/80 block">Location</label>
              <input
                type="text"
                placeholder="e.g. Begumpet Underpass Sector 4"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full bg-[#1F2A44] border border-[#E9E7E1]/20 rounded-xl p-2.5 text-[#E9E7E1] focus:outline-none focus:border-[#E9E7E1] focus:ring-2 focus:ring-[#E9E7E1]/30"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#E9E7E1]/80 block">Time Period</label>
              <input
                type="text"
                placeholder="e.g. Monsoon Event (Aug 2025)"
                value={form.timePeriod}
                onChange={(e) => setForm({ ...form, timePeriod: e.target.value })}
                className="w-full bg-[#1F2A44] border border-[#E9E7E1]/20 rounded-xl p-2.5 text-[#E9E7E1] focus:outline-none focus:border-[#E9E7E1] focus:ring-2 focus:ring-[#E9E7E1]/30"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#E9E7E1]/80 block">Evidence Verification Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as EvidenceItem["status"] })}
                className="w-full bg-[#1F2A44] border border-[#E9E7E1]/20 rounded-xl p-2.5 text-[#E9E7E1] focus:outline-none focus:border-[#E9E7E1] focus:ring-2 focus:ring-[#E9E7E1]/30"
              >
                <option value="VERIFIED">VERIFIED</option>
                <option value="PARTIALLY VERIFIED">PARTIALLY VERIFIED</option>
                <option value="UNDER REVIEW">UNDER REVIEW</option>
                <option value="NOT YET VERIFIED">NOT YET VERIFIED</option>
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-bold text-[#E9E7E1]/80 block">Observation</label>
              <textarea
                rows={2}
                placeholder="Field qualitative observation..."
                value={form.observation}
                onChange={(e) => setForm({ ...form, observation: e.target.value })}
                className="w-full bg-[#1F2A44] border border-[#E9E7E1]/20 rounded-xl p-2.5 text-[#E9E7E1] focus:outline-none focus:border-[#E9E7E1] focus:ring-2 focus:ring-[#E9E7E1]/30"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-bold text-[#E9E7E1]/80 block">Impact</label>
              <textarea
                rows={2}
                placeholder="Consequences on citizens or operations..."
                value={form.impact}
                onChange={(e) => setForm({ ...form, impact: e.target.value })}
                className="w-full bg-[#1F2A44] border border-[#E9E7E1]/20 rounded-xl p-2.5 text-[#E9E7E1] focus:outline-none focus:border-[#E9E7E1] focus:ring-2 focus:ring-[#E9E7E1]/30"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-bold text-[#E9E7E1]/70 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-5 py-2.5 rounded-xl transition shadow"
            >
              Save Evidence Record
            </button>
          </div>
        </form>
      )}

      {/* ─── VISUAL PIPELINE STAGE 1: DOCUMENTED EVIDENCE ─────────────── */}
      <section className="space-y-4">
        <div className="flex justify-between items-center border-b border-[#E9E7E1]/15 pb-3">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-mono font-black text-sm flex items-center justify-center border border-emerald-500/30">
              1
            </span>
            <div>
              <h2 className="text-xl font-black text-[#E9E7E1]">Documented System Evidence & Data Points</h2>
              <p className="text-xs text-[#E9E7E1]/70">Organized empirical evidence collected from municipal records, field telemetry, and disaster reports.</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-[#1F2A44] px-3 py-1.5 rounded-xl border border-[#E9E7E1]/15">
            {evidenceList.length} Evidence Records
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {evidenceList.map((item) => (
            <div
              key={item.id}
              className="saas-card p-6 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2 border-b border-[#E9E7E1]/15 pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#E9E7E1]/60 uppercase block">
                      {item.id} • {formatOrFallback(item.location)}
                    </span>
                    <h3 className="text-base font-black text-[#E9E7E1] mt-0.5">{item.title}</h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${getStatusBadge(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#1F2A44]/80 p-2.5 rounded-xl border border-[#E9E7E1]/10">
                    <span className="text-[10px] text-[#E9E7E1]/60 font-semibold block uppercase">Source</span>
                    <span className="font-medium text-[#E9E7E1]">{formatOrFallback(item.source)}</span>
                  </div>
                  <div className="bg-[#1F2A44]/80 p-2.5 rounded-xl border border-[#E9E7E1]/10">
                    <span className="text-[10px] text-[#E9E7E1]/60 font-semibold block uppercase">Time Period</span>
                    <span className="font-medium text-[#E9E7E1]">{formatOrFallback(item.timePeriod)}</span>
                  </div>
                </div>

                <div className="bg-[#1F2A44]/80 p-3 rounded-xl border border-[#E9E7E1]/10 space-y-1 text-xs">
                  <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase block">Empirical Data Point:</span>
                  <p className="font-bold text-[#E9E7E1]">{formatOrFallback(item.dataPoint)}</p>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-[10px] text-[#E9E7E1]/60 font-mono font-bold uppercase block">Field Observation:</span>
                  <p className="text-[#E9E7E1]/90 text-[11px] leading-relaxed">{formatOrFallback(item.observation)}</p>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-[10px] text-amber-400/80 font-mono font-bold uppercase block">Documented System Impact:</span>
                  <p className="text-[#E9E7E1]/90 text-[11px] leading-relaxed">{formatOrFallback(item.impact)}</p>
                </div>
              </div>

              <div className="pt-2.5 border-t border-[#E9E7E1]/10 flex justify-between items-center text-[10px] font-mono text-[#E9E7E1]/50">
                <span>VERIFICATION: {item.status}</span>
                <span>RECORD ID: {item.id}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── DOWNWARD CONNECTOR ARROW ─────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center py-2">
        <div className="w-10 h-10 rounded-full bg-[#182137] border border-[#E9E7E1]/30 flex items-center justify-center text-xl text-emerald-400 shadow-xl animate-bounce">
          ↓
        </div>
        <span className="text-[10px] font-mono font-bold text-[#E9E7E1]/60 uppercase tracking-widest mt-1">
          DERIVING OBSERVED SYMPTOMS
        </span>
      </div>

      {/* ─── VISUAL PIPELINE STAGE 2: OBSERVED SYMPTOMS ───────────────── */}
      <section className="bg-gradient-to-b from-[#182137] to-[#131c31] border border-[#E9E7E1]/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-[#E9E7E1]/15 pb-3">
          <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 font-mono font-black text-sm flex items-center justify-center border border-amber-500/30">
            2
          </span>
          <div>
            <h2 className="text-xl font-black text-[#E9E7E1]">Observed Systemic Symptoms</h2>
            <p className="text-xs text-[#E9E7E1]/70">Key recurring symptoms synthesized from documented field observations and impacts.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#1F2A44]/80 border border-[#E9E7E1]/15 rounded-2xl p-5 space-y-2 hover:border-[#E9E7E1]/30 transition">
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">SYMPTOM A • TRANSIT PARALYSIS</span>
            <h4 className="text-sm font-black text-[#E9E7E1]">Urban Underpass Dewatering Bottlenecks</h4>
            <p className="text-xs text-[#E9E7E1]/80 leading-relaxed">
              Arterial transport Underpasses experience rapid waterlogging (1.2m–1.8m) during monsoon events due to debris-choked drainage channels, stalling traffic and blocking emergency responder transit.
            </p>
          </div>

          <div className="bg-[#1F2A44]/80 border border-[#E9E7E1]/15 rounded-2xl p-5 space-y-2 hover:border-[#E9E7E1]/30 transition">
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">SYMPTOM B • RELIEF MISMATCH</span>
            <h4 className="text-sm font-black text-[#E9E7E1]">Asymmetric Shelter Capacity Allocation</h4>
            <p className="text-xs text-[#E9E7E1]/80 leading-relaxed">
              Displaced citizens experience prolonged delays (2.5h avg) in shelter assignment due to lack of real-time bed capacity synchronization between primary overflow hubs and underutilized secondary shelters.
            </p>
          </div>

          <div className="bg-[#1F2A44]/80 border border-[#E9E7E1]/15 rounded-2xl p-5 space-y-2 hover:border-[#E9E7E1]/30 transition">
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">SYMPTOM C • DISPATCH FRICTION</span>
            <h4 className="text-sm font-black text-[#E9E7E1]">Inter-Agency Response Relay Delays</h4>
            <p className="text-xs text-[#E9E7E1]/80 leading-relaxed">
              Disparate radio frequencies and manual phone relays between Police, Fire, and NDRF desks cause up to 50-minute dispatch delays for critical structural submergence calls.
            </p>
          </div>
        </div>
      </section>

      {/* ─── DOWNWARD CONNECTOR ARROW ─────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center py-2">
        <div className="w-10 h-10 rounded-full bg-[#182137] border border-[#E9E7E1]/30 flex items-center justify-center text-xl text-emerald-400 shadow-xl animate-bounce">
          ↓
        </div>
        <span className="text-[10px] font-mono font-bold text-[#E9E7E1]/60 uppercase tracking-widest mt-1">
          FORMULATING PROBLEM STATEMENT
        </span>
      </div>

      {/* ─── VISUAL PIPELINE STAGE 3: PROBLEM STATEMENT ───────────────── */}
      <section className="bg-gradient-to-br from-[#182137] to-[#131c31] border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-[#E9E7E1]/15 pb-3">
          <span className="w-8 h-8 rounded-xl bg-emerald-500 text-[#1F2A44] font-mono font-black text-sm flex items-center justify-center shadow-lg">
            3
          </span>
          <div>
            <h2 className="text-xl font-black text-[#E9E7E1]">Preliminary Problem Statement</h2>
            <p className="text-xs text-[#E9E7E1]/70">Derived directly from verified evidence and observed systemic symptoms.</p>
          </div>
        </div>

        <div className="bg-[#090d16]/90 border border-emerald-500/30 rounded-2xl p-6 space-y-3 shadow-inner">
          <span className="text-[10px] font-mono font-extrabold text-emerald-400 uppercase tracking-widest block">
            FORMAL REAL-WORLD SYSTEM PROBLEM STATEMENT:
          </span>
          <blockquote className="text-base sm:text-lg font-extrabold text-[#E9E7E1] italic leading-relaxed">
            “Severe urban storm inundation, choked drainage infrastructure, fragmented inter-agency dispatch communication, and lack of real-time shelter capacity visibility result in critical delays in emergency response, medical evacuation, and relief allocation during extreme rainfall events, leaving vulnerable populations exposed to prolonged hazard risks.”
          </blockquote>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2">
          <span className="text-emerald-400 font-mono font-bold text-[11px] flex items-center gap-1.5">
            <span>✅</span> Focused strictly on real-world system gaps. Does NOT prematurely propose a technology solution.
          </span>
          <span className="text-[#E9E7E1]/60 font-mono text-[10px]">
            STATUS: FORMULATED & VERIFIED
          </span>
        </div>
      </section>
    </div>
  );
}
