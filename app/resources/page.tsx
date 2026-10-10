"use client";

import { useEffect, useState } from "react";

type Resource = { id: number; category?: string; name: string; quantityAvailable?: number; location?: string; organizationId?: string };
const apiBaseUrl = "";

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [category, setCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [location, setLocation] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const load = async (signal?: AbortSignal) => {
    try { const response = await fetch(`${apiBaseUrl}/api/resources`, { signal, cache: "no-store" }); if (!response.ok) throw new Error("Resource service unavailable."); const data: Resource[] = await response.json(); if (!signal?.aborted) { setResources(Array.isArray(data) ? data : []); setError(""); } }
    catch (cause) { if (cause instanceof Error && cause.name === "AbortError") return; if (!signal?.aborted) setError(cause instanceof Error ? cause.message : "Could not load resources."); }
    finally { if (!signal?.aborted) setLoading(false); }
  };
  useEffect(() => {
    const controller = new AbortController();
    const initial = window.setTimeout(() => { try { const user = JSON.parse(localStorage.getItem("dr_user") || "null") as { role?: string } | null; setCanManage(["ADMIN", "EOC_ADMIN"].includes(user?.role?.toUpperCase() || "")); } catch { setCanManage(false); } void load(controller.signal); }, 0);
    return () => { controller.abort(); window.clearTimeout(initial); };
  }, []);
  const categories = ["ALL", ...new Set(resources.map((item) => item.category || "Uncategorized"))];
  const shown = resources.filter((item) => category === "ALL" || (item.category || "Uncategorized") === category);
  const adjust = async (item: Resource, delta: number) => {
    setBusyId(item.id); setError(""); setMessage("");
    try { const token = localStorage.getItem("dr_token"); const response = await fetch(`${apiBaseUrl}/api/resources/${item.id}/quantity`, { method: "PATCH", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ delta }) }); if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Only an administrator can adjust inventory." : "The inventory update was rejected."); const saved: Resource = await response.json(); setResources((current) => current.map((entry) => entry.id === item.id ? saved : entry)); setMessage(`${item.name} inventory updated.`); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Inventory update failed."); }
    finally { setBusyId(null); }
  };
  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setMessage("");
    try { const token = localStorage.getItem("dr_token"); const response = await fetch(`${apiBaseUrl}/api/resources`, { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ name: name.trim(), category: newCategory.trim(), quantityAvailable: Number(quantity), location: location.trim() }) }); if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Sign in as an administrator to add inventory." : "The resource could not be saved."); const saved: Resource = await response.json(); setResources((current) => [saved, ...current]); setName(""); setNewCategory(""); setQuantity("1"); setLocation(""); setMessage("Resource added to inventory."); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Resource creation failed."); }
  };
  return <div className="space-y-5"><header><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">Logistics registry</p><h1 className="mt-1 text-3xl font-extrabold">Resources</h1><p className="mt-2 text-sm text-slate-600">Available quantities from the resource inventory. Assignment and maintenance quantities are not tracked by the current API.</p></header>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error} <button onClick={() => void load()} className="ml-2 font-bold underline">Retry</button></div>}{message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}
    {canManage && <form onSubmit={(event) => void create(event)} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"><label className="text-xs font-bold">Resource name<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-normal" /></label><label className="text-xs font-bold">Category<input required value={newCategory} onChange={(event) => setNewCategory(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-normal" /></label><label className="text-xs font-bold">Available quantity<input required type="number" min="0" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-normal" /></label><label className="text-xs font-bold">Storage location<input required value={location} onChange={(event) => setLocation(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-normal" /></label><button className="min-h-11 rounded-xl bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800">Add resource</button></form>}
    <div className="flex flex-wrap gap-2" aria-label="Filter resource category">{categories.map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className={`min-h-10 rounded-full border px-4 text-xs font-bold ${category === item ? "border-blue-700 bg-blue-700 text-white" : "border-slate-200 bg-white text-slate-700"}`}>{item === "ALL" ? "All categories" : item}</button>)}</div>
    {loading && <p role="status" className="rounded-xl border bg-white p-5 text-sm text-slate-600">Loading inventory…</p>}{!loading && !error && shown.length === 0 && <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No resource records are available.</p>}
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{shown.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.category || "Resource"}</p><h2 className="mt-1 font-extrabold">{item.name}</h2></div><span className="rounded-lg bg-emerald-50 px-3 py-2 text-xl font-extrabold text-emerald-800">{item.quantityAvailable ?? 0}</span></div><p className="mt-3 text-sm text-slate-600">{item.location || "Storage location not reported"}</p>{canManage && <div className="mt-4 flex gap-2"><button disabled={busyId === item.id || (item.quantityAvailable || 0) <= 0} onClick={() => void adjust(item, -1)} className="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-bold disabled:opacity-50">− 1</button><button disabled={busyId === item.id} onClick={() => void adjust(item, 1)} className="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-bold disabled:opacity-50">+ 1</button></div>}</article>)}</div>
  </div>;
}
