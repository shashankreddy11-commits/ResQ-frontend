"use client";

import { useEffect, useMemo, useState } from "react";

type Incident = { id: number; type?: string; severity?: string; priority?: string; status?: string; createdAt?: string; updatedAt?: string };
type Shelter = { capacity?: number; occupancy?: number };
type Responder = { status?: string };
type OfflineUsage = { eventName: string; totalCount: number };
const apiBaseUrl = "";
async function get<T>(path: string, signal: AbortSignal): Promise<T> { const response = await fetch(`${apiBaseUrl}${path}`, { signal, cache: "no-store" }); if (!response.ok) throw new Error(path); return response.json() as Promise<T>; }

export default function AnalyticsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [responders, setResponders] = useState<Responder[]>([]);
  const [offlineUsage, setOfflineUsage] = useState<OfflineUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    Promise.allSettled([
      get<Incident[]>("/api/incidents", controller.signal),
      get<Shelter[]>("/api/shelters", controller.signal),
      get<Responder[]>("/api/responders", controller.signal),
      get<OfflineUsage[]>("/api/analytics/offline-usage", controller.signal),
    ]).then((result) => {
      if (controller.signal.aborted) return;
      setIncidents(result[0].status === "fulfilled" ? result[0].value : []); setShelters(result[1].status === "fulfilled" ? result[1].value : []); setResponders(result[2].status === "fulfilled" ? result[2].value : []); setOfflineUsage(result[3].status === "fulfilled" ? result[3].value : []);
      setError(result.every((item) => item.status === "rejected") ? "Historical data could not be loaded. Check the Java API and retry." : result.some((item) => item.status === "rejected") ? "Some data sources are unavailable; charts use available records only." : ""); setLoading(false);
    });
    return () => controller.abort();
  }, []);
  const days = useMemo(() => Array.from({ length: 7 }, (_, offset) => { const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - (6 - offset)); return date; }), []);
  const daily = days.map((day) => ({ label: day.toLocaleDateString(undefined, { weekday: "short" }), value: incidents.filter((incident) => incident.createdAt && new Date(incident.createdAt).toDateString() === day.toDateString()).length }));
  const countBy = (key: (item: Incident) => string) => Object.entries(incidents.reduce<Record<string, number>>((counts, item) => { const value = key(item); counts[value] = (counts[value] || 0) + 1; return counts; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const hazards = countBy((item) => (item.type || "OTHER").replaceAll("_", " "));
  const priority = countBy((item) => (item.priority || item.severity || "UNASSESSED").toUpperCase());
  const state = countBy((item) => (item.status || "REPORTED").replaceAll("_", " "));
  const maxDaily = Math.max(1, ...daily.map((item) => item.value));
  const freeBeds = shelters.reduce((sum, item) => sum + Math.max(0, (item.capacity || 0) - (item.occupancy || 0)), 0);
  const occupied = shelters.reduce((sum, item) => sum + (item.occupancy || 0), 0);
  const capacity = shelters.reduce((sum, item) => sum + (item.capacity || 0), 0);
  const utilization = responders.length ? Math.round(responders.filter((item) => !/AVAILABLE|READY/i.test(item.status || "")).length / responders.length * 100) : 0;
  return <div className="space-y-5"><header><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">Historical view</p><h1 className="mt-1 text-3xl font-extrabold">Analytics</h1><p className="mt-2 text-sm text-slate-600">Incident and service trends from the records currently available in the application.</p></header>
    {error && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error}{!incidents.length && <button onClick={() => window.location.reload()} className="ml-2 font-bold underline">Retry</button>}</p>}
    {loading && <p role="status" className="rounded-xl border bg-white p-5 text-sm text-slate-600">Loading analytics…</p>}
    <section className="grid gap-4 lg:grid-cols-2"><Chart title="Incident reports · last 7 days" subtitle="Count by record creation date">{daily.map((item) => <div key={item.label} className="flex flex-1 flex-col items-center gap-2"><span className="text-xs font-bold tabular-nums">{item.value}</span><div className="flex h-32 w-full items-end rounded-t-md bg-slate-50"><div className="w-full rounded-t-md bg-blue-600" style={{ height: `${Math.max(3, item.value / maxDaily * 100)}%` }} title={`${item.value} incidents`} /></div><span className="text-xs text-slate-600">{item.label}</span></div>)}</Chart>
      <Chart title="Incidents by hazard" subtitle="All incident records"><Bars entries={hazards} /></Chart>
      <Chart title="Priority distribution" subtitle="Severity and priority labels from records"><Bars entries={priority} /></Chart>
      <Chart title="Incident status" subtitle="Current record status, not status history"><Bars entries={state} /></Chart>
      <Chart title="Shelter occupancy" subtitle={`${freeBeds.toLocaleString()} available places across ${shelters.length} sites`}><div className="mt-4"><div className="mb-2 flex justify-between text-sm"><span>Occupied</span><strong>{occupied.toLocaleString()} / {capacity.toLocaleString()}</strong></div><div className="h-4 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${capacity ? Math.min(100, occupied / capacity * 100) : 0}%` }} /></div><p className="mt-2 text-xs text-slate-500">Occupancy uses the shelter values last reported to the app.</p></div></Chart>
      <Chart title="Responder unit utilization" subtitle="Available and assigned status labels"><div className="mt-4 flex items-center gap-4"><div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-[14px] border-blue-100" style={{ borderTopColor: "#1677FF", transform: "rotate(45deg)" }}><span className="-rotate-45 text-xl font-extrabold">{responders.length ? `${utilization}%` : "—"}</span></div><p className="text-sm leading-6 text-slate-600">{responders.filter((item) => /AVAILABLE|READY/i.test(item.status || "")).length} available out of {responders.length} listed units.</p></div></Chart>
      <Chart title="Offline usage patterns · last 90 days" subtitle="Anonymous action counts are saved on-device while offline and synced after reconnecting.">
        {offlineUsage.length
          ? <Bars entries={offlineUsage.map(({ eventName, totalCount }) => [eventName.replaceAll("_", " "), totalCount])} />
          : <p className="py-6 text-sm text-slate-500">No offline activity reports have been received in the last 90 days.</p>}
      </Chart>
    </section>
    <p className="text-xs text-slate-500">Charts summarize recorded application data, not official statistics. Incident trends only include dates present on incident records. Offline usage contains fixed event counts only; it excludes message text, location, account, and device identifiers.</p>
  </div>;
}
function Chart({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-base font-extrabold">{title}</h2><p className="mt-1 text-xs text-slate-500">{subtitle}</p><div className="mt-4">{children}</div></section>; }
function Bars({ entries }: { entries: [string, number][] }) { const max = Math.max(1, ...entries.map(([, count]) => count)); return entries.length ? <div className="space-y-3">{entries.map(([label, count]) => <div key={label}><div className="mb-1 flex justify-between gap-2 text-xs"><span className="truncate font-semibold">{label}</span><span className="font-bold tabular-nums">{count}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${count / max * 100}%` }} /></div></div>)}</div> : <p className="py-6 text-sm text-slate-500">No records to chart.</p>; }
