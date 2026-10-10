"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { WebSocketResponder } from "@/components/websocket-responder";

type Incident = { id: number; type?: string; description?: string; priority?: string; severity?: string; status?: string; assignedResponder?: string; latitude?: number; longitude?: number };
type Unit = { id: number; unitCode?: string; unitName?: string; agencyType?: string; status?: string; latitude?: number; longitude?: number; lastPingTime?: string };
const apiBaseUrl = "";

export default function RespondersPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    Promise.allSettled([fetch(`${apiBaseUrl}/api/incidents`, { signal: controller.signal, cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<Incident[]> : Promise.reject()), fetch(`${apiBaseUrl}/api/responders`, { signal: controller.signal, cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<Unit[]> : Promise.reject())]).then(([incidentResult, unitResult]) => {
      if (controller.signal.aborted) return;
      setIncidents(incidentResult.status === "fulfilled" && Array.isArray(incidentResult.value) ? incidentResult.value : []);
      setUnits(unitResult.status === "fulfilled" && Array.isArray(unitResult.value) ? unitResult.value : []);
      setError(incidentResult.status === "rejected" && unitResult.status === "rejected" ? `Responder data could not be loaded. Check the Java API at ${apiBaseUrl}.` : incidentResult.status === "rejected" || unitResult.status === "rejected" ? "Some responder data sources are unavailable." : "");
      setLoading(false);
    });
    return () => controller.abort();
  }, []);
  const active = incidents.filter((item) => !["RESOLVED", "CLOSED"].includes((item.status || "").toUpperCase()));
  const assigned = active.filter((item) => item.assignedResponder);
  const onsite = active.filter((item) => ["ON SITE", "ON_SITE", "ASSESSING", "RESCUE"].includes((item.status || "").toUpperCase()));
  const resolved = incidents.filter((item) => ["RESOLVED", "CLOSED"].includes((item.status || "").toUpperCase()));
  return <div className="space-y-5"><header><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">Field operations</p><h1 className="mt-1 text-3xl font-extrabold">Responders and missions</h1><p className="mt-2 text-sm text-slate-600">Missions link to the same incident records used by citizens and the EOC.</p></header>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric title="Active missions" value={loading ? "—" : String(active.length)} /><Metric title="Assigned" value={loading ? "—" : String(assigned.length)} /><Metric title="On site" value={loading ? "—" : String(onsite.length)} /><Metric title="Resolved" value={loading ? "—" : String(resolved.length)} /></div>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-extrabold">Field units</h2><p className="mt-1 text-xs text-slate-500">Reported availability and location telemetry</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{units.length} units</span></div>
      {units.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{units.map((unit) => <article key={unit.id} className="rounded-xl border border-slate-200 p-4"><div className="flex justify-between gap-2"><h3 className="font-bold">{unit.unitName || unit.unitCode || `Unit ${unit.id}`}</h3><span className="text-xs font-bold text-blue-800">{unit.status || "UNKNOWN"}</span></div><p className="mt-1 text-xs text-slate-600">{unit.agencyType || "Agency not listed"} · {unit.unitCode || `ID ${unit.id}`}</p><p className="mt-2 text-xs text-slate-500">{unit.latitude != null && unit.longitude != null ? `${unit.latitude.toFixed(4)}, ${unit.longitude.toFixed(4)}` : "Location not reported"}</p><p className="mt-1 text-[11px] text-slate-500">Last update: {unit.lastPingTime ? new Date(unit.lastPingTime).toLocaleString() : "Unavailable"}</p></article>)}</div> : !loading && <p className="mt-4 text-sm text-slate-600">No field units are listed by the service.</p>}
    </section>
    <section><div className="mb-3"><h2 className="text-lg font-extrabold">Incident missions</h2><p className="mt-1 text-sm text-slate-600">Open an incident to accept, navigate, arrive, and update its shared status.</p></div>{loading && <p role="status" className="rounded-xl bg-white p-5 text-sm text-slate-600">Loading missions…</p>}{error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error} <button onClick={() => window.location.reload()} className="font-bold underline">Retry</button></div>}{!loading && !error && !active.length && <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No active incidents need a response.</p>}
      <div className="grid gap-3 lg:grid-cols-2">{active.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs font-bold text-blue-700">DR-{item.id}</p><h3 className="mt-1 font-extrabold">{(item.type || "Emergency").replaceAll("_", " ")}</h3></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">{item.priority || item.severity || "UNASSESSED"}</span></div><p className="mt-2 text-sm text-slate-600">{item.description || "Location details not provided"}</p><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold text-slate-600">{(item.status || "REPORTED").replaceAll("_", " ")} · {item.assignedResponder || "Unassigned"}</span><Link href={`/missions/${item.id}`} className="inline-flex min-h-10 items-center rounded-lg bg-blue-700 px-3 text-xs font-bold text-white hover:bg-blue-800">Open mission</Link></div></article>)}</div>
    </section>
    <WebSocketResponder />
  </div>;
}
function Metric({ title, value }: { title: string; value: string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-600">{title}</p><p className="mt-2 text-2xl font-extrabold">{value}</p></div>; }
