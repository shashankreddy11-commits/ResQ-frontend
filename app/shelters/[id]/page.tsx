"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Shelter = { id: number; name?: string; address?: string; capacity?: number; occupancy?: number; facilities?: string; status?: string; latitude?: number; longitude?: number };
const apiBaseUrl = "";

export default function ShelterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [shelter, setShelter] = useState<Shelter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiBaseUrl}/api/shelters/${encodeURIComponent(id)}`, { signal: controller.signal, cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<Shelter> : Promise.reject(new Error(response.status === 404 ? "This shelter could not be found." : "The shelter service is unavailable.")))
      .then((data) => { if (!controller.signal.aborted) setShelter(data); })
      .catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Unable to load this shelter."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id]);
  const available = Math.max(0, (shelter?.capacity || 0) - (shelter?.occupancy || 0));
  const mapHref = shelter?.latitude != null && shelter.longitude != null ? `https://www.google.com/maps/search/?api=1&query=${shelter.latitude},${shelter.longitude}` : null;
  return <div className="mx-auto max-w-4xl space-y-5"><Link href="/shelters" className="inline-flex min-h-10 items-center text-sm font-semibold text-blue-700 hover:underline">← All shelters</Link>
    {loading && <p role="status" className="rounded-xl border bg-white p-6 text-sm text-slate-600">Loading shelter details…</p>}
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{error} <button className="ml-2 font-bold underline" onClick={() => window.location.reload()}>Try again</button></div>}
    {shelter && <><header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Relief shelter</p><h1 className="mt-2 text-3xl font-extrabold">{shelter.name || `Shelter ${shelter.id}`}</h1><p className="mt-2 text-sm text-slate-600">{shelter.address || "Address not listed"}</p><span className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${available === 0 ? "bg-red-50 text-red-800" : available < 25 ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-800"}`}>{available === 0 ? "Full" : available < 25 ? "Limited availability" : "Available"}</span></header>
      <section className="grid gap-4 sm:grid-cols-3"><Info label="Capacity" value={String(shelter.capacity ?? "Not reported")} /><Info label="Occupancy" value={String(shelter.occupancy ?? "Not reported")} /><Info label="Available spaces" value={String(available)} /></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Facilities</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{shelter.facilities || "Facility information has not been reported."}</p></section>
      {mapHref && <a href={mapHref} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800">Directions</a>}<p className="text-xs text-slate-500">Availability reflects the last shelter record update. Confirm directly with local authorities before travel.</p></>}
  </div>;
}
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-2 text-xl font-extrabold">{value}</p></div>; }
