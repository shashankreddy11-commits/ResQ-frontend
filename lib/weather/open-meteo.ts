export interface WeatherLocation {
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country?: string;
  timezone?: string;
}

export interface CurrentWeather {
  time: string;
  temperatureC: number;
  apparentTemperatureC: number;
  humidityPercent: number;
  precipitationMm: number;
  rainMm: number;
  showersMm: number;
  snowfallCm: number;
  pressureHpa: number;
  windSpeedKmh: number;
  windDirectionDegrees: number;
  windGustsKmh: number;
  cloudCoverPercent: number;
  weatherCode: number;
}

export interface HourForecast {
  time: string;
  temperatureC: number;
  precipitationProbabilityPercent: number;
  precipitationMm: number;
  rainMm: number;
  windSpeedKmh: number;
  humidityPercent: number;
  pressureHpa: number;
  weatherCode: number;
}

export interface DayForecast {
  date: string;
  highC: number;
  lowC: number;
  precipitationMm: number;
  precipitationProbabilityPercent: number;
  weatherCode: number;
}

export interface WeatherBundle {
  current: CurrentWeather;
  hourly: HourForecast[];
  daily: DayForecast[];
  timezone: string;
  source: "Open-Meteo";
  fetchedAt: string;
}

interface OpenMeteoPayload {
  current?: Record<string, unknown>;
  hourly?: Record<string, unknown[]>;
  daily?: Record<string, unknown[]>;
  timezone?: string;
  error?: boolean;
  reason?: string;
}

interface GeocodingPayload {
  results?: Array<{
    id?: number;
    name?: string;
    latitude?: number;
    longitude?: number;
    admin1?: string;
    country?: string;
    timezone?: string;
    feature_code?: string;
  }>;
}

const forecastEndpoint = "https://api.open-meteo.com/v1/forecast";
const geocodingEndpoint = "https://geocoding-api.open-meteo.com/v1/search";
const currentFields = [
  "temperature_2m",
  "apparent_temperature",
  "relative_humidity_2m",
  "precipitation",
  "rain",
  "showers",
  "snowfall",
  "pressure_msl",
  "wind_speed_10m",
  "wind_direction_10m",
  "wind_gusts_10m",
  "cloud_cover",
  "weather_code",
].join(",");

function requestSignal(signal?: AbortSignal, timeoutMs = 10_000): AbortSignal {
  const timeout = AbortSignal.timeout(timeoutMs);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

function numberField(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error("Weather service returned incomplete data: " + key);
  }
  return value;
}

function optionalNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readArray(record: Record<string, unknown[]>, key: string): unknown[] {
  const value = record[key];
  return Array.isArray(value) ? value : [];
}

export function describeWeatherCode(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code === 85 || code === 86) return "Snow showers";
  if (code >= 95) return "Thunderstorm";
  return "Weather conditions";
}

export async function getWeatherForLocation(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<WeatherBundle> {
  const url = new URL(forecastEndpoint);
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: currentFields,
    hourly: "temperature_2m,precipitation_probability,precipitation,rain,wind_speed_10m,relative_humidity_2m,pressure_msl,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max",
    forecast_days: "6",
    forecast_hours: "24",
    timezone: "auto",
  }).toString();

  const response = await fetch(url, { signal: requestSignal(signal, 10_000), cache: "no-store" });
  if (!response.ok) throw new Error("Weather service is unavailable (" + response.status + ")");
  const payload = await response.json() as OpenMeteoPayload;
  if (payload.error || !payload.current) {
    throw new Error(payload.reason || "Weather service did not return current conditions");
  }

  const currentPayload = payload.current;
  const current: CurrentWeather = {
    time: String(currentPayload.time || ""),
    temperatureC: numberField(currentPayload, "temperature_2m"),
    apparentTemperatureC: numberField(currentPayload, "apparent_temperature"),
    humidityPercent: numberField(currentPayload, "relative_humidity_2m"),
    precipitationMm: numberField(currentPayload, "precipitation"),
    rainMm: numberField(currentPayload, "rain"),
    showersMm: numberField(currentPayload, "showers"),
    snowfallCm: numberField(currentPayload, "snowfall"),
    pressureHpa: numberField(currentPayload, "pressure_msl"),
    windSpeedKmh: numberField(currentPayload, "wind_speed_10m"),
    windDirectionDegrees: numberField(currentPayload, "wind_direction_10m"),
    windGustsKmh: numberField(currentPayload, "wind_gusts_10m"),
    cloudCoverPercent: numberField(currentPayload, "cloud_cover"),
    weatherCode: numberField(currentPayload, "weather_code"),
  };

  const hourlyPayload = payload.hourly || {};
  const hourlyTimes = readArray(hourlyPayload, "time");
  const hourly: HourForecast[] = hourlyTimes.map((time, index) => ({
    time: String(time),
    temperatureC: optionalNumber(readArray(hourlyPayload, "temperature_2m")[index]),
    precipitationProbabilityPercent: optionalNumber(readArray(hourlyPayload, "precipitation_probability")[index]),
    precipitationMm: optionalNumber(readArray(hourlyPayload, "precipitation")[index]),
    rainMm: optionalNumber(readArray(hourlyPayload, "rain")[index]),
    windSpeedKmh: optionalNumber(readArray(hourlyPayload, "wind_speed_10m")[index]),
    humidityPercent: optionalNumber(readArray(hourlyPayload, "relative_humidity_2m")[index]),
    pressureHpa: optionalNumber(readArray(hourlyPayload, "pressure_msl")[index]),
    weatherCode: optionalNumber(readArray(hourlyPayload, "weather_code")[index]),
  }));

  const dailyPayload = payload.daily || {};
  const dailyTimes = readArray(dailyPayload, "time");
  const daily: DayForecast[] = dailyTimes.map((date, index) => ({
    date: String(date),
    highC: optionalNumber(readArray(dailyPayload, "temperature_2m_max")[index]),
    lowC: optionalNumber(readArray(dailyPayload, "temperature_2m_min")[index]),
    precipitationMm: optionalNumber(readArray(dailyPayload, "precipitation_sum")[index]),
    precipitationProbabilityPercent: optionalNumber(readArray(dailyPayload, "precipitation_probability_max")[index]),
    weatherCode: optionalNumber(readArray(dailyPayload, "weather_code")[index]),
  }));

  return {
    current,
    hourly,
    daily,
    timezone: payload.timezone || "UTC",
    source: "Open-Meteo",
    fetchedAt: new Date().toISOString(),
  };
}

