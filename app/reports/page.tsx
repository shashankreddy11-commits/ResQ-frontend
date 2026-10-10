"use client";

import { useCallback, useEffect, useState } from "react";

type Row = { id: number; type?: string; description?: string; severity?: string; priority?: string; status?: string; createdAt?: string };
type Alert = { id: number };
type Shelter = { capacity?: number; occupancy?: number };
type Responder = { status?: string };
type Resource = { quantityAvailable?: number; name?: string; type?: string };
const apiBaseUrl = "";
async function get<T>(path: string, signal: AbortSignal): Promise<T> { const response = await fetch(`${apiBaseUrl}${path}`, { signal, cache: "no-store" }); if (!response.ok) throw new Error(path); return response.json() as Promise<T>; }

export default function ReportsPage() {
  const [incidents, setIncidents] = useState<Row[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [responders, setResponders] = useState<Responder[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async (signal: AbortSignal) => {
    const result = await Promise.allSettled([get<Row[]>("/api/incidents", signal), get<Alert[]>("/api/alerts", signal), get<Shelter[]>("/api/shelters", signal), get<Responder[]>("/api/responders", signal), get<Resource[]>("/api/resources", signal)]);
    if (signal.aborted) return;
    setIncidents(result[0].status === "fulfilled" ? result[0].value : []); setAlerts(result[1].status === "fulfilled" ? result[1].value : []); setShelters(result[2].status === "fulfilled" ? result[2].value : []); setResponders(result[3].status === "fulfilled" ? result[3].value : []); setResources(result[4].status === "fulfilled" ? result[4].value : []);
    const failed = result.filter((item) => item.status === "rejected").length; setError(failed ? `${failed} data source${failed === 1 ? " is" : "s are"} unavailable. The report includes successfully loaded records only.` : ""); setLoading(false);
  }, []);
  useEffect(() => { const controller = new AbortController(); const initial = window.setTimeout(() => void load(controller.signal), 0); return () => { controller.abort(); window.clearTimeout(initial); }; }, [load]);
  const active = incidents.filter((item) => !["RESOLVED", "CLOSED"].includes((item.status || "").toUpperCase()));
  const freeBeds = shelters.reduce((sum, shelter) => sum + Math.max(0, (shelter.capacity || 0) - (shelter.occupancy || 0)), 0);
  const exportReport = () => {
    const data = { generatedAt: new Date().toISOString(), source: "Disaster Resilience Java API", activeIncidents: active, alerts, shelters, responders, resources };
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })); link.download = `disaster-response-report-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(link.href);
  };
  return <div className="space-y-5"><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">Situation reporting</p><h1 className="mt-1 text-3xl font-extrabold">Reports</h1><p className="mt-2 text-sm text-slate-600">A current snapshot from incident, alert, shelter, responder, and resource records.</p></div><div className="flex gap-2"><button onClick={() => window.print()} className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold">Print</button><button onClick={exportReport} className="min-h-11 rounded-xl bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800">Export JSON</button></div></header>
    {loading && <p role="status" className="rounded-xl border bg-white p-5 text-sm text-slate-600">Loading current report data…</p>}{error && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error}</p>}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><ReportMetric label="Current open incidents" value={loading ? "—" : String(active.length)} /><ReportMetric label="Active alerts" value={loading ? "—" : String(alerts.length)} /><ReportMetric label="Response teams" value={loading ? "—" : String(responders.length)} /><ReportMetric label="Shelter capacity" value={loading ? "—" : shelters.reduce((sum, item) => sum + (item.capacity || 0), 0).toLocaleString()} /><ReportMetric label="Available shelter places" value={loading ? "—" : freeBeds.toLocaleString()} /><ReportMetric label="Resource records" value={loading ? "—" : String(resources.length)} /></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-extrabold">Open incident register</h2>{active.length ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] border-collapse text-left text-sm"><thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-500"><th className="p-3">Incident</th><th className="p-3">Hazard</th><th className="p-3">Priority</th><th className="p-3">Status</th><th className="p-3">Reported</th></tr></thead><tbody>{active.map((item) => <tr key={item.id} className="border-b border-slate-100"><td className="p-3 font-mono font-bold">DR-{item.id}</td><td className="p-3">{(item.type || "Emergency").replaceAll("_", " ")}</td><td className="p-3">{item.priority || item.severity || "Not assessed"}</td><td className="p-3">{(item.status || "REPORTED").replaceAll("_", " ")}</td><td className="p-3">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "Unavailable"}</td></tr>)}</tbody></table></div> : !loading && <p className="mt-3 text-sm text-slate-600">No open incident records.</p>}</section>
    <p className="text-xs text-slate-500">This report reflects records currently available from the app service; it is not an official government situation report.</p>
  </div>;
}
function ReportMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-slate-600">{label}</p><p className="mt-2 text-2xl font-extrabold">{value}</p></div>; }
