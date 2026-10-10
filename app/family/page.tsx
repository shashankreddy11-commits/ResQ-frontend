"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type FamilyMember = { id: string; name: string; relationship: string; status: "UNKNOWN" | "SAFE" | "NEEDS_HELP"; updatedAt: string };
const storageKey = "dr_family_contacts";

export default function FamilySafetyPage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => { try { const saved = JSON.parse(localStorage.getItem(storageKey) || "[]"); if (Array.isArray(saved)) setMembers(saved); } catch { localStorage.removeItem(storageKey); } setReady(true); }, 0); return () => window.clearTimeout(timer); }, []);
  const save = (next: FamilyMember[]) => { setMembers(next); localStorage.setItem(storageKey, JSON.stringify(next)); };
  const add = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const cleanName = name.trim(); if (!cleanName) return; save([...members, { id: crypto.randomUUID(), name: cleanName, relationship: relationship.trim() || "Family contact", status: "UNKNOWN", updatedAt: new Date().toISOString() }]); setName(""); setRelationship(""); };
  const update = (id: string, status: FamilyMember["status"]) => save(members.map((member) => member.id === id ? { ...member, status, updatedAt: new Date().toISOString() } : member));
  return <div className="mx-auto max-w-4xl space-y-5"><header><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">Household readiness</p><h1 className="mt-1 text-3xl font-extrabold">Family safety</h1><p className="mt-2 text-sm leading-6 text-slate-600">Keep a local checklist of family check-ins. This list stays on this browser and is not shared with responders.</p></header>
    <form onSubmit={add} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><label className="text-sm font-semibold">Name<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" /></label><label className="text-sm font-semibold">Relationship<input value={relationship} onChange={(event) => setRelationship(event.target.value)} placeholder="Parent, child, neighbour…" className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" /></label><button className="min-h-11 rounded-xl bg-blue-700 px-5 text-sm font-bold text-white hover:bg-blue-800">Add contact</button></form>
    {!ready && <p role="status" className="text-sm text-slate-500">Loading saved contacts…</p>}
    {ready && !members.length && <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No family check-ins yet. Add a contact to track their status on this device.</p>}
    <div className="space-y-3">{members.map((member) => <article key={member.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5"><div><h2 className="font-extrabold">{member.name}</h2><p className="mt-1 text-sm text-slate-600">{member.relationship} · <span className={member.status === "SAFE" ? "font-bold text-emerald-700" : member.status === "NEEDS_HELP" ? "font-bold text-red-700" : "font-semibold text-slate-600"}>{member.status.replaceAll("_", " ")}</span></p><p className="mt-1 text-xs text-slate-500">Updated {new Date(member.updatedAt).toLocaleString()}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => update(member.id, "SAFE")} className="min-h-10 rounded-lg border border-emerald-300 px-3 text-sm font-bold text-emerald-800 hover:bg-emerald-50">I’m safe</button><button onClick={() => update(member.id, "NEEDS_HELP")} className="min-h-10 rounded-lg border border-red-300 px-3 text-sm font-bold text-red-800 hover:bg-red-50">Needs help</button><button onClick={() => save(members.filter((item) => item.id !== member.id))} aria-label={`Remove ${member.name}`} className="min-h-10 rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100">Remove</button></div></article>)}</div>
    <Link href="/sos" className="inline-flex min-h-11 items-center rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700">Request emergency help</Link>
  </div>;
}
