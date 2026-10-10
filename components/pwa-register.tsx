"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const hadController = Boolean(navigator.serviceWorker.controller);
      let reloadedForUpdate = false;
      const refreshAfterUpdate = () => {
        navigator.serviceWorker.controller?.postMessage({ type: "WARM_CORE_ROUTES" });
        if (!hadController || reloadedForUpdate) return;
        reloadedForUpdate = true;
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener("controllerchange", refreshAfterUpdate);
      const useFullPageNavigationOffline = (event: MouseEvent) => {
        if (navigator.onLine || event.defaultPrevented || event.button !== 0
          || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const target = event.target;
        if (!(target instanceof Element)) return;
        const anchor = target.closest("a");
        if (!(anchor instanceof HTMLAnchorElement) || anchor.target || anchor.hasAttribute("download")) return;
        const destination = new URL(anchor.href, window.location.href);
        if (destination.origin !== window.location.origin) return;
        event.preventDefault();
        window.location.assign(destination.href);
      };
      document.addEventListener("click", useFullPageNavigationOffline, true);
      navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then((registration) => {
          void registration.update();
          if (navigator.onLine) {
            registration.active?.postMessage({ type: "WARM_CORE_ROUTES" });
          }
          console.log("[PWA Service Worker] Registered successfully:", registration.scope);
        })
        .catch((err) => console.error("[PWA Service Worker] Registration failed:", err));
      return () => {
        navigator.serviceWorker.removeEventListener("controllerchange", refreshAfterUpdate);
        document.removeEventListener("click", useFullPageNavigationOffline, true);
      };
    }
  }, []);

  return null;
}
