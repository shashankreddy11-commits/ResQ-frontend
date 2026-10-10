"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Incident = { id: number; type?: string; description?: string; severity?: string; priority?: string; status?: string; latitude?: number; longitude?: number; createdAt?: string; updatedAt?: string };
const apiBaseUrl = "";

export default function IncidentsPage() {
  const [items, setItems] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiBaseUrl}/api/incidents`, { signal: controller.signal, cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<Incident[]> : Promise.reject(new Error("The incident service is unavailable.")))
      .then((data) => { if (!controller.signal.aborted) setItems(Array.isArray(data) ? data : []); })
      .catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Unable to load incidents. Check the Java API and retry."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const filtered = items.filter((item) => `${item.id} ${item.type || ""} ${item.description || ""} ${item.status || ""}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <div className="space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">Shared incident records</p><h1 className="mt-1 text-3xl font-extrabold">Incident tracking</h1><p className="mt-2 text-sm text-slate-600">Reports move through the same record across citizen, EOC, and responder workflows.</p></div><Link href="/sos" className="inline-flex min-h-11 items-center rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700">Report an emergency</Link></header>
    <label className="block max-w-lg"><span className="mb-1 block text-sm font-semibold">Search incident records</span><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200" placeholder="Search ID, hazard, status…" /></label>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error} <button onClick={() => window.location.reload()} className="ml-2 font-bold underline">Retry</button></div>}
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="grid grid-cols-[1fr_1.3fr_1.2fr_.8fr] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600"><span>Incident</span><span>Hazard / details</span><span>Priority</span><span>Status</span></div>
      {loading ? <p role="status" className="p-6 text-sm text-slate-500">Loading incident records…</p> : filtered.map((item) => <Link key={item.id} href={`/incidents/${item.id}`} className="grid min-h-16 grid-cols-[1fr_1.3fr_1.2fr_.8fr] items-center gap-3 border-b border-slate-100 px-4 py-3 text-sm hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"><span className="font-mono font-bold text-blue-800">INC-{item.id}</span><span className="min-w-0"><span className="block truncate font-bold text-slate-900">{(item.type || "Emergency").replaceAll("_", " ")}</span><span className="block truncate text-xs text-slate-500">{item.description || "No description provided"}</span></span><span className="text-xs font-bold text-slate-700">{item.priority || item.severity || "Unassigned"}</span><span className="text-xs font-semibold text-slate-700">{(item.status || "REPORTED").replaceAll("_", " ")}</span></Link>)}
      {!loading && !error && !filtered.length && <p className="p-6 text-sm text-slate-500">{items.length ? "No records match your search." : "No incidents have been reported."}</p>}
    </div>
  </div>;
}
