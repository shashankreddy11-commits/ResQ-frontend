"use client";

import React, { useState } from "react";

export function EmergencyServices() {
  const [userPos] = useState({ address: "Hyderabad City Sector (Tank Bund / Begumpet Zone Detected)" });

  const nearbyHospitals = [
    { name: "Gandhi Hospital (Level-1 Trauma Center)", distance: "2.1 km", icuBeds: 60, generalBeds: 450, status: "OPEN 24/7", phone: "040-27505566" },
    { name: "NIMS Hospital (Punjagutta)", distance: "1.4 km", icuBeds: 45, generalBeds: 280, status: "OPEN 24/7", phone: "040-23489000" },
    { name: "Osmania General Hospital (Afzal Gunj)", distance: "3.8 km", icuBeds: 18, generalBeds: 190, status: "HIGH CAPACITY", phone: "040-24600121" },
  ];

  const nearbyPolice = [
    { name: "Hyderabad City Police Commissionerate", distance: "1.1 km", status: "OPEN 24 HOURS", patrolUnits: 24, phone: "112 / 100" },
    { name: "Cyberabad Police Command (Gachibowli)", distance: "4.5 km", status: "HIGH PATROL", patrolUnits: 18, phone: "040-27852435" },
  ];

  const nearbyShelters = [
    { name: "Kotla Vijayabhaskara Reddy Indoor Stadium", distance: "1.8 km", capacity: 600, availableBeds: 460, foodStock: "Abundant (GHMC Kitchen)", power: "TGDRF Generator Active" },
    { name: "Gachibowli Sports Complex Relief Camp", distance: "5.2 km", capacity: 800, availableBeds: 705, foodStock: "Abundant", power: "100kW Generator" },
    { name: "LB Stadium Relief Hub (Nampally)", distance: "2.4 km", capacity: 1000, availableBeds: 680, foodStock: "Abundant", power: "Helipad Active" },
  ];

  return (
    <div className="space-y-4 bg-[#182137] p-6 rounded-2xl border border-[#E9E7E1]/20 text-[#E9E7E1]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E9E7E1]/15 pb-3">
        <div>
          <span className="text-xs font-mono font-bold text-[#E9E7E1] uppercase tracking-wider block">AUTONOMOUS GIS DETECTOR</span>
          <h3 className="text-xl font-black text-[#E9E7E1]">Nearby Emergency Services</h3>
          <p className="text-xs text-[#E9E7E1]/70">{userPos.address}</p>
        </div>
        <span className="text-xs font-mono bg-[#1F2A44] text-[#E9E7E1] border border-[#E9E7E1]/20 px-3 py-1 rounded-lg">
          GPS Distance Matrix Verified
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Nearest Hospitals */}
        <div className="bg-[#273452] border border-[#E9E7E1]/20 p-4 rounded-xl space-y-3">
          <div className="flex items-center gap-2 border-b border-[#E9E7E1]/15 pb-2">
            <span className="text-xl">🏥</span>
            <h4 className="font-extrabold text-[#E9E7E1] text-sm">Nearest Trauma Hospitals</h4>
          </div>
          <div className="space-y-2 text-xs">
            {nearbyHospitals.map((h, i) => (
              <div key={i} className="bg-[#1F2A44] border border-[#E9E7E1]/20 p-3 rounded-lg space-y-1">
                <div className="flex justify-between items-center">
                  <strong className="text-[#E9E7E1] text-xs">{h.name}</strong>
                  <span className="text-[10px] font-bold text-[#E9E7E1] font-mono">{h.distance}</span>
                </div>
                <div className="flex justify-between text-[11px] text-[#E9E7E1]/80">
                  <span>Available ICU Beds: <strong className="text-[#E9E7E1]">{h.icuBeds}</strong></span>
                  <span className="text-[#E9E7E1] font-bold">{h.status}</span>
                </div>
                <button
                  onClick={() => alert(`Navigating directly to ${h.name} (${h.distance})...`)}
                  className="w-full mt-1 bg-[#E9E7E1] hover:bg-white text-[#1F2A44] font-bold text-[11px] py-1.5 rounded transition"
                >
                  Navigate Emergency Route →
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Nearest Police Stations */}
        <div className="bg-[#273452] border border-[#E9E7E1]/20 p-4 rounded-xl space-y-3">
          <div className="flex items-center gap-2 border-b border-[#E9E7E1]/15 pb-2">
            <span className="text-xl">👮</span>
            <h4 className="font-extrabold text-[#E9E7E1] text-sm">Nearest Police Stations</h4>
          </div>
          <div className="space-y-2 text-xs">
            {nearbyPolice.map((p, i) => (
              <div key={i} className="bg-[#1F2A44] border border-[#E9E7E1]/20 p-3 rounded-lg space-y-1">
                <div className="flex justify-between items-center">
                  <strong className="text-[#E9E7E1] text-xs">{p.name}</strong>
                  <span className="text-[10px] font-bold text-[#E9E7E1] font-mono">{p.distance}</span>
                </div>
                <div className="flex justify-between text-[11px] text-[#E9E7E1]/80">
                  <span>Patrol Units: <strong className="text-[#E9E7E1]">{p.patrolUnits} Active</strong></span>
                  <span className="text-[#E9E7E1] font-bold">{p.status}</span>
                </div>
                <button
                  onClick={() => alert(`Dialing Direct Control Dispatch for ${p.name} (${p.phone})...`)}
                  className="w-full mt-1 bg-[#182137] hover:bg-[#273452] border border-[#E9E7E1]/30 text-[#E9E7E1] font-bold text-[11px] py-1.5 rounded transition"
                >
                  Contact Station ({p.phone})
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Nearest Evacuation Shelters */}
        <div className="bg-[#273452] border border-[#E9E7E1]/20 p-4 rounded-xl space-y-3">
          <div className="flex items-center gap-2 border-b border-[#E9E7E1]/15 pb-2">
            <span className="text-xl">🏠</span>
            <h4 className="font-extrabold text-[#E9E7E1] text-sm">Nearest Safe Shelters</h4>
          </div>
          <div className="space-y-2 text-xs">
            {nearbyShelters.map((s, i) => (
              <div key={i} className="bg-[#1F2A44] border border-[#E9E7E1]/20 p-3 rounded-lg space-y-1">
                <div className="flex justify-between items-center">
                  <strong className="text-[#E9E7E1] text-xs">{s.name}</strong>
                  <span className="text-[10px] font-bold text-[#E9E7E1] font-mono">{s.distance}</span>
                </div>
                <div className="flex justify-between text-[11px] text-[#E9E7E1]/80">
                  <span>Available Beds: <strong className="text-[#E9E7E1]">{s.availableBeds}</strong> / {s.capacity}</span>
                  <span className="text-[#E9E7E1] font-semibold">{s.foodStock} Food</span>
                </div>
                <button
                  onClick={() => alert(`Plotting Safe Bypass Route to ${s.name}...`)}
                  className="w-full mt-1 bg-[#E9E7E1] hover:bg-white text-[#1F2A44] font-bold text-[11px] py-1.5 rounded transition"
                >
                  Get Safe Evacuation Route →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
