"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getLiveWeather, type LiveWeatherSnapshot } from "@/lib/live-weather";

type WeatherData = LiveWeatherSnapshot;

interface RiskPrediction {
  riskLevel: string;
  riskScorePercent: number;
  riskFactors: string[];
  disclaimer: string;
}

interface HourlyForecastItem {
  time: string;
  condition: string;
  temperatureC: number;
  rainMmHr: number;
}

interface DailyForecastItem {
  day: string;
  condition: string;
  highC: number;
  lowC: number;
  rainProbabilityPercent: number;
}

interface WeatherAlertItem {
  title: string;
  description: string;
  severity: string;
}

export function WeatherPanel() {
  const [selectedCity, setSelectedCity] = useState("Mumbai");
  const [coords, setCoords] = useState<{ lat: number; lon: number }>({ lat: 19.0760, lon: 72.8777 });
  const [unit, setUnit] = useState<"C" | "F">("C");
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecastItem[]>([]);
  const [dailyForecast, setDailyForecast] = useState<DailyForecastItem[]>([]);
  const [alerts, setAlerts] = useState<WeatherAlertItem[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<RiskPrediction | null>(null);

  const cityCoordinates: Record<string, { lat: number; lon: number }> = {
    "Mumbai": { lat: 19.0760, lon: 72.8777 },
    "Delhi": { lat: 28.6139, lon: 77.2090 },
    "Hyderabad": { lat: 17.3850, lon: 78.4867 },
    "Bengaluru": { lat: 12.9716, lon: 77.5946 },
    "Kolkata": { lat: 22.5726, lon: 88.3639 },
    "Chennai": { lat: 13.0827, lon: 80.2707 },
  };

  const apiBaseUrl = "";

  const fetchRiskAssessment = React.useCallback(async (wData: WeatherData) => {
    const metrics = [wData.precipitationRateMmHr, wData.windSpeedKmh, wData.humidityPercent, wData.pressureHpa];
    if (metrics.some((value) => typeof value !== "number")) {
      setRiskAssessment(null);
      return;
    }
    const [rain, wind, humidity, pressure] = metrics as number[];
    try {
      const mlRes = await fetch(`${apiBaseUrl}/api/ml/predict-risk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rainfall_mm_hr: rain,
          wind_speed_kmh: wind,
          humidity_pct: humidity,
          pressure_hpa: pressure,
        })
      });
      if (mlRes.ok) {
        const riskData = await mlRes.json() as {
          riskLevel?: string; risk_level?: string; riskScorePercent?: number; risk_score?: number;
          riskFactors?: string[]; risk_factors?: string[]; disclaimer?: string;
        };
        setRiskAssessment({
          riskLevel: riskData.riskLevel || riskData.risk_level || "UNAVAILABLE",
          riskScorePercent: riskData.riskScorePercent ?? riskData.risk_score ?? 0,
          riskFactors: riskData.riskFactors || riskData.risk_factors || [],
          disclaimer: riskData.disclaimer || "Experimental decision-support estimate; not an official warning.",
        });
        return;
      }
    } catch {
      // client side fallback risk calculation
    }

    // Heuristic client fallback
    let score = 20;
    const factors = [];
    if (rain > 20) {
      score += 45;
      factors.push("Flash Flood Hazard");
    } else if (rain > 5) {
      score += 20;
      factors.push("Monsoon Waterlogging");
    }
    if (wind > 30) {
      score += 25;
      factors.push("High Wind Shear");
    }
    if (pressure < 1000) {
      score += 15;
      factors.push("Low Atmospheric Pressure System");
    }

    let level = "Low";
    if (score >= 70) level = "Critical";
    else if (score >= 50) level = "High";
    else if (score >= 35) level = "Moderate";

    setRiskAssessment({
      riskLevel: level,
      riskScorePercent: Math.min(score, 98),
      riskFactors: factors.length > 0 ? factors : ["Normal Meteorological Telemetry"],
      disclaimer: "Prototype Rule-Based Disaster Risk Telemetry"
    });
  }, [apiBaseUrl]);

  const fetchWeatherData = React.useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const [currentRes, hourlyRes, dailyRes, alertsRes] = await Promise.allSettled([
        getLiveWeather(lat, lon),
        fetch(`${apiBaseUrl}/api/weather/hourly?lat=${lat}&lon=${lon}`),
        fetch(`${apiBaseUrl}/api/weather/daily?lat=${lat}&lon=${lon}`),
        fetch(`${apiBaseUrl}/api/weather/alerts?lat=${lat}&lon=${lon}`)
      ]);

      if (currentRes.status === "fulfilled") {
        const data = currentRes.value;
        setWeather(data);
        fetchRiskAssessment(data);
      } else {
        setWeather(null);
        setRiskAssessment(null);
      }

      if (hourlyRes.status === "fulfilled" && hourlyRes.value.ok) {
        const hourly = await hourlyRes.value.json();
        setHourlyForecast(hourly);
      }

      if (dailyRes.status === "fulfilled" && dailyRes.value.ok) {
        const daily = await dailyRes.value.json();
        setDailyForecast(daily);
      }

      if (alertsRes.status === "fulfilled" && alertsRes.value.ok) {
        const alertList = await alertsRes.value.json();
        setAlerts(alertList);
      }
    } catch (err) {
      console.warn("Live weather service unavailable", err);
      setWeather(null);
      setRiskAssessment(null);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, fetchRiskAssessment]);

  useEffect(() => {
    let isMounted = true;
    const refreshWeather = () => {
      if (isMounted) fetchWeatherData(coords.lat, coords.lon);
    };
    const timer = setTimeout(() => {
      refreshWeather();
    }, 0);
    const refreshInterval = window.setInterval(refreshWeather, 5 * 60_000);
    return () => {
      isMounted = false;
      clearTimeout(timer);
      window.clearInterval(refreshInterval);
    };
  }, [coords, fetchWeatherData]);

  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName);
    if (cityCoordinates[cityName]) {
      setCoords(cityCoordinates[cityName]);
    }
  };

  const handleUseMyLocation = () => {
    if ("geolocation" in navigator) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setSelectedCity("GPS Current Location");
          setCoords({ lat, lon });
          setLocationLoading(false);
        },
        (err) => {
          console.warn("Geolocation permission denied or timed out:", err);
          setLocationLoading(false);
          alert("Could not access your location. Please check browser permissions.");
        },
        { timeout: 8000 }
      );
    }
  };

  const getWeatherIcon = (code: string) => {
    if (code.includes("rain") || code.includes("monsoon")) return "🌧️";
    if (code.includes("thunder") || code.includes("heavy")) return "⛈️";
    if (code.includes("cloud")) return "⛅";
    if (code.includes("sunny") || code.includes("clear")) return "☀️";
    return "🌤️";
  };

  const getRiskBadgeColor = (level?: string) => {
    switch (level) {
      case "Critical": return "bg-red-600 text-white border-red-400 animate-pulse";
      case "High": return "bg-orange-600 text-white border-orange-400";
      case "Moderate": return "bg-amber-500 text-slate-950 border-amber-300 font-bold";
      default: return "bg-emerald-600 text-white border-emerald-400";
    }
  };

  return (
    <div className="bg-[#182137] border border-[#E9E7E1]/20 rounded-3xl overflow-hidden shadow-2xl text-[#E9E7E1] font-sans p-4 sm:p-6 space-y-5">
      {/* 1. Header & Location Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E9E7E1]/15 pb-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Use My GPS Location Button */}
          <button
            onClick={handleUseMyLocation}
            disabled={locationLoading}
            className="bg-[#E9E7E1] text-[#1F2A44] hover:bg-[#E9E7E1]/90 px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 transition shadow-md"
          >
            <span>{locationLoading ? "⏳ Locating..." : "📍 Use My GPS Location"}</span>
          </button>

          {/* Quick City Chips */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
            {Object.keys(cityCoordinates).map((city) => (
              <button
                key={city}
                onClick={() => handleCitySelect(city)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
                  selectedCity === city
                    ? "bg-[#273452] text-[#E9E7E1] border border-[#E9E7E1]/40"
                    : "bg-[#1F2A44]/80 text-[#E9E7E1]/70 hover:bg-[#273452]"
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Temperature Unit Toggle */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <button
            onClick={() => setUnit(unit === "C" ? "F" : "C")}
            className="bg-[#273452] hover:bg-[#1F2A44] px-3 py-1.5 rounded-xl border border-[#E9E7E1]/20 text-[#E9E7E1] transition"
          >
            °{unit} Switch
          </button>
        </div>
      </div>

      {/* 2. Active Severe Weather Alert Banner (If Any) */}
      {alerts && alerts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-900/80 to-red-900/80 border border-amber-500/40 text-[#E9E7E1] px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="text-amber-400 text-base animate-bounce">⚠️</span>
            <div>
              <span className="font-extrabold text-amber-200">{alerts[0].title || "Weather Advisory"}</span>
              <p className="text-[11px] text-[#E9E7E1]/80 font-normal">{alerts[0].description}</p>
            </div>
          </div>
          <span className="text-[10px] bg-red-800 px-2 py-0.5 rounded font-mono font-bold text-white uppercase">
            {alerts[0].severity || "ALERT"}
          </span>
        </div>
      )}

      {/* 3. Hero Weather Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Weather Telemetry Card */}
        <div className="lg:col-span-7 bg-[#273452] border border-[#E9E7E1]/20 rounded-3xl p-6 space-y-4 relative">
          {loading && (
            <div className="absolute inset-0 bg-[#182137]/60 backdrop-blur-sm rounded-3xl flex items-center justify-center z-10">
              <span className="text-xs font-bold text-[#E9E7E1] animate-pulse">Syncing live weather...</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">📍</span>
              <h2 className="text-lg font-black text-[#E9E7E1]">{selectedCity}</h2>
              <span className="text-[10px] bg-[#1F2A44] border border-[#E9E7E1]/20 text-[#E9E7E1]/80 px-2 py-0.5 rounded-full font-mono">
                {coords.lat.toFixed(2)}°, {coords.lon.toFixed(2)}°
              </span>
            </div>
            <span className="text-[10px] text-[#E9E7E1]/60 font-mono">
              {weather?.dataSource || "Live Telemetry"}
            </span>
          </div>

          <div className="flex items-center gap-6 pt-1">
            <span className="text-6xl">{getWeatherIcon(weather?.conditionCode || "cloud")}</span>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black text-[#E9E7E1] tracking-tight">
                {weather
                    ? unit === "C" ? `${weather.temperatureC ?? "—"}°C` : `${weather.temperatureF ?? "—"}°F`
                    : loading ? "Loading…" : "Unavailable"}
                </span>
              </div>
              <p className="text-lg font-bold text-[#E9E7E1] leading-tight capitalize">
                {weather?.conditionText || (loading ? "Fetching current weather" : "Live weather unavailable")}
              </p>
              <p className="text-xs text-[#E9E7E1]/75">
                Humidity <strong className="text-[#E9E7E1]">{weather?.humidityPercent != null ? `${weather.humidityPercent}%` : "—"}</strong>
              </p>
            </div>
          </div>

          {/* 6 Key Weather Telemetry Metrics */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 border-t border-[#E9E7E1]/15 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] text-[#E9E7E1]/70 font-semibold block">Precipitation</span>
              <span className="font-bold text-[#E9E7E1]">{weather?.precipitationRateMmHr ?? "—"} mm/h</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-[#E9E7E1]/70 font-semibold block">Wind Speed</span>
              <span className="font-bold text-[#E9E7E1]">{weather?.windSpeedKmh ?? "—"} km/h</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-[#E9E7E1]/70 font-semibold block">Pressure</span>
              <span className="font-bold text-[#E9E7E1]">{weather?.pressureHpa ?? "—"} hPa</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-[#E9E7E1]/70 font-semibold block">Air Quality (AQI)</span>
              <span className="font-bold text-[#E9E7E1]">{weather?.aqi ?? "—"}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-[#E9E7E1]/70 font-semibold block">UV Index</span>
              <span className="font-bold text-[#E9E7E1]">{weather?.uvIndex ?? "—"}{weather?.uvIndex != null ? " / 10" : ""}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-[#E9E7E1]/70 font-semibold block">Wind Dir</span>
              <span className="font-bold text-[#E9E7E1]">{weather?.windDirection ?? "—"}</span>
            </div>
          </div>
        </div>

        {/* Right AI Disaster Risk Prediction Widget */}
        <div className="lg:col-span-5 bg-[#1F2A44] border border-[#E9E7E1]/20 rounded-3xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex justify-between items-center pb-2 border-b border-[#E9E7E1]/15">
              <div className="flex items-center gap-2">
                <span className="text-sm">🤖</span>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#E9E7E1]">
                  AI Disaster Risk Telemetry
                </h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${getRiskBadgeColor(riskAssessment?.riskLevel)}`}>
                {riskAssessment ? `${riskAssessment.riskLevel} Risk (${riskAssessment.riskScorePercent}%)` : "Risk unavailable"}
              </span>
            </div>

            <div className="py-3 space-y-2">
              <p className="text-xs text-[#E9E7E1]/80">
                Automated risk synthesis combining precipitation rates, atmospheric pressure, and wind shear telemetry.
              </p>

              <div className="space-y-1">
                <span className="text-[10px] text-[#E9E7E1]/60 font-semibold uppercase block">Identified Hazard Factors:</span>
                <div className="flex flex-wrap gap-1.5">
                  {riskAssessment?.riskFactors.map((factor, idx) => (
                    <span key={idx} className="bg-[#273452] border border-[#E9E7E1]/20 px-2 py-0.5 rounded text-[11px] font-semibold text-[#E9E7E1]">
                      • {factor}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#273452]/60 p-2.5 rounded-xl border border-[#E9E7E1]/10 text-[10px] text-[#E9E7E1]/70 font-mono flex items-center justify-between">
            <span>ℹ️ {riskAssessment?.disclaimer || "Prototype Rule-Based Risk Assessment"}</span>
            <Link href="/live-situation" className="text-[#E9E7E1] font-bold hover:underline ml-2">Evacuation Map &gt;</Link>
          </div>
        </div>
      </div>

      {/* 4. 10-Day Forecast Bar */}
      {dailyForecast.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-black text-xs uppercase tracking-wider text-[#E9E7E1]/80">Multi-Day Meteorological Outlook</h4>
          <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2">
            {dailyForecast.map((df, i) => (
              <div
                key={i}
                className="p-2.5 rounded-2xl border border-[#E9E7E1]/15 bg-[#273452] text-center space-y-1 hover:border-[#E9E7E1]/40 transition"
              >
                <span className="text-[11px] font-extrabold text-[#E9E7E1] block">{df.day}</span>
                <div className="text-xl py-0.5">{getWeatherIcon(df.condition || "")}</div>
                <div className="flex justify-center items-center gap-1 text-[10px] font-bold">
                  <span>{df.highC}°</span>
                  <span className="opacity-60">{df.lowC}°</span>
                </div>
                <span className="text-[9px] text-[#E9E7E1]/60 font-semibold block">{df.rainProbabilityPercent}% Rain</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. 24-Hour Timeline */}
      {hourlyForecast.length > 0 && (
        <div className="bg-[#273452] border border-[#E9E7E1]/20 rounded-3xl p-4 space-y-2">
          <h4 className="font-extrabold text-[#E9E7E1] text-xs">24-Hour Hourly Telemetry Forecast</h4>
          <div className="flex items-center justify-between overflow-x-auto gap-4 py-2 border-t border-[#E9E7E1]/15">
            {hourlyForecast.slice(0, 12).map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-1 min-w-[55px] text-xs">
                <span className="text-[10px] text-[#E9E7E1]/70 font-semibold">{h.time}</span>
                <span className="text-lg">{getWeatherIcon(h.condition || "")}</span>
                <span className="font-bold text-[#E9E7E1] font-mono text-[11px]">{h.temperatureC}°C</span>
                <span className="text-[9px] text-amber-300 font-mono">{h.rainMmHr} mm/h</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
