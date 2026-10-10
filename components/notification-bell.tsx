"use client";

import { useEffect, useState } from "react";
import { getLiveWeather } from "@/lib/live-weather";

type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
interface CitizenNotice {
  id: string;
  title: string;
  message: string;
  severity: Severity;
  category: string;
  location: string;
  timestamp: string;
  source?: string;
}
interface WeatherRecord {
  conditionText?: string;
  temperatureC?: number;
  precipitationRateMmHr?: number;
  windSpeedKmh?: number;
  dataSource?: string;
  isRealApiData?: boolean;
}
interface AlertRecord {
  id?: number | string;
  title?: string;
  message?: string;
  description?: string;
  disasterType?: string;
  severity?: string;
  targetArea?: string;
  startTime?: string;
  issuedAt?: string;
  expiryTime?: string;
  effectiveUntil?: string;
  source?: string;
  createdBy?: string;
}
interface IncidentRecord {
  id?: number | string;
  type?: string;
  description?: string;
  severity?: string;
  priority?: string;
  status?: string;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
}
interface EarthquakeFeed {
  isRealApiData?: boolean;
  dataSource?: string;
  features?: Array<{
    id?: string;
    properties?: { mag?: number; place?: string; time?: number; url?: string; alert?: string | null };
    geometry?: { coordinates?: number[] };
  }>;
}
interface GlobalDisasterFeed {
  features?: Array<{
    id?: string | number;
    properties?: Record<string, unknown>;
    geometry?: { type?: string; coordinates?: unknown };
  }>;
  isRealApiData?: boolean;
  dataSource?: string;
}

const apiBaseUrl = "";
const defaultLocation = { latitude: 16.737, longitude: 78.003 };
const severityRank: Record<Severity, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
const severityStyle: Record<Severity, string> = {
  CRITICAL: "border-red-200 bg-red-50 text-red-800",
  HIGH: "border-orange-200 bg-orange-50 text-orange-800",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-900",
  LOW: "border-blue-200 bg-blue-50 text-blue-800",
  INFO: "border-slate-200 bg-slate-50 text-slate-700",
};
async function fetchLiveWeather(latitude: number, longitude: number, signal: AbortSignal): Promise<WeatherRecord> {
  return getLiveWeather(latitude, longitude, signal);
}

function severityOf(value?: string): Severity {
  const normalized = value?.toUpperCase() || "";
  if (["CRITICAL", "SEVERE", "EXTREME", "EMERGENCY"].includes(normalized)) return "CRITICAL";
  if (["HIGH", "URGENT", "WARNING"].includes(normalized)) return "HIGH";
  if (["MEDIUM", "MODERATE", "AMBER"].includes(normalized)) return "MEDIUM";
  if (["LOW", "MINOR", "ADVISORY"].includes(normalized)) return "LOW";
  return "INFO";
}