export async function searchWeatherLocations(query: string, signal?: AbortSignal): Promise<WeatherLocation[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const url = new URL(geocodingEndpoint);
  url.search = new URLSearchParams({
    name: trimmed,
    count: "7",
    language: "en",
    format: "json",
  }).toString();
  const response = await fetch(url, { signal: requestSignal(signal, 8_000), cache: "no-store" });
  if (!response.ok) throw new Error("Location search is unavailable");
  const payload = await response.json() as GeocodingPayload;
  return (payload.results || []).flatMap((result) => {
    if (!result.name || typeof result.latitude !== "number" || typeof result.longitude !== "number") return [];
    return [{
      name: result.name,
      latitude: result.latitude,
      longitude: result.longitude,
      admin1: result.admin1,
      country: result.country,
      timezone: result.timezone,
    }];
  });
}

export interface WeatherGridPoint {
  latitude: number;
  longitude: number;
  current: CurrentWeather;
  forecast?: HourForecast;
}

export async function getWeatherGrid(
  locations: Array<{ latitude: number; longitude: number }>,
  signal?: AbortSignal,
  forecastHours?: number,
): Promise<WeatherGridPoint[]> {
  if (locations.length === 0) return [];
  if (locations.length > 50) throw new Error("Weather grid is limited to 50 points per request");
  const url = new URL(forecastEndpoint);
  url.search = new URLSearchParams({
    latitude: locations.map((point) => point.latitude.toFixed(4)).join(","),
    longitude: locations.map((point) => point.longitude.toFixed(4)).join(","),
    current: currentFields,
    ...(forecastHours !== undefined ? {
      hourly: "temperature_2m,precipitation_probability,precipitation,rain,wind_speed_10m,relative_humidity_2m,pressure_msl,weather_code",
      forecast_hours: String(Math.max(1, Math.min(24, forecastHours + 1))),
      timezone: "GMT",
    } : { timezone: "auto" }),
  }).toString();
  const response = await fetch(url, { signal: requestSignal(signal, 10_000), cache: "no-store" });
  if (!response.ok) throw new Error("Weather grid is unavailable");
  const result = await response.json() as OpenMeteoPayload | OpenMeteoPayload[];
  const payloads = Array.isArray(result) ? result : [result];
  if (payloads.length !== locations.length) throw new Error("Weather grid returned an unexpected number of points");
  return payloads.flatMap((payload, index) => {
    if (!payload.current) return [];
    const current = payload.current;
    try {
      const point: WeatherGridPoint = {
        ...locations[index],
        current: {
          time: String(current.time || ""),
          temperatureC: numberField(current, "temperature_2m"),
          apparentTemperatureC: numberField(current, "apparent_temperature"),
          humidityPercent: numberField(current, "relative_humidity_2m"),
          precipitationMm: numberField(current, "precipitation"),
          rainMm: numberField(current, "rain"),
          showersMm: numberField(current, "showers"),
          snowfallCm: numberField(current, "snowfall"),
          pressureHpa: numberField(current, "pressure_msl"),
          windSpeedKmh: numberField(current, "wind_speed_10m"),
          windDirectionDegrees: numberField(current, "wind_direction_10m"),
          windGustsKmh: numberField(current, "wind_gusts_10m"),
          cloudCoverPercent: numberField(current, "cloud_cover"),
          weatherCode: numberField(current, "weather_code"),
        },
      };
      if (forecastHours !== undefined && payload.hourly) {
        const hourly = payload.hourly;
        const times = readArray(hourly, "time");
        const forecastIndex = Math.min(forecastHours, times.length - 1);
        if (forecastIndex >= 0) {
          point.forecast = {
            time: String(times[forecastIndex]) + "Z",
            temperatureC: optionalNumber(readArray(hourly, "temperature_2m")[forecastIndex]),
            precipitationProbabilityPercent: optionalNumber(readArray(hourly, "precipitation_probability")[forecastIndex]),
            precipitationMm: optionalNumber(readArray(hourly, "precipitation")[forecastIndex]),
            rainMm: optionalNumber(readArray(hourly, "rain")[forecastIndex]),
            windSpeedKmh: optionalNumber(readArray(hourly, "wind_speed_10m")[forecastIndex]),
            humidityPercent: optionalNumber(readArray(hourly, "relative_humidity_2m")[forecastIndex]),
            pressureHpa: optionalNumber(readArray(hourly, "pressure_msl")[forecastIndex]),
            weatherCode: optionalNumber(readArray(hourly, "weather_code")[forecastIndex]),
          };
        }
      }
      return [point];
    } catch {
      return [];
    }
  });
}
