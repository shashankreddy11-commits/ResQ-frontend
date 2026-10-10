"use client";

import React, { useState } from "react";
import Link from "next/link";

export function WorkflowDiagramComponent() {
  const [activeStep, setActiveStep] = useState<string | null>(null);

  const citizenSteps = [
    { id: "c1", num: "1", title: "Register / Login", subtitle: "(Citizen)", action: "Auth Modal", link: "/#login" },
    { id: "c2", num: "2", title: "Access Dashboard", subtitle: "(View alerts, services, profile)", action: "Dashboard View", link: "/dashboard" },
    { id: "c3", num: "3", title: "View Disaster Alerts", subtitle: "(Real-time notifications)", action: "Live Alerts", link: "/alerts" },
    { id: "c4", num: "4", title: "Request Emergency Help", subtitle: "(Share location & details)", action: "Send SOS", link: "/#sos" },
    { id: "c5", num: "5", title: "Find Nearby Services", subtitle: "(Hospitals, Shelters, Safe Routes)", action: "Shelters & Map", link: "/shelters" },
    { id: "c6", num: "6", title: "Track Request / View Updates", subtitle: "(Status & notifications)", action: "Responders Feed", link: "/responders" },
    { id: "c7", num: "7", title: "Manage Profile", subtitle: "(Update information)", action: "Profile Settings", link: "/#profile" },
  ];

  const adminSteps = [
    { id: "a1", num: "1", title: "Login", subtitle: "(Admin)", action: "EOC Auth", link: "/#admin" },
    { id: "a2", num: "2", title: "Manage Users", subtitle: "(Citizens, Rescue Teams, etc.)", action: "User Directory", link: "/responders" },
    { id: "a3", num: "3", title: "Create Disaster Alerts", subtitle: "(Location, severity, message)", action: "Dispatch Advisory", link: "/alerts" },
    { id: "a4", num: "4", title: "Manage Emergency Requests", subtitle: "(Assign teams, update status)", action: "EOC Queue", link: "/eoc" },
    { id: "a5", num: "5", title: "Manage Hospitals & Shelters", subtitle: "(Add / Update information)", action: "Shelter Admin", link: "/shelters" },
    { id: "a6", num: "6", title: "Manage Rescue Teams", subtitle: "(Track availability & location)", action: "Rescue GIS", link: "/live-situation" },
    { id: "a7", num: "7", title: "View Reports", subtitle: "(Analytics & performance)", action: "SITREP Analytics", link: "/system-analysis" },
  ];

  return (
    <div className="space-y-8 text-[#E9E7E1]">
      {/* Abstract Box matching the user's diagram */}
      <div className="bg-[#182137] border border-[#E9E7E1]/20 rounded-3xl p-6 sm:p-8 space-y-3 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-3">
          <span className="bg-blue-600 text-white font-mono font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider">
            ABSTRACT
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#E9E7E1]">
            Disaster Resilience and Emergency Response System
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-[#E9E7E1]/85 leading-relaxed font-medium">
          The Disaster Resilience and Emergency Response System is a web-based platform designed to provide faster and more effective disaster management and emergency assistance. It connects citizens, rescue teams, hospitals, shelters, and administrators through a unified system, enabling real-time alerts, emergency help requests, safe route guidance, and location-based services. The platform ensures quick communication, efficient resource allocation, and better coordination during disasters, ultimately helping to save lives and build a safer and more resilient community.
        </p>
      </div>

      {/* Main Workflow Diagram Header */}
      <div className="text-center py-2">
        <span className="bg-[#1F2A44] border border-[#E9E7E1]/30 text-[#E9E7E1] font-black text-base px-8 py-3 rounded-full uppercase tracking-widest shadow-xl inline-block">
          ⚙️ WORK FLOW DIAGRAM
        </span>
      </div>

      {/* 3-Column Diagram Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: User Workflow (Citizen) */}
        <div className="lg:col-span-4 bg-[#182137] border-2 border-blue-500/40 rounded-3xl p-5 space-y-4 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center gap-3 border-b border-[#E9E7E1]/15 pb-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-md">
              👤
            </div>
            <div>
              <h3 className="text-lg font-black text-[#E9E7E1]">User Workflow</h3>
              <span className="text-[10px] text-blue-300 font-mono font-bold uppercase">Citizen Lifecycle (7 Steps)</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {citizenSteps.map((step) => (
              <div
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`p-3 rounded-2xl border transition cursor-pointer flex items-center gap-3 ${
                  activeStep === step.id
                    ? "bg-blue-600/30 border-blue-400 shadow-lg"
                    : "bg-[#1F2A44] border-[#E9E7E1]/10 hover:border-blue-400/50"
                }`}
              >
                <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-mono font-black text-xs flex items-center justify-center shrink-0">
                  {step.num}
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-[#E9E7E1] truncate">{step.title}</h4>
                  <span className="text-[10px] text-[#E9E7E1]/70 block truncate">{step.subtitle}</span>
                </div>
                <Link
                  href={step.link}
                  className="text-[10px] font-mono font-bold text-blue-300 hover:underline shrink-0 bg-[#182137] px-2 py-1 rounded border border-[#E9E7E1]/10"
                >
                  {step.action} →
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Center Column: System Architecture & REST APIs */}
        <div className="lg:col-span-4 bg-[#182137] border-2 border-purple-500/40 rounded-3xl p-5 space-y-6 shadow-2xl flex flex-col justify-between">
          <div className="text-center border-b border-[#E9E7E1]/15 pb-3">
            <h3 className="text-lg font-black text-[#E9E7E1]">☁️ System Architecture</h3>
            <span className="text-[10px] text-purple-300 font-mono font-bold uppercase">REST APIs & Data Persistence</span>
          </div>

          {/* System Logic Box */}
          <div className="bg-[#1F2A44] border border-purple-500/30 rounded-2xl p-4 space-y-3 text-center shadow-inner">
            <span className="text-xs font-mono font-black text-purple-300 uppercase block">SYSTEM CORE</span>
            <div className="bg-[#182137] p-2.5 rounded-xl border border-[#E9E7E1]/10 text-xs font-bold text-[#E9E7E1]">
              Authentication &amp; Authorization (JWT)
            </div>
            <div className="bg-[#182137] p-2.5 rounded-xl border border-[#E9E7E1]/10 text-xs font-bold text-[#E9E7E1]">
              Business Logic (Services)
            </div>
            <div className="bg-[#182137] p-2.5 rounded-xl border border-[#E9E7E1]/10 text-xs font-mono font-bold text-emerald-400">
              REST APIs &amp; WebSockets (Port 8081)
            </div>
          </div>

          <div className="text-center text-xl text-purple-400 font-bold">↕️</div>

          {/* Database Box */}
          <div className="bg-[#1F2A44] border border-purple-500/30 rounded-2xl p-4 space-y-2 text-center shadow-inner">
            <span className="text-xs font-mono font-black text-purple-300 uppercase block">DATABASE LAYER</span>
            <div className="w-12 h-12 mx-auto rounded-full bg-purple-600/20 border border-purple-400 text-purple-300 flex items-center justify-center text-xl font-bold">
              💾
            </div>
            <p className="text-xs font-bold text-[#E9E7E1]">
              PostgreSQL / PostGIS
            </p>
            <p className="text-[10px] text-[#E9E7E1]/70 font-mono">
              Users, Alerts, Requests, Hospitals, Shelters, Responders, Resources
            </p>
          </div>
        </div>

        {/* Right Column: Admin Workflow (EOC / Admin) */}
        <div className="lg:col-span-4 bg-[#182137] border-2 border-emerald-500/40 rounded-3xl p-5 space-y-4 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center gap-3 border-b border-[#E9E7E1]/15 pb-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-md">
              ⚙️
            </div>
            <div>
              <h3 className="text-lg font-black text-[#E9E7E1]">Admin Workflow</h3>
              <span className="text-[10px] text-emerald-300 font-mono font-bold uppercase">EOC Operations (7 Steps)</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {adminSteps.map((step) => (
              <div
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`p-3 rounded-2xl border transition cursor-pointer flex items-center gap-3 ${
                  activeStep === step.id
                    ? "bg-emerald-600/30 border-emerald-400 shadow-lg"
                    : "bg-[#1F2A44] border-[#E9E7E1]/10 hover:border-emerald-400/50"
                }`}
              >
                <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-mono font-black text-xs flex items-center justify-center shrink-0">
                  {step.num}
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-[#E9E7E1] truncate">{step.title}</h4>
                  <span className="text-[10px] text-[#E9E7E1]/70 block truncate">{step.subtitle}</span>
                </div>
                <Link
                  href={step.link}
                  className="text-[10px] font-mono font-bold text-emerald-300 hover:underline shrink-0 bg-[#182137] px-2 py-1 rounded border border-[#E9E7E1]/10"
                >
                  {step.action} →
                </Link>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
