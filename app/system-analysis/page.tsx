"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getLiveWeather, type LiveWeatherSnapshot } from "@/lib/live-weather";

type Incident = { id: number; type?: string; severity?: string; priority?: string; status?: string; createdAt?: string; updatedAt?: string };
type Alert = { id: number; severity?: string; disasterType?: string; startTime?: string; expiryTime?: string };
type Shelter = { capacity?: number; occupancy?: number; status?: string };
type Responder = { status?: string; agencyType?: string };
type Resource = { quantityAvailable?: number; status?: string; type?: string; name?: string };
type Metrics = { activeIncidents?: number; activeAlerts?: number; shelterCapacity?: number; shelterOccupancy?: number; availableShelterBeds?: number; lowStockResources?: number; generatedAt?: string };

const apiBaseUrl = "";
const request = async <T,>(path: string, signal: AbortSignal): Promise<T> => {
  const response = await fetch(`${apiBaseUrl}${path}`, { signal, cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json() as Promise<T>;
};

export default function SystemAnalysisPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [responders, setResponders] = useState<Responder[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [weather, setWeather] = useState<LiveWeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(0);

  const refresh = useCallback(async (signal: AbortSignal) => {
    const results = await Promise.allSettled([
      request<Incident[]>("/api/incidents", signal), request<Alert[]>("/api/alerts", signal),
      request<Shelter[]>("/api/shelters", signal), request<Responder[]>("/api/responders", signal),
      request<Resource[]>("/api/resources", signal), request<Metrics>("/api/dashboard/operations", signal),
      getLiveWeather(17.385, 78.4867, signal),
    ]);
    if (signal.aborted) return;
    const failures = results.filter((result) => result.status === "rejected").length;
    setIncidents(results[0].status === "fulfilled" ? results[0].value : []);
    setAlerts(results[1].status === "fulfilled" ? results[1].value : []);
    setShelters(results[2].status === "fulfilled" ? results[2].value : []);
    setResponders(results[3].status === "fulfilled" ? results[3].value : []);
    setResources(results[4].status === "fulfilled" ? results[4].value : []);
    setMetrics(results[5].status === "fulfilled" ? results[5].value : null);
    setWeather(results[6].status === "fulfilled" ? results[6].value : null);
    setError(failures === results.length ? `Live services could not be reached. Confirm the Java API is running at ${apiBaseUrl}.` : failures ? "Some data sources are unavailable; displayed values include only successfully loaded records." : "");
    setLoading(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const initial = window.setTimeout(() => { setNow(Date.now()); void refresh(controller.signal); }, 0);
    const timer = window.setInterval(() => void refresh(controller.signal), 60_000);
    return () => { controller.abort(); window.clearTimeout(initial); window.clearInterval(timer); };
  }, [refresh]);

  const activeIncidents = incidents.filter((incident) => !["RESOLVED", "CLOSED"].includes((incident.status || "").toUpperCase()));
  const activeAlerts = alerts.filter((alert) => !alert.expiryTime || (now > 0 && new Date(alert.expiryTime).getTime() > now));
  const totalCapacity = metrics?.shelterCapacity ?? shelters.reduce((sum, item) => sum + (item.capacity || 0), 0);
  const occupied = metrics?.shelterOccupancy ?? shelters.reduce((sum, item) => sum + (item.occupancy || 0), 0);
  const freeBeds = Math.max(0, totalCapacity - occupied);
  const availableTeams = responders.filter((team) => /AVAILABLE|READY/i.test(team.status || "")).length;
  const openIncidents = activeIncidents.length;
  const byHazard = Object.entries(activeIncidents.reduce<Record<string, number>>((counts, item) => { const type = item.type || "Other"; counts[type] = (counts[type] || 0) + 1; return counts; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const largestHazard = Math.max(1, ...byHazard.map(([, count]) => count));
  const rainfall = weather?.precipitationRateMmHr ?? 0;
  const windSpeed = weather?.windSpeedKmh ?? 0;
  const temperature = weather?.temperatureC ?? 0;
  const risk = weather ? rainfall >= 12 || windSpeed >= 70 || temperature >= 43 ? "HIGH" : rainfall >= 5 || windSpeed >= 45 || temperature >= 38 ? "MODERATE" : "LOW" : "UNAVAILABLE";
  const riskStyle = risk === "HIGH" ? "bg-red-50 text-red-800" : risk === "MODERATE" ? "bg-amber-50 text-amber-800" : risk === "LOW" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700";

  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">Operational overview</p><h1 className="mt-1 text-3xl font-extrabold text-[#172033]">System analysis</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">What is the current state of the emergency response system?</p></div><div className="flex items-center gap-2"><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">{loading ? "Loading current data" : "Live operational data"}</span><Link href="/reports" className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-bold text-blue-700 hover:bg-blue-50">Reports</Link><Link href="/analytics" className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-bold text-blue-700 hover:bg-blue-50">Analytics</Link></div></header>
    {error && <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>}

    <section aria-label="Current metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric title="Current risk" value={loading ? "—" : risk} detail={weather ? `${temperature != null ? `${Math.round(temperature)}°C` : "Temperature unavailable"} · ${weather.conditionText}` : "Live weather unavailable"} style={riskStyle} href="/live-situation" />
      <Metric title="Active incidents" value={loading ? "—" : String(metrics?.activeIncidents ?? openIncidents)} detail={`${activeIncidents.filter((item) => item.priority === "CRITICAL" || item.severity === "CRITICAL").length} critical · ${incidents.length} total records`} href="/incidents" />
      <Metric title="Active alerts" value={loading ? "—" : String(metrics?.activeAlerts ?? activeAlerts.length)} detail="Published alert records" href="/alerts" />
      <Metric title="Available shelter beds" value={loading ? "—" : freeBeds.toLocaleString()} detail={`${occupied.toLocaleString()} occupied of ${totalCapacity.toLocaleString()}`} href="/shelters" />
      <Metric title="Response teams" value={loading ? "—" : String(responders.length)} detail={`${availableTeams} marked available`} href="/responders" />
      <Metric title="Affected areas" value={loading ? "—" : String(new Set(activeIncidents.map((item) => item.type || "Other")).size)} detail="Hazard types in open incident records" href="/emergency-map" />
      <Metric title="Resources" value={loading ? "—" : String(resources.length)} detail={`${metrics?.lowStockResources ?? resources.filter((item) => (item.quantityAvailable || 0) < 50).length} low stock records`} href="/resources" />
      <Metric title="Weather" value={loading ? "—" : weather && weather.temperatureC != null ? `${Math.round(weather.temperatureC)}°C` : "Unavailable"} detail={weather?.conditionText || "Current conditions"} href="/live-situation" />
    </section>

    <section className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border border-[#E4E7EC] bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-lg font-extrabold">Open incidents by hazard</h2><p className="mt-1 text-sm text-slate-500">Current incident records, not a historical trend</p></div><Link href="/incidents" className="text-sm font-bold text-blue-700">All incidents →</Link></div>
        {loading ? <p className="py-8 text-sm text-slate-500">Loading incident data…</p> : byHazard.length ? <div className="mt-5 space-y-4">{byHazard.map(([name, count]) => <div key={name}><div className="mb-1 flex justify-between text-sm"><span className="font-semibold text-slate-700">{name.replaceAll("_", " ")}</span><span className="font-bold tabular-nums">{count}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(8, count / largestHazard * 100)}%` }} /></div></div>)}</div> : <p className="py-8 text-sm text-slate-500">No open incidents to summarize.</p>}
      </div>
      <div className="rounded-2xl border border-[#E4E7EC] bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-lg font-extrabold">Operational status</h2><p className="mt-1 text-sm text-slate-500">Shelter and resource readiness</p></div><Link href="/reports" className="text-sm font-bold text-blue-700">Reports →</Link></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2"><StatusBox label="Shelter occupancy" value={totalCapacity ? `${Math.round(occupied / totalCapacity * 100)}%` : "No capacity data"} detail={`${freeBeds.toLocaleString()} spaces available`} /><StatusBox label="Shelter sites" value={String(shelters.length)} detail={`${shelters.filter((shelter) => /FULL|CLOSED/i.test(shelter.status || "")).length} full or closed`} /><StatusBox label="Resource catalog" value={String(resources.length)} detail="Items tracked by the API" /><StatusBox label="Response availability" value={`${availableTeams} available`} detail={`${responders.length} units in registry`} /></div>
      </div>
    </section>
    <p className="text-xs leading-5 text-slate-500">Weather risk is an experimental threshold estimate from current model readings. It is decision support, not a validated risk forecast or official warning.</p>
  </div>;
}

function Metric({ title, value, detail, href, style }: { title: string; value: string; detail: string; href: string; style?: string }) {
  return <Link href={href} className="rounded-2xl border border-[#E4E7EC] bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><p className="text-sm font-semibold text-slate-600">{title}</p><p className={`mt-2 text-2xl font-extrabold ${style || "text-[#172033]"}`}>{value}</p><p className="mt-1 truncate text-xs text-slate-500">{detail}</p></Link>;
}
function StatusBox({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-600">{label}</p><p className="mt-2 text-lg font-extrabold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>; }
