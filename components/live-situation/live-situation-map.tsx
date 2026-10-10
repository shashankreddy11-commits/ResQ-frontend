"use client";

import { useEffect, useRef } from "react";
import * as L from "leaflet";
import type { MapFeature, FeatureLayer } from "@/lib/live-situation-data";
import type { WeatherGridPoint } from "@/lib/weather/open-meteo";
import { estimateWeatherRisk } from "@/lib/weather/risk-estimate";
import { layerColors } from "./map-config";

export interface MapLocation {
  name: string;
  latitude: number;
  longitude: number;
  zoom?: number;
}

export type WeatherOverlay = "precipitation" | "wind" | "temperature" | "humidity" | "pressure" | null;
export type MapMode = "satellite" | "map";
export type MeasurementMode = "distance" | "area" | null;
export type MeasurementAction = { id: number; action: "undo" | "finish" | "clear" } | null;

export interface MeasurementStatus {
  summary: string;
  pointCount: number;
  canFinish: boolean;
  hasMeasurement: boolean;
}

export interface LiveSituationMapProps {
  location: MapLocation;
  features: MapFeature[];
  enabledLayers: Record<FeatureLayer, boolean>;
  radarTileUrl: string | null;
  radarVisible: boolean;
  radarOpacity: number;
  weatherGrid: WeatherGridPoint[];
  riskZonesVisible: boolean;
  weatherOverlay: WeatherOverlay;
  forecastHours: number | null;
  mapMode: MapMode;
  tileRefresh: number;
  onTileStatus?: (status: "loading" | "ready" | "unavailable") => void;
  measurementMode: MeasurementMode;
  measurementAction: MeasurementAction;
  onMeasurementStatus: (status: MeasurementStatus) => void;
  onMeasurementFinish: () => void;
  onMapClick: (latitude: number, longitude: number) => void;
  onMapReady?: (element: HTMLDivElement | null) => void;
}

function addText(parent: HTMLElement, tag: string, text: string, className?: string): HTMLElement {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  parent.appendChild(node);
  return node;
}

