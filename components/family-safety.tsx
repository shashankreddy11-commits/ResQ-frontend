"use client";

import React, { useState } from "react";

interface FamilyMember {
  id: number;
  name: string;
  relation: string;
  status: "SAFE" | "SHELTER A" | "RESPONDER EN ROUTE" | "DISPATCH REQUIRED";
  location: string;
  lastCheckin: string;
  phone: string;
}

export function FamilySafety() {
  const [members, setMembers] = useState<FamilyMember[]>([
    { id: 1, name: "Robert Vance", relation: "Father", status: "SAFE", location: "Home Sector 4 (Evacuated High Ground)", lastCheckin: "2 mins ago", phone: "+1 555-0182" },
    { id: 2, name: "Eleanor Vance", relation: "Mother", status: "SHELTER A", location: "Northside Central Relief Hub (Bed #104)", lastCheckin: "8 mins ago", phone: "+1 555-0199" },
    { id: 3, name: "Lucas Vance", relation: "Brother", status: "RESPONDER EN ROUTE", location: "Sector 2 Maritime Boat Unit #04", lastCheckin: "Just now", phone: "+1 555-0143" },
  ]);

  const [newName, setNewName] = useState("");
  const [newRelation, setNewRelation] = useState("Relative");
  const [newPhone, setNewPhone] = useState("");

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const created: FamilyMember = {
      id: Date.now(),
      name: newName,
      relation: newRelation,
      status: "SAFE",
      location: "Verified Satellite Ping - Zone 4",
      lastCheckin: "Just registered",
      phone: newPhone || "+1 555-0000",
    };
    setMembers((prev) => [...prev, created]);
    setNewName("");
    setNewPhone("");
  };

  return (
    <div className="bg-[#0c1322] border border-slate-800 p-6 rounded-2xl space-y-5 shadow-2xl">
      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider block">CIVILIAN PROTECTION NETWORK</span>
          <h3 className="text-xl font-black text-white">Family Safety & Check-In Tracker</h3>
          <p className="text-xs text-slate-400">Monitor live rescue and shelter status for registered family members.</p>
        </div>
        <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-3 py-1.5 rounded-lg font-mono font-bold">
          ● {members.length} Members Monitored
        </span>
      </div>

      {/* Register Family Member Form */}
      <form onSubmit={handleAddMember} className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-3">
        <h4 className="text-xs font-bold text-cyan-400 uppercase">Register New Family Member</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            required
            placeholder="Full Name (e.g. Eleanor Vance)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-white rounded p-2 text-xs"
          />
          <select
            value={newRelation}
            onChange={(e) => setNewRelation(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-white rounded p-2 text-xs"
          >
            <option value="Father">Father</option>
            <option value="Mother">Mother</option>
            <option value="Brother">Brother</option>
            <option value="Sister">Sister</option>
            <option value="Spouse">Spouse</option>
            <option value="Child">Child</option>
            <option value="Relative">Relative / Friend</option>
          </select>
          <input
            type="tel"
            placeholder="Mobile Phone Number"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-white rounded p-2 text-xs"
          />
        </div>
        <div className="flex justify-end">
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded transition">
            + Add Family Member To Watchlist
          </button>
        </div>
      </form>

      {/* Family Members Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {members.map((m) => {
          const statusColor =
            m.status === "SAFE"
              ? "bg-emerald-950 text-emerald-400 border-emerald-500/40"
              : m.status === "SHELTER A"
              ? "bg-cyan-950 text-cyan-400 border-cyan-500/40"
              : "bg-amber-950 text-amber-400 border-amber-500/40";

          return (
            <div key={m.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-extrabold text-white text-sm">{m.name}</h4>
                  <span className="text-[11px] text-slate-400 font-medium">{m.relation}</span>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded border ${statusColor}`}>
                  {m.status}
                </span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 text-xs space-y-1">
                <p className="text-slate-300">📍 Location: <strong className="text-white">{m.location}</strong></p>
                <p className="text-slate-400 text-[11px]">🕒 Last Check-in: {m.lastCheckin}</p>
                <p className="text-slate-400 text-[11px]">📞 Phone: {m.phone}</p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => alert(`Sending SOS Check-in ping to ${m.name}...`)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-1.5 rounded"
                >
                  Ping Location
                </button>
                <button
                  onClick={() => alert(`Requesting Emergency Assistance for ${m.name}...`)}
                  className="w-full bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/30 font-bold text-xs py-1.5 rounded"
                >
                  Request Aid
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
