"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { getLiveWeather, getLiveWeatherBatch, type LiveWeatherSnapshot } from "@/lib/live-weather";

interface WeatherPlace {
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  climate?: string;
  weather?: LiveWeatherSnapshot;
}

const indiaPlaces: WeatherPlace[] = [
  { id: "andhra-pradesh", name: "Amaravati", region: "Andhra Pradesh, India", latitude: 16.5062, longitude: 80.648 },
  { id: "arunachal-pradesh", name: "Itanagar", region: "Arunachal Pradesh, India", latitude: 27.0844, longitude: 93.6053 },
  { id: "assam", name: "Guwahati", region: "Assam, India", latitude: 26.1445, longitude: 91.7362 },
  { id: "bihar", name: "Patna", region: "Bihar, India", latitude: 25.5941, longitude: 85.1376 },
  { id: "chhattisgarh", name: "Raipur", region: "Chhattisgarh, India", latitude: 21.2514, longitude: 81.6296 },
  { id: "goa", name: "Panaji", region: "Goa, India", latitude: 15.4909, longitude: 73.8278 },
  { id: "gujarat", name: "Ahmedabad", region: "Gujarat, India", latitude: 23.0225, longitude: 72.5714 },
  { id: "haryana", name: "Gurugram", region: "Haryana, India", latitude: 28.4595, longitude: 77.0266 },
  { id: "himachal-pradesh", name: "Shimla", region: "Himachal Pradesh, India", latitude: 31.1048, longitude: 77.1734 },
  { id: "jharkhand", name: "Ranchi", region: "Jharkhand, India", latitude: 23.3441, longitude: 85.3096 },
  { id: "karnataka", name: "Bengaluru", region: "Karnataka, India", latitude: 12.9716, longitude: 77.5946 },
  { id: "kerala", name: "Thiruvananthapuram", region: "Kerala, India", latitude: 8.5241, longitude: 76.9366 },
  { id: "madhya-pradesh", name: "Bhopal", region: "Madhya Pradesh, India", latitude: 23.2599, longitude: 77.4126 },
  { id: "maharashtra", name: "Mumbai", region: "Maharashtra, India", latitude: 19.076, longitude: 72.8777 },
  { id: "manipur", name: "Imphal", region: "Manipur, India", latitude: 24.817, longitude: 93.9368 },
  { id: "meghalaya", name: "Shillong", region: "Meghalaya, India", latitude: 25.5788, longitude: 91.8933 },
  { id: "mizoram", name: "Aizawl", region: "Mizoram, India", latitude: 23.7271, longitude: 92.7176 },
  { id: "nagaland", name: "Kohima", region: "Nagaland, India", latitude: 25.6751, longitude: 94.1086 },
  { id: "odisha", name: "Bhubaneswar", region: "Odisha, India", latitude: 20.2961, longitude: 85.8245 },
  { id: "punjab", name: "Amritsar", region: "Punjab, India", latitude: 31.634, longitude: 74.8723 },
  { id: "rajasthan", name: "Jaipur", region: "Rajasthan, India", latitude: 26.9124, longitude: 75.7873 },
  { id: "rajasthan-desert", name: "Jaisalmer", region: "Rajasthan, Thar Desert, India", latitude: 26.9157, longitude: 70.9083, climate: "Thar Desert - arid region" },
  { id: "sikkim", name: "Gangtok", region: "Sikkim, India", latitude: 27.3389, longitude: 88.6065 },
  { id: "tamil-nadu", name: "Chennai", region: "Tamil Nadu, India", latitude: 13.0827, longitude: 80.2707 },
  { id: "telangana", name: "Hyderabad", region: "Telangana, India", latitude: 17.385, longitude: 78.4867 },
  { id: "mahabubnagar", name: "Mahabubnagar", region: "Telangana, India", latitude: 16.737, longitude: 78.003 },
  { id: "tripura", name: "Agartala", region: "Tripura, India", latitude: 23.8315, longitude: 91.2868 },
  { id: "uttar-pradesh", name: "Lucknow", region: "Uttar Pradesh, India", latitude: 26.8467, longitude: 80.9462 },
  { id: "uttarakhand", name: "Dehradun", region: "Uttarakhand, India", latitude: 30.3165, longitude: 78.0322 },
  { id: "west-bengal", name: "Kolkata", region: "West Bengal, India", latitude: 22.5726, longitude: 88.3639 },
  { id: "andaman-nicobar", name: "Port Blair", region: "Andaman and Nicobar Islands, India", latitude: 11.6234, longitude: 92.7265 },
  { id: "chandigarh", name: "Chandigarh", region: "Chandigarh, India", latitude: 30.7333, longitude: 76.7794 },
  { id: "dadra-nagar-haveli-daman-diu", name: "Daman", region: "Dadra and Nagar Haveli and Daman and Diu, India", latitude: 20.3974, longitude: 72.8328 },
  { id: "delhi", name: "New Delhi", region: "National Capital Territory of Delhi, India", latitude: 28.6139, longitude: 77.209 },
  { id: "jammu-kashmir", name: "Srinagar", region: "Jammu and Kashmir, India", latitude: 34.0837, longitude: 74.7973 },
  { id: "ladakh", name: "Leh", region: "Ladakh, India", latitude: 34.1526, longitude: 77.5771 },
  { id: "lakshadweep", name: "Kavaratti", region: "Lakshadweep, India", latitude: 10.5667, longitude: 72.6417 },
  { id: "puducherry", name: "Puducherry", region: "Puducherry, India", latitude: 11.9416, longitude: 79.8083 },
];

