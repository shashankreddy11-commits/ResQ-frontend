"use client";

import { useEffect, useState } from "react";

type Preferences = { browserNotifications: boolean; temperatureUnit: "C" | "F"; language: "English" | "Hindi" | "Telugu" };
const defaults: Preferences = { browserNotifications: false, temperatureUnit: "C", language: "English" };

export default function SettingsPage() {
  const [preferences, setPreferences] = useState(defaults);
  const [message, setMessage] = useState("");
  useEffect(() => { const timer = window.setTimeout(() => { try { const saved = JSON.parse(localStorage.getItem("dr_settings") || "{}") as Partial<Preferences>; setPreferences({ ...defaults, ...saved }); } catch { localStorage.removeItem("dr_settings"); } }, 0); return () => window.clearTimeout(timer); }, []);
  const save = (next: Preferences) => { setPreferences(next); localStorage.setItem("dr_settings", JSON.stringify(next)); setMessage("Preferences saved on this device."); };
  const enableNotifications = async (enabled: boolean) => {
    if (enabled && "Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setMessage("Browser notification permission was not granted."); return; }
    }
    if (enabled && !("Notification" in window)) { setMessage("This browser does not support desktop notifications."); return; }
    save({ ...preferences, browserNotifications: enabled });
  };
  return <div className="mx-auto max-w-3xl space-y-5"><header><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">Personalize</p><h1 className="mt-1 text-3xl font-extrabold">Settings</h1><p className="mt-2 text-sm text-slate-600">These preferences are saved in this browser.</p></header>
    <section className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4 py-5"><div><h2 className="font-bold">Browser notifications</h2><p className="mt-1 text-sm text-slate-600">Allow this site to show alerts while it is open.</p></div><button type="button" aria-pressed={preferences.browserNotifications} onClick={() => void enableNotifications(!preferences.browserNotifications)} className={`min-h-11 rounded-xl px-4 text-sm font-bold ${preferences.browserNotifications ? "bg-emerald-100 text-emerald-900" : "bg-slate-100 text-slate-800"}`}>{preferences.browserNotifications ? "Enabled" : "Enable"}</button></div>
      <label className="grid gap-1 py-5 text-sm font-bold sm:grid-cols-[1fr_220px] sm:items-center">Temperature units<select value={preferences.temperatureUnit} onChange={(event) => save({ ...preferences, temperatureUnit: event.target.value as Preferences["temperatureUnit"] })} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 font-normal"><option value="C">Celsius (°C)</option><option value="F">Fahrenheit (°F)</option></select></label>
      <label className="grid gap-1 py-5 text-sm font-bold sm:grid-cols-[1fr_220px] sm:items-center">Language<select value={preferences.language} onChange={(event) => save({ ...preferences, language: event.target.value as Preferences["language"] })} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 font-normal"><option>English</option><option>Hindi</option><option>Telugu</option></select></label></section>
    {message && <p role="status" className="text-sm text-slate-600">{message}</p>}
    <p className="text-xs text-slate-500">A theme setting is not shown because the current product shell has a single light theme.</p>
  </div>;
}
