"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLiveWeather, type LiveWeatherSnapshot } from "@/lib/live-weather";

type Incident = { id: number; type?: string; description?: string; severity?: string; priority?: string; status?: string; updatedAt?: string };
type Alert = { id: number; title?: string; message?: string; severity?: string; targetArea?: string; expiryTime?: string; startTime?: string };
type Shelter = { id: number; name?: string; capacity?: number; occupancy?: number; status?: string; address?: string };
const apiBaseUrl = "";

export default function DashboardPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [weather, setWeather] = useState<LiveWeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [now, setNow] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const clock = window.setTimeout(() => setNow(Date.now()), 0);
    const token = localStorage.getItem("dr_token"); window.setTimeout(() => setSignedIn(Boolean(token)), 0);
    Promise.allSettled([
      fetch(`${apiBaseUrl}/api/incidents/mine`, { signal: controller.signal, headers: token ? { Authorization: `Bearer ${token}` } : {}, cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<Incident[]> : Promise.reject()),
      fetch(`${apiBaseUrl}/api/alerts`, { signal: controller.signal, cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<Alert[]> : Promise.reject()),
      fetch(`${apiBaseUrl}/api/shelters`, { signal: controller.signal, cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<Shelter[]> : Promise.reject()),
      getLiveWeather(17.385, 78.4867, controller.signal),
    ]).then(([incidentResult, alertResult, shelterResult, weatherResult]) => {
      if (controller.signal.aborted) return;
      setIncidents(incidentResult.status === "fulfilled" && Array.isArray(incidentResult.value) ? incidentResult.value : []);
      setAlerts(alertResult.status === "fulfilled" && Array.isArray(alertResult.value) ? alertResult.value : []);
      setShelters(shelterResult.status === "fulfilled" && Array.isArray(shelterResult.value) ? shelterResult.value : []);
      setWeather(weatherResult.status === "fulfilled" ? weatherResult.value : null);
      const failures = [incidentResult, alertResult, shelterResult].filter((item) => item.status === "rejected").length;
      setError(failures === 3 ? "Operations data could not be loaded. Check the Java API connection." : failures ? "Some dashboard data sources are unavailable." : "");
      setLoading(false);
    });
    return () => { controller.abort(); window.clearTimeout(clock); };
  }, []);
  const openIncidents = incidents.filter((item) => !["RESOLVED", "CLOSED"].includes((item.status || "").toUpperCase()));
  const currentAlerts = alerts.filter((item) => !item.expiryTime || (now > 0 && new Date(item.expiryTime).getTime() > now));
  const availableShelters = shelters.filter((item) => (item.capacity || 0) > (item.occupancy || 0) && !/CLOSED/i.test(item.status || ""));
  const currentRisk = !weather ? "Unavailable" : (weather.precipitationRateMmHr || 0) >= 12 || (weather.windSpeedKmh || 0) >= 70 || (weather.temperatureC || 0) >= 43 ? "High" : (weather.precipitationRateMmHr || 0) >= 5 || (weather.windSpeedKmh || 0) >= 45 || (weather.temperatureC || 0) >= 38 ? "Moderate" : "Low";
  return <div className="space-y-5"><header><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">Citizen dashboard</p><h1 className="mt-1 text-3xl font-extrabold">Your emergency overview</h1><p className="mt-2 text-sm text-slate-600">Local conditions, current alerts, nearby shelter records, and your own requests.</p></header>
    {error && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error}{!incidents.length && <button onClick={() => window.location.reload()} className="ml-2 font-bold underline">Retry</button>}</div>}
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Card title="Current weather" value={loading ? "—" : weather?.temperatureC != null ? `${Math.round(weather.temperatureC)}°C` : "Unavailable"} detail={weather?.conditionText || "Hyderabad area"} href="/live-situation" /><Card title="Weather risk estimate" value={loading ? "—" : currentRisk} detail="Decision support only" href="/live-situation" /><Card title="Active alerts" value={loading ? "—" : String(currentAlerts.length)} detail="Alert records from the app" href="/alerts" /><Card title="Nearby shelters" value={loading ? "—" : String(availableShelters.length)} detail="Shelters reporting open capacity" href="/shelters" /></section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Action href="/sos" title="Send SOS" detail="Report an emergency" danger /><Action href="/emergency-map" title="Emergency map" detail="Find services and incidents" /><Action href="/ai-assistant" title="Safety assistant" detail="General guidance and app records" /><Action href="/family" title="Family safety" detail="Manage local check-ins" /></section>
    <section className="grid gap-5 lg:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-extrabold">My emergency requests</h2><p className="mt-1 text-xs text-slate-500">Only requests linked to your signed-in account are shown.</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">{signedIn ? `${openIncidents.length} open` : "Guest"}</span></div>{!signedIn && <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Sign in to see requests associated with your account. Guest SOS submissions remain available in the incident register.</p>}{signedIn && !loading && !incidents.length && <p className="mt-4 text-sm text-slate-600">You have no requests linked to this account.</p>}{loading && <p role="status" className="mt-4 text-sm text-slate-500">Loading your requests…</p>}<div className="mt-3 space-y-2">{incidents.slice(0, 6).map((item) => <Link key={item.id} href={`/incidents/${item.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3 hover:bg-blue-50"><span><span className="block font-mono text-xs font-bold text-blue-800">DR-{item.id}</span><span className="mt-1 block text-sm font-semibold">{(item.type || "Emergency").replaceAll("_", " ")}</span></span><span className="text-xs font-bold">{(item.status || "REPORTED").replaceAll("_", " ")}</span></Link>)}</div><Link href="/incidents" className="mt-3 inline-flex min-h-10 items-center px-2 text-sm font-bold text-blue-700">All incident records →</Link></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><h2 className="text-lg font-extrabold">Recent alerts</h2><p className="mt-1 text-xs text-slate-500">Current alert records</p></div><Link href="/alerts" className="text-sm font-bold text-blue-700">All alerts →</Link></div>{!loading && !currentAlerts.length && <p className="mt-4 text-sm text-slate-600">No active alerts are published.</p>}<div className="mt-3 space-y-2">{currentAlerts.slice(0, 4).map((item) => <Link key={item.id} href={`/alerts/${item.id}`} className="block rounded-xl border border-slate-200 p-3 hover:bg-blue-50"><span className="font-bold">{item.title || "Public alert"}</span><span className="mt-1 block text-xs text-slate-600">{item.targetArea || "Area unavailable"} · {item.severity || "Advisory"}</span></Link>)}</div></div></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-extrabold">Shelter options</h2><p className="mt-1 text-xs text-slate-500">Availability reported by the shelter registry</p></div><Link href="/shelters" className="text-sm font-bold text-blue-700">Browse shelters →</Link></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{availableShelters.slice(0, 4).map((item) => <Link key={item.id} href={`/shelters/${item.id}`} className="rounded-xl border border-slate-200 p-4 hover:bg-emerald-50"><h3 className="font-bold">{item.name || `Shelter ${item.id}`}</h3><p className="mt-1 text-xs text-slate-600">{item.address || "Address not listed"}</p><p className="mt-2 text-xs font-semibold text-emerald-800">{Math.max(0, (item.capacity || 0) - (item.occupancy || 0))} spaces listed available</p></Link>)}</div>{!loading && !availableShelters.length && <p className="mt-4 text-sm text-slate-600">No shelters with reported capacity are available.</p>}</section>
    <p className="text-xs text-slate-500">Weather risk is an experimental threshold estimate, not an official warning. Follow alerts from local authorities.</p>
  </div>;
}
function Card({ title, value, detail, href }: { title: string; value: string; detail: string; href: string }) { return <Link href={href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300"><p className="text-sm font-semibold text-slate-600">{title}</p><p className="mt-2 text-2xl font-extrabold">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></Link>; }
function Action({ href, title, detail, danger = false }: { href: string; title: string; detail: string; danger?: boolean }) { return <Link href={href} className={`rounded-2xl p-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${danger ? "bg-red-700 text-white hover:bg-red-800" : "border border-slate-200 bg-white hover:border-blue-300"}`}><span className="block font-extrabold">{title}</span><span className={`mt-1 block text-xs ${danger ? "text-red-100" : "text-slate-500"}`}>{detail}</span></Link>; }