const globalPlaces: WeatherPlace[] = [
  { id: "cairo", name: "Cairo", region: "Egypt", latitude: 30.0444, longitude: 31.2357 },
  { id: "london", name: "London", region: "United Kingdom", latitude: 51.5072, longitude: -0.1276 },
  { id: "tokyo", name: "Tokyo", region: "Japan", latitude: 35.6762, longitude: 139.6503 },
  { id: "new-york", name: "New York", region: "United States", latitude: 40.7128, longitude: -74.006 },
  { id: "sydney", name: "Sydney", region: "Australia", latitude: -33.8688, longitude: 151.2093 },
  { id: "nairobi", name: "Nairobi", region: "Kenya", latitude: -1.2921, longitude: 36.8219 },
  { id: "sao-paulo", name: "Sao Paulo", region: "Brazil", latitude: -23.5505, longitude: -46.6333 },
  { id: "beijing", name: "Beijing", region: "China", latitude: 39.9042, longitude: 116.4074 },
];

const featuredPlaces = [...indiaPlaces, ...globalPlaces];

// Telangana district headquarters and nearby cities let residents inspect more than the state-capital reading.
// Weather for these extra locations is fetched on demand to keep the initial live batch small.
const telanganaPlaces: WeatherPlace[] = [
  { id: "tg-adilabad", name: "Adilabad", region: "Telangana, India", latitude: 19.6641, longitude: 78.532 },
  { id: "tg-bhadradri", name: "Kothagudem", region: "Telangana, India", latitude: 17.5515, longitude: 80.6198 },
  { id: "tg-hanumakonda", name: "Hanumakonda", region: "Telangana, India", latitude: 18.0001, longitude: 79.5881 },
  { id: "tg-jagtial", name: "Jagtial", region: "Telangana, India", latitude: 18.794, longitude: 78.9165 },
  { id: "tg-jangaon", name: "Jangaon", region: "Telangana, India", latitude: 17.726, longitude: 79.152 },
  { id: "tg-jayashankar", name: "Bhupalpally", region: "Telangana, India", latitude: 18.4386, longitude: 79.8633 },
  { id: "tg-jogulamba", name: "Gadwal", region: "Telangana, India", latitude: 16.23, longitude: 77.8 },
  { id: "tg-kamareddy", name: "Kamareddy", region: "Telangana, India", latitude: 18.3215, longitude: 78.3347 },
  { id: "tg-karimnagar", name: "Karimnagar", region: "Telangana, India", latitude: 18.4386, longitude: 79.1288 },
  { id: "tg-khammam", name: "Khammam", region: "Telangana, India", latitude: 17.2473, longitude: 80.1514 },
  { id: "tg-kumuram-bheem", name: "Asifabad", region: "Telangana, India", latitude: 19.3585, longitude: 79.2891 },
  { id: "tg-mahabubabad", name: "Mahabubabad", region: "Telangana, India", latitude: 17.5973, longitude: 80.002 },
  { id: "tg-mancherial", name: "Mancherial", region: "Telangana, India", latitude: 18.8714, longitude: 79.4443 },
  { id: "tg-medak", name: "Medak", region: "Telangana, India", latitude: 18.0453, longitude: 78.2608 },
  { id: "tg-medchal", name: "Medchal", region: "Telangana, India", latitude: 17.6299, longitude: 78.4814 },
  { id: "tg-mulugu", name: "Mulugu", region: "Telangana, India", latitude: 18.1904, longitude: 79.9436 },
  { id: "tg-nagarkurnool", name: "Nagarkurnool", region: "Telangana, India", latitude: 16.4821, longitude: 78.3247 },
  { id: "tg-nalgonda", name: "Nalgonda", region: "Telangana, India", latitude: 17.0575, longitude: 79.269 },
  { id: "tg-narayanpet", name: "Narayanpet", region: "Telangana, India", latitude: 16.747, longitude: 77.495 },
  { id: "tg-nirmal", name: "Nirmal", region: "Telangana, India", latitude: 19.096, longitude: 78.344 },
  { id: "tg-nizamabad", name: "Nizamabad", region: "Telangana, India", latitude: 18.6725, longitude: 78.0941 },
  { id: "tg-peddapalli", name: "Peddapalli", region: "Telangana, India", latitude: 18.6132, longitude: 79.3744 },
  { id: "tg-rajanna-sircilla", name: "Sircilla", region: "Telangana, India", latitude: 18.388, longitude: 78.8106 },
  { id: "tg-rangareddy", name: "Shamshabad", region: "Telangana, India", latitude: 17.2627, longitude: 78.3965 },
  { id: "tg-sangareddy", name: "Sangareddy", region: "Telangana, India", latitude: 17.6248, longitude: 78.0867 },
  { id: "tg-siddipet", name: "Siddipet", region: "Telangana, India", latitude: 18.1018, longitude: 78.852 },
  { id: "tg-suryapet", name: "Suryapet", region: "Telangana, India", latitude: 17.1405, longitude: 79.6236 },
  { id: "tg-vikarabad", name: "Vikarabad", region: "Telangana, India", latitude: 17.3381, longitude: 77.9044 },
  { id: "tg-wanaparthy", name: "Wanaparthy", region: "Telangana, India", latitude: 16.3623, longitude: 78.0622 },
  { id: "tg-warangal", name: "Warangal", region: "Telangana, India", latitude: 17.9689, longitude: 79.5941 },
  { id: "tg-yadadri", name: "Bhongir", region: "Telangana, India", latitude: 17.5154, longitude: 78.8856 },
];

