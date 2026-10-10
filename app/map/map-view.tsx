"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const GisMap = dynamic(() => import("@/components/gis-map").then((module) => module.GisMap), {
  ssr: false,
  loading: () => <div className="skeleton min-h-[420px] rounded-xl" role="status">Loading emergency map…</div>,
});

export default function MapView() {
  return <div className="space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><span className="text-xs font-bold uppercase tracking-wide text-[#2563EB]">Hyderabad · Telangana</span><h1 className="mt-1 text-2xl font-extrabold text-[#172033]">Live Situation Map</h1><p className="mt-1 text-sm text-slate-600">Operational incidents, open shelters, hospitals and response teams.</p></div>
      <div className="flex flex-wrap gap-2"><Link href="/shelters" className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700">Shelter directory</Link><Link href="/responders" className="min-h-11 rounded-lg bg-[#2563EB] px-4 py-3 text-xs font-bold text-white">Response missions</Link></div>
    </header>
    <section className="saas-card overflow-hidden p-2 sm:p-3"><GisMap /></section>
    <p className="text-xs text-slate-500">Map tiles require an internet connection. Markers come from the Java API; availability may be limited when backend services are offline.</p>
  </div>;
}
