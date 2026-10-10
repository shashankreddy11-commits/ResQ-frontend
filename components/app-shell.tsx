"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { SOSModal } from "./sos-modal";
import { AuthModal } from "./auth-modal";
import { OfflineStatus } from "./offline-status";
import { recordOfflineUsage, startOfflineUsageSync } from "@/lib/offline-usage";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const apiBaseUrl = "";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const restoreUser = () => {
      try {
        const savedUser = localStorage.getItem("dr_user");
        if (savedUser) setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("dr_user");
      }
      setAuthReady(true);
    };
    const timer = window.setTimeout(restoreUser, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => startOfflineUsageSync(), []);

  useEffect(() => {
    if (!navigator.onLine) recordOfflineUsage("offline_page_view");
  }, [pathname]);

  useEffect(() => {
    if (!authReady) return;
    const role = user?.role?.toUpperCase();
    const needsAdmin = pathname === "/eoc";
    if (needsAdmin && role !== "ADMIN") {
      router.replace(user ? "/dashboard" : "/login");
    }
  }, [authReady, pathname, router, user]);

  // Bypass application shell layout completely for standalone unauthenticated routes
  if (pathname === "/login" || pathname === "/register") {
    return <>{children}</>;
  }

  const isProtectedRoute = pathname === "/eoc";
  const isHomePage = pathname === "/";
  const isMapWorkspace = pathname === "/live-situation";
  if (isProtectedRoute && (!authReady || !user || user.role.toUpperCase() !== "ADMIN")) {
    return <main className="flex min-h-screen items-center justify-center text-sm text-slate-600">Checking your access…</main>;
  }

  return (
    <div className="flex h-dvh min-h-0 w-full overflow-hidden bg-[#F4F7FB] text-[#172033] font-sans antialiased">
      {/* 1. Global Dark Navy Sidebar - Fixed desktop height 100vh */}
      <AppSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSOS={() => setIsSOSOpen(true)}
        userRole={user?.role || "CITIZEN"}
      />

      {/* 2. Right Main Layout Shell - Header stays fixed while route content scrolls below it */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Header - Remains visible while the route content scrolls */}
        <AppHeader
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenAuth={() => setIsAuthOpen(true)}
          user={user}
        />
        <OfflineStatus />

        {/* Dynamic Route Content Area - ONLY THIS CONTAINER SCROLLS VERTICALLY */}
        <main className={`min-h-0 min-w-0 flex-1 overscroll-contain ${isMapWorkspace ? "overflow-hidden p-0" : "overflow-y-auto"} ${isHomePage || isMapWorkspace ? "w-full" : "mx-auto w-full max-w-[1440px] space-y-6 p-4 pb-8 sm:p-6 lg:p-8 lg:pb-8"}`}>
          {children}

          {/* Global Footer inside the scrollable container */}
          {!isMapWorkspace && <footer className={`bg-white border border-[#E4E7EC] rounded-xl py-4 px-6 text-xs text-[#667085] mt-8 mb-4 ${isHomePage ? "mx-4 w-[calc(100%-2rem)] sm:mx-6 sm:w-[calc(100%-3rem)] lg:mx-8 lg:w-[calc(100%-4rem)]" : "w-full"}`}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="font-medium text-center sm:text-left">
                <strong className="text-[#172033]">Disaster Resilience and Emergency Response</strong> — Emergency Operations Desk. 24/7 Helpline: 112
              </p>
              <span className="font-mono text-[10px] text-[#16A34A] font-bold bg-[#EAF8EF] px-2.5 py-1 rounded-md border border-[#16A34A]/20">
                ● PROTOTYPE DATA OPERATIONAL
              </span>
            </div>
          </footer>}
        </main>
      </div>

      {/* Global Modals */}
      <SOSModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
        onSuccess={(inc) => console.log("SOS Incident Created:", inc)}
        apiBaseUrl={apiBaseUrl}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(u) => setUser(u)}
        apiBaseUrl={apiBaseUrl}
      />
    </div>
  );
}
