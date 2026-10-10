export interface LiveWeatherSnapshot {
  latitude: number;
  longitude: number;
  temperatureC?: number;
  temperatureF?: number;
  humidityPercent?: number;
  precipitationRateMmHr?: number;
  windSpeedKmh?: number;
  windDirection?: string;
  pressureHpa?: number;
  uvIndex?: number;
  aqi?: number | null;
  conditionText: string;
  conditionCode?: string;
  weatherIconUrl?: string;
  timestamp?: string;
  isRealApiData: boolean;
  dataSource: string;
}

interface OpenMeteoResponse {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    precipitation?: number;
    weather_code?: number;
    pressure_msl?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    uv_index?: number;
    time?: string;
  };
}

const apiBaseUrl = "";

function describeWeatherCode(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "Rain showers";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "Snowfall";
  if (code >= 95 && code <= 99) return "Thunderstorm";
  return "Current conditions";
}

async function getOpenMeteoWeather(latitude: number, longitude: number, signal?: AbortSignal): Promise<LiveWeatherSnapshot> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,relative_humidity_2m,precipitation,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m,uv_index",
    timezone: "auto",
  }).toString();

  const response = await fetch(url, { signal, cache: "no-store" });
  if (!response.ok) throw new Error("Live weather service is unavailable");
  const result = await response.json() as OpenMeteoResponse;
  const current = result.current;
  if (!current || typeof current.temperature_2m !== "number" || typeof current.weather_code !== "number") {
    throw new Error("Live weather service returned incomplete current conditions");
  }

  return mapOpenMeteoCurrent(current, latitude, longitude);
}

function mapOpenMeteoCurrent(current: NonNullable<OpenMeteoResponse["current"]>, latitude: number, longitude: number): LiveWeatherSnapshot {
  if (typeof current.temperature_2m !== "number") throw new Error("Live weather response is missing temperature");
  const temperatureC = current.temperature_2m;
  const conditionText = describeWeatherCode(current.weather_code ?? -1);
  return {
    latitude,
    longitude,
    temperatureC,
    temperatureF: temperatureC * 9 / 5 + 32,
    humidityPercent: current.relative_humidity_2m,
    precipitationRateMmHr: current.precipitation,
    windSpeedKmh: current.wind_speed_10m,
    windDirection: typeof current.wind_direction_10m === "number"
      ? ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(current.wind_direction_10m / 45) % 8]
      : undefined,
    pressureHpa: current.pressure_msl,
    uvIndex: current.uv_index,
    aqi: null,
    conditionText,
    conditionCode: conditionText.toLowerCase(),
    timestamp: current.time,
    isRealApiData: true,
    dataSource: "Open-Meteo live weather",
  };
}

export async function getLiveWeatherBatch(locations: Array<{ latitude: number; longitude: number }>): Promise<LiveWeatherSnapshot[]> {
  if (!locations.length) return [];
  const latitudes = locations.map((location) => location.latitude.toFixed(5)).join(",");
  const longitudes = locations.map((location) => location.longitude.toFixed(5)).join(",");
  try {
    const url = `${apiBaseUrl}/api/weather/current/batch?latitudes=${latitudes}&longitudes=${longitudes}`;
    const response = await fetch(url, { cache: "no-store" });
    if (response.ok) {
      const snapshots = await response.json() as LiveWeatherSnapshot[];
      if (Array.isArray(snapshots) && snapshots.length === locations.length && snapshots.every((snapshot) => snapshot.isRealApiData && typeof snapshot.temperatureC === "number")) {
        return snapshots;
      }
    }
  } catch {
    // Use the public live feed directly if the Java batch endpoint is offline.
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: latitudes,
    longitude: longitudes,
    current: "temperature_2m,relative_humidity_2m,precipitation,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m,uv_index",
    timezone: "auto",
  }).toString();
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Live weather batch is unavailable");
  const payload = await response.json() as OpenMeteoResponse | OpenMeteoResponse[];
  const snapshots = Array.isArray(payload) ? payload : [payload];
  if (snapshots.length !== locations.length) throw new Error("Live weather batch returned an unexpected number of locations");
  return snapshots.map((snapshot, index) => {
    if (!snapshot.current || typeof snapshot.current.temperature_2m !== "number") {
      throw new Error("Live weather batch returned incomplete conditions");
    }
    return mapOpenMeteoCurrent(snapshot.current, locations[index].latitude, locations[index].longitude);
  });
}

export async function getLiveWeather(latitude: number, longitude: number, signal?: AbortSignal): Promise<LiveWeatherSnapshot> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/weather/current?lat=${latitude}&lon=${longitude}`, {
      signal,
      cache: "no-store",
    });
    if (response.ok) {
      const snapshot = await response.json() as LiveWeatherSnapshot;
      if (snapshot.isRealApiData && typeof snapshot.temperatureC === "number") return snapshot;
    }
  } catch (error) {
    if (signal?.aborted) throw error;
  }

  return getOpenMeteoWeather(latitude, longitude, signal);
}
