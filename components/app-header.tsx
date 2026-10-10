"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NotificationBell } from "./notification-bell";
import { getLiveWeather, type LiveWeatherSnapshot } from "@/lib/live-weather";

interface AppHeaderProps {
  onToggleSidebar: () => void;
  onOpenAuth: () => void;
  user?: { name: string; role: string } | null;
}

interface LocationChoice {
  name: string;
  latitude: number;
  longitude: number;
  region?: string;
}

const locations: LocationChoice[] = [
  { name: "Mahabubnagar", region: "Telangana, India", latitude: 16.737, longitude: 78.003 },
  { name: "Hyderabad", region: "Telangana, India", latitude: 17.385, longitude: 78.4867 },
  { name: "Warangal", region: "Telangana, India", latitude: 17.9689, longitude: 79.5941 },
  { name: "Jaipur", region: "Rajasthan, India", latitude: 26.9124, longitude: 75.7873 },
  { name: "Jaisalmer", region: "Rajasthan, India", latitude: 26.9157, longitude: 70.9083 },
  { name: "Jodhpur", region: "Rajasthan, India", latitude: 26.2389, longitude: 73.0243 },
  { name: "Delhi", region: "India", latitude: 28.6139, longitude: 77.209 },
  { name: "Mumbai", region: "Maharashtra, India", latitude: 19.076, longitude: 72.8777 },
  { name: "Bengaluru", region: "Karnataka, India", latitude: 12.9716, longitude: 77.5946 },
  { name: "Chennai", region: "Tamil Nadu, India", latitude: 13.0827, longitude: 80.2707 },
  { name: "Kolkata", region: "West Bengal, India", latitude: 22.5726, longitude: 88.3639 },
  { name: "London", region: "United Kingdom", latitude: 51.5072, longitude: -0.1276 },
  { name: "Tokyo", region: "Japan", latitude: 35.6762, longitude: 139.6503 },
  { name: "New York", region: "United States", latitude: 40.7128, longitude: -74.006 },
  { name: "Sydney", region: "Australia", latitude: -33.8688, longitude: 151.2093 },
];

