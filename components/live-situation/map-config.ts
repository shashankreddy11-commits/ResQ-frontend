import type { FeatureLayer } from "@/lib/live-situation-data";

export const layerLabels: Record<FeatureLayer, string> = {
  incidents: "Incidents",
  alerts: "Alerts",
  shelters: "Shelters",
  hospitals: "Hospitals",
  fire: "Fire response units",
  police: "Police response units",
  responders: "Response teams",
  earthquakes: "USGS earthquakes",
  disasters: "GDACS events",
};

export const layerOrder: FeatureLayer[] = [
  "incidents",
  "alerts",
  "shelters",
  "hospitals",
  "fire",
  "police",
  "responders",
  "earthquakes",
  "disasters",
];

export const layerGroups: Array<{ label: string; layers: FeatureLayer[] }> = [
  { label: "Disaster", layers: ["incidents", "alerts", "earthquakes", "disasters"] },
  { label: "Emergency services", layers: ["shelters", "hospitals", "fire", "police", "responders"] },
];

export const layerColors: Record<FeatureLayer, string> = {
  incidents: "#dc2626",
  alerts: "#1677ff",
  shelters: "#16a34a",
  hospitals: "#7c3aed",
  fire: "#ea580c",
  police: "#2563eb",
  responders: "#0ea5e9",
  earthquakes: "#be123c",
  disasters: "#d97706",
};
