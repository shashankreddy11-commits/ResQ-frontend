"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AlertRecord = { id: number; title?: string; message?: string; severity?: string; disasterType?: string; targetArea?: string; startTime?: string; expiryTime?: string };
const apiBaseUrl = "";
const severities = ["ALL", "CRITICAL", "HIGH", "MODERATE", "LOW"];
const hazards = ["ALL", "FLOOD", "CYCLONE", "EARTHQUAKE", "FIRE", "LANDSLIDE", "HEATWAVE", "LIGHTNING", "OTHER"];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [severity, setSeverity] = useState("ALL");
  const [hazard, setHazard] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(0);

  useEffect(() => {
    const clock = window.setTimeout(() => setNow(Date.now()), 0);
    const clockInterval = window.setInterval(() => setNow(Date.now()), 60_000);
    const controller = new AbortController();
    fetch(`${apiBaseUrl}/api/alerts`, { signal: controller.signal, cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<AlertRecord[]> : Promise.reject(new Error("The alert service is unavailable.")))
      .then((data) => { if (!controller.signal.aborted) setAlerts(Array.isArray(data) ? data : []); })
      .catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Unable to load alerts. Check the Java API and retry."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); window.clearTimeout(clock); window.clearInterval(clockInterval); };
  }, []);

  const activeAlerts = alerts.filter((item) => !item.expiryTime || (now > 0 && new Date(item.expiryTime).getTime() > now));
  const filtered = useMemo(() => activeAlerts.filter((item) => {
    const itemSeverity = (item.severity || "LOW").toUpperCase();
    const itemHazard = (item.disasterType || "OTHER").toUpperCase();
    const severityMatches = severity === "ALL" || (severity === "MODERATE" ? ["MEDIUM", "MODERATE"].includes(itemSeverity) : itemSeverity === severity);
    const hazardMatches = hazard === "ALL" || itemHazard.includes(hazard);
    return severityMatches && hazardMatches;
  }), [activeAlerts, severity, hazard]);

  return <div className="space-y-5">
    <header><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">Public safety notices</p><h1 className="mt-1 text-3xl font-extrabold">Alerts</h1><p className="mt-2 text-sm text-slate-600">Active alert records from the Java API. Weather estimates are marked separately from official notices.</p></header>
    <section className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">Severity<select value={severity} onChange={(event) => setSeverity(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200">{severities.map((item) => <option key={item} value={item}>{item === "ALL" ? "All severities" : item}</option>)}</select></label><label className="text-sm font-semibold">Hazard<select value={hazard} onChange={(event) => setHazard(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200">{hazards.map((item) => <option key={item} value={item}>{item === "ALL" ? "All hazards" : item}</option>)}</select></label></section>
    {loading && <p role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading active alerts…</p>}
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{error}<button onClick={() => window.location.reload()} className="ml-2 font-bold underline">Retry</button></div>}
    {!loading && !error && !filtered.length && <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">{activeAlerts.length ? "No alerts match these filters." : "No active alerts have been published."}</div>}
    <div className="space-y-3">{filtered.map((item) => {
      const level = (item.severity || "LOW").toUpperCase();
      const tone = level === "CRITICAL" || level === "HIGH" || level === "SEVERE" ? "bg-red-50 text-red-800" : level === "MODERATE" || level === "MEDIUM" ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-800";
      return <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{(item.disasterType || "OTHER").replaceAll("_", " ")}</p><h2 className="mt-1 text-lg font-extrabold text-slate-950">{item.title || "Public safety alert"}</h2><p className="mt-1 text-sm text-slate-600">{item.targetArea || "Affected area not specified"} · {item.startTime ? new Date(item.startTime).toLocaleString() : "Issue time unavailable"}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${tone}`}>{level}</span></div><p className="mt-3 text-sm leading-6 text-slate-700">{item.message || "Follow guidance from local authorities."}</p><Link href={`/alerts/${item.id}`} className="mt-3 inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-bold text-blue-700 hover:bg-blue-50">View details →</Link></article>;
    })}</div>
    <p className="text-xs text-slate-500">Follow official local authority instructions for emergency decisions.</p>
  </div>;
}
