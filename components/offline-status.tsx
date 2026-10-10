"use client";

import { useEffect, useState } from "react";

export function OfflineStatus() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const updateStatus = () => setOnline(navigator.onLine);
    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  if (online !== false) return null;

  return (
    <div role="status" className="shrink-0 border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-xs font-semibold leading-5 text-amber-950 sm:px-6">
      Offline: saved pages and records may be out of date. SOS, live alerts, maps, and responder updates cannot reach services. Call 112 for immediate danger.
    </div>
  );
}
