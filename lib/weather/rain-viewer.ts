export interface RadarFrame {
  time: number;
  path: string;
  tileUrl: string;
}

interface RainViewerPayload {
  host?: string;
  radar?: {
    past?: Array<{ time?: number; path?: string }>;
  };
}

export async function getRadarFrames(signal?: AbortSignal): Promise<RadarFrame[]> {
  const response = await fetch("https://api.rainviewer.com/public/weather-maps.json", {
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10_000)]) : AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Radar service is unavailable (" + response.status + ")");
  const payload = await response.json() as RainViewerPayload;
  if (!payload.host || !Array.isArray(payload.radar?.past)) {
    throw new Error("Radar service returned no historical frames");
  }
  return payload.radar.past.flatMap((frame) => {
    if (typeof frame.time !== "number" || !frame.path) return [];
    const path = frame.path.startsWith("/") ? frame.path : "/" + frame.path;
    return [{
      time: frame.time,
      path,
      tileUrl: payload.host + path + "/256/{z}/{x}/{y}/2/1_1.png",
    }];
  }).sort((left, right) => left.time - right.time);
}