function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(bLat - aLat);
  const dLon = radians(bLon - aLon);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(aLat)) * Math.cos(radians(bLat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function geometryCenter(coordinates: unknown): [number, number] | null {
  if (!Array.isArray(coordinates)) return null;
  if (coordinates.length >= 2 && typeof coordinates[0] === "number" && typeof coordinates[1] === "number") {
    return [coordinates[0], coordinates[1]];
  }
  const points = coordinates.map(geometryCenter).filter((point): point is [number, number] => point !== null);
  if (!points.length) return null;
  return [points.reduce((sum, point) => sum + point[0], 0) / points.length, points.reduce((sum, point) => sum + point[1], 0) / points.length];
}

function activeUntil(value?: string) {
  if (!value) return true;
  const time = Date.parse(value);
  return !Number.isFinite(time) || time > Date.now();
}

function weatherRiskNotices(weather: WeatherRecord | null): CitizenNotice[] {
  if (!weather?.isRealApiData) return [];
  const notices: CitizenNotice[] = [];
  const rain = Number(weather.precipitationRateMmHr || 0);
  const wind = Number(weather.windSpeedKmh || 0);
  const now = new Date().toISOString();

  if (rain >= 20) notices.push({ id: "weather-rain-extreme", title: "Very heavy rain: flood risk", message: `Rainfall is around ${rain.toFixed(1)} mm in the past hour. Avoid flooded roads and underpasses; move to higher ground if water rises.`, severity: "CRITICAL", category: "Flood risk", location: "Your selected area", timestamp: now, source: weather.dataSource });
  else if (rain >= 10) notices.push({ id: "weather-rain-heavy", title: "Heavy rain: waterlogging possible", message: `Rainfall is around ${rain.toFixed(1)} mm in the past hour. Watch for fast-rising water and avoid low-lying routes.`, severity: "HIGH", category: "Flood risk", location: "Your selected area", timestamp: now, source: weather.dataSource });
  else if (rain >= 5) notices.push({ id: "weather-rain-watch", title: "Rain watch", message: `Rainfall is around ${rain.toFixed(1)} mm in the past hour. Check local advisories before travelling through low-lying areas.`, severity: "MEDIUM", category: "Weather", location: "Your selected area", timestamp: now, source: weather.dataSource });
  if (wind >= 90) notices.push({ id: "weather-wind-extreme", title: "Very strong winds", message: `Winds are around ${wind.toFixed(0)} km/h. Stay indoors and keep away from trees, power lines, and loose structures.`, severity: "CRITICAL", category: "Wind hazard", location: "Your selected area", timestamp: now, source: weather.dataSource });
  else if (wind >= 60) notices.push({ id: "weather-wind-high", title: "Strong wind advisory", message: `Winds are around ${wind.toFixed(0)} km/h. Secure loose items and follow local emergency instructions.`, severity: "HIGH", category: "Wind hazard", location: "Your selected area", timestamp: now, source: weather.dataSource });
  return notices;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notices, setNotices] = useState<CitizenNotice[]>([]);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [location, setLocation] = useState(defaultLocation);
  const [locationName, setLocationName] = useState("Mahabubnagar area");
  const [weatherSource, setWeatherSource] = useState("");
  const [liveWeatherAvailable, setLiveWeatherAvailable] = useState(false);
  const [globalDisasterAvailable, setGlobalDisasterAvailable] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locationMessage, setLocationMessage] = useState("");

  useEffect(() => {
    let disposed = false;
    let controller: AbortController | null = null;
    let liveWeatherCache: { at: number; data: WeatherRecord } | null = null;
    const restorePreferences = () => {
      try {
        const savedSeen = JSON.parse(localStorage.getItem("dr_notification_seen") || "[]");
        if (Array.isArray(savedSeen)) setSeenIds(savedSeen.filter((id): id is string => typeof id === "string"));
        const savedLocation = JSON.parse(localStorage.getItem("dr_notification_location") || "null");
        if (savedLocation && Number.isFinite(savedLocation.latitude) && Number.isFinite(savedLocation.longitude)) {
          setLocation(savedLocation);
          setLocationName("Your saved location");
        }
      } catch {
        localStorage.removeItem("dr_notification_seen");
        localStorage.removeItem("dr_notification_location");
      }
    };
    const loadUpdates = async () => {
      controller?.abort();
      controller = new AbortController();
      const signal = controller.signal;
      const fetchJson = async (path: string) => {
        const response = await fetch(`${apiBaseUrl}${path}`, { signal, cache: "no-store" });
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        return response.json() as Promise<unknown>;
      };
      const getWeather = async () => {
        if (liveWeatherCache && Date.now() - liveWeatherCache.at < 10 * 60_000) return liveWeatherCache.data;
        try {
          const live = await fetchLiveWeather(location.latitude, location.longitude, signal);
          liveWeatherCache = { at: Date.now(), data: live };
          return live;
        } catch (error) {
          if (signal.aborted) throw error;
          return null;
        }
      };
      const results = await Promise.allSettled([
        getWeather(),
        fetchJson(`/api/weather/alerts?lat=${location.latitude}&lon=${location.longitude}`),
        fetchJson("/api/alerts"),
        fetchJson("/api/incidents"),
        fetchJson("/api/weather/earthquakes"),
        fetchJson("/api/weather/disasters"),
      ]);
      if (disposed || signal.aborted) return;
      const resultAt = (index: number) => results[index].status === "fulfilled" ? results[index].value : null;
      const weather = resultAt(0) as WeatherRecord | null;
      const weatherAlerts = resultAt(1) as AlertRecord[] | null;
      const publicAlerts = resultAt(2) as AlertRecord[] | null;
      const incidents = resultAt(3) as IncidentRecord[] | null;
      const earthquakes = resultAt(4) as EarthquakeFeed | null;
      const globalDisasters = resultAt(5) as GlobalDisasterFeed | null;
      setGlobalDisasterAvailable(Boolean(globalDisasters?.isRealApiData));
      const successfulFeeds = results.filter((result) => result.status === "fulfilled").length;
      const nextNotices: CitizenNotice[] = [];

      if (weather && typeof weather === "object") {
        setWeatherSource(weather.dataSource || (weather.isRealApiData ? "Live weather feed" : "Simulated weather feed"));
        setLiveWeatherAvailable(Boolean(weather.isRealApiData));
        nextNotices.push(...weatherRiskNotices(weather));
      } else setLiveWeatherAvailable(false);
      for (const [feed, records] of [["Weather advisory", weatherAlerts], ["Public safety alert", publicAlerts]] as const) {
        if (!Array.isArray(records)) continue;
        records.filter((alert) => activeUntil(alert.expiryTime || alert.effectiveUntil)).forEach((alert, index) => {
          const simulated = alert.source?.toLowerCase().includes("simulated") || alert.source?.toLowerCase().includes("proxy") || alert.createdBy?.toLowerCase().includes("demo sample data");
          const title = `${simulated ? "Sample: " : ""}${alert.title || alert.disasterType || feed}`;
          nextNotices.push({
            id: `${feed.replaceAll(" ", "-").toLowerCase()}-${alert.id ?? `${index}-${title}`}`,
            title,
            message: `${simulated ? "Demonstration data, not a real emergency warning. " : ""}${alert.message || alert.description || "Follow current instructions from local emergency services."}`,
            severity: simulated ? "INFO" : severityOf(alert.severity),
            category: alert.disasterType?.replaceAll("_", " ") || feed,
            location: alert.targetArea || locationName,
            timestamp: alert.startTime || alert.issuedAt || new Date().toISOString(),
            source: simulated ? "Simulated feed (not official)" : alert.source || alert.createdBy || feed,
          });
        });
      }
      if (Array.isArray(incidents)) incidents.forEach((incident) => {
        if (!Number.isFinite(incident.latitude) || !Number.isFinite(incident.longitude)) return;
        if (["RESOLVED", "CLOSED", "CANCELLED"].includes((incident.status || "").toUpperCase())) return;
        const distance = distanceKm(location.latitude, location.longitude, incident.latitude!, incident.longitude!);
        if (distance > 50) return;
        const category = (incident.type || "Emergency").replaceAll("_", " ");
        const prioritySeverity = severityOf(incident.priority);
        nextNotices.push({
          id: `incident-${incident.id ?? `${incident.latitude}-${incident.longitude}`}`,
          title: `${category} reported nearby`,
          message: incident.description || "An emergency has been reported. Follow directions from response teams.",
          severity: prioritySeverity === "INFO" ? severityOf(incident.severity) : prioritySeverity,
          category,
          location: `${distance.toFixed(1)} km from your selected area`,
          timestamp: incident.createdAt || new Date().toISOString(),
          source: "Incident reports",
        });
      });
      earthquakes?.features?.forEach((event) => {
        const coordinates = event.geometry?.coordinates;
        const magnitude = event.properties?.mag;
        if (!coordinates || coordinates.length < 2 || !Number.isFinite(magnitude) || magnitude! < 3) return;
        const [longitude, latitude] = coordinates;
        const distance = distanceKm(location.latitude, location.longitude, latitude, longitude);
        if (distance > 100) return;
        const severity: Severity = magnitude! >= 6 ? "CRITICAL" : magnitude! >= 5 ? "HIGH" : "MEDIUM";
        nextNotices.push({
          id: `usgs-earthquake-${event.id || `${latitude}-${longitude}`}`,
          title: `Earthquake M${magnitude!.toFixed(1)} reported nearby`,
          message: `${event.properties?.place || "An earthquake"} was recorded ${distance.toFixed(1)} km from your selected area. Check for damage, move away from damaged structures, and follow local authority guidance.`,
          severity,
          category: "Earthquake",
          location: `${distance.toFixed(1)} km from your selected area`,
          timestamp: event.properties?.time ? new Date(event.properties.time).toISOString() : new Date().toISOString(),
          source: event.properties?.url ? `USGS · ${event.properties.url}` : "USGS Earthquake Feed",
        });
      });
      globalDisasters?.features?.forEach((event) => {
        const properties = event.properties || {};
        const currentEvent = properties.iscurrent ?? properties.isCurrent;
        if (currentEvent != null && String(currentEvent).toLowerCase() === "false") return;
        const endsAt = String(properties.todate || properties.toDate || "");
        if (endsAt && Number.isFinite(Date.parse(endsAt)) && Date.parse(endsAt) <= Date.now()) return;
        const center = geometryCenter(event.geometry?.coordinates);
        if (!center) return;
        const [longitude, latitude] = center;
        const distance = distanceKm(location.latitude, location.longitude, latitude, longitude);
        if (distance > 200) return;
        const eventType = String(properties.eventtype || properties.eventType || "").toUpperCase();
        const categories: Record<string, string> = { EQ: "Earthquake", FL: "Flood", TC: "Tropical cyclone", VO: "Volcano", WF: "Wildfire", FF: "Wildfire", DR: "Drought" };
        const category = categories[eventType];
        if (!category) return;
        const alertLevel = String(properties.alertlevel || properties.alertLevel || "").toLowerCase();
        const severity: Severity = alertLevel === "red" ? "CRITICAL" : alertLevel === "orange" ? "HIGH" : alertLevel === "green" ? "LOW" : "INFO";
        const name = String(properties.name || properties.eventname || properties.eventName || category);
        const country = String(properties.country || properties.countryname || "");
        const eventId = properties.eventid || properties.eventId || event.id || `${eventType}-${latitude}-${longitude}`;
        const episodeId = properties.episodeid || properties.episodeId || "";
        const eventTime = String(properties.fromdate || properties.fromDate || properties.datetime || "");
        nextNotices.push({
          id: `gdacs-${eventId}-${episodeId}`,
          title: `${category} alert: ${name}`,
          message: `${alertLevel ? `${alertLevel[0].toUpperCase()}${alertLevel.slice(1)} alert. ` : ""}${country ? `Reported in ${country}. ` : ""}Check local emergency guidance and avoid affected areas.`,
          severity,
          category,
          location: `${distance.toFixed(1)} km from your selected area${country ? ` · ${country}` : ""}`,
          timestamp: Number.isFinite(Date.parse(eventTime)) ? new Date(eventTime).toISOString() : new Date().toISOString(),
          source: "Global Disaster Awareness and Coordination System (GDACS)",
        });
      });

      const unique = [...new Map(nextNotices.map((notice) => [notice.id, notice])).values()]
        .sort((a, b) => severityRank[a.severity] - severityRank[b.severity] || Date.parse(b.timestamp) - Date.parse(a.timestamp));
      setNotices(unique);
      setLastUpdated(new Date());
      setError(successfulFeeds ? "" : "Notification services are unavailable. Start the Java API and try refreshing.");
      setLoading(false);
    };

    const start = window.setTimeout(() => {
      restorePreferences();
      void loadUpdates();
    }, 0);
    const interval = window.setInterval(() => void loadUpdates(), 60_000);
    return () => {
      disposed = true;
      controller?.abort();
      window.clearTimeout(start);
      window.clearInterval(interval);
    };
  }, [location, locationName]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const unreadCount = notices.filter((notice) => !seenIds.includes(notice.id)).length;
  const markAsSeen = () => {
    const updated = [...new Set([...seenIds, ...notices.map((notice) => notice.id)])].slice(-100);
    setSeenIds(updated);
    localStorage.setItem("dr_notification_seen", JSON.stringify(updated));
  };
  const togglePanel = () => {
    if (!open) markAsSeen();
    setOpen((current) => !current);
  };
  const useCurrentLocation = () => {
    if (!navigator.geolocation) { setLocationMessage("Location is unavailable on this device."); return; }
    setLocationMessage("Finding your location…");
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const next = { latitude: coords.latitude, longitude: coords.longitude };
      setLocation(next);
      setLocationName("Your current area");
      localStorage.setItem("dr_notification_location", JSON.stringify(next));
      setLocationMessage("Nearby alerts will use your current location.");
    }, () => setLocationMessage("Location permission was not available; showing Mahabubnagar area alerts."), { enableHighAccuracy: false, timeout: 10000, maximumAge: 300_000 });
  };

  return (
    <div className="relative">
      <button type="button" onClick={togglePanel} aria-label={unreadCount ? `Open notifications, ${unreadCount} unread` : "Open notifications"} aria-expanded={open} aria-controls="citizen-notifications" className="relative flex h-11 w-11 items-center justify-center rounded-lg p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
        <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        {unreadCount > 0 && <span aria-hidden="true" className="absolute right-1 top-1 min-w-4 rounded-full bg-red-600 px-1 text-center text-[9px] font-bold leading-4 text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>

      {open && <section id="citizen-notifications" aria-label="Citizen safety notifications" className="absolute right-0 top-full z-[60] mt-2 w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
          <div><h2 className="text-sm font-extrabold">Safety notifications</h2><p className="mt-1 text-[11px] text-slate-500">Weather and nearby disaster updates · refreshes every minute</p></div>
          <button type="button" onClick={markAsSeen} className="shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold text-blue-700 hover:bg-blue-50">Mark read</button>
        </header>
        <div className="flex items-center justify-between gap-2 bg-slate-50 px-4 py-2 text-[10px] text-slate-600">
          <span>{locationName}{lastUpdated ? ` · Updated ${lastUpdated.toLocaleTimeString()}` : ""}</span>
          <button type="button" onClick={useCurrentLocation} className="shrink-0 font-bold text-blue-700 hover:underline">Use my location</button>
        </div>
        <p className="px-4 pt-2 text-[9px] text-slate-500">Using your location sends its coordinates to the weather provider for local conditions; the saved location stays in this browser.</p>
        <p className="px-4 pt-1 text-[9px] leading-relaxed text-slate-500">Weather thresholds are advisory estimates. Nearby earthquakes and global disaster alerts use USGS and GDACS feeds when available. Landslides and local fire reports come from connected local alerts/incidents. Sample records are labeled; confirm urgent instructions with local authorities.</p>
        {locationMessage && <p role="status" className="px-4 pt-2 text-[10px] text-slate-500">{locationMessage}</p>}
        <div className="max-h-[min(60vh,28rem)] space-y-2 overflow-y-auto p-3">
          {loading && <p role="status" className="p-5 text-center text-xs text-slate-500">Checking weather and local alerts…</p>}
          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</p>}
          {!loading && notices.length === 0 && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900"><p className="font-bold">No active nearby disaster alerts.</p><p className="mt-1">{liveWeatherAvailable ? `${weatherSource} is not reporting a high weather risk.` : "Live weather is unavailable right now; weather risk notices are paused until a live feed connects."}</p></div>}
          {notices.map((notice) => <article key={notice.id} className={`rounded-xl border p-3 ${severityStyle[notice.severity]}`}>
            <div className="flex items-start justify-between gap-2"><div><p className="text-[10px] font-extrabold uppercase tracking-wide">{notice.category} · {notice.severity}</p><h3 className="mt-1 text-xs font-bold">{notice.title}</h3></div><span className="shrink-0 text-[9px]">{Number.isFinite(Date.parse(notice.timestamp)) ? new Date(notice.timestamp).toLocaleTimeString() : "Now"}</span></div>
            <p className="mt-2 text-[11px] leading-relaxed">{notice.message}</p>
            <p className="mt-2 text-[10px] font-semibold opacity-80">{notice.location}</p>
            {notice.source && <p className="mt-1 text-[9px] opacity-70">Source: {notice.source}</p>}
          </article>)}
          {!loading && !liveWeatherAvailable && <p className="px-1 pb-1 text-[10px] leading-relaxed text-slate-500">Weather data is currently simulated, not live; weather risk notices are paused. {globalDisasterAvailable ? "Global disaster updates are live." : "The global disaster feed is unavailable right now."} Local fire and landslide reports appear when present in connected alert/incident feeds.</p>}
          {liveWeatherAvailable && <p className="px-1 pb-1 text-[10px] text-slate-500">{weatherSource.toLowerCase().includes("open-meteo") ? <>Weather data by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="font-semibold text-blue-700 underline">Open-Meteo</a>. </> : `Weather source: ${weatherSource}. `}Forecast-based risk notices are advisory only. Earthquake, fire, and landslide updates come from local alert and incident reports.</p>}
        </div>
      </section>}
    </div>
  );
}
