export type FeatureLayer =
  | "incidents"
  | "alerts"
  | "shelters"
  | "hospitals"
  | "fire"
  | "police"
  | "responders"
  | "earthquakes"
  | "disasters";

export interface MapFeature {
  id: string;
  layer: FeatureLayer;
  title: string;
  detail: string;
  latitude: number;
  longitude: number;
  severity?: string;
  href?: string;
  values?: Array<{ label: string; value: string }>;
}

export interface Bulletin {
  id: string;
  href?: string;
  title: string;
  message: string;
  hazard: string;
  severity: string;
  targetArea?: string;
  startTime?: string;
  expiryTime?: string;
}

export interface FeedStatus {
  name: string;
  status: "available" | "unavailable";
  count: number;
  source: string;
}

export interface LiveSituationData {
  features: MapFeature[];
  bulletins: Bulletin[];
  feeds: FeedStatus[];
}

interface CoordinateRow {
  id?: number | string;
  latitude?: number | null;
  longitude?: number | null;
  name?: string;
  title?: string;
  type?: string;
  description?: string;
  address?: string;
  status?: string;
  operationalStatus?: string;
  severity?: string;
  priority?: string;
  occupancy?: number;
  capacity?: number;
  totalWardBeds?: number;
  availableWardBeds?: number;
  totalIcuBeds?: number;
  availableIcuBeds?: number;
  unitCode?: string;
  unitName?: string;
  agencyType?: string;
  batteryPercentage?: number;
  assignedIncidentCode?: string;
  assignedResponder?: string;
  assignedShelter?: string;
  peopleAffected?: number;
  createdAt?: string;
  startTime?: string;
  expiryTime?: string;
  message?: string;
  disasterType?: string;
  targetArea?: string;
}

interface GeoJsonFeature {
  type?: string;
  geometry?: {
    type?: string;
    coordinates?: unknown;
  } | null;
  properties?: Record<string, unknown> | null;
}

interface GeoJsonResponse {
  features?: GeoJsonFeature[];
  isRealApiData?: boolean;
  dataSource?: string;
}

const apiBaseUrl = "";

function requestSignal(signal: AbortSignal): AbortSignal {
  return AbortSignal.any([signal, AbortSignal.timeout(10_000)]);
}

function isCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function pointFeature(
  row: CoordinateRow,
  layer: FeatureLayer,
  title: string,
  detail: string,
  values?: MapFeature["values"],
): MapFeature | null {
  if (!isCoordinate(row.latitude) || !isCoordinate(row.longitude)) return null;
  return {
    id: layer + "-" + String(row.id ?? row.unitCode ?? title),
    layer,
    title,
    detail,
    latitude: row.latitude,
    longitude: row.longitude,
    severity: row.severity || row.priority || row.status,
    values,
  };
}

