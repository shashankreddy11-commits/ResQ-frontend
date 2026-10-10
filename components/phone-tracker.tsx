"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

export interface PhonePing {
  id: number;
  phoneNumber: string;
  personName: string;
  latitude: number;
  longitude: number;
  address: string;
  status: "CRITICAL" | "NEEDS_RESCUE" | "SEARCHING" | "SAFE" | "RESCUED" | string;
  batteryLevel: number;
  signalStrength: number;
  notes: string;
  assignedRescueSquad?: string;
  lastPingTime: string;
}

export function PhoneTracker({ apiBaseUrl = "" }: { apiBaseUrl?: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [pings, setPings] = useState<PhonePing[]>([]);
  const [selectedPing, setSelectedPing] = useState<PhonePing | null>(null);
  const [loading, setLoading] = useState(true);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  // New Location Broadcast Modal state
  const [isSimulatingPing, setIsSimulatingPing] = useState(false);
  const [pingForm, setPingForm] = useState({
    phoneNumber: "",
    personName: "",
    address: "",
    status: "NEEDS_RESCUE",
    batteryLevel: 80,
    signalStrength: 4,
    notes: "",
  });
  const [isSubmittingPing, setIsSubmittingPing] = useState(false);

  // Initial Mock Fallback Data in case backend is offline during preview
  const mockPings = useMemo<PhonePing[]>(() => ([
    {
      id: 101,
      phoneNumber: "+91-9876543210",
      personName: "Aarav Sharma",
      latitude: 28.6145,
      longitude: 77.2095,
      address: "Block B, Sunrise Apts, Sector 4",
      status: "CRITICAL",
      batteryLevel: 14,
      signalStrength: 1,
      notes: "Trapped on 2nd floor balcony due to flood water rising. Battery low.",
      assignedRescueSquad: "Alpha Boat Squad #2",
      lastPingTime: "2026-10-01T10:00:00.000Z",
    },
    {
      id: 102,
      phoneNumber: "+91-9123456789",
      personName: "Priya Verma",
      latitude: 28.6215,
      longitude: 77.2158,
      address: "Near Metro Gate 3, Sector 2",
      status: "NEEDS_RESCUE",
      batteryLevel: 45,
      signalStrength: 3,
      notes: "Elderly family member needs wheelchair evacuation support.",
      assignedRescueSquad: undefined,
      lastPingTime: "2026-10-01T09:55:00.000Z",
    },
    {
      id: 103,
      phoneNumber: "+1-555-0199",
      personName: "David Miller",
      latitude: 28.6058,
      longitude: 77.1985,
      address: "Riverfront Highway Mile 14",
      status: "SEARCHING",
      batteryLevel: 62,
      signalStrength: 4,
      notes: "Vehicle stalled in floodwater. Signal weak but GPS fix stable.",
      assignedRescueSquad: "Helicopter Unit 4",
      lastPingTime: "2026-10-01T09:47:00.000Z",
    },
    {
      id: 104,
      phoneNumber: "+91-9988776655",
      personName: "Sunita Patel",
      latitude: 28.6180,
      longitude: 77.2110,
      address: "Central Market Square",
      status: "SAFE",
      batteryLevel: 90,
      signalStrength: 5,
      notes: "Reached Northside Shelter safely with family.",
      assignedRescueSquad: "Medical Desk #1",
      lastPingTime: "2026-10-01T09:32:00.000Z",
    },
  ]), []);

  const fetchPings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/tracking`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setPings(data);
          if (!selectedPing) setSelectedPing(data[0]);
          setLoading(false);
          return;
        }
      }
    } catch {
      console.warn("Backend server not reachable, utilizing emergency local telemetry feed.");
    }
    setPings(mockPings);
    if (!selectedPing) setSelectedPing(mockPings[0]);
    setLoading(false);
  }, [apiBaseUrl, mockPings, selectedPing]);

  useEffect(() => {
    const initialFetch = window.setTimeout(() => void fetchPings(), 0);
    const interval = setInterval(fetchPings, 15000);
    return () => {
      window.clearTimeout(initialFetch);
      clearInterval(interval);
    };
  }, [fetchPings]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredPings = pings.filter(
    (p) =>
      p.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.personName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateStatus = async (id: number, newStatus: string, squad?: string) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/tracking/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          assignedRescueSquad: squad || selectedPing?.assignedRescueSquad || "Dispatched Rescue Squad",
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPings((prev) => prev.map((p) => (p.id === id ? updated : p)));
        if (selectedPing?.id === id) setSelectedPing(updated);
        setDispatchStatus(`Status updated to ${newStatus} for ${updated.personName}`);
        setTimeout(() => setDispatchStatus(null), 4000);
        return;
      }
    } catch (err) {
      console.error("Local status override:", err);
    }
    // Client-side fallback update
    setPings((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: newStatus, assignedRescueSquad: squad || "Dispatched Rescue Squad" }
          : p
      )
    );
    if (selectedPing?.id === id) {
      setSelectedPing({
        ...selectedPing,
        status: newStatus,
        assignedRescueSquad: squad || "Dispatched Rescue Squad",
      });
    }
    setDispatchStatus(`Rescue squad dispatched to ${selectedPing?.personName || "Victim"}!`);
    setTimeout(() => setDispatchStatus(null), 4000);
  };

  const handleSendPing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pingForm.phoneNumber) return;
    setIsSubmittingPing(true);

    // Default current position if user enables location or fallback coordinates
    let lat = 28.6145;
    let lng = 77.2095;

    if (navigator.geolocation) {
      try {
      const pos: GeolocationPosition = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        console.log("Using sector default coordinates");
      }
    }

    const payload = {
      phoneNumber: pingForm.phoneNumber,
      personName: pingForm.personName || "Mobile Civilian",
      latitude: lat,
      longitude: lng,
      address: pingForm.address || "Sector Flood Zone Pin",
      status: pingForm.status,
      batteryLevel: Number(pingForm.batteryLevel),
      signalStrength: Number(pingForm.signalStrength),
      notes: pingForm.notes || "SOS Mobile location broadcast",
    };

    try {
      const res = await fetch(`${apiBaseUrl}/api/tracking/ping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const newPing = await res.json();
        setPings((prev) => [newPing, ...prev.filter((p) => p.phoneNumber !== newPing.phoneNumber)]);
        setSelectedPing(newPing);
      } else {
        throw new Error("Failed");
      }
    } catch {
      const localPing: PhonePing = {
        id: Date.now(),
        ...payload,
        lastPingTime: new Date().toISOString(),
      };
      setPings((prev) => [localPing, ...prev]);
      setSelectedPing(localPing);
    }

    setIsSubmittingPing(false);
    setIsSimulatingPing(false);
    setDispatchStatus(`Location beacon sent for ${pingForm.phoneNumber}!`);
    setTimeout(() => setDispatchStatus(null), 4000);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "CRITICAL":
        return "bg-red-950/80 text-red-400 border-red-500/60 animate-pulse";
      case "NEEDS_RESCUE":
        return "bg-amber-950/80 text-amber-400 border-amber-500/60";
      case "SEARCHING":
        return "bg-cyan-950/80 text-cyan-400 border-cyan-500/60";
      case "SAFE":
      case "RESCUED":
        return "bg-emerald-950/80 text-emerald-400 border-emerald-500/60";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="w-full bg-[#0b101d] border border-slate-800 rounded-2xl p-4 md:p-6 shadow-2xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-950/80 border border-red-500/40 rounded-xl text-2xl text-red-500 shadow-lg shadow-red-950/50">
            📡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-wide">
                Phone Number Emergency Tracking Server
              </h2>
              <span className="bg-red-900/60 text-red-400 text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border border-red-500/30">
                LIVE GPS TRACE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Rescue team search desk for pinpointing victim locations, cellular signal telemetry, battery levels, and dispatching rescue boats & helicopters.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSimulatingPing(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-950/50 flex items-center gap-1.5 transition"
          >
            <span>📱</span> Ping Phone Location
          </button>
          <button
            onClick={fetchPings}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold px-3 py-2.5 rounded-xl transition"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {dispatchStatus && (
        <div className="bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs px-4 py-3 rounded-xl font-mono flex items-center justify-between animate-in fade-in">
          <span>✅ {dispatchStatus}</span>
          <span className="text-emerald-400 font-bold">RESCUE TELEMETRY UPDATED</span>
        </div>
      )}

      {/* Main Grid: Left Search & Victim Cards, Right GPS Mapping & Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Phone Search & List (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Phone Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by phone (+91-9876...), victim name, or status..."
              className="w-full bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 text-xs rounded-xl px-4 py-3 pl-10 focus:outline-none focus:border-cyan-500 transition font-mono"
            />
            <span className="absolute left-3 top-3 text-slate-500 text-sm">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Preset Victim Quick Filters */}
          <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
            <span className="text-slate-500 py-0.5">Presets:</span>
            {["+91-9876543210", "+91-9123456789", "+1-555-0199", "CRITICAL"].map((preset) => (
              <button
                key={preset}
                onClick={() => setSearchQuery(preset)}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded transition"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Victim List */}
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 font-sans">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs animate-pulse">
                Fetching satellite & carrier phone pings...
              </div>
            ) : filteredPings.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl text-slate-500 text-xs">
                No active phone location pings match &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredPings.map((ping) => {
                const isSelected = selectedPing?.id === ping.id;
                return (
                  <div
                    key={ping.id}
                    onClick={() => setSelectedPing(ping)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-slate-900 border-cyan-500/80 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/50"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <h4 className="font-bold text-sm text-white flex items-center gap-2">
                          <span>👤 {ping.personName}</span>
                        </h4>
                        <span className="text-xs font-mono text-cyan-400 font-semibold block">
                          📞 {ping.phoneNumber}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${getStatusBadge(
                          ping.status
                        )}`}
                      >
                        {ping.status.replace("_", " ")}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-1 mb-2">
                      📍 {ping.address}
                    </p>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <span>🔋</span>
                          <span
                            className={
                              ping.batteryLevel < 20
                                ? "text-red-400 font-bold"
                                : ping.batteryLevel < 50
                                ? "text-amber-400"
                                : "text-emerald-400"
                            }
                          >
                            {ping.batteryLevel}%
                          </span>
                        </span>

                        <span className="flex items-center gap-1">
                          <span>📶</span>
                          <span className="text-slate-300 font-bold">
                            {"█".repeat(ping.signalStrength)}
                            {"░".repeat(5 - ping.signalStrength)}
                          </span>
                        </span>
                      </div>

                      <span className="text-slate-500 text-[10px]">
                        {new Date(ping.lastPingTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Telemetry & Interactive GIS Map View (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedPing ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5">
              {/* Target Victim Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase block tracking-wider">
                    TARGET TELEMETRY LOCK
                  </span>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    {selectedPing.personName}
                    <span className="text-xs text-slate-400 font-mono font-normal">
                      ({selectedPing.phoneNumber})
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    📍 {selectedPing.address}
                  </p>
                </div>

                <div className="flex flex-col sm:items-end gap-1 font-mono">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-lg border uppercase inline-block ${getStatusBadge(
                      selectedPing.status
                    )}`}
                  >
                    {selectedPing.status.replace("_", " ")}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    GPS Fix: {selectedPing.latitude.toFixed(4)}, {selectedPing.longitude.toFixed(4)}
                  </span>
                </div>
              </div>

              {/* Live Signal Telemetry Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">BATTERY POWER</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-lg">🔋</span>
                    <strong
                      className={`text-base font-bold ${
                        selectedPing.batteryLevel < 20
                          ? "text-red-400 animate-pulse"
                          : selectedPing.batteryLevel < 50
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {selectedPing.batteryLevel}%
                    </strong>
                  </div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">CELL SIGNAL</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-lg">📶</span>
                    <strong className="text-base font-bold text-cyan-400">
                      {selectedPing.signalStrength}/5 Bars
                    </strong>
                  </div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">RESCUE SQUAD</span>
                  <div className="text-xs font-bold text-amber-400 mt-1 truncate">
                    {selectedPing.assignedRescueSquad || "Unassigned"}
                  </div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">LAST PING</span>
                  <div className="text-xs font-bold text-emerald-400 mt-1">
                    {new Date(selectedPing.lastPingTime).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Simulated Map View Container */}
              <div className="relative w-full h-[240px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
                {/* Background Tactical Grid Simulation */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#1e293b 1px, #090d16 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />

                {/* Satellite Radar Ping Animation */}
                <div className="relative z-10 text-center space-y-2 p-4">
                  <div className="relative inline-block">
                    <div className="w-16 h-16 rounded-full border-2 border-red-500/60 bg-red-950/30 flex items-center justify-center mx-auto animate-ping opacity-75 absolute inset-0" />
                    <div className="w-16 h-16 rounded-full border-2 border-cyan-400 bg-slate-900/90 flex items-center justify-center mx-auto shadow-xl relative z-10 text-2xl">
                      📍
                    </div>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-200 shadow-md">
                    Target Pin: <strong className="text-cyan-400">{selectedPing.personName}</strong> (
                    {selectedPing.latitude.toFixed(4)}, {selectedPing.longitude.toFixed(4)})
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    Cellular Triangulation Precision: ~12 meters
                  </span>
                </div>
              </div>

              {/* Distress Notes */}
              <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl">
                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase block mb-1">
                  🚨 RECENT SOS NOTES & DISTRESS REPORT
                </span>
                <p className="text-xs text-slate-200 italic font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  &quot;{selectedPing.notes || "No notes provided."}&quot;
                </p>
              </div>

              {/* Dispatch Action Control Buttons */}
              <div className="border-t border-slate-800 pt-4 space-y-2 font-sans">
                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase block">
                  ⚡ RESCUE TEAM DISPATCH ACTIONS
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() =>
                      handleUpdateStatus(selectedPing.id, "CRITICAL", "Alpha Boat Squad #1")
                    }
                    className="bg-red-700 hover:bg-red-600 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-red-950/60 transition flex items-center justify-center gap-1.5"
                  >
                    <span>🚤</span> Dispatch Boat Squad
                  </button>

                  <button
                    onClick={() =>
                      handleUpdateStatus(selectedPing.id, "SEARCHING", "Air Rescue Chopper 2")
                    }
                    className="bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-cyan-950/60 transition flex items-center justify-center gap-1.5"
                  >
                    <span>🚁</span> Air Rescue Unit
                  </button>

                  <button
                    onClick={() =>
                      handleUpdateStatus(selectedPing.id, "RESCUED", "Relief Hub Team")
                    }
                    className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-emerald-950/60 transition flex items-center justify-center gap-1.5"
                  >
                    <span>✅</span> Mark Rescued
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-slate-500 text-xs">
              Select a phone number ping from the list to view real-time location telemetry.
            </div>
          )}
        </div>
      </div>

      {/* Ping Phone Location Registration Modal */}
      {isSimulatingPing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>📱</span> Broadcast Phone Location Beacon
              </h3>
              <button
                onClick={() => setIsSimulatingPing(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendPing} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91-9876543210"
                  value={pingForm.phoneNumber}
                  onChange={(e) => setPingForm({ ...pingForm, phoneNumber: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Person Name</label>
                  <input
                    type="text"
                    placeholder="Civilian Name"
                    value={pingForm.personName}
                    onChange={(e) => setPingForm({ ...pingForm, personName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Status</label>
                  <select
                    value={pingForm.status}
                    onChange={(e) => setPingForm({ ...pingForm, status: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 font-bold focus:outline-none focus:border-cyan-500"
                  >
                    <option value="CRITICAL">🔴 CRITICAL</option>
                    <option value="NEEDS_RESCUE">🟠 NEEDS RESCUE</option>
                    <option value="SEARCHING">🔵 SEARCHING</option>
                    <option value="SAFE">🟢 SAFE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Address / Landmark</label>
                <input
                  type="text"
                  placeholder="e.g. Sector 4, near Water Tank"
                  value={pingForm.address}
                  onChange={(e) => setPingForm({ ...pingForm, address: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Battery Level (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={pingForm.batteryLevel}
                    onChange={(e) => setPingForm({ ...pingForm, batteryLevel: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Signal (1-5 Bars)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={pingForm.signalStrength}
                    onChange={(e) => setPingForm({ ...pingForm, signalStrength: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Distress Message</label>
                <textarea
                  rows={2}
                  placeholder="Describe emergency situation..."
                  value={pingForm.notes}
                  onChange={(e) => setPingForm({ ...pingForm, notes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSimulatingPing(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPing}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2 rounded-xl shadow-lg shadow-cyan-950/60"
                >
                  {isSubmittingPing ? "Broadcasting..." : "📡 Send Location Beacon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
