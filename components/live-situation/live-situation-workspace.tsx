"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getWeatherForLocation,
  getWeatherGrid,
  searchWeatherLocations,
  type DayForecast,
  type WeatherBundle,
  type WeatherLocation,
  type WeatherGridPoint,
  describeWeatherCode,
} from "@/lib/weather/open-meteo";
import { getRadarFrames, type RadarFrame } from "@/lib/weather/rain-viewer";
import { estimateWeatherRisk } from "@/lib/weather/risk-estimate";
import {
  getLiveSituationData,
  type FeatureLayer,
  type LiveSituationData,
} from "@/lib/live-situation-data";
import type { LiveSituationMapProps, MapLocation, MapMode, MeasurementAction, MeasurementMode, MeasurementStatus, WeatherOverlay } from "./live-situation-map";
import { layerLabels, layerOrder, layerColors, layerGroups } from "./map-config";

const LiveSituationMap = dynamic<LiveSituationMapProps>(
  () => import("./live-situation-map").then((module) => module.LiveSituationMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[420px] items-center justify-center bg-slate-100 text-sm font-semibold text-slate-600">
        Loading interactive map…
      </div>
    ),
  },
);

const defaultLocation: MapLocation = {
  name: "Mahabubnagar, Telangana, India",
  latitude: 16.737,
  longitude: 78.003,
  zoom: 8,
};

const defaultLayers: Record<FeatureLayer, boolean> = {
  incidents: true,
  alerts: true,
  shelters: true,
  hospitals: true,
  fire: true,
  police: true,
  responders: true,
  earthquakes: true,
  disasters: true,
};

const weatherOverlays: Array<{ id: Exclude<WeatherOverlay, null>; label: string }> = [
  { id: "precipitation", label: "Precipitation" },
  { id: "wind", label: "Wind" },
  { id: "temperature", label: "Temperature" },
  { id: "humidity", label: "Humidity" },
  { id: "pressure", label: "Pressure" },
];

function distanceKm(latitude: number, longitude: number, feature: { latitude: number; longitude: number }): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(feature.latitude - latitude);
  const dLon = radians(feature.longitude - longitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(latitude)) * Math.cos(radians(feature.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function Icon({ name, className = "h-4 w-4" }: { name: "search" | "locate" | "refresh" | "layers" | "expand" | "play" | "pause" | "previous" | "next" | "close" | "info" | "settings" | "share"; className?: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const shapes = {
    search: <><circle cx="10.8" cy="10.8" r="6.4" {...common} /><path d="m16 16 4.2 4.2" {...common} /></>,
    locate: <><circle cx="12" cy="12" r="7" {...common} /><circle cx="12" cy="12" r="2" {...common} /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" {...common} /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" {...common} /><path d="M5.7 9a7 7 0 0 1 11.5-2L20 12M4 12l2.8 5a7 7 0 0 0 11.5-2" {...common} /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" {...common} /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" {...common} /></>,
    expand: <><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5" {...common} /></>,
    play: <path d="m8 5 11 7-11 7V5Z" fill="currentColor" />,
    pause: <><path d="M8 5v14M16 5v14" {...common} strokeWidth="3" /></>,
    previous: <><path d="m15 5-7 7 7 7M8 12h12" {...common} /></>,
    next: <><path d="m9 5 7 7-7 7M16 12H4" {...common} /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" {...common} /></>,
    info: <><circle cx="12" cy="12" r="9" {...common} /><path d="M12 11v5m0-8h.01" {...common} strokeWidth="2.5" /></>,
    settings: <><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" {...common} /><path d="m19.4 15 .1.1 1.2 1-1.5 2.6-1.5-.5a8 8 0 0 1-1.7 1l-.3 1.6h-3l-.3-1.6a8 8 0 0 1-1.7-1l-1.5.5-1.5-2.6 1.2-1a8 8 0 0 1 0-2l-1.2-1 1.5-2.6 1.5.5a8 8 0 0 1 1.7-1l.3-1.6h3l.3 1.6a8 8 0 0 1 1.7 1l1.5-.5 1.5 2.6-1.2 1a8 8 0 0 1 0 2Z" {...common} /></>,
    share: <><circle cx="18" cy="5" r="3" {...common} /><circle cx="6" cy="12" r="3" {...common} /><circle cx="18" cy="19" r="3" {...common} /><path d="m8.7 10.7 6.6-4.4m-6.6 7 6.6 4.4" {...common} /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>{shapes[name]}</svg>;
}

function formatTemperature(value?: number): string {
  return typeof value === "number" ? Math.round(value) + "°" : "—";
}

function formatTime(value: string, timeZone?: string, options: Intl.DateTimeFormatOptions = {}): string {
  const explicitZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
  const date = new Date(explicitZone ? value : value + "Z");
  if (Number.isNaN(date.getTime())) return "Time unavailable";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: explicitZone ? timeZone : "UTC",
    ...options,
  }).format(date);
}

function formatDay(day: DayForecast, index: number): string {
  if (index === 0) return "Today";
  const date = new Date(day.date + "T12:00:00Z");
  return new Intl.DateTimeFormat(undefined, { weekday: "short", timeZone: "UTC" }).format(date);
}

function direction(degrees: number): string {
  return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(degrees / 45) % 8];
}

function formatRadarTime(frame: RadarFrame): string {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", timeZoneName: "short" })
    .format(new Date(frame.time * 1000));
}

function riskTone(level: string): string {
  if (level === "CRITICAL") return "border-red-200 bg-red-50 text-red-800";
  if (level === "HIGH") return "border-orange-200 bg-orange-50 text-orange-800";
  if (level === "MODERATE") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

function LayerToggle({
  checked,
  color,
  label,
  count,
  onChange,
}: {
  checked: boolean;
  color: string;
  label: string;
  count?: number;
  onChange: () => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 text-[13px] text-slate-100 hover:bg-white/10">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-blue-500" />
      <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white/60" style={{ backgroundColor: color }} />
      <span className="min-w-0 flex-1 leading-4">{label}</span>
      {count !== undefined && <span className="text-[11px] text-slate-300">{count}</span>}
    </label>
  );
}

function WeatherMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <dt className="text-[11px] font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-bold tabular-nums text-slate-900">{value}</dd>
    </div>
  );
}

