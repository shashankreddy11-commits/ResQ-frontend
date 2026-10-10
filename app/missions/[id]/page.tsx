"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Incident = { id: number; type?: string; description?: string; priority?: string; severity?: string; status?: string; assignedResponder?: string; assignedShelter?: string; latitude?: number; longitude?: number };
const apiBaseUrl = "";
const steps = ["ASSIGNED", "ACCEPTED", "NAVIGATING", "ON_SITE", "ASSESSING", "RESCUE", "RESOLVED"];

export default function MissionPage() {
  const { id } = useParams<{ id: string }>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = useCallback(async (signal?: AbortSignal) => {
    try { const response = await fetch(`${apiBaseUrl}/api/incidents/${encodeURIComponent(id)}`, { signal, cache: "no-store" }); if (!response.ok) throw new Error(response.status === 404 ? "Mission not found." : "Unable to reach the incident service."); if (!signal?.aborted) { setIncident(await response.json()); setError(""); } }
    catch (cause) { if (cause instanceof Error && cause.name === "AbortError") return; if (!signal?.aborted) setError(cause instanceof Error ? cause.message : "Mission data unavailable."); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [id]);
  useEffect(() => { const controller = new AbortController(); const initial = window.setTimeout(() => void load(controller.signal), 0); return () => { controller.abort(); window.clearTimeout(initial); }; }, [load]);
  const status = (incident?.status || "REPORTED").toUpperCase().replaceAll(" ", "_");
  const currentIndex = steps.indexOf(status);
  const nextStatus = status === "REPORTED" || status === "RESPONDERS_DISPATCHED" || status === "ASSIGNED" ? "ACCEPTED" : status === "ACCEPTED" ? "NAVIGATING" : ["NAVIGATING", "RESPONDING", "EN_ROUTE"].includes(status) ? "ON_SITE" : status === "ON_SITE" ? "ASSESSING" : status === "ASSESSING" ? "RESCUE" : status === "RESCUE" ? "RESOLVED" : null;
  const advance = async () => {
    if (!incident || !nextStatus) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const token = localStorage.getItem("dr_token");
      const response = await fetch(`${apiBaseUrl}/api/incidents/${incident.id}/status`, { method: "PUT", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ status: nextStatus, remarks: `Mission status updated to ${nextStatus.replaceAll("_", " ")}.` }) });
      if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Sign in with a responder or EOC account to update this mission." : "The status update was rejected. Try again.");
      setIncident(await response.json()); setMessage(`Mission updated: ${nextStatus.replaceAll("_", " ")}.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Mission update failed."); }
    finally { setBusy(false); }
  };
  if (loading) return <p role="status" className="rounded-xl border bg-white p-6 text-sm">Loading mission…</p>;
  if (!incident) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{error}<p className="mt-3"><Link href="/responders" className="font-bold underline">Return to response teams</Link></p></div>;
  const directions = incident.latitude != null && incident.longitude != null ? `https://www.google.com/maps/dir/?api=1&destination=${incident.latitude},${incident.longitude}` : null;
  return <div className="mx-auto max-w-4xl space-y-5"><Link href="/responders" className="inline-flex min-h-10 items-center text-sm font-semibold text-blue-700">← Missions</Link><header><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">Responder mission</p><h1 className="mt-1 text-3xl font-extrabold">Incident DR-{incident.id}</h1><p className="mt-2 text-sm text-slate-600">{(incident.type || "Emergency").replaceAll("_", " ")} · {incident.description || "No location details recorded"}</p></header>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</p>}{message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{message}</p>}
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs font-bold uppercase text-slate-500">Current mission status</p><p className="mt-1 text-xl font-extrabold">{status.replaceAll("_", " ")}</p></div><span className="h-fit rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-800">{incident.priority || incident.severity || "UNASSESSED"}</span></div><ol className="mt-5 grid gap-3 sm:grid-cols-4">{steps.map((step, index) => <li key={step} className="flex items-center gap-2 text-xs"><span className={`flex h-7 w-7 items-center justify-center rounded-full font-bold ${currentIndex >= index ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>{currentIndex >= index ? "✓" : index + 1}</span>{step.replaceAll("_", " ")}</li>)}</ol></section>
    <section className="flex flex-wrap gap-3">{nextStatus && <button disabled={busy} onClick={() => void advance()} className="min-h-11 rounded-xl bg-blue-700 px-5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50">{busy ? "Updating…" : `${nextStatus === "ACCEPTED" ? "Accept mission" : nextStatus === "NAVIGATING" ? "Navigate" : nextStatus === "ON_SITE" ? "Mark arrived" : nextStatus === "RESCUE" ? "Start rescue" : nextStatus === "RESOLVED" ? "Resolve incident" : "Update status"}`}</button>}{directions && <a href={directions} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-800">Open directions</a>}<Link href="/resources" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-800">Request resources</Link><Link href={`/incidents/${incident.id}`} className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-800">Incident details</Link></section>
  </div>;
}
