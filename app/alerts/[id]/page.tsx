"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type AlertRecord = { id: number; title?: string; message?: string; severity?: string; disasterType?: string; targetArea?: string; startTime?: string; expiryTime?: string; createdBy?: string };
const apiBaseUrl = "";

export default function AlertDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [alert, setAlert] = useState<AlertRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiBaseUrl}/api/alerts/${encodeURIComponent(id)}`, { signal: controller.signal, cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<AlertRecord> : Promise.reject(new Error(response.status === 404 ? "This alert could not be found." : "The alert service is unavailable.")))
      .then((data) => { if (!controller.signal.aborted) setAlert(data); })
      .catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Unable to load this alert."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id]);
  return <div className="mx-auto max-w-4xl space-y-5"><Link href="/alerts" className="inline-flex min-h-10 items-center text-sm font-semibold text-blue-700 hover:underline">← All alerts</Link>
    {loading && <p role="status" className="rounded-xl border bg-white p-6 text-sm text-slate-600">Loading alert…</p>}
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{error}<p className="mt-2">Check your connection to the Java API, then <button className="font-bold underline" onClick={() => window.location.reload()}>try again</button>.</p></div>}
    {alert && <><header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold uppercase text-red-800">{alert.severity || "Advisory"}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-700">{(alert.disasterType || "Hazard").replaceAll("_", " ")}</span></div><h1 className="mt-4 text-3xl font-extrabold text-slate-950">{alert.title || "Public safety alert"}</h1><p className="mt-2 text-sm text-slate-600">{alert.targetArea || "Area not specified"} · Issued {alert.startTime ? new Date(alert.startTime).toLocaleString() : "time unavailable"}</p><p className="mt-5 leading-7 text-slate-800">{alert.message || "Follow safety instructions issued by local authorities."}</p></header>
      <section className="grid gap-4 md:grid-cols-2"><article className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Affected area</h2><p className="mt-2 text-sm text-slate-600">{alert.targetArea || "The alert record does not include an affected area."}</p><p className="mt-3 text-xs text-slate-500">{alert.expiryTime ? `Valid until ${new Date(alert.expiryTime).toLocaleString()}` : "No expiry time is listed in this record."}</p></article><article className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Safety guidance</h2><p className="mt-2 text-sm leading-6 text-slate-600">Follow the instructions in this alert and local authority updates. Move away from immediate hazards and call 112 if you need urgent help.</p><Link href="/safety-guide" className="mt-3 inline-flex min-h-10 items-center font-bold text-blue-700">Open safety guide →</Link></article></section>
      <Link href="/emergency-map" className="inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800">View services map</Link></>}
  </div>;
}
