"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Incident = { id: number; type: string; description?: string; latitude?: number; longitude?: number; severity?: string; priority?: string; status?: string; assignedResponder?: string; assignedShelter?: string; createdAt?: string; updatedAt?: string };
type HistoryEntry = { id: number; previousStatus: string; newStatus: string; changedBy?: string; remarks?: string; changedAt: string };
const apiBaseUrl = "";
const timeline = ["REPORTED", "VERIFIED", "PRIORITIZED", "ASSIGNED", "RESPONDING", "ON_SITE", "RESCUE", "RESOLVED", "CLOSED"];
const aliases: Record<string, string> = { CONTROL_ROOM_ALERTED: "VERIFIED", RESPONDERS_DISPATCHED: "ASSIGNED", EN_ROUTE: "RESPONDING", IN_PROGRESS: "RESCUE", SHELTER_GUIDED: "RESCUE" };

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/incidents/${encodeURIComponent(id)}`, { signal, cache: "no-store" });
      if (!response.ok) throw new Error(response.status === 404 ? "This incident could not be found." : "The incident service is unavailable.");
      const record: Incident = await response.json();
      if (signal?.aborted) return;
      setIncident(record);
      setError("");
      const historyResponse = await fetch(`${apiBaseUrl}/api/incidents/${encodeURIComponent(id)}/history`, { signal, cache: "no-store" });
      if (historyResponse.ok && !signal?.aborted) setHistory(await historyResponse.json());
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause.message : "Unable to load incident details.");
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [id]);
  useEffect(() => { const controller = new AbortController(); const initial = window.setTimeout(() => void load(controller.signal), 0); return () => { controller.abort(); window.clearTimeout(initial); }; }, [load]);

  if (loading && !incident) return <p role="status" className="rounded-xl border border-slate-200 bg-white p-8 text-sm">Loading incident details…</p>;
  if (!incident) return <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900" role="alert"><p>{error || "Incident unavailable."}</p><button onClick={() => { setLoading(true); void load(); }} className="font-bold underline">Try again</button><Link href="/incidents" className="ml-3 font-bold underline">All incidents</Link></div>;

  const status = (incident.status || "REPORTED").toUpperCase().replaceAll(" ", "_");
  const currentStep = timeline.indexOf(aliases[status] || status);
  const location = incident.latitude != null && incident.longitude != null ? `${incident.latitude.toFixed(5)}, ${incident.longitude.toFixed(5)}` : "Location not provided";
  const mapHref = incident.latitude != null && incident.longitude != null ? `https://www.google.com/maps/search/?api=1&query=${incident.latitude},${incident.longitude}` : "/emergency-map";
  return <div className="space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><Link href="/incidents" className="inline-flex min-h-10 items-center text-sm font-semibold text-blue-700 hover:underline">← Incident list</Link><h1 className="mt-2 text-3xl font-extrabold">Incident DR-{incident.id}</h1><p className="mt-1 text-sm text-slate-600">{incident.type.replaceAll("_", " ")} · {location}</p></div><div className="flex gap-2"><span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-800">{incident.priority || incident.severity || "UNASSESSED"}</span><span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800">{status.replaceAll("_", " ")}</span></div></header>
    {error && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Live refresh failed: {error}</p>}
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-extrabold">Incident lifecycle</h2><ol className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">{timeline.map((step, index) => { const complete = currentStep >= index; return <li key={step} className="flex items-center gap-3"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${complete ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`} aria-label={complete ? "Complete" : "Pending"}>{complete ? "✓" : index + 1}</span><span className={`text-xs font-semibold ${complete ? "text-slate-900" : "text-slate-500"}`}>{step.replaceAll("_", " ")}</span></li>; })}</ol></section>
    <section className="grid gap-4 md:grid-cols-3"><Info label="Hazard / report" value={incident.type.replaceAll("_", " ")} detail={incident.description || "No report description was provided."} /><Info label="Location" value={location} detail={incident.latitude != null ? "Coordinates provided with the report." : "The reporter did not share coordinates."} /><Info label="Assigned response" value={incident.assignedResponder || "Awaiting team assignment"} detail={`Nearest shelter: ${incident.assignedShelter || "Not assigned"}`} /></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-extrabold">Status history</h2><a href={mapHref} target={incident.latitude != null ? "_blank" : undefined} rel={incident.latitude != null ? "noreferrer" : undefined} className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-bold text-blue-700 hover:bg-blue-50">Map / directions →</a></div>{history.length ? <ol className="mt-4 space-y-4 border-l-2 border-slate-200 pl-4">{history.map((entry) => <li key={entry.id} className="relative"><span className="absolute -left-[1.38rem] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-blue-600"/><p className="text-sm font-bold">{entry.previousStatus.replaceAll("_", " ")} → {entry.newStatus.replaceAll("_", " ")}</p><p className="mt-1 text-xs text-slate-500">{new Date(entry.changedAt).toLocaleString()}{entry.changedBy ? ` · ${entry.changedBy}` : ""}</p>{entry.remarks && <p className="mt-1 text-sm text-slate-700">{entry.remarks}</p>}</li>)}</ol> : <p className="mt-3 text-sm text-slate-500">No status updates have been recorded yet.</p>}</section>
    <p className="text-xs text-slate-500">Last reported {incident.updatedAt ? new Date(incident.updatedAt).toLocaleString() : incident.createdAt ? new Date(incident.createdAt).toLocaleString() : "time unavailable"}</p>
  </div>;
}
function Info({ label, value, detail }: { label: string; value: string; detail: string }) { return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</h2><p className="mt-3 text-base font-bold text-slate-900">{value}</p><p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p></article>; }
