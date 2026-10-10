"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const stages = [
  ["Monitor", "Weather observations show heavy rainfall in the scenario area."],
  ["Estimate risk", "The local decision-support estimate raises a flood risk level."],
  ["Warn", "A draft flood notice is prepared for review."],
  ["Identify affected area", "A simulated low-lying area is marked for response planning."],
  ["Citizen report", "A sample SOS report enters the training workflow."],
  ["EOC verification", "The command desk reviews and verifies the training report."],
  ["Prioritize and assign", "A simulated response unit is assigned to the exercise."],
  ["Responder en route", "The mission status advances through the response workflow."],
  ["On site", "The simulated team reaches the exercise location."],
  ["Shelter / medical support", "The exercise demonstrates referral to service records."],
  ["Resolve", "The training incident reaches a resolved state."],
] as const;

export default function DemoPage() {
  const [stage, setStage] = useState(-1);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing || stage >= stages.length - 1) return;
    const timer = window.setTimeout(() => {
      const nextStage = stage + 1;
      setStage(nextStage);
      if (nextStage >= stages.length - 1) setPlaying(false);
    }, 12_000);
    return () => window.clearTimeout(timer);
  }, [playing, stage]);
  const reset = () => { setPlaying(false); setStage(-1); };
  return <div className="mx-auto max-w-5xl space-y-6"><header className="rounded-2xl bg-[#0B1F3A] p-6 text-white sm:p-8"><span className="rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-100">Training scenario · simulated data</span><h1 className="mt-4 text-3xl font-extrabold">Flood response walkthrough</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">Follow a sample report from weather monitoring through EOC coordination and resolution. This exercise does not create real alerts, incidents, or assignments.</p></header>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex flex-wrap gap-3"><button onClick={() => { if (stage >= stages.length - 1) setStage(-1); setPlaying(true); }} className="min-h-11 rounded-xl bg-blue-700 px-5 text-sm font-bold text-white hover:bg-blue-800">{playing ? "Playing…" : stage >= stages.length - 1 ? "Play again" : "Play"}</button><button onClick={() => setPlaying(false)} disabled={!playing} className="min-h-11 rounded-xl border border-slate-300 px-5 text-sm font-bold disabled:opacity-50">Pause</button><button onClick={reset} className="min-h-11 rounded-xl border border-slate-300 px-5 text-sm font-bold">Reset</button><button onClick={() => { setPlaying(false); setStage((current) => Math.min(stages.length - 1, current + 1)); }} disabled={stage >= stages.length - 1} className="min-h-11 rounded-xl border border-slate-300 px-5 text-sm font-bold disabled:opacity-50">Next step</button></div>
      <p role="status" className="mt-4 text-sm font-semibold text-slate-600">{playing ? "Scenario running · advances every 12 seconds" : stage < 0 ? "Ready to start" : `Step ${stage + 1} of ${stages.length}`}</p><ol className="mt-5 space-y-3">{stages.map(([title, description], index) => <li key={title} className={`flex gap-4 rounded-xl border p-4 transition-colors ${index === stage ? "border-blue-300 bg-blue-50" : index < stage ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-white"}`}><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${index < stage ? "bg-emerald-700 text-white" : index === stage ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600"}`}>{index < stage ? "✓" : index + 1}</span><span><span className="block text-sm font-bold">{title}</span><span className="mt-1 block text-sm leading-6 text-slate-600">{description}</span></span></li>)}</ol>
    </section><section className="flex flex-wrap gap-3"><Link href="/live-situation" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold">Live situation map →</Link><Link href="/eoc" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold">EOC command desk →</Link><Link href="/responders" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold">Responder missions →</Link></section>
  </div>;
}
