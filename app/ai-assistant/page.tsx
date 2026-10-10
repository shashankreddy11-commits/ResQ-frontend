"use client";

import React from "react";
import { AIAssistant } from "@/components/ai-assistant";

export default function AIAssistantPage() {
  return (
    <div className="space-y-6">
      <div className="saas-card p-6 border border-[#E4E7EC] shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#667085]">
            24/7 CONVERSATIONAL SAFETY HELPLINE
          </span>
          <h1 className="text-2xl font-extrabold text-[#172033]">
            AI Emergency Assistant
          </h1>
          <p className="text-xs text-[#667085] mt-1">
            Get instant safety guidance, protocol lookups, and emergency service details.
          </p>
        </div>
        <span className="text-xs font-mono font-bold bg-purple-50 border border-purple-200 text-[#7C3AED] px-3 py-1.5 rounded-full">
          ● LOCAL DEMO ASSISTANT
        </span>
      </div>

      <AIAssistant />
    </div>
  );
}