export function LiveSituationWorkspace() {
  const [location, setLocation] = useState<MapLocation>(defaultLocation);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<WeatherLocation[]>([]);
  const [searchMessage, setSearchMessage] = useState("");
  const [searchBusy, setSearchBusy] = useState(false);
  const [weather, setWeather] = useState<WeatherBundle | null>(null);
  const [weatherError, setWeatherError] = useState("");
  const [weatherBusy, setWeatherBusy] = useState(true);
  const [weatherRefresh, setWeatherRefresh] = useState(0);
  const [radarFrames, setRadarFrames] = useState<RadarFrame[]>([]);
  const [selectedRadarTime, setSelectedRadarTime] = useState<number | null>(null);
  const [radarError, setRadarError] = useState("");
  const [radarBusy, setRadarBusy] = useState(true);
  const [radarRefresh, setRadarRefresh] = useState(0);
  const [radarPlaying, setRadarPlaying] = useState(false);
  const [radarVisible, setRadarVisible] = useState(true);
  const [mapMode, setMapMode] = useState<MapMode>("satellite");
  const [layers, setLayers] = useState(defaultLayers);
  const [layerPanelOpen, setLayerPanelOpen] = useState(true);
  const [weatherOverlay, setWeatherOverlay] = useState<WeatherOverlay>(null);
  const [forecastHours, setForecastHours] = useState<number | null>(null);
  const [riskZonesVisible, setRiskZonesVisible] = useState(false);
  const [measurementMode, setMeasurementMode] = useState<MeasurementMode>(null);
  const [measurementAction, setMeasurementAction] = useState<MeasurementAction>(null);
  const [measurementStatus, setMeasurementStatus] = useState<MeasurementStatus>({ summary: "", pointCount: 0, canFinish: false, hasMeasurement: false });
  const measurementActionId = useRef(0);
  const [grid, setGrid] = useState<WeatherGridPoint[]>([]);
  const [gridBusy, setGridBusy] = useState(false);
  const [operationalData, setOperationalData] = useState<LiveSituationData>({ features: [], bulletins: [], feeds: [] });
  const [operationalBusy, setOperationalBusy] = useState(true);
  const [operationalError, setOperationalError] = useState("");
  const [operationalRefresh, setOperationalRefresh] = useState(0);
  const [locateMessage, setLocateMessage] = useState("");
  const [mapElement, setMapElement] = useState<HTMLDivElement | null>(null);
  const [mapTileStatus, setMapTileStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [mapTileRefresh, setMapTileRefresh] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [mobileWeatherOpen, setMobileWeatherOpen] = useState(false);
  const [mapKeyOpen, setMapKeyOpen] = useState(false);
  const [mapSettingsOpen, setMapSettingsOpen] = useState(false);
  const [mapInfoOpen, setMapInfoOpen] = useState(false);
  const [radarOpacity, setRadarOpacity] = useState(67);
  const [shareMessage, setShareMessage] = useState("");
  const [clock, setClock] = useState(() => new Date());
  const selectedIndexRef = useRef<number | null>(null);

  const currentFrame = useMemo(() => {
    if (!radarFrames.length) return null;
    return radarFrames.find((frame) => frame.time === selectedRadarTime) || radarFrames[radarFrames.length - 1];
  }, [radarFrames, selectedRadarTime]);

  const countByLayer = useMemo(() => {
    const counts: Partial<Record<FeatureLayer, number>> = {};
    operationalData.features.forEach((feature) => { counts[feature.layer] = (counts[feature.layer] || 0) + 1; });
    return counts;
  }, [operationalData]);

  const nearbyCounts = useMemo(() => {
    const nearby = operationalData.features.filter((feature) => {
      if (distanceKm(location.latitude, location.longitude, feature) > 100) return false;
      const status = feature.values?.find((item) => item.label.toLowerCase() === "status")?.value || "";
      return feature.layer !== "incidents" || !/resolved|closed|cancelled/i.test(status);
    });
    return {
      incidents: nearby.filter((feature) => feature.layer === "incidents").length,
      alerts: nearby.filter((feature) => feature.layer === "alerts").length,
      services: nearby.filter((feature) => ["shelters", "hospitals", "fire", "police", "responders"].includes(feature.layer)).length,
    };
  }, [location.latitude, location.longitude, operationalData.features]);

  const risk = useMemo(() => weather ? estimateWeatherRisk(weather.current) : null, [weather]);
  const pointLegend = useMemo(() => [
    ...(layers.incidents ? [
      { label: "Critical incident", color: "#dc2626" },
      { label: "High incident", color: "#ea580c" },
      { label: "Moderate incident", color: "#f59e0b" },
      { label: "Low incident", color: "#1677ff" },
    ] : []),
    ...(layers.alerts ? [
      { label: "Critical alert", color: "#dc2626" },
      { label: "High alert", color: "#ea580c" },
      { label: "Moderate alert", color: "#f59e0b" },
      { label: "Low alert", color: "#1677ff" },
    ] : []),
    ...layerOrder.filter((layer) => layer !== "incidents" && layer !== "alerts" && layers[layer]).map((layer) => ({ label: layerLabels[layer], color: layerColors[layer] })),
  ], [layers]);

  const selectLocation = useCallback((next: MapLocation) => {
    setLocation(next);
    setQuery("");
    setSuggestions([]);
    setSearchMessage("");
    setWeatherError("");
    setForecastHours(null);
  }, []);

  const selectMapPoint = useCallback((latitude: number, longitude: number) => {
    selectLocation({
      name: "Map point " + latitude.toFixed(3) + ", " + longitude.toFixed(3),
      latitude,
      longitude,
      zoom: 11,
    });
  }, [selectLocation]);

  const onMapReady = useCallback((element: HTMLDivElement | null) => {
    setMapElement(element);
  }, []);

  const onMeasurementFinish = useCallback(() => setMeasurementMode(null), []);
  const runMeasurementAction = useCallback((action: "undo" | "finish" | "clear") => {
    measurementActionId.current += 1;
    setMeasurementAction({ id: measurementActionId.current, action });
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const latitude = Number(params.get("lat"));
    const longitude = Number(params.get("lon"));
    if (params.has("lat") && params.has("lon") && Number.isFinite(latitude) && Number.isFinite(longitude)
      && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180) {
      const timer = window.setTimeout(() => selectLocation({
          name: params.get("place") || "Shared map location",
          latitude,
          longitude,
        }), 0);
      return () => window.clearTimeout(timer);
    }
  }, [selectLocation]);

  useEffect(() => {
    const controller = new AbortController();
    let searchingTimer: number | null = null;
    if (query.trim().length < 2) return () => controller.abort();
    searchingTimer = window.setTimeout(() => {
      void searchWeatherLocations(query, controller.signal)
        .then((results) => {
          if (controller.signal.aborted) return;
          setSuggestions(results);
          setSearchMessage(results.length ? "" : "No matching places found.");
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setSuggestions([]);
            setSearchMessage("Location search is temporarily unavailable.");
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearchBusy(false);
        });
    }, 280);
    return () => {
      controller.abort();
      if (searchingTimer !== null) window.clearTimeout(searchingTimer);
    };
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    let live = true;
    const load = async () => {
      setWeatherBusy(true);
      try {
        const result = await getWeatherForLocation(location.latitude, location.longitude, controller.signal);
        if (!live) return;
        setWeather(result);
        setWeatherError("");
      } catch {
        if (!live || controller.signal.aborted) return;
        setWeatherError("Weather data temporarily unavailable.");
      } finally {
        if (live) setWeatherBusy(false);
      }
    };
    void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 10 * 60_000);
    return () => {
      live = false;
      controller.abort();
      window.clearInterval(timer);
    };
  }, [location.latitude, location.longitude, weatherRefresh]);

  useEffect(() => {
    const controller = new AbortController();
    let live = true;
    const load = async () => {
      setRadarBusy(true);
      try {
        const frames = await getRadarFrames(controller.signal);
        if (!live) return;
        setRadarFrames(frames);
        setRadarError(frames.length ? "" : "No historical radar frames are available right now.");
        const previousTime = selectedIndexRef.current;
        const matchingFrame = previousTime === null ? null : frames.find((frame) => frame.time === previousTime);
        const chosen = matchingFrame || frames[frames.length - 1] || null;
        setSelectedRadarTime(chosen?.time ?? null);
        selectedIndexRef.current = chosen?.time ?? null;
      } catch {
        if (!live || controller.signal.aborted) return;
        setRadarError("Radar temporarily unavailable.");
      } finally {
        if (live) setRadarBusy(false);
      }
    };
    void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 5 * 60_000);
    return () => {
      live = false;
      controller.abort();
      window.clearInterval(timer);
    };
  }, [radarRefresh]);

  useEffect(() => {
    const controller = new AbortController();
    let live = true;
    const load = async () => {
      setOperationalBusy(true);
      try {
        const result = await getLiveSituationData(controller.signal);
        if (live) {
          setOperationalData(result);
          setOperationalError(result.feeds.length > 0 && result.feeds.every((feed) => feed.status === "unavailable")
            ? "Operational map data unavailable."
            : "");
        }
      } catch {
        if (live && !controller.signal.aborted) setOperationalError("Operational map data unavailable.");
      } finally {
        if (live) setOperationalBusy(false);
      }
    };
    void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 60_000);
    return () => {
      live = false;
      controller.abort();
      window.clearInterval(timer);
    };
  }, [operationalRefresh]);

  useEffect(() => {
    if (!riskZonesVisible && !weatherOverlay) {
      return;
    }
    const controller = new AbortController();
    let live = true;
    const points: Array<{ latitude: number; longitude: number }> = [];
    const latitudeStep = 0.32;
    const longitudeStep = latitudeStep / Math.max(Math.cos(location.latitude * Math.PI / 180), 0.3);
    for (let y = -2; y <= 2; y += 1) {
      for (let x = -2; x <= 2; x += 1) {
        points.push({
          latitude: Math.max(-85, Math.min(85, location.latitude + y * latitudeStep)),
          longitude: ((location.longitude + x * longitudeStep + 540) % 360) - 180,
        });
      }
    }
    const loadTimer = window.setTimeout(() => {
      if (!live) return;
      setGridBusy(true);
      void getWeatherGrid(points, controller.signal, forecastHours !== null && weatherOverlay ? forecastHours : undefined)
        .then((result) => { if (live) setGrid(result); })
        .catch(() => { if (live && !controller.signal.aborted) setGrid([]); })
        .finally(() => { if (live) setGridBusy(false); });
    }, 0);
    return () => {
      live = false;
      controller.abort();
      window.clearTimeout(loadTimer);
      setGridBusy(false);
    };
  }, [location.latitude, location.longitude, riskZonesVisible, weatherOverlay, forecastHours]);

  useEffect(() => {
    if (!radarPlaying) return;
    const timer = window.setInterval(() => {
      setSelectedRadarTime((time) => {
        if (radarFrames.length < 2) return time;
        const current = radarFrames.findIndex((frame) => frame.time === time);
        const next = radarFrames[(current + 1 + radarFrames.length) % radarFrames.length];
        selectedIndexRef.current = next.time;
        return next.time;
      });
    }, 800);
    return () => window.clearInterval(timer);
  }, [radarFrames, radarPlaying]);

  useEffect(() => {
    const pauseWhenHidden = () => { if (document.visibilityState !== "visible") setRadarPlaying(false); };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, []);

  useEffect(() => {
    const syncFullscreen = () => setFullscreen(Boolean(mapElement?.parentElement && document.fullscreenElement === mapElement.parentElement));
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, [mapElement]);

  const chooseSuggestion = (suggestion: WeatherLocation) => {
    selectLocation({
      name: [suggestion.name, suggestion.admin1, suggestion.country].filter(Boolean).join(", "),
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      zoom: 11,
    });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocateMessage("Location access is not supported by this browser.");
      return;
    }
    setLocateMessage("Requesting your location…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        selectLocation({
          name: "Your location",
          latitude: coords.latitude,
          longitude: coords.longitude,
          zoom: 13,
        });
        setLocateMessage("Map centered on your location.");
      },
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? "Location permission was denied."
          : error.code === error.TIMEOUT
            ? "Location request timed out. Try again."
            : "Your current location could not be determined.";
        setLocateMessage(message);
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  };

  const moveRadar = (delta: number) => {
    if (radarFrames.length < 2) return;
    const index = Math.max(0, radarFrames.findIndex((frame) => frame.time === selectedRadarTime));
    const next = radarFrames[(index + delta + radarFrames.length) % radarFrames.length];
    setSelectedRadarTime(next.time);
    selectedIndexRef.current = next.time;
  };

  const toggleFullscreen = async () => {
    const target = mapElement?.parentElement;
    if (!target) return;
    try {
      if (document.fullscreenElement === target) await document.exitFullscreen();
      else await target.requestFullscreen();
    } catch {
      setLocateMessage("Fullscreen is not available in this browser.");
    }
  };

  const shareLocation = async () => {
    const params = new URLSearchParams({
      lat: location.latitude.toFixed(5),
      lon: location.longitude.toFixed(5),
      place: location.name,
    });
    const link = `${window.location.origin}/live-situation?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(link);
      setShareMessage("Map link copied");
    } catch {
      setShareMessage(link);
    }
    window.setTimeout(() => setShareMessage(""), 5000);
  };

  const visibleBulletins = layers.alerts ? operationalData.bulletins.slice(0, 4) : [];
  const weatherStatus = weatherError ? "Unavailable" : weatherBusy ? "Updating" : weather ? "Live" : "Unavailable";
  const locationNameParts = location.name.split(",").map((part) => part.trim()).filter(Boolean);
  const mapPointLabel = locationNameParts[0] || location.name;
  const mapPointRegion = locationNameParts.slice(1).join(", ");
  const viewAlertOnMap = (bulletin: LiveSituationData["bulletins"][number]) => {
    const feature = operationalData.features.find((item) => item.layer === "alerts" && (item.id === "alerts-" + bulletin.id || item.title === bulletin.title));
    if (!feature) return;
    selectLocation({ name: bulletin.targetArea || bulletin.title, latitude: feature.latitude, longitude: feature.longitude, zoom: 12 });
  };

  return (
    <section className="live-situation-page flex h-full min-h-0 flex-col gap-3 overflow-y-auto bg-slate-100 p-2 sm:p-3 xl:overflow-hidden">
      <header className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.13)]" />
              Live situation
            </div>
            <h1 className="mt-1 truncate text-xl font-extrabold text-slate-950 sm:text-2xl">Weather &amp; Disaster Map</h1>
            <p className="mt-1 truncate text-sm text-slate-500">{location.name}</p>
          </div>

          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
            <div className="relative min-w-0 flex-1 xl:w-[310px] xl:flex-none">
              <label htmlFor="situation-location-search" className="sr-only">Search a city, district or location</label>
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="situation-location-search"
                role="combobox"
                value={query}
                onChange={(event) => {
                  const value = event.target.value;
                  setQuery(value);
                  setSearchMessage("");
                  if (value.trim().length < 2) {
                    setSuggestions([]);
                    setSearchBusy(false);
                  } else {
                    setSearchBusy(true);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && suggestions[0]) {
                    event.preventDefault();
                    chooseSuggestion(suggestions[0]);
                  }
                  if (event.key === "Escape") setSuggestions([]);
                }}
                placeholder="Search city, district or place"
                autoComplete="off"
                aria-expanded={suggestions.length > 0}
                aria-controls="situation-location-suggestions"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              {(suggestions.length > 0 || searchBusy || searchMessage) && (
                <div id="situation-location-suggestions" role="listbox" className="absolute left-0 right-0 top-[calc(100%+6px)] z-[1200] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                  {searchBusy && <p className="px-3 py-2 text-xs text-slate-500">Searching locations…</p>}
                  {suggestions.map((suggestion) => (
                    <button
                      key={[suggestion.name, suggestion.admin1, suggestion.country, suggestion.latitude].join("-")}
                      type="button"
                      role="option"
                      aria-selected="false"
                      onClick={() => chooseSuggestion(suggestion)}
                      className="block min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm text-slate-800 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                    >
                      <span className="block font-semibold">{suggestion.name}</span>
                      <span className="block text-xs text-slate-500">{[suggestion.admin1, suggestion.country].filter(Boolean).join(", ")}</span>
                    </button>
                  ))}
                  {searchMessage && !searchBusy && <p className="px-3 py-2 text-xs text-slate-500">{searchMessage}</p>}
                </div>
              )}
            </div>
            <div className="flex min-w-0 items-center justify-between gap-3 sm:justify-start">
              <div className="min-w-[115px]">
                <p className="text-lg font-extrabold tabular-nums text-slate-900">
                  {weather ? formatTemperature(weather.current.temperatureC) : weatherBusy ? "…" : "—"}
                  <span className={"ml-2 inline-flex items-center gap-1 align-middle text-[10px] font-bold uppercase tracking-wide " + (weatherStatus === "Live" ? "text-emerald-700" : weatherStatus === "Updating" ? "text-blue-700" : "text-amber-700")}><i className={"h-1.5 w-1.5 rounded-full " + (weatherStatus === "Live" ? "bg-emerald-500" : weatherStatus === "Updating" ? "bg-blue-500" : "bg-amber-500")} />{weatherStatus}</span>
                </p>
                <p className="max-w-[155px] truncate text-xs text-slate-500">
                  {weather ? describeWeatherCode(weather.current.weatherCode) + " · " + new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", timeZone: weather.timezone }).format(clock) + " local" : weatherBusy ? "Loading weather…" : "Weather unavailable"}
                </p>
              </div>
              <button type="button" onClick={useMyLocation} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50" aria-label="Use my current location">
                <Icon name="locate" />
                <span className="hidden sm:inline">Locate me</span>
              </button>
              <button type="button" onClick={() => { setWeatherRefresh((value) => value + 1); setRadarRefresh((value) => value + 1); setOperationalRefresh((value) => value + 1); }} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50" aria-label="Refresh live data" title="Refresh">
                <Icon name="refresh" />
              </button>
            </div>
          </div>
        </div>
        {locateMessage && <p role="status" className="mt-2 text-xs text-slate-500">{locateMessage}</p>}
      </header>

      <div className="relative grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-3">
        <div className="live-map-column relative flex min-h-0 min-w-0 flex-col">
          <div className="live-map-shell relative min-h-[360px] flex-1 overflow-hidden rounded-2xl border border-slate-300 bg-slate-900 shadow-md sm:min-h-[420px] xl:min-h-0">
            <LiveSituationMap
              location={location}
              features={operationalData.features}
              enabledLayers={layers}
              radarTileUrl={currentFrame?.tileUrl || null}
              radarVisible={radarVisible}
              radarOpacity={radarOpacity / 100}
              weatherGrid={grid}
              riskZonesVisible={riskZonesVisible}
              weatherOverlay={weatherOverlay}
              forecastHours={forecastHours}
              mapMode={mapMode}
              tileRefresh={mapTileRefresh}
              onTileStatus={setMapTileStatus}
              measurementMode={measurementMode}
              measurementAction={measurementAction}
              onMeasurementStatus={setMeasurementStatus}
              onMeasurementFinish={onMeasurementFinish}
              onMapClick={selectMapPoint}
              onMapReady={onMapReady}
            />

            <div className="pointer-events-none absolute left-3 top-3 z-[700] w-[min(360px,calc(100%-5rem))] rounded-xl border border-white/15 bg-slate-950/90 p-3 text-white shadow-lg backdrop-blur">
              <div className="flex min-w-0 items-start gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.18)]" />
                <div className="min-w-0">
                <p className="truncate text-xs font-extrabold uppercase tracking-wide">{mapPointLabel}</p>
                {mapPointRegion && <p className="truncate text-[10px] text-slate-300">{mapPointRegion}</p>}
                <p className="mt-0.5 text-[9px] tabular-nums text-slate-400">{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-1.5 border-t border-white/10 pt-2">
                <div className="min-w-0"><p className="text-sm font-extrabold tabular-nums">{weather ? formatTemperature(weather.current.temperatureC) : "—"}</p><p className="truncate text-[9px] text-slate-300">{weather ? describeWeatherCode(weather.current.weatherCode) : "Weather"}</p></div>
                <div><p className={"text-xs font-extrabold " + (risk?.level === "CRITICAL" ? "text-red-300" : risk?.level === "HIGH" ? "text-orange-300" : risk?.level === "MODERATE" ? "text-amber-200" : "text-emerald-300")}>{risk?.level || "—"}</p><p className="text-[9px] text-slate-300">Risk</p></div>
                <div><p className="text-xs font-extrabold tabular-nums">{nearbyCounts.incidents}</p><p className="text-[9px] text-slate-300">Incidents</p></div>
                <div><p className="text-xs font-extrabold tabular-nums">{nearbyCounts.alerts}</p><p className="text-[9px] text-slate-300">Alerts</p></div>
              </div>
            </div>

            <div className="absolute right-3 top-3 z-[700] flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg md:right-[344px]">
              <button type="button" onClick={() => setMapMode("satellite")} aria-pressed={mapMode === "satellite"} className={"min-h-11 px-3 text-xs font-bold " + (mapMode === "satellite" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50")}>Satellite</button>
              <button type="button" onClick={() => setMapMode("map")} aria-pressed={mapMode === "map"} className={"min-h-11 px-3 text-xs font-bold " + (mapMode === "map" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50")}>Map</button>
              <button type="button" onClick={() => setMapKeyOpen((open) => !open)} aria-expanded={mapKeyOpen} aria-label={mapKeyOpen ? "Close map key" : "Open map key"} title="Map key" className={"min-h-11 border-l border-slate-200 px-3 text-xs font-bold " + (mapKeyOpen ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50")}>Key</button>
            </div>

            <div className="absolute right-3 top-[58px] z-[700] flex flex-col gap-2 md:right-[344px]">
              <button type="button" onClick={() => { setLayerPanelOpen((open) => !open); setMobileWeatherOpen(false); }} aria-expanded={layerPanelOpen} aria-label={layerPanelOpen ? "Close map layers" : "Open map layers"} title="Layers" className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-lg hover:bg-slate-50">
                <Icon name="layers" />
              </button>
              <button type="button" onClick={() => { setMobileWeatherOpen((open) => !open); setLayerPanelOpen(false); }} aria-expanded={mobileWeatherOpen} aria-label={mobileWeatherOpen ? "Close weather details" : "Open weather details"} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-lg hover:bg-slate-50 md:hidden">
                <span className="text-[10px] font-extrabold">{weather ? formatTemperature(weather.current.temperatureC) : "°C"}</span>
              </button>
              <button type="button" onClick={toggleFullscreen} aria-label={fullscreen ? "Exit fullscreen map" : "Show map fullscreen"} title={fullscreen ? "Exit fullscreen" : "Fullscreen"} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-lg hover:bg-slate-50">
                <Icon name="expand" />
              </button>
              <button type="button" onClick={() => { setMapSettingsOpen((open) => !open); setMapInfoOpen(false); }} aria-expanded={mapSettingsOpen} aria-label="Map settings" title="Settings" className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-lg hover:bg-slate-50">
                <Icon name="settings" />
              </button>
              <button type="button" onClick={() => { setMapInfoOpen((open) => !open); setMapSettingsOpen(false); }} aria-expanded={mapInfoOpen} aria-label="Map information" title="Information" className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-lg hover:bg-slate-50">
                <Icon name="info" />
              </button>
              <button type="button" onClick={() => void shareLocation()} aria-label="Copy link to this map location" title="Share map location" className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-lg hover:bg-slate-50">
                <Icon name="share" />
              </button>
            </div>

            {mapSettingsOpen && <section aria-label="Map settings" className="absolute right-16 top-[58px] z-[710] w-[min(260px,calc(100%-6rem))] rounded-xl border border-slate-200 bg-white p-3 text-slate-800 shadow-xl">
              <div className="flex items-center justify-between"><h2 className="text-xs font-extrabold">Map settings</h2><button type="button" onClick={() => setMapSettingsOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100" aria-label="Close map settings"><Icon name="close" /></button></div>
              <p className="mt-3 text-[11px] font-semibold">Base map</p>
              <div className="mt-1 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                <button type="button" aria-pressed={mapMode === "satellite"} onClick={() => setMapMode("satellite")} className={"min-h-9 rounded-md text-xs font-bold " + (mapMode === "satellite" ? "bg-white shadow-sm" : "text-slate-600")}>Satellite</button>
                <button type="button" aria-pressed={mapMode === "map"} onClick={() => setMapMode("map")} className={"min-h-9 rounded-md text-xs font-bold " + (mapMode === "map" ? "bg-white shadow-sm" : "text-slate-600")}>Standard</button>
              </div>
              <label htmlFor="radar-opacity" className="mt-3 flex items-center justify-between text-[11px] font-semibold"><span>Radar opacity</span><span>{radarOpacity}%</span></label>
              <input id="radar-opacity" type="range" min="10" max="100" value={radarOpacity} onChange={(event) => setRadarOpacity(Number(event.target.value))} className="mt-2 h-2 w-full accent-blue-600" />
            </section>}

            {mapInfoOpen && <section aria-label="Map information" className="absolute right-16 top-[58px] z-[710] w-[min(280px,calc(100%-6rem))] rounded-xl border border-slate-200 bg-white p-3 text-slate-800 shadow-xl">
              <div className="flex items-center justify-between"><h2 className="text-xs font-extrabold">Data sources</h2><button type="button" onClick={() => setMapInfoOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100" aria-label="Close map information"><Icon name="close" /></button></div>
              <ul className="mt-2 space-y-2 text-[11px] leading-4 text-slate-600">
                <li>Map imagery: {mapMode === "satellite" ? "Esri World Imagery" : "OpenStreetMap"}</li>
                <li>Weather: Open-Meteo</li><li>Radar: RainViewer · {currentFrame ? "latest available frame " + formatRadarTime(currentFrame) : "frame unavailable"}</li>
                <li>Disaster events: GDACS and USGS</li><li>Incidents and services: project Java API</li>
              </ul>
              <p className="mt-2 border-t border-slate-100 pt-2 text-[10px] leading-4 text-slate-500">Risk estimates are decision support and are not official warnings. An alert without coordinates is shown in the alert list, not placed at a guessed map location.</p>
            </section>}
            {shareMessage && <p role="status" className="absolute right-16 top-[58px] z-[710] max-w-[min(330px,calc(100%-6rem))] break-all rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-700 shadow-xl">{shareMessage}</p>}

            {mapKeyOpen && (pointLegend.length > 0 || radarVisible || weatherOverlay || riskZonesVisible) && <section aria-label="Map point legend" className="absolute right-[3.75rem] top-[58px] z-[710] max-h-[34%] w-[min(205px,calc(100%-5rem))] overflow-y-auto rounded-xl border border-white/20 bg-slate-950/90 p-3 text-white shadow-xl backdrop-blur md:right-[calc(344px+3.75rem)]">
              <h2 className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-200">Map key</h2>
              {pointLegend.length > 0 && <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
                {pointLegend.map((item) => <span key={item.label} className="flex min-w-0 items-center gap-2 text-[10px] leading-4 text-slate-100"><i aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full border border-white/70" style={{ backgroundColor: item.color }} /><span className="truncate">{item.label}</span></span>)}
              </div>}
              {radarVisible && <div className="mt-2 border-t border-white/15 pt-2"><p className="text-[10px] font-semibold">Radar intensity · RainViewer</p><div className="mt-1 h-2 rounded-full bg-gradient-to-r from-cyan-300 via-emerald-400 via-yellow-300 to-red-500" /><div className="mt-1 flex justify-between text-[9px] text-slate-300"><span>Light</span><span>Heavy</span></div></div>}
              {weatherOverlay && <p className="mt-2 border-t border-white/15 pt-2 text-[10px] text-slate-100">Weather grid values · {weatherOverlays.find((overlay) => overlay.id === weatherOverlay)?.label}</p>}
              {riskZonesVisible && <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-white/15 pt-2 text-[10px] text-slate-100">{[{ label: "Low risk", color: "#16a34a" }, { label: "Moderate", color: "#f59e0b" }, { label: "High", color: "#ea580c" }, { label: "Critical", color: "#dc2626" }].map((item) => <span key={item.label} className="flex items-center gap-2"><i aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />{item.label}</span>)}</div>}
              {layers.fire || layers.police ? <p className="mt-2 border-t border-white/15 pt-2 text-[9px] leading-4 text-slate-300">Fire and police dots are response units, not station locations.</p> : null}
            </section>}

            {mapTileStatus === "unavailable" && <div role="status" className="absolute left-1/2 top-[58px] z-[700] flex max-w-[calc(100%-6rem)] -translate-x-1/2 items-center gap-2 rounded-xl border border-amber-200 bg-white/95 px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-lg backdrop-blur">
              <span>Map imagery unavailable. Check your connection.</span>
              <button type="button" onClick={() => { setMapTileStatus("loading"); setMapTileRefresh((value) => value + 1); }} className="shrink-0 rounded-lg bg-blue-600 px-2.5 py-1.5 text-white hover:bg-blue-700">Retry</button>
            </div>}

            {layerPanelOpen && (
              <section aria-label="Map layers" className="live-layer-panel absolute bottom-[104px] left-3 top-[132px] z-[700] w-[min(260px,calc(100%-1.5rem))] overflow-y-auto rounded-2xl border border-white/15 bg-[#0b1f3a]/95 p-3 text-white shadow-2xl backdrop-blur">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div>
                    <h2 className="text-xs font-extrabold uppercase tracking-[0.16em]">Map layers</h2>
                    <p className="mt-0.5 text-[10px] text-slate-300">Operational data and weather</p>
                  </div>
                  <button type="button" onClick={() => setLayerPanelOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-200 hover:bg-white/10 xl:hidden" aria-label="Close map layers"><Icon name="close" /></button>
                </div>

                <div className="mt-3">
                  <h3 className="mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Map tools</h3>
                  <div className="grid grid-cols-2 gap-1.5 px-1">
                    <button type="button" aria-pressed={measurementMode === "distance"} onClick={() => setMeasurementMode(measurementMode === "distance" ? null : "distance")} className={"min-h-9 rounded-lg border px-2 text-xs font-semibold " + (measurementMode === "distance" ? "border-blue-300 bg-blue-500/20 text-white" : "border-white/15 text-slate-200 hover:bg-white/10")}>Measure distance</button>
                    <button type="button" aria-pressed={measurementMode === "area"} onClick={() => setMeasurementMode(measurementMode === "area" ? null : "area")} className={"min-h-9 rounded-lg border px-2 text-xs font-semibold " + (measurementMode === "area" ? "border-blue-300 bg-blue-500/20 text-white" : "border-white/15 text-slate-200 hover:bg-white/10")}>Measure area</button>
                  </div>
                  {measurementMode && <p className="mt-1 px-2 text-[10px] leading-4 text-sky-200">Click the map to add points. {measurementMode === "distance" ? "Two points" : "Three points"} are needed to finish.</p>}
                  {measurementStatus.hasMeasurement && <p role="status" className="mt-1 px-2 text-xs font-semibold text-white">{measurementMode === null ? "Measurement" : "Current measurement"}: {measurementStatus.summary}</p>}
                  {(measurementMode || measurementStatus.hasMeasurement) && <div className="mt-1 flex gap-1.5 px-1">
                    {measurementMode && <button type="button" onClick={() => runMeasurementAction("undo")} disabled={!measurementStatus.pointCount} className="min-h-8 flex-1 rounded-lg bg-white/10 px-2 text-[11px] font-semibold text-slate-100 hover:bg-white/15 disabled:opacity-40">Undo point</button>}
                    {measurementMode && <button type="button" onClick={() => runMeasurementAction("finish")} disabled={!measurementStatus.canFinish} className="min-h-11 flex-1 rounded-lg bg-blue-600 px-2 text-[11px] font-bold text-white hover:bg-blue-500 disabled:opacity-40">Done</button>}
                    {measurementMode && <button type="button" onClick={() => { setMeasurementMode(null); runMeasurementAction("clear"); }} className="min-h-11 flex-1 rounded-lg border border-white/15 px-2 text-[11px] font-semibold text-slate-200 hover:bg-white/10">Cancel</button>}
                    <button type="button" onClick={() => { setMeasurementMode(null); runMeasurementAction("clear"); }} className="min-h-8 flex-1 rounded-lg border border-white/15 px-2 text-[11px] font-semibold text-slate-200 hover:bg-white/10">Clear</button>
                  </div>}
                </div>

                <div className="mt-3 border-t border-white/10 pt-3">
                  <h3 className="mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Map</h3>
                  <div className="mb-2 grid grid-cols-2 gap-1 rounded-lg bg-slate-950/40 p-1">
                    <button type="button" aria-pressed={mapMode === "satellite"} onClick={() => setMapMode("satellite")} className={"min-h-9 rounded-md text-xs font-semibold " + (mapMode === "satellite" ? "bg-white text-slate-900" : "text-slate-200 hover:bg-white/10")}>Satellite</button>
                    <button type="button" aria-pressed={mapMode === "map"} onClick={() => setMapMode("map")} className={"min-h-9 rounded-md text-xs font-semibold " + (mapMode === "map" ? "bg-white text-slate-900" : "text-slate-200 hover:bg-white/10")}>Standard map</button>
                  </div>
                </div>

                <div className="mt-3 border-t border-white/10 pt-3">
                  <h3 className="mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Weather</h3>
                  <LayerToggle checked={radarVisible} color="#38bdf8" label="Radar · RainViewer" onChange={() => setRadarVisible((value) => !value)} />
                  {weatherOverlays.map((overlay) => (
                    <button key={overlay.id} type="button" aria-pressed={weatherOverlay === overlay.id} onClick={() => setWeatherOverlay(weatherOverlay === overlay.id ? null : overlay.id)} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-left text-[13px] text-slate-100 hover:bg-white/10">
                      <span aria-hidden="true" className={"flex h-4 w-4 items-center justify-center rounded-full border " + (weatherOverlay === overlay.id ? "border-blue-300 bg-blue-500" : "border-slate-400")} />
                      <span className="flex-1">{overlay.label}</span>
                      {weatherOverlay === overlay.id && <span className="text-[10px] text-sky-300">GRID</span>}
                    </button>
                  ))}
                  <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-300">Weather time</h4>
                      <span className="text-[10px] font-semibold text-sky-200">{forecastHours === null ? "Live" : "+" + forecastHours + " hr"}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg bg-slate-950/40 p-1">
                      <button type="button" aria-pressed={forecastHours === null} onClick={() => setForecastHours(null)} className={"min-h-8 rounded-md px-2 text-[11px] font-semibold " + (forecastHours === null ? "bg-white text-slate-900" : "text-slate-300 hover:bg-white/10")}>Live</button>
                      <button type="button" aria-pressed={forecastHours !== null} onClick={() => setForecastHours((value) => value ?? 0)} className={"min-h-8 rounded-md px-2 text-[11px] font-semibold " + (forecastHours !== null ? "bg-white text-slate-900" : "text-slate-300 hover:bg-white/10")}>Forecast</button>
                    </div>
                    {forecastHours !== null && <div className="mt-2">
                      <div className="flex items-center justify-between text-[10px] text-slate-300"><span>Now</span><span>24 hours</span></div>
                      <label htmlFor="weather-forecast-hour" className="sr-only">Forecast hour</label>
                      <input id="weather-forecast-hour" type="range" min="0" max="23" value={forecastHours} onChange={(event) => setForecastHours(Number(event.target.value))} className="mt-1 h-2 w-full cursor-pointer accent-sky-400" />
                      <p className="text-[10px] leading-4 text-slate-400">Hourly Open-Meteo forecast for the selected map area. Choose a weather layer to show forecast values.</p>
                    </div>}
                  </div>
                  {gridBusy && <p role="status" className="px-2 py-1 text-[10px] text-slate-400">Loading weather samples…</p>}
                  {grid.length > 0 && (riskZonesVisible || weatherOverlay) && <p className="px-2 py-1 text-[10px] leading-4 text-slate-400">Open-Meteo model samples around the selected point. Decision support only.</p>}
                </div>

                <div className="mt-3 border-t border-white/10 pt-3">
                  {layerGroups.map((group) => (
                    <div key={group.label} className="mb-2">
                      <h3 className="mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">{group.label}</h3>
                      {group.label === "Disaster" && <LayerToggle checked={riskZonesVisible} color="#f59e0b" label="Weather risk zones" onChange={() => setRiskZonesVisible((value) => !value)} />}
                      {group.layers.map((layer) => (
                        <LayerToggle
                          key={layer}
                          checked={layers[layer]}
                          color={layerColors[layer]}
                          label={layerLabels[layer]}
                          count={countByLayer[layer]}
                          onChange={() => setLayers((current) => ({ ...current, [layer]: !current[layer] }))}
                        />
                      ))}
                    </div>
                  ))}
                </div>

              </section>
            )}

            {operationalBusy && (
              <div role="status" className="pointer-events-none absolute bottom-[104px] left-3 right-3 z-[700] rounded-lg bg-slate-950/85 px-3 py-2 text-[11px] font-medium text-white md:right-[344px]">
                Loading incidents, shelters and services…
              </div>
            )}
            {operationalError && (
              <div role="status" className="absolute bottom-[104px] left-3 right-3 z-[700] rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900 shadow md:right-[344px]">
                {operationalError} Current map layers may be empty until it reconnects.
              </div>
            )}
          </div>

          <section aria-label="Radar timeline" className="absolute bottom-3 left-3 right-3 z-[800] rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-xl backdrop-blur md:right-[344px]">
            <div className="flex min-w-0 items-center gap-2">
              <div className="mr-auto min-w-0">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Radar history</p>
                <p className="truncate text-xs font-bold text-slate-900">{radarBusy && radarFrames.length === 0 ? "Loading radar…" : radarError ? "Radar temporarily unavailable." : currentFrame ? formatRadarTime(currentFrame) : "No frame selected"}</p>
              </div>
              <button type="button" onClick={() => moveRadar(-1)} disabled={radarFrames.length < 2} aria-label="Previous radar frame" className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 disabled:opacity-40"><Icon name="previous" /></button>
              <button type="button" onClick={() => setRadarPlaying((playing) => !playing)} disabled={radarFrames.length < 2} aria-label={radarPlaying ? "Pause radar animation" : "Play radar animation"} className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white disabled:opacity-40">
                <Icon name={radarPlaying ? "pause" : "play"} />
              </button>
              <button type="button" onClick={() => moveRadar(1)} disabled={radarFrames.length < 2} aria-label="Next radar frame" className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 disabled:opacity-40"><Icon name="next" /></button>
              <button type="button" onClick={() => { const last = radarFrames[radarFrames.length - 1]; if (last) { setSelectedRadarTime(last.time); selectedIndexRef.current = last.time; } }} disabled={!radarFrames.length} className="min-h-10 rounded-lg border border-blue-100 bg-blue-50 px-3 text-xs font-bold text-blue-700 disabled:opacity-40">Latest</button>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <label htmlFor="radar-frame-slider" className="sr-only">Choose a historical radar frame</label>
              <input
                id="radar-frame-slider"
                type="range"
                min={0}
                max={Math.max(0, radarFrames.length - 1)}
                value={Math.max(0, radarFrames.findIndex((frame) => frame.time === selectedRadarTime))}
                disabled={radarFrames.length < 2}
                onChange={(event) => {
                  const frame = radarFrames[Number(event.target.value)];
                  if (frame) {
                    setSelectedRadarTime(frame.time);
                    selectedIndexRef.current = frame.time;
                  }
                }}
                className="h-2 min-w-0 flex-1 cursor-pointer accent-blue-600"
              />
              <span className="min-w-[58px] text-right text-[10px] text-slate-500">{radarFrames.length} frames</span>
            </div>
          </section>

        </div>

        <aside aria-label="Current weather and area conditions" className={"live-weather-panel absolute inset-x-3 bottom-[104px] z-[760] max-h-[56%] space-y-3 overflow-y-auto overscroll-contain rounded-2xl bg-slate-100/90 p-1 shadow-2xl backdrop-blur md:inset-y-3 md:left-auto md:right-3 md:w-[320px] md:max-h-none md:rounded-none md:bg-transparent md:p-0 md:shadow-none " + (mobileWeatherOpen ? "block" : "hidden md:block")}>
          <div className="flex justify-end md:hidden">
            <button type="button" onClick={() => setMobileWeatherOpen(false)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm">Close weather</button>
          </div>
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-600">Current conditions</p>
                <h2 className="mt-1 truncate text-base font-extrabold text-slate-950">{location.name}</h2>
              </div>
              <span className={"rounded-full border px-2.5 py-1 text-[10px] font-bold " + (weatherStatus === "Live" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : weatherStatus === "Updating" ? "border-blue-200 bg-blue-50 text-blue-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{weatherStatus}</span>
            </div>
            {weatherBusy && !weather && <div role="status" className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600"><p>Loading weather...</p><div className="mt-3 h-8 animate-pulse rounded-lg bg-slate-200" /><div className="mt-2 h-14 animate-pulse rounded-lg bg-slate-200" /></div>}
            {weatherError && <p role="status" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">{weatherError}</p>}
            {weather && (
              <>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <p className="text-5xl font-extrabold tracking-tight tabular-nums text-slate-950">{formatTemperature(weather.current.temperatureC)}</p>
                  <div className="pb-1 text-right">
                    <p className="text-sm font-bold text-slate-800">{describeWeatherCode(weather.current.weatherCode)}</p>
                    <p className="mt-1 text-[11px] text-slate-500">Feels like {formatTemperature(weather.current.apparentTemperatureC)}</p>
                  </div>
                </div>
                {weather.daily[0] && <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Today <span className="ml-1 tabular-nums">{formatTemperature(weather.daily[0].lowC)} min</span><span className="ml-2 tabular-nums">{formatTemperature(weather.daily[0].highC)} max</span></p>}
                <dl className="mt-3 grid grid-cols-3 gap-1.5">
                  <WeatherMetric label="Humidity" value={Math.round(weather.current.humidityPercent) + "%"} />
                  <WeatherMetric label="Wind" value={Math.round(weather.current.windSpeedKmh) + " km/h " + direction(weather.current.windDirectionDegrees)} />
                  <WeatherMetric label="Rain" value={weather.current.rainMm.toFixed(1) + " mm"} />
                  <WeatherMetric label="Pressure" value={Math.round(weather.current.pressureHpa) + " hPa"} />
                  <WeatherMetric label="Cloud cover" value={Math.round(weather.current.cloudCoverPercent) + "%"} />
                  <WeatherMetric label="Precipitation" value={weather.current.precipitationMm.toFixed(1) + " mm"} />
                </dl>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
                  <span>Source: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="font-semibold text-slate-700 underline underline-offset-2">Open-Meteo</a></span>
                  <span>Model time: {formatTime(weather.current.time, weather.timezone)}</span>
                </div>
              </>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-600">Current risk</p>
                <h2 className="mt-1 text-sm font-extrabold text-slate-950">Weather estimate · decision support</h2>
              </div>
              {risk && <span className={"rounded-full border px-2.5 py-1 text-[10px] font-extrabold " + riskTone(risk.level)}>{risk.level}</span>}
            </div>
            {risk ? (
              <>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-[5px] border-slate-100 text-sm font-extrabold text-slate-900" style={{ borderTopColor: risk.level === "CRITICAL" ? "#dc2626" : risk.level === "HIGH" ? "#ea580c" : risk.level === "MODERATE" ? "#f59e0b" : "#16a34a" }}>{risk.score}</div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Risk score: {risk.score} / 100</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">Derived from current model fields</p>
                  </div>
                </div>
                <ul className="mt-3 space-y-1.5 text-xs leading-4 text-slate-600">
                  {risk.factors.map((factor) => <li key={factor} className="flex gap-2"><span aria-hidden="true" className="text-blue-600">•</span>{factor}</li>)}
                </ul>
                <p className="mt-3 rounded-lg bg-slate-50 px-2.5 py-2 text-[10px] leading-4 text-slate-600">Area records within 100 km: {nearbyCounts.incidents} incidents · {nearbyCounts.alerts} mapped alerts · {nearbyCounts.services} emergency service locations.</p>
                <p className="mt-3 border-t border-slate-100 pt-2 text-[10px] leading-4 text-slate-500">{risk.method}</p>
              </>
            ) : <p className="mt-3 text-xs text-slate-500">Current weather values are needed to estimate local conditions.</p>}
          </section>

          <section aria-label="Nearby mapped records" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-600">Nearby operations</p>
                <h2 className="mt-1 text-sm font-extrabold text-slate-950">Within 100 km</h2>
              </div>
              <span className="text-[10px] text-slate-500">from selected point</span>
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[{ label: "Incidents", value: nearbyCounts.incidents }, { label: "Mapped alerts", value: nearbyCounts.alerts }, { label: "Services", value: nearbyCounts.services }].map((item) => (
                <div key={item.label} className="rounded-lg bg-slate-50 px-2 py-2">
                  <dd className="text-lg font-extrabold tabular-nums text-slate-900">{item.value}</dd>
                  <dt className="text-[10px] text-slate-500">{item.label}</dt>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-[10px] leading-4 text-slate-500">Counts include only project or public-feed records with coordinates. Alerts without coordinates remain in the alert list.</p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-600">Forecast</p>
                <h2 className="mt-1 text-sm font-extrabold text-slate-950">Next 6 days</h2>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {weather?.daily.map((day, index) => (
                <div key={day.date} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center">
                  <p className="text-[10px] font-semibold text-slate-500">{formatDay(day, index)}</p>
                  <p className="mt-2 text-sm font-extrabold tabular-nums text-slate-900">{formatTemperature(day.highC)}</p>
                  <p className="text-[11px] tabular-nums text-slate-500">{formatTemperature(day.lowC)}</p>
                  <p className="mt-2 text-[10px] text-blue-700">{Math.round(day.precipitationProbabilityPercent)}% rain</p>
                </div>
              )) || <p className="col-span-full text-xs text-slate-500">Forecast is unavailable.</p>}
            </div>
            {weather && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Next hours</p>
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                  {weather.hourly.slice(0, 8).map((hour) => (
                    <div key={hour.time} className="min-w-[62px] rounded-lg bg-slate-50 px-2 py-2 text-center">
                      <p className="text-[10px] text-slate-500">{formatTime(hour.time, weather.timezone)}</p>
                      <p className="mt-1 text-xs font-bold tabular-nums text-slate-900">{formatTemperature(hour.temperatureC)}</p>
                      <p className="mt-1 text-[9px] text-blue-700">{Math.round(hour.precipitationProbabilityPercent)}%</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="mt-3 text-[10px] text-slate-500">Forecast source: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2">Open-Meteo</a></p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-600">Operational alerts</p>
                <h2 className="mt-1 text-sm font-extrabold text-slate-950">Java response system</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700">{operationalData.bulletins.length}</span>
            </div>
            {operationalBusy && operationalData.bulletins.length === 0 && <p role="status" className="mt-3 rounded-lg bg-slate-50 px-3 py-3 text-xs text-slate-600">Loading incidents and alerts...</p>}
            {!operationalBusy && !visibleBulletins.length && <p className="mt-3 rounded-lg bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-600">No active records are currently returned by the project alert feed.</p>}
            <div className="mt-3 space-y-2">
              {visibleBulletins.map((bulletin) => (
                <article key={bulletin.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900">{bulletin.title}</h3>
                    <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-1 text-[9px] font-bold text-slate-600">{bulletin.severity}</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-4 text-slate-600">{bulletin.message}</p>
                  <p className="mt-2 text-[10px] text-slate-500">{bulletin.hazard}{bulletin.targetArea ? " · " + bulletin.targetArea : ""}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold">
                    <a href={bulletin.href || "/alerts"} className="text-blue-700 underline underline-offset-2">View alert</a>
                    {operationalData.features.some((item) => item.layer === "alerts" && (item.id === "alerts-" + bulletin.id || item.title === bulletin.title)) && <button type="button" onClick={() => viewAlertOnMap(bulletin)} className="text-blue-700 underline underline-offset-2">View on map</button>}
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-slate-500">Project records may not be official public warnings.</p>
            {!!operationalData.feeds.length && <div className="mt-3 border-t border-slate-100 pt-3">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Feed status</h3>
              <ul className="mt-2 grid grid-cols-2 gap-1.5">
                {operationalData.feeds.map((feed) => <li key={feed.name} className="flex min-w-0 items-center gap-1.5 text-[10px] text-slate-600" title={feed.source}>
                  <i className={"h-1.5 w-1.5 shrink-0 rounded-full " + (feed.status === "available" ? "bg-emerald-500" : "bg-amber-500")} />
                  <span className="truncate">{feed.name}</span><span className="ml-auto tabular-nums">{feed.status === "available" ? feed.count : "offline"}</span>
                </li>)}
              </ul>
            </div>}
          </section>
        </aside>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[10px] text-slate-500">
        <span>Weather: Open-Meteo · Radar: RainViewer · Events: GDACS / USGS when available · Operations: project Java API · Map: {mapMode === "satellite" ? "Esri imagery" : "OpenStreetMap"}</span>
        <span>Last updated: {weather ? new Date(weather.fetchedAt).toLocaleTimeString() : weatherBusy ? "loading…" : "weather unavailable"}</span>
      </footer>
    </section>
  );
}