const nearbyStateCities: WeatherPlace[] = [
  { id: "ap-kurnool", name: "Kurnool", region: "Andhra Pradesh, India", latitude: 15.8281, longitude: 78.0373 },
  { id: "ap-vijayawada", name: "Vijayawada", region: "Andhra Pradesh, India", latitude: 16.5062, longitude: 80.648 },
  { id: "ka-raichur", name: "Raichur", region: "Karnataka, India", latitude: 16.2076, longitude: 77.3463 },
  { id: "ka-kalaburagi", name: "Kalaburagi", region: "Karnataka, India", latitude: 17.3297, longitude: 76.8343 },
  { id: "ka-bidar", name: "Bidar", region: "Karnataka, India", latitude: 17.9133, longitude: 77.5301 },
  { id: "mh-nanded", name: "Nanded", region: "Maharashtra, India", latitude: 19.1383, longitude: 77.321 },
  { id: "mh-chandrapur", name: "Chandrapur", region: "Maharashtra, India", latitude: 19.9615, longitude: 79.2961 },
  { id: "mh-gadchiroli", name: "Gadchiroli", region: "Maharashtra, India", latitude: 20.182, longitude: 80.003 },
  { id: "mh-nagpur", name: "Nagpur", region: "Maharashtra, India", latitude: 21.1458, longitude: 79.0882 },
];

const locationCatalog = [...featuredPlaces, ...telanganaPlaces, ...nearbyStateCities];

