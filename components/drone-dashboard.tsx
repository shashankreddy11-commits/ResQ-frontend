"use client";

import React, { useState, useEffect } from "react";

interface DroneUnit {
  id: string;
  name: string;
  sector: string;
  alt: string;
  speed: string;
  battery: number;
  camera: string;
  status: "PATROLLING" | "SEARCHING" | "PAYLOAD_READY" | "RETURNING";
  payload: string;
  lat: number;
  lng: number;
  signalLatencyMs: number;
}

export function DroneDashboard() {
  const [activeDroneId, setActiveDroneId] = useState("DRONE-ALPHA-01");
  const [mode, setMode] = useState<"VISUAL" | "THERMAL" | "FLOOD_MAP" | "AI_DETECTION">("THERMAL");
  const [isAutoPilot, setIsAutoPilot] = useState(true);
  const [payloadDeployed, setPayloadDeployed] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    "[15:03:10] DRONE-ALPHA-01: Auto-pilot waypoint #04 engaged @ Tank Bund Corridor.",
    "[15:03:22] DRONE-ALPHA-01: FLIR Thermal sensor detected 4 heat signatures under Begumpet bridge.",
    "[15:03:35] TELEMETRY: 5G Sub-6GHz latency nominal @ 12ms. Battery voltage stable.",
  ]);

  const [drones, setDrones] = useState<DroneUnit[]>([
    {
      id: "DRONE-ALPHA-01",
      name: "TGDRF Aero-Recon One",
      sector: "Begumpet Nala & Tank Bund Corridor",
      alt: "125m",
      speed: "28 km/h",
      battery: 88,
      camera: "4K Dual Optical + FLIR Thermal IR",
      status: "SEARCHING",
      payload: "Life-Raft & Oxygen Pods",
      lat: 17.4375,
      lng: 78.4715,
      signalLatencyMs: 12,
    },
    {
      id: "DRONE-BRAVO-02",
      name: "TGDRF Hydro-LiDAR Two",
      sector: "Gachibowli Relief Hub & Stadium",
      alt: "180m",
      speed: "34 km/h",
      battery: 94,
      camera: "LiDAR Topographic Elevation Map",
      status: "PATROLLING",
      payload: "First-Aid & Radio Beacon",
      lat: 17.4435,
      lng: 78.3512,
      signalLatencyMs: 14,
    },
    {
      id: "DRONE-CHARLIE-03",
      name: "TGDRF Night-Vision Three",
      sector: "Old City & Osmania Flood Sector",
      alt: "95m",
      speed: "22 km/h",
      battery: 76,
      camera: "Ultra Night-Vision 30x Zoom",
      status: "PAYLOAD_READY",
      payload: "Inflatable Floatation Ring",
      lat: 17.3700,
      lng: 78.4800,
      signalLatencyMs: 16,
    },
    {
      id: "DRONE-DELTA-04",
      name: "TGDRF Heavy Payload Four",
      sector: "Secunderabad Station & MG Road Corridor",
      alt: "150m",
      speed: "40 km/h",
      battery: 91,
      camera: "AI Bounding-Box Detection Cam",
      status: "PATROLLING",
      payload: "Emergency Rations & Satellite Phone",
      lat: 17.4399,
      lng: 78.4983,
      signalLatencyMs: 11,
    },
  ]);

  const activeDrone = drones.find((d) => d.id === activeDroneId) || drones[0];

  useEffect(() => {
    const interval = setInterval(() => {
      setDrones((prev) =>
        prev.map((d) => ({
          ...d,
          battery: Math.max(10, d.battery - (Math.random() > 0.7 ? 1 : 0)),
          signalLatencyMs: Math.floor(Math.random() * 8 + 10),
        }))
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const triggerPayloadDrop = () => {
    setPayloadDeployed(true);
    const newLog = `[${new Date().toLocaleTimeString()}] ${activeDrone.id}: EMERGENCY PAYLOAD RELEASED! Dropping ${activeDrone.payload} at GPS (${activeDrone.lat.toFixed(4)}° N, ${activeDrone.lng.toFixed(4)}° E).`;
    setLogs((prev) => [newLog, ...prev.slice(0, 5)]);
    setTimeout(() => setPayloadDeployed(false), 4000);
  };

  const triggerRTL = () => {
    const newLog = `[${new Date().toLocaleTimeString()}] ${activeDrone.id}: RETURN TO BASE (RTL) COMMAND INITIATED. Autonomous navigation back to TGDRF Central Pad.`;
    setLogs((prev) => [newLog, ...prev.slice(0, 5)]);
  };

  const trigger360Orbit = () => {
    const newLog = `[${new Date().toLocaleTimeString()}] ${activeDrone.id}: EXECUTING 360° THERMAL ORBIT SCAN around target coordinates.`;
    setLogs((prev) => [newLog, ...prev.slice(0, 5)]);
  };

  return (
    <div className="bg-[#182137] border border-[#E9E7E1]/20 rounded-2xl p-5 space-y-4 shadow-2xl text-[#E9E7E1]">
      {/* Controller Header Bar */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-[#E9E7E1]/15 pb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🛸</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-[#E9E7E1] uppercase tracking-wider font-mono">
                AUTONOMOUS DRONE FLEET CONTROLLER & AERIAL RECONNAISSANCE v4.0
              </h3>
              <span className="text-[10px] bg-[#1F2A44] text-[#E9E7E1] border border-[#E9E7E1]/30 px-2 py-0.5 rounded font-mono font-bold">
                5G AI CONNECTED
              </span>
            </div>
            <p className="text-xs text-[#E9E7E1]/70">
              Real-time FLIR thermal imaging, LiDAR hydro elevation mapping, victim target detection, and autonomous payload drop.
            </p>
          </div>
        </div>

        {/* Camera Visual Mode Selector */}
        <div className="flex items-center gap-1.5 bg-[#1F2A44] border border-[#E9E7E1]/20 p-1 rounded-xl">
          {(["VISUAL", "THERMAL", "FLOOD_MAP", "AI_DETECTION"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                mode === m ? "bg-[#E9E7E1] text-[#1F2A44] shadow-md" : "text-[#E9E7E1]/70 hover:text-[#E9E7E1]"
              }`}
            >
              {m === "VISUAL"
                ? "📷 4K Optical"
                : m === "THERMAL"
                ? "🔥 FLIR Thermal IR"
                : m === "FLOOD_MAP"
                ? "🌊 Hydro LiDAR"
                : "🤖 AI Detection"}
            </button>
          ))}
        </div>
      </div>

      {/* Main Viewport & Fleet Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Interactive Drone HUD Camera Feed */}
        <div className="lg:col-span-8 space-y-3">
          <div className="relative h-96 bg-[#1F2A44] border border-[#E9E7E1]/20 rounded-2xl overflow-hidden flex flex-col justify-between p-4">
            {/* Background Feed Gradient */}
            <div className="absolute inset-0 opacity-80 bg-[#1F2A44] transition-all duration-500">
              <div className="gis-grid-background absolute inset-0 opacity-30 bg-[radial-gradient(#E9E7E1_1px,transparent_1px)] [background-size:24px_24px]" />
            </div>

            {/* HUD Top Status Bar */}
            <div className="relative z-10 flex flex-wrap justify-between items-center text-xs font-mono font-bold text-[#E9E7E1] bg-[#182137]/90 p-2.5 rounded-xl border border-[#E9E7E1]/30 backdrop-blur-md gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E9E7E1] animate-ping" />
                <span>REC: {activeDrone.id} ({activeDrone.name})</span>
              </div>
              <span>MODE: {mode}</span>
              <span>GPS: {activeDrone.lat.toFixed(4)}° N, {activeDrone.lng.toFixed(4)}° E</span>
              <span>LATENCY: {activeDrone.signalLatencyMs}ms</span>
            </div>

            {/* HUD Center Crosshair & Target Overlay */}
            <div className="relative z-10 flex flex-col items-center justify-center space-y-2 my-auto">
              <div className="relative flex items-center justify-center">
                <div
                  className="w-24 h-24 border-2 border-[#E9E7E1]/80 rounded-full flex items-center justify-center animate-spin"
                  style={{ animationDuration: "12s" }}
                >
                  <div className="w-12 h-12 border border-dashed border-[#E9E7E1]/80 rounded-full" />
                </div>
                <div className="w-3 h-3 bg-[#E9E7E1] rounded-full absolute animate-ping" />
              </div>

              {mode === "AI_DETECTION" && (
                <div className="border-2 border-[#E9E7E1] bg-[#273452] px-3 py-1.5 rounded-lg text-[#E9E7E1] text-xs font-mono font-bold animate-pulse">
                  🎯 AI BOUNDING BOX: 4 SURVIVORS DETECTED (CONFIDENCE 98.4%)
                </div>
              )}

              {mode === "THERMAL" && (
                <span className="text-xs font-mono font-bold text-[#E9E7E1] bg-[#1F2A44] px-3 py-1 rounded-lg border border-[#E9E7E1]/30">
                  🔥 FLIR HEAT SIGNATURE: 37.8°C CORRIDOR SPOTLIGHT ACTIVE
                </span>
              )}

              {mode === "FLOOD_MAP" && (
                <span className="text-xs font-mono font-bold text-[#E9E7E1] bg-[#1F2A44] px-3 py-1 rounded-lg border border-[#E9E7E1]/30">
                  🌊 LiDAR FLOOD ELEVATION: INUNDATION DEPTH +1.45 METERS
                </span>
              )}

              {payloadDeployed && (
                <div className="bg-[#E9E7E1] text-[#1F2A44] px-4 py-2 rounded-xl text-xs font-extrabold shadow-2xl animate-bounce">
                  🚨 PAYLOAD RELEASED: DISPATCHING {activeDrone.payload} TO VICTIM SPOT
                </div>
              )}
            </div>

            {/* HUD Bottom Telemetry Data Strip */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-[#E9E7E1]/80 bg-[#182137]/90 p-2.5 rounded-xl border border-[#E9E7E1]/20 backdrop-blur-md">
              <div>ALTITUDE: <strong className="text-[#E9E7E1]">{activeDrone.alt}</strong></div>
              <div>AIRSPEED: <strong className="text-[#E9E7E1]">{activeDrone.speed}</strong></div>
              <div>BATTERY: <strong className="text-[#E9E7E1]">{activeDrone.battery}%</strong></div>
              <div>AUTO-PILOT: <strong className="text-[#E9E7E1]">{isAutoPilot ? "ENABLED ✓" : "MANUAL"}</strong></div>
            </div>
          </div>

          {/* Autonomous Flight Commands Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              onClick={triggerPayloadDrop}
              className="bg-[#E9E7E1] hover:bg-white text-[#1F2A44] font-extrabold py-2.5 px-3 rounded-xl transition shadow-lg flex items-center justify-center gap-1.5"
            >
              📦 Deploy Payload Drop
            </button>

            <button
              onClick={trigger360Orbit}
              className="bg-[#273452] hover:bg-[#182137] border border-[#E9E7E1]/30 text-[#E9E7E1] font-bold py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5"
            >
              🔄 360° Thermal Orbit
            </button>

            <button
              onClick={triggerRTL}
              className="bg-[#273452] hover:bg-[#182137] border border-[#E9E7E1]/30 text-[#E9E7E1] font-bold py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5"
            >
              🏠 Return to Base (RTL)
            </button>

            <button
              onClick={() => setIsAutoPilot(!isAutoPilot)}
              className={`font-bold py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 border border-[#E9E7E1]/30 ${
                isAutoPilot ? "bg-[#E9E7E1] text-[#1F2A44]" : "bg-[#1F2A44] text-[#E9E7E1]"
              }`}
            >
              ⚡ {isAutoPilot ? "Auto-Pilot ON" : "Manual Mode"}
            </button>
          </div>
        </div>

        {/* Right Active Fleet & Telemetry Logs Sidebar */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex justify-between items-center border-b border-[#E9E7E1]/15 pb-2">
            <h4 className="text-xs font-bold text-[#E9E7E1]/80 uppercase font-mono">
              ACTIVE PATROL FLEET ({drones.length})
            </h4>
            <span className="text-[10px] text-[#E9E7E1] font-mono font-bold">ALL UNITS NOMINAL</span>
          </div>

          {/* Fleet Selector Cards */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {drones.map((d) => (
              <div
                key={d.id}
                onClick={() => setActiveDroneId(d.id)}
                className={`p-3 rounded-xl border transition cursor-pointer space-y-1 ${
                  activeDroneId === d.id
                    ? "bg-[#273452] border-[#E9E7E1] text-[#E9E7E1] shadow-lg"
                    : "bg-[#1F2A44] border-[#E9E7E1]/20 text-[#E9E7E1]/70 hover:border-[#E9E7E1]/40"
                }`}
              >
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="font-mono text-[#E9E7E1]">{d.id}</span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded font-bold bg-[#1F2A44] text-[#E9E7E1] border border-[#E9E7E1]/20">
                    {d.battery}% Battery
                  </span>
                </div>
                <h5 className="font-bold text-[#E9E7E1] text-xs">{d.name}</h5>
                <p className="text-[11px] text-[#E9E7E1]/75">{d.sector}</p>
                <div className="flex justify-between text-[10px] text-[#E9E7E1]/70 font-mono pt-1">
                  <span>Alt: {d.alt}</span>
                  <span className="text-[#E9E7E1]">{d.payload}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Real-time Telemetry Logs Terminal */}
          <div className="bg-[#1F2A44] border border-[#E9E7E1]/20 rounded-xl p-3 space-y-1.5 font-mono text-[10px]">
            <span className="text-[#E9E7E1]/70 font-bold block uppercase border-b border-[#E9E7E1]/15 pb-1">
              📡 REAL-TIME DRONE COMMAND LOGS
            </span>
            <div className="space-y-1 text-[#E9E7E1]/85 max-h-24 overflow-y-auto">
              {logs.map((log, idx) => (
                <p key={idx} className="leading-tight">{log}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
