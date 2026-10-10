"use client";

import React, { useState } from "react";
import Link from "next/link";
import { recordOfflineUsage } from "@/lib/offline-usage";

interface SubmittedIncident {
  id?: number | string;
  [key: string]: unknown;
}

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (incident: SubmittedIncident) => void;
  apiBaseUrl?: string;
}

export function SOSModal({ isOpen, onClose, onSuccess, apiBaseUrl = "" }: SOSModalProps) {
  const [emergencyType, setEmergencyType] = useState("Medical Emergency");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdIncident, setCreatedIncident] = useState<SubmittedIncident | null>(null);
  const [locationPoint, setLocationPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState("");
  const [formError, setFormError] = useState("");
  const [peopleCount, setPeopleCount] = useState(1);
  const [needs, setNeeds] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!navigator.onLine) {
      recordOfflineUsage("offline_sos_blocked");
      setFormError("Your SOS was not sent because this device is offline. Call 112 directly for immediate help.");
      return;
    }
    setIsSubmitting(true);
    setFormError("");

    const payload = {
      type: emergencyType.toUpperCase().replace(/\s+/g, "_"),
      description: `${description || "Emergency SOS distress signal received."} | People: ${peopleCount} | Needs: ${needs.length ? needs.join(", ") : "None specified"} | Location: ${location}`,
      contactNumber,
      latitude: locationPoint?.latitude,
      longitude: locationPoint?.longitude,
      severity: "CRITICAL",
      priority: "CRITICAL",
    };

    try {
      const res = await fetch(`${apiBaseUrl}/api/incidents`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(localStorage.getItem("dr_token") ? { Authorization: `Bearer ${localStorage.getItem("dr_token")}` } : {}) },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data: SubmittedIncident = await res.json();
        setCreatedIncident(data);
        if (onSuccess) onSuccess(data);
      } else {
        const response = await res.json().catch(() => null);
        setFormError(response?.message || "Your SOS could not be submitted. Please call 112 if you need immediate help.");
      }
    } catch {
      setFormError("We could not reach the emergency service. Your SOS was not sent. Please call 112 for immediate help.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const detectLocation = () => {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Location detection is not available on this device. Enter your location manually.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setLocationPoint({ latitude: coords.latitude, longitude: coords.longitude }); setLocation(`GPS ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`); },
      () => setLocationError("Location permission was not available. Enter your location manually."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-[#E4E7EC] rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 font-bold p-1.5 rounded-lg z-10"
        >
          ✕
        </button>

        {createdIncident ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto">
              ✓
            </div>
            <h3 className="text-xl font-extrabold text-[#172033]">Emergency Request Created</h3>
            <p className="text-xs text-[#667085]">Your report was accepted by the application service.</p>
            <div className="rounded-xl bg-slate-50 p-4 text-sm"><p>Incident ID: <strong className="font-mono text-[#1677FF]">DR-{createdIncident.id}</strong></p><p className="mt-1">Priority: <strong>CRITICAL</strong></p><p className="mt-1">Status: <strong>REPORTED</strong></p></div>
            <div className="pt-4 border-t border-[#E4E7EC]">
              <Link href={`/incidents/${createdIncident.id}`} onClick={onClose} className="mr-2 inline-flex min-h-10 items-center rounded-xl bg-[#1677FF] px-4 text-xs font-bold text-white hover:bg-blue-700">Track incident</Link>
              <button
                onClick={() => {
                  setCreatedIncident(null);
                  onClose();
                }}
                className="bg-[#1677FF] hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 min-h-[460px]">
            {/* Left Column matching Sub-screen 6 */}
            <div className="md:col-span-2 bg-slate-50 border-r border-[#E4E7EC] p-8 flex flex-col items-center justify-center text-center space-y-4">
              {/* Circular Red Siren Badge */}
              <div className="relative w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-red-200 animate-ping opacity-75" />
                <div className="w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xl shadow-lg relative z-10">
                  SOS
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-[#172033]">Your safety is our priority</h3>
                <p className="text-xs text-[#667085] leading-relaxed">
                  Share clear details so the report can be reviewed and routed.
                </p>
              </div>
            </div>

            {/* Right Form Column matching Sub-screen 6 */}
            <form onSubmit={handleSubmit} className="md:col-span-3 p-8 space-y-4 flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-[#172033]">Send SOS</h2>
                <p className="text-xs text-[#1677FF] font-medium">Get immediate help from nearby responders</p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#667085] font-bold mb-1">Emergency Type</label>
                  <select
                    value={emergencyType}
                    onChange={(e) => setEmergencyType(e.target.value)}
                    className="w-full bg-slate-50 border border-[#E4E7EC] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-[#1677FF] font-medium"
                  >
                    <option value="Medical Emergency">Medical Emergency</option>
                    <option value="Flood">Flood</option>
                    <option value="Cyclone">Cyclone</option>
                    <option value="Fire">Fire</option>
                    <option value="Earthquake">Earthquake</option>
                    <option value="Landslide">Landslide</option>
                    <option value="Road Accident">Road accident</option>
                    <option value="Chemical Emergency">Chemical emergency</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#667085] font-bold mb-1">Description</label>
                  <textarea
                    placeholder="Describe your emergency..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    maxLength={1200}
                    className="w-full bg-slate-50 border border-[#E4E7EC] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-[#1677FF] font-medium resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[#667085] font-bold mb-1">Location</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Enter location"
                      value={location}
                      onChange={(e) => { setLocation(e.target.value); setLocationPoint(null); }}
                      className="w-full bg-slate-50 border border-[#E4E7EC] rounded-xl pl-3 pr-8 py-2 text-[#172033] focus:outline-none focus:border-[#1677FF] font-medium"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-400 text-xs">📍</span>
                  </div>
                  <button type="button" onClick={detectLocation} className="mt-2 rounded-lg border border-[#E4E7EC] px-3 py-2 text-[11px] font-bold text-[#1677FF] hover:bg-blue-50">Use my current location</button>
                  {locationError && <p role="status" className="mt-1 text-[11px] text-amber-700">{locationError}</p>}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block text-[#667085] font-bold">People needing help
                    <input type="number" min="1" max="100" value={peopleCount} onChange={(event) => setPeopleCount(Number(event.target.value))} className="mt-1 w-full rounded-xl border border-[#E4E7EC] bg-slate-50 px-3 py-2 text-[#172033]" />
                  </label>
                  <fieldset className="space-y-1 text-[#667085]"><legend className="mb-1 font-bold">Additional needs</legend>{["Children", "Elderly", "Injured"].map((need) => <label key={need} className="flex items-center gap-2"><input type="checkbox" checked={needs.includes(need)} onChange={(event) => setNeeds((previous) => event.target.checked ? [...previous, need] : previous.filter((item) => item !== need))} />{need}</label>)}</fieldset>
                </div>

                <div>
                  <label className="block text-[#667085] font-bold mb-1">Contact Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      placeholder="Enter phone number"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-[#E4E7EC] rounded-xl pl-3 pr-8 py-2 text-[#172033] focus:outline-none focus:border-[#1677FF] font-medium"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-400 text-xs">📞</span>
                  </div>
                </div>
              </div>

              {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{formError}</p>}

              {/* Red Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#DC2626] hover:bg-red-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                <span>📞</span> {isSubmitting ? "Sending..." : "Send SOS"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
