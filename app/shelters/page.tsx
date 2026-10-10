"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Shelter = { id: number; name?: string; address?: string; capacity?: number; occupancy?: number; status?: string; facilities?: string; latitude?: number; longitude?: number };
const apiBaseUrl = "";

export default function SheltersPage() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [query, setQuery] = useState("");
  const [availability, setAvailability] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiBaseUrl}/api/shelters`, { signal: controller.signal, cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<Shelter[]> : Promise.reject(new Error("The shelter service is unavailable.")))
      .then((data) => { if (!controller.signal.aborted) setShelters(Array.isArray(data) ? data : []); })
      .catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Unable to load shelters. Check the Java API and retry."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  const filtered = useMemo(() => shelters.filter((shelter) => {
    const free = Math.max(0, (shelter.capacity || 0) - (shelter.occupancy || 0));
    const state = free === 0 || /FULL|CLOSED/i.test(shelter.status || "") ? "FULL" : free < 25 ? "LIMITED" : "AVAILABLE";
    return `${shelter.name || ""} ${shelter.address || ""} ${shelter.facilities || ""}`.toLowerCase().includes(query.trim().toLowerCase()) && (availability === "ALL" || state === availability);
  }), [availability, query, shelters]);
  return <div className="space-y-5">
    <header><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">Safe places</p><h1 className="mt-1 text-3xl font-extrabold">Shelters</h1><p className="mt-2 text-sm text-slate-600">Capacity and facility information reported by the shelter registry.</p></header>
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]"><label className="text-sm font-semibold">Search shelters<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, address, or facility" className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200" /></label><label className="text-sm font-semibold">Availability<select value={availability} onChange={(event) => setAvailability(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"><option value="ALL">All statuses</option><option value="AVAILABLE">Available</option><option value="LIMITED">Limited</option><option value="FULL">Full</option></select></label></div>
    {loading && <p role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading shelter records…</p>}
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{error}<button onClick={() => window.location.reload()} className="ml-2 font-bold underline">Retry</button></div>}
    {!loading && !error && !filtered.length && <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">{shelters.length ? "No shelters match this search." : "No shelter records are available."}</div>}
    <div className="grid gap-4 lg:grid-cols-2">{filtered.map((shelter) => {
      const capacity = shelter.capacity || 0;
      const occupancy = shelter.occupancy || 0;
      const available = Math.max(0, capacity - occupancy);
      const status = available === 0 || /FULL|CLOSED/i.test(shelter.status || "") ? "FULL" : available < 25 ? "LIMITED" : "AVAILABLE";
      const badge = status === "FULL" ? "bg-red-50 text-red-800" : status === "LIMITED" ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-800";
      return <article key={shelter.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Relief shelter</p><h2 className="mt-1 text-lg font-extrabold">{shelter.name || `Shelter ${shelter.id}`}</h2></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${badge}`}>{status}</span></div><p className="mt-2 text-sm text-slate-600">{shelter.address || "Address not listed"}</p><div className="mt-4 grid grid-cols-3 gap-2 text-center"><Value label="Capacity" value={capacity.toLocaleString()} /><Value label="Occupancy" value={occupancy.toLocaleString()} /><Value label="Available" value={available.toLocaleString()} /></div><p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">{shelter.facilities || "Facility information has not been reported."}</p><Link href={`/shelters/${shelter.id}`} className="mt-4 inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-bold text-blue-700 hover:bg-blue-50">View details →</Link></article>;
    })}</div>
    <p className="text-xs text-slate-500">Shelter availability can change. Confirm current access with local authorities before travelling.</p>
  </div>;
}
function Value({ label, value }: { label: string; value: string }) { return <div className="rounded-lg bg-slate-50 p-2"><p className="text-[10px] font-semibold text-slate-500">{label}</p><p className="mt-1 text-sm font-extrabold text-slate-900">{value}</p></div>; }
