"use client";

import { useRouter } from "next/navigation";
import { SOSModal } from "@/components/sos-modal";

export default function SOSPage() {
  const router = useRouter();
  const apiBaseUrl = "";
  return <div className="mx-auto max-w-3xl space-y-5 py-5">
    <div><p className="text-xs font-bold uppercase tracking-[.18em] text-red-700">Emergency request</p><h1 className="mt-1 text-3xl font-extrabold">Send an SOS</h1><p className="mt-2 text-sm text-slate-600">Share the emergency type, location, and help needed. For immediate danger, call 112.</p></div>
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900"><strong>Use this form only if you need emergency assistance.</strong> Keep the page open until you receive a request ID. A submitted request goes to the incident service; it does not itself contact emergency services.</div>
    <SOSModal isOpen onClose={() => router.push("/")} onSuccess={() => {}} apiBaseUrl={apiBaseUrl} />
  </div>;
}
