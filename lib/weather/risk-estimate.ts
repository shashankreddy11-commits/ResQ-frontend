import type { CurrentWeather } from "./open-meteo";

export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export interface RiskEstimate {
  level: RiskLevel;
  score: number;
  factors: string[];
  method: string;
}

export function estimateWeatherRisk(weather: CurrentWeather): RiskEstimate {
  let score = 0;
  const factors: string[] = [];

  if (weather.precipitationMm >= 12) {
    score += 35;
    factors.push("Heavy modelled precipitation");
  } else if (weather.precipitationMm >= 5) {
    score += 22;
    factors.push("Elevated modelled precipitation");
  } else if (weather.precipitationMm >= 1) {
    score += 10;
    factors.push("Precipitation is present");
  }

  if (weather.windGustsKmh >= 80) {
    score += 30;
    factors.push("Very strong modelled wind gusts");
  } else if (weather.windGustsKmh >= 60) {
    score += 22;
    factors.push("Strong modelled wind gusts");
  } else if (weather.windGustsKmh >= 40) {
    score += 12;
    factors.push("Elevated modelled wind gusts");
  }

  if (weather.temperatureC >= 44) {
    score += 25;
    factors.push("Extreme modelled air temperature");
  } else if (weather.temperatureC >= 40) {
    score += 18;
    factors.push("Very high modelled air temperature");
  } else if (weather.temperatureC >= 36) {
    score += 8;
    factors.push("High modelled air temperature");
  }

  if (weather.weatherCode >= 95) {
    score += 25;
    factors.push("Thunderstorm conditions in the model");
  }

  score = Math.min(score, 100);
  const level: RiskLevel = score >= 65 ? "CRITICAL" : score >= 45 ? "HIGH" : score >= 25 ? "MODERATE" : "LOW";

  return {
    level,
    score,
    factors: factors.length ? factors : ["No elevated weather factors in the current model reading"],
    method: "Experimental threshold estimate from current Open-Meteo fields; not calibrated or an official warning.",
  };
}
