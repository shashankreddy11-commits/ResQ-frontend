"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getLiveWeather, type LiveWeatherSnapshot } from "@/lib/live-weather";

type Incident = { id: number; type?: string; description?: string; severity?: string; priority?: string; status?: string; updatedAt?: string };
type Alert = { id: number; title?: string; message?: string; severity?: string; targetArea?: string; startTime?: string; disasterType?: string };
type Shelter = { id: number; name?: string; capacity?: number; occupancy?: number; address?: string; status?: string };
type Overview = { incidents: Incident[]; alerts: Alert[]; shelters: Shelter[]; responderCount: number; weather: LiveWeatherSnapshot | null; loading: boolean; apiAvailable: boolean };

const apiBaseUrl = "";

export default function Home() {
  const [overview, setOverview] = useState<Overview>({ incidents: [], alerts: [], shelters: [], responderCount: 0, weather: null, loading: true, apiAvailable: true });
  const [now, setNow] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      const [incidents, alerts, shelters, responders, weather] = await Promise.allSettled([
        fetch(`${apiBaseUrl}/api/incidents`, { signal: controller.signal }).then((response) => response.ok ? response.json() as Promise<Incident[]> : Promise.reject()),
        fetch(`${apiBaseUrl}/api/alerts`, { signal: controller.signal }).then((response) => response.ok ? response.json() as Promise<Alert[]> : Promise.reject()),
        fetch(`${apiBaseUrl}/api/shelters`, { signal: controller.signal }).then((response) => response.ok ? response.json() as Promise<Shelter[]> : Promise.reject()),
        fetch(`${apiBaseUrl}/api/responders`, { signal: controller.signal }).then((response) => response.ok ? response.json() as Promise<unknown[]> : Promise.reject()),
        getLiveWeather(17.385, 78.4867, controller.signal),
      ]);
      if (controller.signal.aborted) return;
      const failed = [incidents, alerts, shelters, responders].some((result) => result.status === "rejected");
      setOverview({
        incidents: incidents.status === "fulfilled" && Array.isArray(incidents.value) ? incidents.value : [],
        alerts: alerts.status === "fulfilled" && Array.isArray(alerts.value) ? alerts.value : [],
        shelters: shelters.status === "fulfilled" && Array.isArray(shelters.value) ? shelters.value : [],
        responderCount: responders.status === "fulfilled" && Array.isArray(responders.value) ? responders.value.length : 0,
        weather: weather.status === "fulfilled" ? weather.value : null,
        loading: false,
        apiAvailable: !failed,
      });
    };
    const initial = window.setTimeout(() => { setNow(Date.now()); void load(); }, 0);
    return () => { controller.abort(); window.clearTimeout(initial); };
  }, []);

  const activeIncidents = overview.incidents.filter((incident) => !["RESOLVED", "CLOSED"].includes((incident.status || "").toUpperCase()));
  const activeAlerts = overview.alerts.filter((alert) => !alert.startTime || (now > 0 && now - new Date(alert.startTime).getTime() < 7 * 24 * 60 * 60 * 1000));
  const availableBeds = overview.shelters.reduce((total, shelter) => total + Math.max(0, (shelter.capacity || 0) - (shelter.occupancy || 0)), 0);

  return <div className="space-y-6 pb-6">
    <section className="relative isolate min-h-[300px] overflow-hidden bg-[#0B1F3A] text-white sm:rounded-2xl">
      <Image src="/disaster-hero.webp" alt="Storm clouds over a lake and nearby communities" fill priority sizes="100vw" className="absolute inset-0 -z-20 object-cover" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#07182C]/95 via-[#0B1F3A]/75 to-[#0B1F3A]/20" />
      <div className="grid min-h-[300px] items-center gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-10">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-200">Prepared together. Ready when it matters.</p>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">ResQ</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-100 sm:text-base">Understand risk, find help, and coordinate emergency response from one place.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/sos" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#DC2626] px-5 text-sm font-extrabold text-white shadow-lg transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Send SOS</Link>
            <Link href="/alerts" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#1677FF] px-5 text-sm font-extrabold text-white shadow-lg transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">View alerts</Link>
            <Link href="/live-situation" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/60 bg-slate-950/20 px-5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Live situation</Link>
          </div>
        </div>
        <div className="rounded-2xl border border-white/25 bg-slate-950/50 p-5 shadow-xl backdrop-blur-md">
          <p className="text-sm font-bold">Stay safe</p>
          <p className="mt-2 text-sm leading-6 text-slate-200">Follow verified alerts, keep emergency contacts ready, and move to a safe place when directed.</p>
          <p className="mt-4 border-t border-white/15 pt-3 text-xs text-slate-300">Emergency services: <strong className="text-white">112</strong></p>
        </div>
      </div>
    </section>

    {!overview.apiAvailable && <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">Some live operations data could not be reached. Weather and map pages may still be available.</p>}

    <section aria-label="Current overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <OverviewCard label="Current weather" value={overview.loading ? "Loading…" : overview.weather?.temperatureC != null ? `${Math.round(overview.weather.temperatureC)}°C` : "Unavailable"} detail={overview.weather?.conditionText || "Hyderabad · live reading"} href="/live-situation" />
      <OverviewCard label="Active incidents" value={overview.loading ? "—" : String(activeIncidents.length)} detail="Open reports from the Java API" href="/incidents" />
      <OverviewCard label="Active alerts" value={overview.loading ? "—" : String(activeAlerts.length)} detail="Current alert records" href="/alerts" />
      <OverviewCard label="Shelter beds available" value={overview.loading ? "—" : availableBeds.toLocaleString()} detail={`${overview.shelters.length} listed shelters · ${overview.responderCount} response units`} href="/shelters" />
    </section>

    <section className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,.7fr)]">
      <div className="rounded-2xl border border-[#E4E7EC] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 pb-4"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-blue-700">Recent updates</p><h2 className="mt-1 text-xl font-extrabold text-[#172033]">Alerts for your area</h2></div><Link href="/alerts" className="min-h-10 rounded-lg px-3 text-sm font-bold text-blue-700 hover:bg-blue-50">View all alerts →</Link></div>
        <div className="divide-y divide-slate-100">
          {overview.loading ? <p className="py-6 text-sm text-slate-500" role="status">Loading alerts…</p> : activeAlerts.slice(0, 3).map((alert) => <Link href={`/alerts/${alert.id}`} key={alert.id} className="block py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-slate-900">{alert.title || alert.disasterType || "Public safety alert"}</h3><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">{alert.severity || "Advisory"}</span></div><p className="mt-1 text-sm text-slate-600">{alert.targetArea || "Location not specified"} · {alert.message || "Follow local safety instructions."}</p></Link>)}
          {!overview.loading && !activeAlerts.length && <p className="py-7 text-sm text-slate-500">No active alerts have been published.</p>}
        </div>
      </div>
      <div className="rounded-2xl border border-[#E4E7EC] bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[.15em] text-blue-700">Quick actions</p><h2 className="mt-1 text-xl font-extrabold text-[#172033]">Find what you need</h2>
        <div className="mt-4 grid gap-2">
          <QuickAction href="/emergency-map" title="Find emergency services" detail="Incidents, shelters, hospitals, teams" />
          <QuickAction href="/shelters" title="Find a shelter" detail="Capacity and facility information" />
          <QuickAction href="/safety-guide" title="Read safety guidance" detail="Before, during, and after a hazard" />
          <QuickAction href="/ai-assistant" title="Ask the local assistant" detail="Guidance based on available app data" />
        </div>
      </div>
    </section>

    <section className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,.7fr)]">
      <Link href="/live-situation" className="group relative min-h-56 overflow-hidden rounded-2xl border border-slate-200 bg-[#0B1F3A] p-6 text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
        <div className="absolute inset-0 opacity-35 transition group-hover:opacity-45" style={{ backgroundImage: "url('/disaster-hero.webp')", backgroundPosition: "center", backgroundSize: "cover" }} />
        <div className="relative flex h-full min-h-44 flex-col justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-200">Live situation</p><h2 className="mt-2 text-2xl font-extrabold">Weather and hazard monitoring</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-100">View current weather, radar history, and operational map layers.</p></div><span className="mt-5 text-sm font-bold">Open monitoring map →</span></div>
      </Link>
      <div className="rounded-2xl border border-[#E4E7EC] bg-white p-5 shadow-sm sm:p-6"><p className="text-xs font-bold uppercase tracking-[.15em] text-blue-700">Response teams</p><h2 className="mt-1 text-xl font-extrabold">Coordination status</h2><p className="mt-3 text-sm leading-6 text-slate-600">{overview.loading ? "Loading unit information…" : `${overview.responderCount} responder units are listed in the operational registry.`}</p><Link href="/responders" className="mt-4 inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-bold text-blue-700 hover:bg-blue-50">View responders →</Link></div>
    </section>
    <p className="text-xs leading-5 text-slate-500">Weather risk estimates and public feeds support situational awareness. They are not official emergency warnings; follow instructions from local authorities.</p>
  </div>;
}

function OverviewCard({ label, value, detail, href }: { label: string; value: string; detail: string; href: string }) {
  return <Link href={href} className="min-w-0 rounded-2xl border border-[#E4E7EC] bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><p className="text-sm font-semibold text-slate-600">{label}</p><p className="mt-2 truncate text-2xl font-extrabold text-[#172033]">{value}</p><p className="mt-1 truncate text-xs text-slate-500">{detail}</p></Link>;
}

function QuickAction({ href, title, detail }: { href: string; title: string; detail: string }) {
  return <Link href={href} className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 transition hover:border-blue-300 hover:bg-blue-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><span className="min-w-0"><span className="block text-sm font-bold text-slate-900">{title}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{detail}</span></span><span aria-hidden="true" className="text-blue-700">→</span></Link>;
}
