"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Alert = { id: number; title?: string; message?: string; targetArea?: string; severity?: string; startTime?: string };
type Incident = { id: number; type?: string; description?: string; status?: string; updatedAt?: string };
type Notice = { key: string; title: string; message: string; time: string; type: string; href: string };
const apiBaseUrl = "";

export default function NotificationsPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    Promise.allSettled([
      fetch(`${apiBaseUrl}/api/alerts`, { signal: controller.signal, cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<Alert[]> : Promise.reject()),
      fetch(`${apiBaseUrl}/api/incidents`, { signal: controller.signal, cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<Incident[]> : Promise.reject()),
    ]).then(([alerts, incidents]) => {
      if (controller.signal.aborted) return;
      const rows: Notice[] = [];
      if (alerts.status === "fulfilled" && Array.isArray(alerts.value)) for (const item of alerts.value) rows.push({ key: `alert-${item.id}`, type: "Critical alert", title: item.title || item.severity || "Public safety alert", message: `${item.targetArea || "Area not specified"} · ${item.message || "See details for instructions."}`, time: item.startTime || "", href: `/alerts/${item.id}` });
      if (incidents.status === "fulfilled" && Array.isArray(incidents.value)) for (const item of incidents.value.slice(0, 30)) rows.push({ key: `incident-${item.id}`, type: "Incident update", title: `Incident DR-${item.id} · ${(item.status || "REPORTED").replaceAll("_", " ")}`, message: `${item.type || "Emergency"} · ${item.description || "No report description"}`, time: item.updatedAt || "", href: `/incidents/${item.id}` });
      rows.sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime());
      setNotices(rows);
      if (alerts.status === "rejected" && incidents.status === "rejected") setError("Notifications could not be loaded. Check the Java API connection and retry.");
      else if (alerts.status === "rejected" || incidents.status === "rejected") setError("Some notification sources are temporarily unavailable.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  return <div className="space-y-5"><header><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">Your updates</p><h1 className="mt-1 text-3xl font-extrabold">Notifications</h1><p className="mt-2 text-sm text-slate-600">Alert and incident updates currently available from the application services.</p></header>
    {error && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error}{notices.length === 0 && <button onClick={() => window.location.reload()} className="ml-2 font-bold underline">Retry</button>}</div>}
    {loading && <p role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading notifications…</p>}
    {!loading && !notices.length && !error && <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">No new notifications.</p>}
    <div className="space-y-3">{notices.map((notice) => <Link key={notice.key} href={notice.href} className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><div className="flex flex-wrap justify-between gap-2"><span className="text-xs font-bold uppercase tracking-wide text-blue-700">{notice.type}</span><time className="text-xs text-slate-500">{notice.time ? new Date(notice.time).toLocaleString() : "Time unavailable"}</time></div><h2 className="mt-2 font-extrabold text-slate-900">{notice.title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{notice.message}</p></Link>)}</div>
  </div>;
}