function distanceKm(from: MapLocation, feature: MapFeature): number {
  const radians = Math.PI / 180;
  const latitudeDelta = (feature.latitude - from.latitude) * radians;
  const longitudeDelta = (feature.longitude - from.longitude) * radians;
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(from.latitude * radians) * Math.cos(feature.latitude * radians) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function featurePopup(feature: MapFeature, location: MapLocation): HTMLElement {
  const root = document.createElement("div");
  root.className = "live-map-popup";
  addText(root, "strong", feature.title);
  addText(root, "p", feature.detail);
  const distance = distanceKm(location, feature);
  addText(root, "p", `${feature.latitude.toFixed(4)}, ${feature.longitude.toFixed(4)} · ${distance.toFixed(1)} km away`);
  if (feature.layer === "incidents") {
    addText(root, "p", "Incident ID: " + feature.id.replace(/^incidents-/, ""));
  }
  if (feature.values?.length) {
    const list = document.createElement("dl");
    feature.values.forEach(({ label, value }) => {
      const row = document.createElement("div");
      row.className = "live-map-popup__row";
      addText(row, "dt", label);
      addText(row, "dd", value);
      list.appendChild(row);
    });
    root.appendChild(list);
  }
  if (feature.href && feature.href !== "/incidents/") {
    const link = document.createElement("a");
    link.href = feature.href;
    link.textContent = feature.layer === "incidents" ? "View incident" : feature.layer === "alerts" ? "View alert list" : feature.layer === "shelters" ? "View shelter" : feature.layer === "hospitals" ? "View emergency services" : "View response teams";
    link.className = "live-map-popup__link";
    root.appendChild(link);
  }
  if (feature.layer === "incidents") {
    const navigate = document.createElement("a");
    navigate.href = `https://www.google.com/maps/dir/?api=1&destination=${feature.latitude},${feature.longitude}`;
    navigate.target = "_blank";
    navigate.rel = "noreferrer";
    navigate.textContent = "Navigate";
    navigate.className = "live-map-popup__link live-map-popup__link--secondary";
    root.appendChild(navigate);
  } else if (["shelters", "hospitals", "police", "fire", "responders"].includes(feature.layer)) {
    const directions = document.createElement("a");
    directions.href = `https://www.google.com/maps/dir/?api=1&destination=${feature.latitude},${feature.longitude}`;
    directions.target = "_blank";
    directions.rel = "noreferrer";
    directions.textContent = "Directions";
    directions.className = "live-map-popup__link live-map-popup__link--secondary";
    root.appendChild(directions);
  }
  return root;
}

const serviceMarkerPaths: Partial<Record<FeatureLayer, string>> = {
  shelters: '<path d="m3 11 9-7 9 7v9H3z"/><path d="M9 20v-6h6v6"/>',
  hospitals: '<path d="M12 3v18M3 12h18"/>',
  police: '<path d="m12 3 8 3v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6z"/><path d="m9 12 2 2 4-4"/>',
  fire: '<path d="M13 3c1 4-2 4-1 7 1-1 2-2 2-3 4 3 6 6 4 10a7 7 0 0 1-12 0c-2-4 1-8 4-10 0 3 1 4 2 5 2-3 0-5 1-9z"/>',
  responders: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M15 15a5 5 0 0 1 6 5"/>',
};

function serviceIcon(feature: MapFeature): L.DivIcon | null {
  const path = serviceMarkerPaths[feature.layer];
  if (!path) return null;
  const color = layerColors[feature.layer];
  return L.divIcon({
    className: "live-service-marker",
    html: `<span style="--service-marker-color:${color}"><svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg></span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function markerColor(feature: MapFeature): string {
  const severity = (feature.severity || "").toUpperCase();
  if (feature.layer === "incidents") {
    if (severity.includes("CRITICAL") || severity.includes("SEVERE")) return "#dc2626";
    if (severity.includes("HIGH") || severity.includes("URGENT")) return "#ea580c";
    if (severity.includes("MEDIUM") || severity.includes("MODERATE")) return "#f59e0b";
    if (severity.includes("LOW")) return "#1677ff";
    return "#64748b";
  }
  if (feature.layer === "alerts") {
    if (severity.includes("CRITICAL") || severity.includes("SEVERE")) return "#dc2626";
    if (severity.includes("HIGH")) return "#ea580c";
    if (severity.includes("MEDIUM") || severity.includes("MODERATE")) return "#f59e0b";
    if (severity.includes("LOW")) return "#1677ff";
  }
  if (feature.layer === "disasters") {
    if (severity.includes("RED") || severity.includes("HIGH")) return "#dc2626";
    if (severity.includes("ORANGE") || severity.includes("MODERATE")) return "#ea580c";
    if (severity.includes("GREEN") || severity.includes("LOW")) return "#16a34a";
  }
  return layerColors[feature.layer];
}

function markerRadius(feature: MapFeature): number {
  if (feature.layer !== "incidents") return feature.layer === "earthquakes" ? 7 : 6;
  const severity = (feature.severity || "").toUpperCase();
  if (severity.includes("CRITICAL")) return 10;
  if (severity.includes("HIGH") || severity.includes("URGENT")) return 9;
  return 7;
}

function tileConfiguration(mode: MapMode): { url: string; attribution: string; maxZoom: number } {
  if (mode === "map") {
    return {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    };
  }
  const configuredProvider = process.env.NEXT_PUBLIC_MAP_TILE_PROVIDER?.toLowerCase() || "esri";
  const configuredUrl = process.env.NEXT_PUBLIC_SATELLITE_TILE_URL;
  if (configuredUrl) {
    return {
      url: configuredUrl,
      attribution: process.env.NEXT_PUBLIC_SATELLITE_TILE_ATTRIBUTION || "Satellite imagery provider",
      maxZoom: 19,
    };
  }
  if (configuredProvider === "osm") {
    return {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    };
  }
  return {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    maxZoom: 19,
  };
}

function weatherCellText(point: WeatherGridPoint, overlay: Exclude<WeatherOverlay, null>, forecastHours: number | null): string {
  const reading = forecastHours !== null && point.forecast ? point.forecast : point.current;
  if (overlay === "precipitation") return reading.precipitationMm.toFixed(1) + " mm";
  if (overlay === "wind") return Math.round(reading.windSpeedKmh) + " km/h";
  if (overlay === "temperature") return Math.round(reading.temperatureC) + "°";
  if (overlay === "humidity") return Math.round(reading.humidityPercent) + "%";
  return Math.round(reading.pressureHpa) + " hPa";
}

function riskColor(score: number): string {
  if (score >= 65) return "#dc2626";
  if (score >= 45) return "#ea580c";
  if (score >= 25) return "#f59e0b";
  return "#16a34a";
}

function measurementLabel(points: L.LatLng[], mode: Exclude<MeasurementMode, null>): string {
  if (mode === "distance") {
    let meters = 0;
    for (let index = 1; index < points.length; index += 1) meters += points[index - 1].distanceTo(points[index]);
    return meters >= 1000 ? (meters / 1000).toFixed(2) + " km" : Math.round(meters) + " m";
  }
  if (points.length < 3) return "Add " + (3 - points.length) + " more point" + (points.length === 1 ? "" : "s") + " to measure area";
  const earthRadius = 6371008.8;
  let sum = 0;
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    sum += (next.lng - point.lng) * Math.PI / 180 * (2 + Math.sin(point.lat * Math.PI / 180) + Math.sin(next.lat * Math.PI / 180));
  });
  const squareMeters = Math.abs(sum * earthRadius * earthRadius / 2);
  return squareMeters >= 1_000_000 ? (squareMeters / 1_000_000).toFixed(2) + " km²" : Math.round(squareMeters) + " m²";
}

export function LiveSituationMap({
  location,
  features,
  enabledLayers,
  radarTileUrl,
  radarVisible,
  radarOpacity,
  weatherGrid,
  riskZonesVisible,
  weatherOverlay,
  forecastHours,
  mapMode,
  tileRefresh,
  onTileStatus,
  measurementMode,
  measurementAction,
  onMeasurementStatus,
  onMeasurementFinish,
  onMapClick,
  onMapReady,
}: LiveSituationMapProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const baseLayersRef = useRef<Record<MapMode, L.TileLayer> | null>(null);
  const featureLayersRef = useRef<L.LayerGroup | null>(null);
  const riskLayerRef = useRef<L.LayerGroup | null>(null);
  const weatherLayerRef = useRef<L.LayerGroup | null>(null);
  const measurementLayerRef = useRef<L.LayerGroup | null>(null);
  const measurementPointsRef = useRef<L.LatLng[]>([]);
  const locationMarkerRef = useRef<L.CircleMarker | null>(null);
  const measurementModeRef = useRef<MeasurementMode>(null);
  const radarLayerRef = useRef<L.TileLayer | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const onMeasurementStatusRef = useRef(onMeasurementStatus);
  const onTileStatusRef = useRef(onTileStatus);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    onMeasurementStatusRef.current = onMeasurementStatus;
  }, [onMeasurementStatus]);

  useEffect(() => {
    onTileStatusRef.current = onTileStatus;
  }, [onTileStatus]);

  useEffect(() => {
    if (!elementRef.current || mapRef.current) return;
    const map = L.map(elementRef.current, {
      zoomControl: true,
      minZoom: 2,
      maxZoom: 19,
      worldCopyJump: true,
      zoomAnimation: true,
      zoomAnimationThreshold: 4,
      fadeAnimation: false,
      wheelDebounceTime: 80,
      wheelPxPerZoomLevel: 100,
    }).setView([location.latitude, location.longitude], location.zoom ?? 7);
    const modes: MapMode[] = ["satellite", "map"];
    const baseLayers = {} as Record<MapMode, L.TileLayer>;
    modes.forEach((mode) => {
      const config = tileConfiguration(mode);
      baseLayers[mode] = L.tileLayer(config.url, {
        maxZoom: config.maxZoom,
        attribution: config.attribution,
        updateWhenIdle: true,
        updateWhenZooming: false,
        keepBuffer: 4,
      });
    });
    baseLayers[mapMode].addTo(map);
    const featureLayer = L.layerGroup().addTo(map);
    const riskLayer = L.layerGroup().addTo(map);
    const weatherLayer = L.layerGroup().addTo(map);
    const measurementLayer = L.layerGroup().addTo(map);
    locationMarkerRef.current = L.circleMarker([location.latitude, location.longitude], {
      radius: 8,
      color: "#ffffff",
      weight: 3,
      fillColor: "#2563eb",
      fillOpacity: 1,
      bubblingMouseEvents: false,
    }).bindTooltip(location.name, { direction: "top", offset: [0, -8] }).addTo(map);
    map.on("click", (event: L.LeafletMouseEvent) => {
      const mode = measurementModeRef.current;
      if (mode) {
        const points = measurementPointsRef.current;
        points.push(event.latlng);
        measurementLayer.clearLayers();
        points.forEach((point) => L.circleMarker(point, { radius: 4, color: "#fff", weight: 2, fillColor: "#2563eb", fillOpacity: 1 }).addTo(measurementLayer));
        if (points.length > 1) {
          const path = mode === "area" && points.length > 2 ? [...points, points[0]] : points;
          (mode === "area" && points.length > 2
            ? L.polygon(path, { color: "#2563eb", weight: 3, fillColor: "#3b82f6", fillOpacity: 0.2, dashArray: "6 5" })
            : L.polyline(path, { color: "#2563eb", weight: 3, dashArray: "6 5" })
          ).addTo(measurementLayer);
        }
        const label = measurementLabel(points, mode);
        if (points.length) L.marker(points[points.length - 1], {
          icon: L.divIcon({ className: "live-measurement-label", html: `<span>${label}</span>`, iconSize: undefined, iconAnchor: [-8, 18] }),
          interactive: false,
        }).addTo(measurementLayer);
        onMeasurementStatusRef.current({ summary: label, pointCount: points.length, canFinish: points.length >= (mode === "distance" ? 2 : 3), hasMeasurement: points.length > 0 });
        return;
      }
      onMapClickRef.current(event.latlng.lat, event.latlng.lng);
    });

    mapRef.current = map;
    baseLayersRef.current = baseLayers;
    featureLayersRef.current = featureLayer;
    riskLayerRef.current = riskLayer;
    weatherLayerRef.current = weatherLayer;
    measurementLayerRef.current = measurementLayer;
    onMapReady?.(elementRef.current);

    return () => {
      map.remove();
      mapRef.current = null;
      baseLayersRef.current = null;
      featureLayersRef.current = null;
      riskLayerRef.current = null;
      weatherLayerRef.current = null;
      measurementLayerRef.current = null;
      locationMarkerRef.current = null;
      radarLayerRef.current = null;
      onMapReady?.(null);
    };
    // The initial center is intentionally used only for first map creation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = measurementLayerRef.current;
    if (!map || !group) return;
    if (measurementMode) {
      measurementModeRef.current = measurementMode;
      measurementPointsRef.current = [];
      group.clearLayers();
      map.doubleClickZoom.disable();
      onMeasurementStatusRef.current({ summary: "Click the map to add points", pointCount: 0, canFinish: false, hasMeasurement: false });
    } else {
      measurementModeRef.current = null;
      map.doubleClickZoom.enable();
    }
  }, [measurementMode]);

  useEffect(() => {
    if (!measurementAction) return;
    const map = mapRef.current;
    const group = measurementLayerRef.current;
    if (!map || !group) return;
    if (measurementAction.action === "clear") {
      measurementModeRef.current = null;
      measurementPointsRef.current = [];
      group.clearLayers();
      map.doubleClickZoom.enable();
      onMeasurementStatusRef.current({ summary: "", pointCount: 0, canFinish: false, hasMeasurement: false });
      return;
    }
    const mode = measurementModeRef.current;
    if (!mode) return;
    const points = measurementPointsRef.current;
    if (measurementAction.action === "undo") points.pop();
    if (measurementAction.action === "finish") {
      measurementModeRef.current = null;
      map.doubleClickZoom.enable();
      onMeasurementFinish();
    }
    group.clearLayers();
    points.forEach((point) => L.circleMarker(point, { radius: 4, color: "#fff", weight: 2, fillColor: "#2563eb", fillOpacity: 1 }).addTo(group));
    if (points.length > 1) {
      const path = mode === "area" && points.length > 2 ? [...points, points[0]] : points;
      (mode === "area" && points.length > 2
        ? L.polygon(path, { color: "#2563eb", weight: 3, fillColor: "#3b82f6", fillOpacity: 0.2, dashArray: "6 5" })
        : L.polyline(path, { color: "#2563eb", weight: 3, dashArray: "6 5" })
      ).addTo(group);
    }
    if (points.length) {
      const label = measurementLabel(points, mode);
      L.marker(points[points.length - 1], { icon: L.divIcon({ className: "live-measurement-label", html: `<span>${label}</span>`, iconSize: undefined, iconAnchor: [-8, 18] }), interactive: false }).addTo(group);
      onMeasurementStatusRef.current({ summary: label, pointCount: points.length, canFinish: points.length >= (mode === "distance" ? 2 : 3), hasMeasurement: true });
    } else {
      onMeasurementStatusRef.current({ summary: "Click the map to add points", pointCount: 0, canFinish: false, hasMeasurement: false });
    }
  }, [measurementAction, onMeasurementFinish]);

  useEffect(() => {
    locationMarkerRef.current?.setLatLng([location.latitude, location.longitude]);
    locationMarkerRef.current?.unbindTooltip();
    locationMarkerRef.current?.bindTooltip(location.name, { direction: "top", offset: [0, -8] });
  }, [location.latitude, location.longitude, location.name]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo([location.latitude, location.longitude], location.zoom ?? Math.max(map.getZoom(), 11), { duration: 0.7 });
  }, [location.latitude, location.longitude, location.zoom]);

  useEffect(() => {
    const map = mapRef.current;
    const baseLayers = baseLayersRef.current;
    if (!map || !baseLayers) return;
    (Object.keys(baseLayers) as MapMode[]).forEach((mode) => {
      if (map.hasLayer(baseLayers[mode])) map.removeLayer(baseLayers[mode]);
    });
    baseLayers[mapMode].addTo(map);
  }, [mapMode]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = baseLayersRef.current?.[mapMode];
    if (!map || !layer) return;
    let loadedTiles = 0;
    let errors = 0;
    let timeout: number | undefined;
    const loading = () => {
      loadedTiles = 0;
      errors = 0;
      onTileStatusRef.current?.("loading");
      if (timeout !== undefined) window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        onTileStatusRef.current?.(loadedTiles ? "ready" : "unavailable");
      }, 7000);
    };
    const ready = () => {
      loadedTiles += 1;
      onTileStatusRef.current?.("ready");
    };
    const failed = () => {
      errors += 1;
      if (!loadedTiles && errors >= 3) onTileStatusRef.current?.("unavailable");
    };
    const finished = () => {
      if (timeout !== undefined) window.clearTimeout(timeout);
      onTileStatusRef.current?.(loadedTiles ? "ready" : "unavailable");
    };
    layer.on("loading", loading);
    layer.on("load", finished);
    layer.on("tileload", ready);
    layer.on("tileerror", failed);
    loading();
    layer.redraw();
    return () => {
      if (timeout !== undefined) window.clearTimeout(timeout);
      layer.off("loading", loading);
      layer.off("load", finished);
      layer.off("tileload", ready);
      layer.off("tileerror", failed);
    };
  }, [mapMode, location.latitude, location.longitude, tileRefresh]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (radarVisible && radarTileUrl) {
      if (radarLayerRef.current) {
        radarLayerRef.current.setUrl(radarTileUrl);
      } else {
        radarLayerRef.current = L.tileLayer(radarTileUrl, {
          opacity: 0.67,
          maxZoom: 18,
          maxNativeZoom: 7,
          zIndex: 300,
          updateWhenIdle: true,
          updateWhenZooming: false,
          keepBuffer: 4,
          attribution: '<a href="https://www.rainviewer.com/" target="_blank" rel="noreferrer">RainViewer radar</a>',
        }).addTo(map);
      }
    }
  }, [radarTileUrl, radarVisible]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || radarVisible || !radarLayerRef.current) return;
    if (map.hasLayer(radarLayerRef.current)) map.removeLayer(radarLayerRef.current);
      radarLayerRef.current = null;
  }, [radarVisible]);

  useEffect(() => {
    radarLayerRef.current?.setOpacity(radarOpacity);
  }, [radarOpacity]);

  useEffect(() => {
    const group = featureLayersRef.current;
    if (!group) return;
    group.clearLayers();
    features.forEach((feature) => {
      if (!enabledLayers[feature.layer]) return;
      const icon = serviceIcon(feature);
      const marker = icon
        ? L.marker([feature.latitude, feature.longitude], { icon })
        : L.circleMarker([feature.latitude, feature.longitude], {
          radius: markerRadius(feature),
          color: "#fff",
          weight: 2,
          fillColor: markerColor(feature),
          fillOpacity: 0.95,
          bubblingMouseEvents: false,
        });
      marker.bindTooltip(feature.title, { direction: "top", offset: [0, -6], opacity: 0.95 });
      marker.bindPopup(featurePopup(feature, location), { maxWidth: 300 });
      marker.addTo(group);
    });
  }, [features, enabledLayers, location]);

  useEffect(() => {
    const group = riskLayerRef.current;
    if (!group) return;
    group.clearLayers();
    if (!riskZonesVisible) return;
    const latitudeStep = 0.28;
    weatherGrid.forEach((point) => {
      const estimate = estimateWeatherRisk(point.current);
      const longitudeStep = latitudeStep / Math.max(Math.cos(point.latitude * Math.PI / 180), 0.3);
      const color = riskColor(estimate.score);
      const cell = L.rectangle([
        [point.latitude - latitudeStep / 2, point.longitude - longitudeStep / 2],
        [point.latitude + latitudeStep / 2, point.longitude + longitudeStep / 2],
      ], {
        color,
        weight: 1,
        fillColor: color,
        fillOpacity: 0.18,
        opacity: 0.68,
        bubblingMouseEvents: false,
      });
      const popup = document.createElement("div");
      popup.className = "live-map-popup";
      addText(popup, "strong", "Weather-driven risk zone");
      addText(popup, "p", "Risk: " + estimate.level + " · " + estimate.score + "/100");
      addText(popup, "p", "Area: model sample near " + point.latitude.toFixed(3) + ", " + point.longitude.toFixed(3));
      addText(popup, "p", "Rainfall: " + point.current.precipitationMm.toFixed(1) + " mm");
      addText(popup, "p", "Factors: " + estimate.factors.join(", "));
      addText(popup, "p", "Updated: " + point.current.time);
      addText(popup, "p", "Model estimate only; no affected-population data is available.");
      cell.bindPopup(popup);
      cell.addTo(group);
    });
  }, [weatherGrid, riskZonesVisible]);

  useEffect(() => {
    const group = weatherLayerRef.current;
    if (!group) return;
    group.clearLayers();
    if (!weatherOverlay) return;
    weatherGrid.forEach((point) => {
      const div = document.createElement("div");
      div.className = "live-weather-cell";
      div.textContent = weatherCellText(point, weatherOverlay, forecastHours);
      const marker = L.marker([point.latitude, point.longitude], {
        icon: L.divIcon({ className: "live-weather-cell-icon", html: div, iconSize: [74, 28], iconAnchor: [37, 14] }),
        interactive: false,
      });
      marker.addTo(group);
    });
  }, [weatherGrid, weatherOverlay, forecastHours]);

  return <div ref={elementRef} className="live-situation-leaflet" aria-label="Interactive live weather and disaster map" role="application" />;
}
