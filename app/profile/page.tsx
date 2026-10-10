"use client";

import { useEffect, useState } from "react";

type Profile = { name: string; email: string; phone: string; location: string; emergencyContact: string };
const emptyProfile: Profile = { name: "", email: "", phone: "", location: "", emergencyContact: "" };

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [role, setRole] = useState("CITIZEN");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => { try { const user = JSON.parse(localStorage.getItem("dr_user") || "null") as { name?: string; role?: string } | null; const details = JSON.parse(localStorage.getItem("dr_profile") || "{}") as Partial<Profile>; setProfile({ ...emptyProfile, ...details, name: details.name || user?.name || "" }); setRole(user?.role || "CITIZEN"); } catch { setProfile(emptyProfile); } }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const update = (key: keyof Profile, value: string) => { setSaved(false); setProfile((current) => ({ ...current, [key]: value })); };
  const save = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); localStorage.setItem("dr_profile", JSON.stringify(profile)); setSaved(true); };
  return <div className="mx-auto max-w-3xl space-y-5"><header><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">Account</p><h1 className="mt-1 text-3xl font-extrabold">Profile</h1><p className="mt-2 text-sm text-slate-600">Contact details are stored in this browser. They are not synced to the Java API.</p></header>
    <form onSubmit={save} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2 sm:p-6"><Field label="Name" value={profile.name} onChange={(value) => update("name", value)} /><Field label="Email" type="email" value={profile.email} onChange={(value) => update("email", value)} /><Field label="Phone" type="tel" value={profile.phone} onChange={(value) => update("phone", value)} /><Field label="Location" value={profile.location} onChange={(value) => update("location", value)} /><Field label="Emergency contact" value={profile.emergencyContact} onChange={(value) => update("emergencyContact", value)} /><div className="flex flex-col justify-end"><span className="text-xs font-semibold text-slate-500">Signed in role</span><span className="mt-2 font-bold">{role}</span></div><div className="flex items-center gap-3 sm:col-span-2"><button className="min-h-11 rounded-xl bg-blue-700 px-5 text-sm font-bold text-white hover:bg-blue-800">Save on this device</button>{saved && <span role="status" className="text-sm font-semibold text-emerald-800">Saved</span>}</div></form>
  </div>;
}
function Field({ label, type = "text", value, onChange }: { label: string; type?: string; value: string; onChange: (value: string) => void }) { return <label className="text-sm font-semibold">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200" /></label>; }
