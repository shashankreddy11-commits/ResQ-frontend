"use client";

import { useState } from "react";
import Link from "next/link";
import { recordOfflineUsage } from "@/lib/offline-usage";

type ChatMessage = { sender: "USER" | "AI"; text: string; instructions?: string[]; time: string; showShelters?: boolean };
type Shelter = { id: number; name?: string; address?: string; capacity?: number; occupancy?: number; status?: string };
type AssistantResponse = { reply?: string; suggested_actions?: string[] };
const apiBaseUrl = "";
const clock = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([{ sender: "AI", text: "I can share general safety steps and information available in this app. For immediate danger, call 112 and follow local authority instructions.", time: clock() }]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const suggestions = ["What should I do during a flood?", "Where can I find a shelter?", "What should I do during a fire?", "How do I report an emergency?"];

  const send = async (question: string) => {
    const clean = question.trim();
    if (!clean || isSending) return;
    setIsSending(true); setError("");
    setMessages((current) => [...current, { sender: "USER", text: clean, time: clock() }]);
    const needsShelter = /shelter|evacuat|where can i go/i.test(clean);
    let reply = "I can’t reach the guidance service right now. Follow local emergency instructions, move away from immediate danger, and call 112 if urgent help is needed.";
    let actions = ["Call 112 for immediate danger", "Open the safety guide", "Check current alerts"];
    let shelterData: Shelter[] = [];
    const lower = clean.toLowerCase();
    if (!navigator.onLine) {
      recordOfflineUsage("offline_guidance_used");
      if (/fire|smoke/.test(lower)) {
        reply = "Offline fire guidance: leave by the nearest safe exit, stay low under smoke, use stairs rather than elevators, and do not re-enter. Call 112.";
        actions = ["Leave by a safe exit", "Stay low under smoke", "Call 112"];
      } else if (/earthquake|quake/.test(lower)) {
        reply = "Offline earthquake guidance: drop, cover, and hold on. Stay away from windows. After shaking stops, use stairs and avoid damaged buildings. Call 112 if urgent help is needed.";
        actions = ["Drop, cover, and hold on", "Avoid damaged buildings", "Call 112"];
      } else if (/cyclone|storm|wind/.test(lower)) {
        reply = "Offline storm guidance: shelter indoors away from windows, follow official evacuation instructions, and avoid floodwater and fallen power lines. Call 112 if in immediate danger.";
        actions = ["Shelter away from windows", "Avoid floodwater and power lines", "Call 112"];
      } else if (/bleed|injur|first aid/.test(lower)) {
        reply = "Offline first-aid guidance: call 112. For serious bleeding, apply firm, continuous pressure with a clean cloth. Do not move someone with a possible head, neck, or back injury unless they face immediate danger.";
        actions = ["Call 112", "Apply firm pressure to serious bleeding", "Do not move a seriously injured person unnecessarily"];
      } else if (needsShelter) {
        reply = "Offline shelter guidance: use a safe nearby public shelter identified by local authorities. The app cannot confirm shelter locations, capacity, or whether a site is open while offline. Call 112 for urgent help.";
        actions = ["Confirm shelter details with local authorities", "Do not travel through floodwater", "Call 112"];
      } else {
        reply = "Offline flood guidance: move to higher ground, stay away from drains and underpasses, and never walk or drive through floodwater. Follow local authorities and call 112 if in immediate danger.";
        actions = ["Move to higher ground", "Avoid floodwater and underpasses", "Call 112"];
      }
    } else {
      try {
        const response = await fetch(`${apiBaseUrl}/api/ml/chat-assistant`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: clean, offline_mode: false }) });
        if (!response.ok) throw new Error("Guidance service unavailable");
        const data: AssistantResponse = await response.json();
        if (data.reply) reply = data.reply;
        if (Array.isArray(data.suggested_actions) && data.suggested_actions.length) actions = data.suggested_actions;
      } catch { setError("The assistant service is unavailable. The general fallback guidance below is not personalized."); }
    }
    if (needsShelter && navigator.onLine) {
      try { const response = await fetch(`${apiBaseUrl}/api/shelters`, { cache: "no-store" }); if (response.ok) { const data: Shelter[] = await response.json(); shelterData = Array.isArray(data) ? data : []; } }
      catch { setError("Shelter records are unavailable; confirm locations with local authorities."); }
      if (!shelterData.length) reply += " No shelter records are available from the app right now. Confirm an open shelter with local authorities before travelling.";
      else reply += " Here are shelter records available in the app. Availability may change; confirm before travelling.";
    }
    setMessages((current) => [...current, { sender: "AI", text: reply, instructions: actions, time: clock(), showShelters: needsShelter && shelterData.length > 0 }]);
    if (shelterData.length) {
      setMessages((current) => [...current, { sender: "AI", text: `Current shelter records: ${shelterData.slice(0, 5).map((item) => `${item.name || `Shelter ${item.id}`} (${Math.max(0, (item.capacity || 0) - (item.occupancy || 0))} places listed available)`).join("; ")}.`, time: clock(), showShelters: true }]);
    }
    setInput(""); setIsSending(false);
  };

  return <section className="rounded-2xl border border-[#E4E7EC] bg-white p-5 shadow-sm sm:p-6">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4"><div><h1 className="text-xl font-extrabold text-[#172033]">Emergency safety assistant</h1><p className="mt-1 text-sm text-slate-600">Guidance and app records, with clear limits on what the assistant knows.</p></div><span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-bold text-purple-800">LOCAL DEMO ASSISTANT</span></header>
    <div className="mt-4 flex flex-wrap gap-2">{suggestions.map((prompt) => <button key={prompt} type="button" disabled={isSending} onClick={() => void send(prompt)} className="min-h-10 rounded-xl border border-purple-200 bg-purple-50 px-3 text-xs font-semibold text-purple-800 hover:bg-purple-100 disabled:opacity-50">{prompt}</button>)}</div>
    {error && <p role="status" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">{error}</p>}
    <div aria-live="polite" className="mt-4 h-[min(55vh,440px)] min-h-72 space-y-4 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4">{messages.map((message, index) => <div key={`${index}-${message.time}`} className={`flex ${message.sender === "USER" ? "justify-end" : "justify-start"}`}><div className={`max-w-[90%] rounded-2xl p-4 text-sm ${message.sender === "USER" ? "rounded-br-md bg-blue-700 text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-800"}`}><div className="mb-2 flex justify-between gap-4 border-b border-current/10 pb-2 text-xs font-bold"><span>{message.sender === "USER" ? "You" : "Local demo assistant"}</span><time className="font-normal opacity-70">{message.time}</time></div><p className="leading-6">{message.text}</p>{message.instructions?.length ? <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-5">{message.instructions.map((step, stepIndex) => <li key={stepIndex}>{step}</li>)}</ul> : null}{message.showShelters && <Link href="/shelters" className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-blue-50 px-3 text-xs font-bold text-blue-800">Review shelter records →</Link>}</div></div>)}</div>
    <form onSubmit={(event) => { event.preventDefault(); void send(input); }} className="mt-4 flex gap-2"><label className="sr-only" htmlFor="assistant-question">Ask a safety question</label><input id="assistant-question" value={input} onChange={(event) => setInput(event.target.value)} disabled={isSending} placeholder="Ask about safety, alerts, or shelters…" className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200" /><button type="submit" disabled={isSending || !input.trim()} className="min-h-11 rounded-xl bg-purple-700 px-5 text-sm font-bold text-white hover:bg-purple-800 disabled:opacity-50">{isSending ? "Sending…" : "Send"}</button></form>
    <p className="mt-3 text-xs leading-5 text-slate-500">This assistant is a prototype and can be wrong. It does not replace emergency services or official advisories.</p>
  </section>;
}