async function fetchJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(apiBaseUrl + path, {
    signal: requestSignal(signal),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Java API returned " + response.status + " for " + path);
  return response.json() as Promise<T>;
}

function geoPoint(geometry: GeoJsonFeature["geometry"]): { longitude: number; latitude: number } | null {
  if (!geometry?.coordinates) return null;
  const coordinates = geometry.coordinates;
  if (geometry.type === "Point" && Array.isArray(coordinates)) {
    const longitude = coordinates[0];
    const latitude = coordinates[1];
    return isCoordinate(latitude) && isCoordinate(longitude) ? { latitude, longitude } : null;
  }
  if (geometry.type === "Polygon" && Array.isArray(coordinates) && Array.isArray(coordinates[0])) {
    const ring = coordinates[0].filter((entry): entry is number[] => Array.isArray(entry) && isCoordinate(entry[0]) && isCoordinate(entry[1]));
    if (!ring.length) return null;
    const total = ring.reduce((result, coordinate) => ({ longitude: result.longitude + coordinate[0], latitude: result.latitude + coordinate[1] }), { longitude: 0, latitude: 0 });
    return { longitude: total.longitude / ring.length, latitude: total.latitude / ring.length };
  }
  if (geometry.type === "MultiPolygon" && Array.isArray(coordinates) && Array.isArray(coordinates[0]) && Array.isArray(coordinates[0][0])) {
    return geoPoint({ type: "Polygon", coordinates: coordinates[0] });
  }
  return null;
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function readEarthquakes(response: GeoJsonResponse): MapFeature[] {
  return (response.features || []).flatMap((feature, index) => {
    const coordinate = geoPoint(feature.geometry);
    const properties = feature.properties || {};
    if (!coordinate) return [];
    const magnitude = typeof properties.mag === "number" ? properties.mag : null;
    const title = stringValue(properties.title, "Earthquake");
    return [{
      id: "earthquake-" + String(properties.code ?? index),
      layer: "earthquakes" as const,
      title,
      detail: magnitude == null ? "USGS earthquake feed" : "Magnitude " + magnitude.toFixed(1) + " · USGS",
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      severity: magnitude != null && magnitude >= 5 ? "HIGH" : magnitude != null && magnitude >= 3 ? "MODERATE" : "LOW",
      values: [
        { label: "Magnitude", value: magnitude == null ? "Not reported" : magnitude.toFixed(1) },
        { label: "Place", value: stringValue(properties.place, "Location not reported") },
        { label: "Reported", value: typeof properties.time === "number" ? new Date(properties.time).toLocaleString() : "Not reported" },
      ],
    }];
  });
}

function readDisasters(response: GeoJsonResponse): MapFeature[] {
  return (response.features || []).flatMap((feature, index) => {
    const coordinate = geoPoint(feature.geometry);
    const properties = feature.properties || {};
    if (!coordinate) return [];
    const title = stringValue(properties.name, stringValue(properties.eventname, stringValue(properties.eventtype, "Disaster event")));
    const alert = stringValue(properties.alertlevel, stringValue(properties.alert, "Reported event"));
    const country = stringValue(properties.country, "");
    return [{
      id: "gdacs-" + String(properties.eventid ?? index),
      layer: "disasters" as const,
      title,
      detail: [alert, country, "GDACS"].filter(Boolean).join(" · "),
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      severity: alert,
      values: [
        { label: "Feed", value: "GDACS" },
        { label: "Alert level", value: alert },
        { label: "Country", value: country || "Not reported" },
      ],
    }];
  });
}

export async function getLiveSituationData(signal: AbortSignal): Promise<LiveSituationData> {
  const requests = await Promise.allSettled([
    fetchJson<CoordinateRow[]>("/api/incidents", signal),
    fetchJson<CoordinateRow[]>("/api/alerts", signal),
    fetchJson<CoordinateRow[]>("/api/shelters", signal),
    fetchJson<CoordinateRow[]>("/api/hospitals", signal),
    fetchJson<CoordinateRow[]>("/api/responders", signal),
    fetchJson<GeoJsonResponse>("/api/weather/disasters", signal),
    fetchJson<GeoJsonResponse>("/api/weather/earthquakes", signal),
  ]);
  if (signal.aborted) throw new DOMException("Request cancelled", "AbortError");

  const features: MapFeature[] = [];
  const feeds: FeedStatus[] = [];
  const getRows = (index: number, label: string, source: string): CoordinateRow[] => {
    const result = requests[index];
    if (result.status !== "fulfilled" || !Array.isArray(result.value)) {
      feeds.push({ name: label, status: "unavailable", count: 0, source });
      return [];
    }
    feeds.push({ name: label, status: "available", count: result.value.length, source });
    return result.value;
  };

  for (const row of getRows(0, "Incidents", "Project Java API")) {
    const title = row.type || row.title || "Incident";
    const feature = pointFeature(row, "incidents", title, row.description || row.status || "Reported incident", [
      { label: "Severity", value: row.severity || "Not provided" },
      { label: "Priority", value: row.priority || "Not provided" },
      { label: "Status", value: row.status || "Not provided" },
      ...(row.peopleAffected == null ? [] : [{ label: "People affected", value: String(row.peopleAffected) }]),
      ...(row.assignedResponder ? [{ label: "Assigned team", value: row.assignedResponder }] : []),
      ...(row.assignedShelter ? [{ label: "Nearest shelter", value: row.assignedShelter }] : []),
      ...(row.createdAt ? [{ label: "Reported", value: new Date(row.createdAt).toLocaleString() }] : []),
    ]);
    if (feature) features.push({ ...feature, href: "/incidents/" + String(row.id || "") });
  }

  const alertRows = getRows(1, "Operational alerts", "Project Java API");
  const activeAlertRows = alertRows.filter((row) => !row.expiryTime || new Date(row.expiryTime).getTime() > Date.now());
  for (const row of activeAlertRows) {
    const feature = pointFeature(row, "alerts", row.title || "Operational alert", row.message || row.targetArea || "Alert location", [
      { label: "Severity", value: row.severity || "Unspecified" },
      { label: "Affected area", value: row.targetArea || "Not reported" },
      ...(row.startTime ? [{ label: "Issued", value: new Date(row.startTime).toLocaleString() }] : []),
    ]);
    if (feature) features.push({ ...feature, href: row.id == null ? "/alerts" : "/alerts/" + String(row.id) });
  }

  const bulletins = activeAlertRows.map((row) => ({
    id: String(row.id || row.title || row.startTime || row.message || "operational-alert"),
      href: row.id == null ? "/alerts" : "/alerts/" + String(row.id),
      title: row.title || "Operational alert",
      message: row.message || "No message supplied",
      hazard: row.disasterType || "General",
      severity: row.severity || "Unspecified",
      targetArea: row.targetArea,
      startTime: row.startTime,
      expiryTime: row.expiryTime,
    }));

  for (const row of getRows(2, "Shelters", "Project Java API")) {
    const availablePlaces = row.capacity == null || row.occupancy == null ? null : Math.max(0, row.capacity - row.occupancy);
    const feature = pointFeature(row, "shelters", row.name || "Shelter", row.address || row.status || "Shelter location", [
      { label: "Occupancy", value: row.occupancy == null ? "Not reported" : String(row.occupancy) },
      { label: "Capacity", value: row.capacity == null ? "Not reported" : String(row.capacity) },
      ...(availablePlaces == null ? [] : [{ label: "Available places", value: String(availablePlaces) }]),
      { label: "Status", value: row.status || "Not reported" },
    ]);
    if (feature) features.push({ ...feature, href: row.id == null ? undefined : "/shelters/" + String(row.id) });
  }

  for (const row of getRows(3, "Hospitals", "Project Java API")) {
    const status = row.operationalStatus || row.status;
    const feature = pointFeature({ ...row, status }, "hospitals", row.name || "Hospital", row.address || status || "Hospital location", [
      { label: "Ward beds free", value: row.availableWardBeds == null ? "Not reported" : String(row.availableWardBeds) },
      { label: "ICU beds free", value: row.availableIcuBeds == null ? "Not reported" : String(row.availableIcuBeds) },
      { label: "Status", value: status || "Not reported" },
    ]);
    if (feature) features.push({ ...feature, href: row.id == null ? undefined : "/emergency-map" });
  }

  for (const row of getRows(4, "Response units", "Project Java API")) {
    const agency = (row.agencyType || "").toUpperCase();
    const layer: FeatureLayer = agency.includes("FIRE") ? "fire" : agency.includes("POLICE") ? "police" : "responders";
    const title = row.unitName || row.unitCode || row.name || "Response unit";
    const feature = pointFeature(row, layer, title, [row.agencyType, row.status].filter(Boolean).join(" · ") || "Response unit", [
      { label: "Agency", value: row.agencyType || "Not reported" },
      { label: "Status", value: row.status || "Not reported" },
      ...(row.batteryPercentage == null ? [] : [{ label: "Battery", value: row.batteryPercentage + "%" }]),
      ...(row.assignedIncidentCode ? [{ label: "Assigned incident", value: row.assignedIncidentCode }] : []),
    ]);
    if (feature) features.push({ ...feature, href: "/responders" });
  }

  const disasterResult = requests[5];
  if (disasterResult.status === "fulfilled" && disasterResult.value.isRealApiData) {
    const events = readDisasters(disasterResult.value);
    features.push(...events);
    feeds.push({ name: "GDACS events", status: "available", count: events.length, source: disasterResult.value.dataSource || "GDACS" });
  } else {
    feeds.push({ name: "GDACS events", status: "unavailable", count: 0, source: "GDACS" });
  }

  const earthquakeResult = requests[6];
  if (earthquakeResult.status === "fulfilled" && earthquakeResult.value.isRealApiData) {
    const events = readEarthquakes(earthquakeResult.value);
    features.push(...events);
    feeds.push({ name: "Earthquakes", status: "available", count: events.length, source: earthquakeResult.value.dataSource || "USGS" });
  } else {
    feeds.push({ name: "Earthquakes", status: "unavailable", count: 0, source: "USGS" });
  }

  return { features, bulletins, feeds };
}
