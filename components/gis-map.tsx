"use client";

import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";

type LayerName = "incidents" | "shelters" | "hospitals" | "responders";
interface MapPoint { id: string; title: string; description: string; latitude: number; longitude: number; layer: LayerName; }
interface CoordinateRecord { id: number; name?: string; type?: string; description?: string; address?: string; latitude?: number; longitude?: number; status?: string; severity?: string; }

const layerColors: Record<LayerName, string> = { incidents: "#DC2626", shelters: "#16A34A", hospitals: "#7C3AED", responders: "#2563EB" };
const layerLabels: Record<LayerName, string> = { incidents: "Incidents", shelters: "Shelters", hospitals: "Hospitals", responders: "Response teams" };

export function GisMap() {
  const elementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupsRef = useRef<Record<LayerName, L.LayerGroup> | null>(null);
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [enabled, setEnabled] = useState<Record<LayerName, boolean>>({ incidents: true, shelters: true, hospitals: true, responders: true });
  const [search, setSearch] = useState("");
  const [locationMessage, setLocationMessage] = useState("");
  const [dataMessage, setDataMessage] = useState("Loading operational locations…");
  const apiBaseUrl = "";

  useEffect(() => {
    if (!elementRef.current || mapRef.current) return;
    const map = L.map(elementRef.current, { zoomControl: true, attributionControl: false }).setView([17.385, 78.4867], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
    const groups: Record<LayerName, L.LayerGroup> = { incidents: L.layerGroup().addTo(map), shelters: L.layerGroup().addTo(map), hospitals: L.layerGroup().addTo(map), responders: L.layerGroup().addTo(map) };
    mapRef.current = map;
    layerGroupsRef.current = groups;
    return () => { map.remove(); mapRef.current = null; layerGroupsRef.current = null; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const fetchLayer = async (path: string, layer: LayerName): Promise<MapPoint[]> => {
      const response = await fetch(`${apiBaseUrl}${path}`, { signal: controller.signal });
      if (!response.ok) throw new Error("Location service unavailable");
      const rows: CoordinateRecord[] = await response.json();
      return rows.filter((row) => Number.isFinite(row.latitude) && Number.isFinite(row.longitude)).map((row) => ({ id: `${layer}-${row.id}`, title: row.name || row.type || layerLabels[layer], description: row.address || row.description || row.status || "Operational location", latitude: row.latitude!, longitude: row.longitude!, layer }));
    };
    const paths: Array<[string, LayerName]> = [
      ["/api/incidents", "incidents"], ["/api/shelters", "shelters"],
      ["/api/hospitals", "hospitals"], ["/api/responders", "responders"],
    ];
    Promise.allSettled(paths.map(([path, layer]) => fetchLayer(path, layer)))
      .then((results) => {
      if (controller.signal.aborted) return;
      const loaded = results.filter((result): result is PromiseFulfilledResult<MapPoint[]> => result.status === "fulfilled").flatMap((result) => result.value);
      const failed = results.flatMap((result, index) => result.status === "rejected" ? [layerLabels[paths[index][1]]] : []);
      setPoints(loaded);
      setDataMessage(loaded.length
        ? `${loaded.length} locations from the Java API${failed.length ? ` · unavailable: ${failed.join(", ")}` : ""}`
        : failed.length ? "Cannot load map locations. Check the API connection and try again."
          : "No mapped locations have coordinates yet.");
    }).catch(() => {
      if (!controller.signal.aborted) setDataMessage("Cannot load map locations. Check the API connection and try again.");
    });
    return () => controller.abort();
  }, [apiBaseUrl]);

  useEffect(() => {
    if (!layerGroupsRef.current) return;
    (Object.keys(layerGroupsRef.current) as LayerName[]).forEach((layer) => layerGroupsRef.current?.[layer].clearLayers());
    const query = search.trim().toLowerCase();
    points.filter((point) => enabled[point.layer] && (!query || `${point.title} ${point.description}`.toLowerCase().includes(query))).forEach((point) => {
      const circle = L.circleMarker([point.latitude, point.longitude], { radius: point.layer === "incidents" ? 9 : 7, color: "#fff", weight: 2, fillColor: layerColors[point.layer], fillOpacity: 0.95 });
      const content = document.createElement("div");
      const title = document.createElement("strong"); title.textContent = point.title;
      const detail = document.createElement("p"); detail.textContent = point.description;
      content.append(title, detail);
      circle.bindPopup(content);
      circle.addTo(layerGroupsRef.current![point.layer]);
    });
  }, [points, enabled, search]);

  const findMyLocation = () => {
    if (!navigator.geolocation) { setLocationMessage("Location is unavailable on this device."); return; }
    navigator.geolocation.getCurrentPosition(({ coords }) => { mapRef.current?.setView([coords.latitude, coords.longitude], 14); L.circleMarker([coords.latitude, coords.longitude], { radius: 8, color: "#fff", weight: 2, fillColor: "#0B1F4B", fillOpacity: 1 }).addTo(mapRef.current!).bindPopup("Your current location").openPopup(); setLocationMessage("Centered on your current location."); }, () => setLocationMessage("Location permission was not available."), { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 });
  };

  return <div className="space-y-1">
    <div className="relative isolate h-[min(68vh,720px)] min-h-[420px] overflow-hidden rounded-xl">
    <div ref={elementRef} className="absolute inset-0 z-0" aria-label="Map of emergency incidents and services" />
    <div className="absolute left-3 top-3 z-10 w-[min(20rem,calc(100%-1.5rem))] rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
      <label htmlFor="map-search" className="sr-only">Search locations on map</label>
      <input id="map-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search locations…" className="min-h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-600" />
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">{(Object.keys(layerLabels) as LayerName[]).map((layer) => <label key={layer} className="flex min-h-9 items-center gap-2 text-xs text-slate-700"><input type="checkbox" checked={enabled[layer]} onChange={(event) => setEnabled((current) => ({ ...current, [layer]: event.target.checked }))} /><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: layerColors[layer] }} />{layerLabels[layer]}</label>)}</div>
      <button onClick={findMyLocation} className="mt-2 min-h-11 w-full rounded-lg bg-blue-50 px-3 text-xs font-bold text-blue-700 hover:bg-blue-100">Use my location</button>
      {locationMessage && <p role="status" className="mt-1 text-[11px] text-slate-600">{locationMessage}</p>}
      <p className="mt-2 text-[10px] text-slate-500" role="status">{dataMessage}</p>
    </div>
    <div className="absolute bottom-3 right-3 z-10 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-[10px] text-slate-600 shadow"><div className="font-bold text-slate-800">Map legend</div>{(Object.keys(layerLabels) as LayerName[]).map((layer) => <div key={layer} className="mt-1 flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: layerColors[layer] }} />{layerLabels[layer]}</div>)}</div>
    </div>
    <p className="px-1 text-right text-[10px] text-slate-500">Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline decoration-slate-300 underline-offset-2 hover:text-slate-700">OpenStreetMap contributors</a></p>
  </div>;
}
