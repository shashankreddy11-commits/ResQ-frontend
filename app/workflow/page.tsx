"use client";

import React from "react";
import { WorkflowDiagramComponent } from "@/components/workflow-diagram";

export default function WorkflowPage() {
  return (
    <div className="min-h-screen bg-[#090d16] text-[#E9E7E1] font-sans pb-16">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6">
        <WorkflowDiagramComponent />
      </div>
    </div>
  );
}