export function AppHeader({ onToggleSidebar, onOpenAuth, user }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [weather, setWeather] = useState<LiveWeatherSnapshot | null>(null);
  const [location, setLocation] = useState<LocationChoice>(locations[0]);
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationMessage, setLocationMessage] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const isEoc = pathname.startsWith("/eoc");

  const matchingLocations = locations.filter((choice) => `${choice.name} ${choice.region || ""}`.toLowerCase().includes(locationQuery.trim().toLowerCase()));

  const goBack = () => {
    const historyState = window.history.state as { idx?: number } | null;
    const sameOriginReferrer = document.referrer && new URL(document.referrer).origin === window.location.origin;
    if ((typeof historyState?.idx === "number" && historyState.idx > 0) || sameOriginReferrer) {
      router.back();
    } else {
      router.push("/");
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const loadWeather = async () => {
      try {
        setWeather(await getLiveWeather(location.latitude, location.longitude, controller.signal));
      } catch {
        if (!controller.signal.aborted) setWeather({
          latitude: location.latitude,
          longitude: location.longitude,
          conditionText: "Live weather unavailable",
          isRealApiData: false,
          dataSource: "Live weather unavailable",
        });
      }
    };
    void loadWeather();
    const interval = window.setInterval(() => void loadWeather(), 5 * 60_000);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [location]);

  const useMyLocation = () => {
    setLocationMessage("");
    if (!navigator.geolocation) {
      setLocationMessage("Location is unavailable on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setLocation({ name: "Your location", latitude: coords.latitude, longitude: coords.longitude });
      setLocationMessage("Weather now uses your current location.");
      setLocationMenuOpen(false);
    }, () => setLocationMessage("Location permission was unavailable."), { timeout: 10_000, maximumAge: 300_000 });
  };

  const weatherIsRainy = /rain|storm|thunder/i.test(weather?.conditionText || "");
  const roleLabel = isEoc ? "EOC Officer" : "Citizen";

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-[#E4E7EC] bg-white py-2 pr-3 pl-1 shadow-xs sm:pr-5 sm:pl-2 lg:pr-6 lg:pl-2">
      <div className="flex min-h-10 items-center gap-2 sm:gap-3 lg:gap-5">
        <button
          type="button"
          onClick={goBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Go back to the previous page"
          title="Back"
        >
          <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
        </button>

        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 lg:hidden"
          aria-label="Toggle navigation sidebar"
        >
          <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5 lg:gap-4">
          <NotificationBell />

          <div className="hidden items-center gap-2 border-l border-slate-200 pl-3 lg:flex">
            <svg aria-hidden="true" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={weatherIsRainy ? "M7 18a4 4 0 0 1-.6-7.96A5.5 5.5 0 0 1 17 8.5a4.5 4.5 0 0 1 .5 8.96M9 20l-1 2m6-2-1 2m6-2-1 2" : "M12 3v2m0 14v2m9-9h-2M5 12H3m15.36 6.36-1.42-1.42M7.05 7.05 5.64 5.64m12.72 0-1.41 1.41M7.05 16.95l-1.41 1.41M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"} /></svg>
            <div className="leading-tight"><p className="text-[11px] font-extrabold text-slate-800">{weather?.temperatureC != null ? `${Math.round(weather.temperatureC)}°C` : weather ? "Weather" : "Loading weather…"}</p><p className="max-w-24 truncate text-[10px] text-slate-500">{weather?.conditionText || "Current conditions"}</p></div>
          </div>

          <div className="relative hidden lg:block">
            <button type="button" onClick={() => { setLocationMenuOpen((open) => !open); setLocationMessage(""); setLocationQuery(""); }} aria-expanded={locationMenuOpen} aria-haspopup="dialog" className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-left hover:bg-slate-50">
              <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5" strokeWidth="2"/></svg>
              <span className="max-w-32 truncate text-[11px] font-bold text-slate-800">{location.name}</span>
              <svg aria-hidden="true" className="h-3 w-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m7 10 5 5 5-5"/></svg>
            </button>
            {locationMenuOpen && <div role="dialog" aria-label="Search weather locations" className="absolute right-0 top-full z-40 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2.5 shadow-xl">
              <p className="px-1 pb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">Choose weather location</p>
              <label className="relative block">
                <span className="sr-only">Search locations</span>
                <svg aria-hidden="true" className="absolute left-3 top-3 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="7" strokeWidth="2"/><path d="m16 16 4 4" strokeWidth="2"/></svg>
                <input autoFocus value={locationQuery} onChange={(event) => setLocationQuery(event.target.value)} placeholder="Search city or region..." className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200" />
              </label>
              <div className="mt-2 max-h-60 overflow-y-auto">
                {matchingLocations.length ? matchingLocations.map((choice) => <button key={choice.name} type="button" onClick={() => { setLocation(choice); setLocationMenuOpen(false); setLocationQuery(""); }} className={`flex min-h-10 w-full items-center justify-between rounded-lg px-2.5 text-left text-xs font-semibold transition hover:bg-slate-100 ${location.name === choice.name ? "bg-blue-50 text-blue-700" : "text-slate-700"}`}>
                  <span className="min-w-0"><span className="block">{choice.name}</span>{choice.region && <span className="block text-[10px] font-normal text-slate-500">{choice.region}</span>}</span>{location.name === choice.name && <span aria-label="Selected" className="text-blue-700">✓</span>}
                </button>) : <p className="px-2 py-4 text-center text-xs text-slate-500">No matching locations.</p>}
              </div>
              <button type="button" onClick={useMyLocation} className="mt-2 min-h-10 w-full rounded-lg border-t border-slate-100 px-2 text-left text-xs font-bold text-blue-700 hover:bg-blue-50">Use my location</button>
              {locationMessage && <p role="status" className="px-2 pt-2 text-[10px] text-slate-500">{locationMessage}</p>}
            </div>}
          </div>

          <span className="hidden rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-blue-700 sm:inline-flex">{roleLabel}</span>
          <button onClick={() => user ? setUserMenuOpen((open) => !open) : onOpenAuth()} aria-expanded={userMenuOpen} aria-haspopup="menu" aria-label="Open user menu" className="flex min-h-10 items-center gap-2 rounded-xl px-1.5 text-slate-800 transition hover:bg-slate-100 sm:px-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#173B62] text-xs font-bold text-white">{user?.name?.trim()?.[0]?.toUpperCase() || "G"}</span>
            <span className="hidden max-w-36 truncate text-left text-[11px] font-bold lg:block">{user?.name || (isEoc ? "EOC Officer" : "Citizen · Guest")}</span>
            <svg aria-hidden="true" className="hidden h-3 w-3 text-slate-400 lg:block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m7 10 5 5 5-5"/></svg>
          </button>
        </div>
        {userMenuOpen && <div role="menu" aria-label="User menu" className="absolute right-3 top-full z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl sm:right-5 lg:right-6">
          <div className="border-b border-slate-100 px-3 py-2"><p className="truncate text-sm font-bold text-slate-900">{user?.name || "Citizen · Guest"}</p><p className="text-xs text-slate-500">{user?.role || "CITIZEN"}</p></div>
          {[ ["Profile", "/profile"], ["Notifications", "/notifications"], ["Settings", "/settings"] ].map(([label, href]) => <Link key={href} role="menuitem" href={href} onClick={() => setUserMenuOpen(false)} className="flex min-h-10 items-center rounded-lg px-3 text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">{label}</Link>)}
          {user ? <button role="menuitem" type="button" onClick={() => { localStorage.removeItem("dr_user"); window.location.assign("/"); }} className="flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm font-semibold text-red-700 hover:bg-red-50">Log out</button> : <button role="menuitem" type="button" onClick={() => { setUserMenuOpen(false); onOpenAuth(); }} className="flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm font-semibold text-blue-700 hover:bg-blue-50">Sign in</button>}
        </div>}
      </div>
    </header>
  );
}