function distanceKm(a: WeatherPlace, b: WeatherPlace) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latDelta = radians(b.latitude - a.latitude);
  const lonDelta = radians(b.longitude - a.longitude);
  const value = Math.sin(latDelta / 2) ** 2
    + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(lonDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function markerColor(weather?: LiveWeatherSnapshot) {
  if (!weather) return "#94A3B8";
  if ((weather.precipitationRateMmHr ?? 0) >= 10) return "#2563EB";
  if ((weather.windSpeedKmh ?? 0) >= 60) return "#7C3AED";
  if ((weather.temperatureC ?? 0) >= 38) return "#DC2626";
  if ((weather.temperatureC ?? 0) >= 32) return "#F59E0B";
  return "#16A34A";
}

function currentInsight(weather?: LiveWeatherSnapshot) {
  if (!weather || typeof weather.temperatureC !== "number") {
    return "Live conditions are not available for this location right now.";
  }
  const rain = weather.precipitationRateMmHr ?? 0;
  const wind = weather.windSpeedKmh ?? 0;
  const temperature = weather.temperatureC;
  const humidity = weather.humidityPercent;
  if (rain >= 20) return `Heavy rain is being observed (${rain.toFixed(1)} mm/h). Avoid flooded roads and monitor local advisories.`;
  if (wind >= 60) return `Strong winds are being observed (${wind.toFixed(0)} km/h). Secure loose outdoor objects and follow local advice.`;
  if (temperature >= 40) return `Very hot conditions are being observed (${temperature.toFixed(1)}°C). Limit midday exposure and drink water.`;
  if (temperature >= 35 && humidity != null && humidity < 30) return `Hot, dry conditions are being observed (${temperature.toFixed(1)}°C, ${humidity}% humidity). Take heat precautions.`;
  if (rain >= 5) return `Rain is being observed (${rain.toFixed(1)} mm/h). Check local updates before travelling through low-lying areas.`;
  return `${weather.conditionText} conditions are being observed at ${temperature.toFixed(1)}°C. No high rain or wind signal appears in this reading.`;
}

function weatherIconSvg(condition?: string) {
  const label = (condition || "").toLowerCase();
  if (label.includes("thunder")) return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16h11a4 4 0 0 0 .2-8 6 6 0 0 0-11.5 1A3.5 3.5 0 0 0 6 16Z"/><path d="m13 13-3 5h3l-1 4 4-6h-3l1-3Z"/></svg>';
  if (label.includes("rain") || label.includes("drizzle")) return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 14h11a4 4 0 0 0 .2-8 6 6 0 0 0-11.5 1A3.5 3.5 0 0 0 6 14Z"/><path d="m8 17-1 2m6-2-1 2m6-2-1 2"/></svg>';
  if (label.includes("snow") || label.includes("sleet")) return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 13h11a4 4 0 0 0 .2-8 6 6 0 0 0-11.5 1A3.5 3.5 0 0 0 6 13Z"/><path d="M8 17v4m-2-2h4m6-2v4m-2-2h4"/></svg>';
  if (label.includes("cloud") || label.includes("overcast") || label.includes("fog")) return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 17h11a4 4 0 0 0 .2-8 6 6 0 0 0-11.5 1A3.5 3.5 0 0 0 6 17Z"/><path d="M5 20h13"/></svg>';
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
}

function weatherDivIcon(L: typeof import("leaflet"), place: WeatherPlace, isSelected: boolean) {
  const imageUrl = place.weather?.weatherIconUrl;
  const safeGoogleIcon = imageUrl?.startsWith("https://maps.gstatic.com/weather/v1/") ? imageUrl : undefined;
  const iconMarkup = safeGoogleIcon
    ? `<img src="${safeGoogleIcon}" alt="" width="21" height="21" />`
    : `<span class="weather-condition-svg">${weatherIconSvg(place.weather?.conditionText)}</span>`;
  const color = markerColor(place.weather);
  return L.divIcon({
    className: "weather-condition-marker",
    html: `<span class="weather-condition-marker__badge${isSelected ? " weather-condition-marker__badge--selected" : ""}" style="--marker-color:${color}">${iconMarkup}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function WeatherMapCanvas({
  places,
  selectedPlace,
  onMapPoint,
  onPlaceSelect,
}: {
  places: WeatherPlace[];
  selectedPlace: WeatherPlace | null;
  onMapPoint: (latitude: number, longitude: number) => void;
  onPlaceSelect: (place: WeatherPlace) => void;
}) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const placeLayer = useRef<Leaflet.LayerGroup | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const lastSelectedId = useRef<string | null>(null);
  const clickHandler = useRef(onMapPoint);
  const selectHandler = useRef(onPlaceSelect);

  useEffect(() => {
    clickHandler.current = onMapPoint;
    selectHandler.current = onPlaceSelect;
  }, [onMapPoint, onPlaceSelect]);

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;
    let disposed = false;
    void import("leaflet").then((L) => {
      if (disposed || !mapElement.current) return;
      const map = L.map(mapElement.current, { worldCopyJump: true, minZoom: 2, maxZoom: 10, zoomControl: false, attributionControl: false }).setView([22, 8], 2);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      const markers = L.layerGroup().addTo(map);
      map.on("click", (event) => clickHandler.current(event.latlng.lat, event.latlng.lng));
      leafletRef.current = L;
      mapRef.current = map;
      placeLayer.current = markers;
      setMapReady(true);
    });
    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
      placeLayer.current = null;
      leafletRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = placeLayer.current;
    if (!mapReady || !L || !map || !layer) return;
    layer.clearLayers();

    places.forEach((place) => {
      const temp = typeof place.weather?.temperatureC === "number" ? `${Math.round(place.weather.temperatureC)}°` : "···";
      const marker = L.marker([place.latitude, place.longitude], { icon: weatherDivIcon(L, place, place.id === selectedPlace?.id), keyboard: true, title: `${place.name}: ${place.weather?.conditionText || "Weather reading"}, ${temp}` });
      marker.bindTooltip(`${place.name} · ${temp}`, { permanent: false, direction: "top", offset: [0, -7], className: "world-weather-label" });
      marker.on("click", (event) => {
        L.DomEvent.stopPropagation(event);
        selectHandler.current(place);
      });
      marker.addTo(layer);
    });

    if (selectedPlace?.id === "map-point") {
      L.marker([selectedPlace.latitude, selectedPlace.longitude], { icon: weatherDivIcon(L, selectedPlace, true), keyboard: true, title: "Selected map location" }).bindTooltip("Selected map location", { permanent: true, direction: "top", className: "world-weather-label" }).addTo(layer);
    }
    if (selectedPlace && lastSelectedId.current !== null && lastSelectedId.current !== selectedPlace.id) {
      map.flyTo([selectedPlace.latitude, selectedPlace.longitude], Math.max(map.getZoom(), 4), { duration: 0.8 });
    }
    lastSelectedId.current = selectedPlace?.id ?? null;
  }, [mapReady, places, selectedPlace]);

  return <div ref={mapElement} className="h-[330px] w-full rounded-xl bg-slate-100 sm:h-[410px]" aria-label="Interactive live weather map" />;
}

export function WorldWeatherMap() {
  const [places, setPlaces] = useState<WeatherPlace[]>(featuredPlaces);
  const [selectedId, setSelectedId] = useState("telangana");
  const [selectedMapPoint, setSelectedMapPoint] = useState<WeatherPlace | null>(null);
  const [mapPointLoading, setMapPointLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [placeQuery, setPlaceQuery] = useState("");
  const [selectedState, setSelectedState] = useState("Telangana");
  const [stateQuery, setStateQuery] = useState("Telangana");
  const [stateSearchOpen, setStateSearchOpen] = useState(false);
  const [citySearchOpen, setCitySearchOpen] = useState(false);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [radiusKm, setRadiusKm] = useState(100);

  const loadPlaceWeather = useCallback(async () => {
    try {
      const snapshots = await getLiveWeatherBatch(featuredPlaces);
      setPlaces((current) => [
        ...featuredPlaces.map((place, index) => ({ ...place, weather: snapshots[index] })),
        ...current.filter((place) => !featuredPlaces.some((featured) => featured.id === place.id)),
      ]);
      if (snapshots.some((snapshot) => snapshot.isRealApiData)) setUpdatedAt(new Date());
    } catch {
      setPlaces((current) => featuredPlaces.map((place) => ({ ...place, weather: current.find((item) => item.id === place.id)?.weather })));
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadPlaceWeather(), 0);
    const timer = window.setInterval(() => void loadPlaceWeather(), 10 * 60_000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
    };
  }, [loadPlaceWeather]);

  const selectedPlace = useMemo(() => {
    if (selectedId === "map-point") return selectedMapPoint;
    return places.find((place) => place.id === selectedId) || places[0] || null;
  }, [places, selectedId, selectedMapPoint]);
  const stateNames = useMemo(() => [...new Set(locationCatalog
    .filter((place) => place.region.endsWith(", India"))
    .map((place) => place.region.split(",")[0]))].sort(), []);
  const stateSuggestions = stateQuery.trim()
    ? stateNames.filter((state) => state.toLowerCase().startsWith(stateQuery.trim().toLowerCase())).slice(0, 6)
    : [];
  const matchingPlaces = useMemo(() => {
    const query = placeQuery.trim().toLowerCase();
    const selectedLocation = selectedPlace;
    return locationCatalog
      .filter((place) => place.region.split(",")[0] === selectedState && place.region.endsWith(", India"))
      .filter((place) => !nearbyOnly || (selectedLocation && distanceKm(selectedLocation, place) <= radiusKm))
      .filter((place) => !query || `${place.name} ${place.region}`.toLowerCase().includes(query))
      .map((place) => places.find((loaded) => loaded.id === place.id) || place);
  }, [nearbyOnly, placeQuery, places, radiusKm, selectedPlace, selectedState]);
  const citySuggestions = placeQuery.trim()
    ? matchingPlaces.filter((place) => place.name.toLowerCase().startsWith(placeQuery.trim().toLowerCase())).slice(0, 6)
    : [];

  const selectMapPoint = async (latitude: number, longitude: number) => {
    setSelectedId("map-point");
    setMapPointLoading(true);
    const point: WeatherPlace = { id: "map-point", name: "Selected point", region: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`, latitude, longitude };
    setSelectedMapPoint(point);
    try {
      const weather = await getLiveWeather(latitude, longitude);
      setSelectedMapPoint({ ...point, weather });
    } catch {
      setSelectedMapPoint(point);
    } finally {
      setMapPointLoading(false);
    }
  };

  const choosePlace = async (place: WeatherPlace) => {
    setSelectedMapPoint(null);
    setSelectedId(place.id);
    if (place.region.endsWith(", India")) {
      const state = place.region.split(",")[0];
      setSelectedState(state);
      setStateQuery(state);
    }
    setPlaceQuery(place.name);
    setStateSearchOpen(false);
    setCitySearchOpen(false);
    setPlaces((current) => current.some((item) => item.id === place.id) ? current : [...current, place]);
    if (place.weather) return;
    try {
      const weather = await getLiveWeather(place.latitude, place.longitude);
      setPlaces((current) => current.map((item) => item.id === place.id ? { ...item, weather } : item));
      setUpdatedAt(new Date());
    } catch {
      // Keep the location selectable even if its live reading is temporarily unavailable.
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-[#D8E2EE] bg-white shadow-sm" aria-labelledby="world-weather-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4E7EC] px-4 py-4 sm:px-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#2563EB]">Live conditions</span>
          </div>
          <h2 id="world-weather-title" className="mt-1 text-lg font-extrabold text-[#172033]">Weather Map</h2>
          <p className="mt-0.5 text-[10px] text-slate-500">Live readings for all 28 Indian states, 8 union territories, and world reference cities</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[#667085]">{updatedAt ? `Updated ${updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Loading live readings…"}</span>
          <button type="button" onClick={() => void loadPlaceWeather()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#D7E2F0] px-3 text-xs font-bold text-[#173B62] transition hover:bg-[#F4F7FB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300" aria-label="Refresh live weather">
            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 7v5h-5M4 17v-5h5M5.6 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.4-3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 overflow-hidden rounded-xl border border-[#D8E2EE] bg-[#F4F7FB]">
          <WeatherMapCanvas places={places} selectedPlace={selectedPlace} onMapPoint={selectMapPoint} onPlaceSelect={choosePlace} />
          <div className="flex items-center justify-end border-t border-[#D8E2EE] bg-white px-3 py-2 text-[10px] text-slate-500 sm:px-4">
            <span>Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline decoration-slate-300 underline-offset-2 hover:text-[#173B62]">OpenStreetMap contributors</a></span>
          </div>
        </div>

        <aside className="flex min-w-0 flex-col rounded-xl border border-[#D8E2EE] bg-[#F8FAFC] p-4" aria-label="Weather analysis">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#2563EB]">Selected location</p>
              <h3 className="mt-1 text-base font-extrabold text-[#172033]">{selectedPlace?.name || "Loading…"}</h3>
              <p className="text-xs text-slate-500">{selectedPlace?.region || ""}</p>
            </div>
            <span className="rounded-lg bg-[#EAF3FF] px-2 py-1 text-[10px] font-bold text-[#1D4ED8]">LIVE</span>
          </div>

          {selectedPlace?.climate && <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-900">{selectedPlace.climate}</p>}

          <div className="mt-4 flex items-end gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-[#0B1F4B]">{typeof selectedPlace?.weather?.temperatureC === "number" ? `${selectedPlace.weather.temperatureC.toFixed(1)}°` : mapPointLoading ? "…" : "—"}</span>
            <span className="pb-1 text-sm font-semibold text-slate-500">{selectedPlace?.weather?.conditionText || (mapPointLoading ? "Fetching live weather" : "Current condition")}</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-[#E4E7EC] bg-white p-2.5"><p className="text-[10px] font-semibold text-slate-500">Rain</p><p className="mt-1 text-sm font-bold text-[#172033]">{selectedPlace?.weather?.precipitationRateMmHr ?? "—"} <span className="text-[10px] font-medium">mm</span></p></div>
            <div className="rounded-lg border border-[#E4E7EC] bg-white p-2.5"><p className="text-[10px] font-semibold text-slate-500">Wind</p><p className="mt-1 text-sm font-bold text-[#172033]">{selectedPlace?.weather?.windSpeedKmh ?? "—"} <span className="text-[10px] font-medium">km/h</span></p></div>
            <div className="rounded-lg border border-[#E4E7EC] bg-white p-2.5"><p className="text-[10px] font-semibold text-slate-500">Humidity</p><p className="mt-1 text-sm font-bold text-[#172033]">{selectedPlace?.weather?.humidityPercent ?? "—"}<span className="text-[10px] font-medium">%</span></p></div>
            <div className="rounded-lg border border-[#E4E7EC] bg-white p-2.5"><p className="text-[10px] font-semibold text-slate-500">Pressure</p><p className="mt-1 text-sm font-bold text-[#172033]">{selectedPlace?.weather?.pressureHpa ?? "—"} <span className="text-[10px] font-medium">hPa</span></p></div>
          </div>

          <div className="mt-4 rounded-xl border border-[#DCE7F3] bg-white p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#173B62]">Weather analysis</p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{currentInsight(selectedPlace?.weather)}</p>
            {selectedPlace?.weather?.timestamp && <p className="mt-2 text-[10px] text-slate-400">Observation: {new Date(selectedPlace.weather.timestamp).toLocaleString()}</p>}
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-slate-500" htmlFor="weather-state-search">Search state</label>
            <div className="relative mb-2">
              <input id="weather-state-search" role="combobox" aria-autocomplete="list" aria-expanded={stateSearchOpen && stateSuggestions.length > 0} aria-controls="weather-state-suggestions" value={stateQuery} onFocus={() => { setStateSearchOpen(true); setCitySearchOpen(false); }} onChange={(event) => { setStateQuery(event.target.value); setStateSearchOpen(true); setCitySearchOpen(false); }} onKeyDown={(event) => { if (event.key === "Escape") setStateSearchOpen(false); if (event.key === "Enter" && stateSuggestions[0]) { event.preventDefault(); const state = stateSuggestions[0]; setSelectedState(state); setStateQuery(state); setPlaceQuery(""); setNearbyOnly(false); setStateSearchOpen(false); } }} placeholder="Type a state name..." className="h-10 w-full rounded-lg border border-[#D8E2EE] bg-white px-3 text-xs text-[#172033] outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200" />
              {stateSearchOpen && stateSuggestions.length > 0 && <div id="weather-state-suggestions" role="listbox" className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-[#D8E2EE] bg-white p-1.5 shadow-lg">
                {stateSuggestions.map((state) => <button key={state} type="button" role="option" aria-selected={selectedState === state} onMouseDown={(event) => event.preventDefault()} onClick={() => { setSelectedState(state); setStateQuery(state); setPlaceQuery(""); setNearbyOnly(false); setStateSearchOpen(false); }} className="flex min-h-10 w-full items-center rounded-lg px-2.5 text-left text-[11px] font-semibold text-[#172033] hover:bg-[#EAF3FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF]">{state}</button>)}
              </div>}
              {stateSearchOpen && stateQuery.trim() && stateSuggestions.length === 0 && <div id="weather-state-suggestions" role="status" className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-[#D8E2EE] bg-white px-3 py-2.5 text-[11px] text-slate-500 shadow-lg">No matching Indian state.</div>}
            </div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-slate-500" htmlFor="weather-region-search">Search district or city</label>
            <div className="relative mb-2">
              <input id="weather-region-search" role="combobox" aria-autocomplete="list" aria-expanded={citySearchOpen && citySuggestions.length > 0} aria-controls="weather-city-suggestions" value={placeQuery} onFocus={() => { setCitySearchOpen(true); setStateSearchOpen(false); }} onChange={(event) => { setPlaceQuery(event.target.value); setCitySearchOpen(true); setStateSearchOpen(false); }} onKeyDown={(event) => { if (event.key === "Escape") setCitySearchOpen(false); if (event.key === "Enter" && citySuggestions[0]) { event.preventDefault(); void choosePlace(citySuggestions[0]); } }} placeholder={`Type a district or city in ${selectedState}...`} className="h-10 w-full rounded-lg border border-[#D8E2EE] bg-white px-3 text-xs text-[#172033] outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200" />
              {citySearchOpen && citySuggestions.length > 0 && <div id="weather-city-suggestions" role="listbox" className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-[#D8E2EE] bg-white p-1.5 shadow-lg">
                {citySuggestions.map((place) => <button key={place.id} type="button" role="option" aria-selected={selectedPlace?.id === place.id} onMouseDown={(event) => event.preventDefault()} onClick={() => void choosePlace(place)} className="flex min-h-10 w-full items-center justify-between gap-2 rounded-lg px-2.5 text-left hover:bg-[#EAF3FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF]">
                  <span className="min-w-0"><span className="block truncate text-[11px] font-bold text-[#172033]">{place.name}{place.climate ? " · Thar Desert" : ""}</span><span className="block truncate text-[9px] text-slate-500">{place.region}</span></span>
                  <span className="shrink-0 text-[11px] font-bold text-[#173B62]">{place.weather?.temperatureC != null ? `${Math.round(place.weather.temperatureC)}°` : "Live"}</span>
                </button>)}
              </div>}
              {citySearchOpen && placeQuery.trim() && citySuggestions.length === 0 && <div id="weather-city-suggestions" role="status" className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-[#D8E2EE] bg-white px-3 py-2.5 text-[11px] text-slate-500 shadow-lg">No Telangana district starts with that text.</div>}
            </div>
            <div className="mb-2 flex items-center gap-2">
              <label className="flex min-h-10 flex-1 items-center gap-2 rounded-lg border border-[#D8E2EE] bg-white px-2.5 text-[10px] font-semibold text-slate-600">
                <input type="checkbox" checked={nearbyOnly} onChange={(event) => setNearbyOnly(event.target.checked)} className="h-4 w-4 accent-[#1677FF]" />
                Nearby radius
              </label>
              <select aria-label="Nearby location radius" value={radiusKm} onChange={(event) => setRadiusKm(Number(event.target.value))} disabled={!nearbyOnly} className="h-10 rounded-lg border border-[#D8E2EE] bg-white px-2 text-[10px] font-semibold text-[#172033] disabled:bg-slate-100 disabled:text-slate-400">
                {[25, 50, 100, 250, 500].map((radius) => <option key={radius} value={radius}>{radius} km</option>)}
              </select>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
