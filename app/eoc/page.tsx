"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Incident = { id: number; type?: string; description?: string; severity?: string; priority?: string; status?: string; assignedResponder?: string; assignedShelter?: string; updatedAt?: string };
type Responder = { id: number; unitCode?: string; unitName?: string; agencyType?: string; status?: string };
type Shelter = { capacity?: number; occupancy?: number; status?: string };
type Resource = { name?: string; quantityAvailable?: number };
type Alert = { severity?: string; expiryTime?: string };
const apiBaseUrl = "";
const activeStatuses = ["REPORTED", "CONTROL_ROOM_ALERTED", "VERIFIED", "PRIORITIZED", "RESPONDERS_DISPATCHED", "ASSIGNED", "ACCEPTED", "NAVIGATING", "RESPONDING", "EN_ROUTE", "ON SITE", "ON_SITE", "ASSESSING", "RESCUE", "IN_PROGRESS", "SHELTER_GUIDED"];

export default function EocPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [responders, setResponders] = useState<Responder[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [assignments, setAssignments] = useState<Record<number, string>>({});
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(0);
  const load = async (signal?: AbortSignal) => {
    const result = await Promise.allSettled([
      fetch(`${apiBaseUrl}/api/incidents`, { signal, cache: "no-store" }).then((r) => r.ok ? r.json() as Promise<Incident[]> : Promise.reject()),
      fetch(`${apiBaseUrl}/api/responders`, { signal, cache: "no-store" }).then((r) => r.ok ? r.json() as Promise<Responder[]> : Promise.reject()),
      fetch(`${apiBaseUrl}/api/shelters`, { signal, cache: "no-store" }).then((r) => r.ok ? r.json() as Promise<Shelter[]> : Promise.reject()),
      fetch(`${apiBaseUrl}/api/resources`, { signal, cache: "no-store" }).then((r) => r.ok ? r.json() as Promise<Resource[]> : Promise.reject()),
      fetch(`${apiBaseUrl}/api/alerts`, { signal, cache: "no-store" }).then((r) => r.ok ? r.json() as Promise<Alert[]> : Promise.reject()),
    ]);
    if (signal?.aborted) return;
    setIncidents(result[0].status === "fulfilled" && Array.isArray(result[0].value) ? result[0].value : []); setResponders(result[1].status === "fulfilled" && Array.isArray(result[1].value) ? result[1].value : []); setShelters(result[2].status === "fulfilled" && Array.isArray(result[2].value) ? result[2].value : []); setResources(result[3].status === "fulfilled" && Array.isArray(result[3].value) ? result[3].value : []); setAlerts(result[4].status === "fulfilled" && Array.isArray(result[4].value) ? result[4].value : []);
    const failures = result.filter((item) => item.status === "rejected").length; setError(failures ? `${failures} operational source${failures === 1 ? " is" : "s are"} unavailable; values shown are from available sources.` : ""); setLoading(false);
  };
  useEffect(() => { const controller = new AbortController(); const initial = window.setTimeout(() => { setNow(Date.now()); void load(controller.signal); }, 0); return () => { controller.abort(); window.clearTimeout(initial); }; }, []);
  const active = useMemo(() => incidents.filter((item) => activeStatuses.includes((item.status || "REPORTED").toUpperCase())), [incidents]);
  const critical = active.filter((item) => ["CRITICAL", "HIGHEST"].includes((item.priority || item.severity || "").toUpperCase()));
  const high = active.filter((item) => ["HIGH", "URGENT"].includes((item.priority || item.severity || "").toUpperCase()));
  const availableTeams = responders.filter((item) => /AVAILABLE|READY/i.test(item.status || "")).length;
  const affectedPopulation = active.reduce((sum, item) => { const match = item.description?.match(/People:\s*(\d+)/i); return sum + (match ? Number(match[1]) : 0); }, 0);
  const capacity = shelters.reduce((sum, item) => sum + (item.capacity || 0), 0);
  const occupied = shelters.reduce((sum, item) => sum + (item.occupancy || 0), 0);
  const availableResources = resources.reduce((sum, item) => sum + (item.quantityAvailable || 0), 0);
  const activeAlerts = alerts.filter((item) => !item.expiryTime || (now > 0 && new Date(item.expiryTime).getTime() > now)).length;
  const advance = (status: string) => status === "REPORTED" ? "VERIFIED" : status === "CONTROL_ROOM_ALERTED" || status === "VERIFIED" ? "PRIORITIZED" : status === "PRIORITIZED" ? "ASSIGNED" : status === "ASSIGNED" || status === "RESPONDERS_DISPATCHED" ? "RESPONDING" : status === "RESPONDING" || status === "EN_ROUTE" || status === "ACCEPTED" || status === "NAVIGATING" ? "ON_SITE" : status === "ON_SITE" ? "RESCUE" : status === "RESCUE" || status === "ASSESSING" || status === "IN_PROGRESS" || status === "SHELTER_GUIDED" ? "RESOLVED" : null;
  const update = async (incident: Incident, status: string, assignedResponder?: string) => {
    setBusyId(incident.id); setError(""); setMessage("");
    try { const token = localStorage.getItem("dr_token"); const response = await fetch(`${apiBaseUrl}/api/incidents/${incident.id}/status`, { method: "PUT", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ status, assignedResponder, remarks: `EOC updated the incident to ${status.replaceAll("_", " ")}.` }) }); if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Your account cannot update incident records." : "The incident status update was rejected."); const saved: Incident = await response.json(); setIncidents((current) => current.map((item) => item.id === saved.id ? saved : item)); setMessage(`DR-${saved.id} updated to ${status.replaceAll("_", " ")}.`); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Update failed."); }
    finally { setBusyId(null); }
  };
  return <div className="space-y-5"><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">Emergency Operations Center</p><h1 className="mt-1 text-3xl font-extrabold">Command desk</h1><p className="mt-2 text-sm text-slate-600">Verify reports, set priority, assign units, and track incident progress.</p></div><Link href="/live-situation" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold">Open live situation map</Link></header>
    {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error}{incidents.length === 0 && <button onClick={() => void load()} className="ml-2 font-bold underline">Retry</button>}</div>}{message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Total incidents", incidents.length], ["Critical", critical.length], ["High", high.length], ["Active teams", responders.length], ["Affected people", affectedPopulation], ["Shelter capacity", capacity], ["Available resources", availableResources], ["Active alerts", activeAlerts]].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-2 text-2xl font-extrabold">{loading ? "—" : Number(value).toLocaleString()}</p></div>)}</section>
    <section className="grid gap-4 lg:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-extrabold">Critical incidents</h2>{critical.length ? critical.slice(0, 5).map((item) => <Link key={item.id} href={`/incidents/${item.id}`} className="mt-3 block rounded-xl border border-red-100 bg-red-50 p-3"><span className="font-mono text-xs font-bold">DR-{item.id}</span><span className="ml-2 text-xs font-bold text-red-800">{item.type || "Emergency"}</span><p className="mt-1 line-clamp-2 text-xs text-slate-600">{item.description || "No location details provided"}</p></Link>) : <p className="mt-2 text-sm text-slate-500">No critical active records.</p>}</div><div className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-extrabold">Team availability</h2><p className="mt-3 text-3xl font-extrabold">{loading ? "—" : availableTeams}<span className="ml-2 text-sm font-semibold text-slate-500">available / {responders.length} units</span></p><Link href="/responders" className="mt-2 inline-flex min-h-10 items-center text-sm font-bold text-blue-700">View team telemetry →</Link></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-extrabold">Shelter status</h2><p className="mt-3 text-3xl font-extrabold">{loading ? "—" : Math.max(0, capacity - occupied).toLocaleString()}<span className="ml-2 text-sm font-semibold text-slate-500">places available</span></p><Link href="/shelters" className="mt-2 inline-flex min-h-10 items-center text-sm font-bold text-blue-700">Review shelters →</Link></div></section>
    <section className="space-y-3"><div><h2 className="text-lg font-extrabold">Incident queue</h2><p className="mt-1 text-sm text-slate-600">Actions write status changes to the shared Java API incident record.</p></div>{loading && <p role="status" className="rounded-xl bg-white p-5 text-sm">Loading command data…</p>}{!loading && active.length === 0 && <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No active incidents.</p>}
      {active.map((item) => { const status = (item.status || "REPORTED").toUpperCase().replaceAll(" ", "_"); const next = advance(status); return <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><Link href={`/incidents/${item.id}`} className="font-mono text-xs font-bold text-blue-700">DR-{item.id}</Link><h3 className="mt-1 font-extrabold">{(item.type || "Emergency").replaceAll("_", " ")}</h3><p className="mt-1 text-sm text-slate-600">{item.description || "No report details"}</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold">{status.replaceAll("_", " ")}</span></div><div className="mt-4 flex flex-wrap items-end gap-2">{status === "PRIORITIZED" && <label className="min-w-48 text-xs font-bold">Assign responder<select value={assignments[item.id] || item.assignedResponder || ""} onChange={(event) => setAssignments((current) => ({ ...current, [item.id]: event.target.value }))} className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm font-normal"><option value="">Choose a unit</option>{responders.map((unit) => <option key={unit.id} value={unit.unitCode || unit.unitName || `Unit ${unit.id}`}>{unit.unitName || unit.unitCode || `Unit ${unit.id}`} · {unit.status || "Unknown"}</option>)}</select></label>}{next && <button disabled={busyId === item.id || (status === "PRIORITIZED" && !assignments[item.id] && !item.assignedResponder)} onClick={() => void update(item, next, status === "PRIORITIZED" ? assignments[item.id] || item.assignedResponder : undefined)} className="min-h-10 rounded-lg bg-blue-700 px-4 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50">{busyId === item.id ? "Updating…" : status === "REPORTED" ? "Verify" : status === "VERIFIED" || status === "CONTROL_ROOM_ALERTED" ? "Prioritize" : status === "PRIORITIZED" ? "Assign team" : status === "ON_SITE" ? "Start rescue" : next === "RESOLVED" ? "Resolve" : "Advance status"}</button>}<Link href="/resources" className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-4 text-xs font-bold">Request resource</Link><Link href={`/incidents/${item.id}`} className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-4 text-xs font-bold">Details / updates</Link></div></article>; })}
    </section>
  </div>;
}
