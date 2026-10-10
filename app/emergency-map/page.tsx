"use client";

import dynamic from "next/dynamic";

const GisMap = dynamic(() => import("@/components/gis-map").then((module) => module.GisMap), {
  ssr: false,
  loading: () => <div role="status" className="flex min-h-[60vh] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-600">Loading emergency services map…</div>,
});

export default function EmergencyMapPage() {
  return <div className="space-y-5 px-4 py-5 sm:px-6 lg:px-8">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">Operational response</p><h1 className="mt-1 text-2xl font-extrabold text-[#172033] sm:text-3xl">Emergency services map</h1><p className="mt-2 text-sm text-slate-600">Browse incidents, shelters, hospitals, and responder units reported by the Java API.</p></div>
      <a href="/live-situation" className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50">Open live weather map →</a>
    </header>
    <GisMap />
  </div>;
}
