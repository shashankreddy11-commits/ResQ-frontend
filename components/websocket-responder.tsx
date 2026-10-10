"use client";

import { useEffect, useRef, useState } from "react";

interface ResponderTelemetry {
  id: number | string;
  unitCode: string;
  unitName: string;
  agencyType: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  batteryPercentage?: number | null;
  lastPingTime?: string | null;
}

interface StompTelemetry {
  unitId?: string;
  responderName?: string;
  agencyType?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  timestamp?: string;
}

type FeedStatus = "CONNECTING" | "STOMP" | "POLLING" | "UNAVAILABLE";

export function WebSocketResponder() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";
  const [units, setUnits] = useState<ResponderTelemetry[]>([]);
  const [feedStatus, setFeedStatus] = useState<FeedStatus>("CONNECTING");
  const [publishFeedback, setPublishFeedback] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const stompConnectedRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    let socket: WebSocket | null = null;
    let reconnectTimer: number | undefined;
    let disposed = false;
    let stompConnected = false;
    const websocketBase = apiBaseUrl.replace(/^http/, "ws").replace(/\/$/, "");

    const refreshFromApi = async () => {
      if (stompConnected) return;
      try {
        const response = await fetch(`${apiBaseUrl}/api/responders`, { signal: controller.signal });
        if (!response.ok) throw new Error("Responder feed unavailable");
        const data: ResponderTelemetry[] = await response.json();
        if (Array.isArray(data)) {
          setUnits(data);
          setFeedStatus((current) => current === "STOMP" ? current : "POLLING");
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        setFeedStatus((current) => current === "STOMP" ? current : "UNAVAILABLE");
      }
    };

    const applyTelemetry = (update: StompTelemetry) => {
      if (!update.unitId) return;
      const unitId = update.unitId;
      setUnits((current) => {
        const exists = current.some((unit) => unit.unitCode === unitId);
        const timestamp = update.timestamp || new Date().toISOString();
        if (exists) {
          return current.map((unit) => unit.unitCode === unitId ? {
            ...unit,
            unitName: update.responderName || unit.unitName,
            agencyType: update.agencyType || unit.agencyType,
            latitude: update.latitude ?? unit.latitude,
            longitude: update.longitude ?? unit.longitude,
            status: update.status || unit.status,
            lastPingTime: timestamp,
          } : unit);
        }
        return [...current, {
          id: unitId,
          unitCode: unitId,
          unitName: update.responderName || unitId,
          agencyType: update.agencyType || "FIELD UNIT",
          latitude: update.latitude ?? null,
          longitude: update.longitude ?? null,
          status: update.status || "UNKNOWN",
          lastPingTime: timestamp,
        }];
      });
    };

    const openSockJsStomp = () => {
      if (disposed) return;
      const serverId = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
      const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      socket = new WebSocket(`${websocketBase}/ws-emergency/${serverId}/${sessionId}/websocket`);
      socketRef.current = socket;

      const sendStomp = (frame: string) => {
        if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify([frame]));
      };

      const receiveStomp = (frame: string) => {
        if (frame.startsWith("CONNECTED\n")) {
          stompConnected = true;
          stompConnectedRef.current = true;
          sendStomp("SUBSCRIBE\nid:responder-telemetry\ndestination:/topic/responder-telemetry\nack:auto\n\n\u0000");
          setFeedStatus("STOMP");
          return;
        }
        if (!frame.startsWith("MESSAGE\n")) return;
        const bodyStart = frame.indexOf("\n\n");
        if (bodyStart < 0) return;
        const body = frame.slice(bodyStart + 2).replace(/\u0000$/, "");
        try {
          applyTelemetry(JSON.parse(body) as StompTelemetry);
        } catch {
          // Ignore malformed telemetry frames and keep the API snapshot available.
        }
      };

      socket.onmessage = (event) => {
        if (typeof event.data !== "string") return;
        if (event.data === "o") {
          const token = localStorage.getItem("dr_token");
          const authHeader = token ? `Authorization:Bearer ${token}\n` : "";
          sendStomp(`CONNECT\naccept-version:1.2\nheart-beat:0,10000\n${authHeader}\n\u0000`);
        } else if (event.data.startsWith("a")) {
          try {
            const frames = JSON.parse(event.data.slice(1)) as string[];
            frames.forEach(receiveStomp);
          } catch {
            setFeedStatus("POLLING");
          }
        }
      };

      socket.onerror = () => socket?.close();
      socket.onclose = () => {
        if (disposed) return;
        stompConnected = false;
        stompConnectedRef.current = false;
        socketRef.current = null;
        setFeedStatus((current) => current === "STOMP" ? "POLLING" : current);
        reconnectTimer = window.setTimeout(openSockJsStomp, 3000);
      };
    };

    void refreshFromApi();
    openSockJsStomp();
    const pollTimer = window.setInterval(() => void refreshFromApi(), 15000);
    return () => {
      disposed = true;
      controller.abort();
      window.clearInterval(pollTimer);
      if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer);
      stompConnectedRef.current = false;
      socketRef.current = null;
      socket?.close();
    };
  }, [apiBaseUrl]);

  const shareCurrentLocation = (unit: ResponderTelemetry) => {
    if (!stompConnectedRef.current || socketRef.current?.readyState !== WebSocket.OPEN) {
      setPublishFeedback("Live telemetry is reconnecting. Please try again in a moment.");
      return;
    }
    if (!localStorage.getItem("dr_token")) {
      setPublishFeedback("Sign in with a responder or administrator account to publish telemetry.");
      return;
    }
    if (!navigator.geolocation) {
      setPublishFeedback("This device does not provide location access.");
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
      const frame = [
        "SEND",
        "destination:/app/responder-location",
        "content-type:application/json",
        "",
        JSON.stringify({
          unitId: unit.unitCode,
          responderName: unit.unitName,
          agencyType: unit.agencyType,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          status: unit.status,
          timestamp: new Date().toISOString(),
        }),
      ].join("\n") + "\u0000";
      socketRef.current?.send(JSON.stringify([frame]));
      setPublishFeedback(`Location shared for ${unit.unitCode}.`);
    }, () => setPublishFeedback("Location permission was denied or unavailable."), { enableHighAccuracy: true, timeout: 10000 });
  };

  return (
    <section className="space-y-3 rounded-2xl border border-cyan-500/30 bg-[#0c1322] p-5 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h3 className="font-mono text-sm font-extrabold uppercase tracking-wider text-white">Responder unit telemetry</h3>
          <p className="text-[11px] text-slate-400">Java SockJS/STOMP telemetry with a 15 second REST snapshot fallback</p>
        </div>
        <span className={`rounded-lg border px-3 py-1 text-xs font-mono font-bold ${feedStatus === "STOMP" ? "border-emerald-500/30 bg-emerald-950 text-emerald-300" : "border-amber-500/30 bg-amber-950 text-amber-300"}`}>
          {feedStatus === "STOMP" ? "● STOMP LIVE" : `● ${feedStatus}`}
        </span>
      </div>

      {publishFeedback && <p role="status" className="text-[11px] text-cyan-200">{publishFeedback}</p>}

      {units.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-400">{feedStatus === "UNAVAILABLE" ? "Responder feed is unavailable." : "No responder units are reporting."}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 text-xs md:grid-cols-3">
          {units.map((unit) => (
            <article key={unit.id} className="space-y-2 rounded-xl border border-slate-800 bg-slate-900 p-3 font-mono">
              <div className="flex items-center justify-between gap-2 text-[10px]">
                <span className="rounded bg-slate-800 px-2 py-0.5 font-bold text-cyan-400">{unit.unitCode}</span>
                <span className="text-slate-400">{unit.agencyType}</span>
              </div>
              <h4 className="font-sans text-xs font-bold text-white">{unit.unitName}</h4>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-300">
                <span>Latitude: <strong className="text-white">{unit.latitude ?? "—"}</strong></span>
                <span>Longitude: <strong className="text-white">{unit.longitude ?? "—"}</strong></span>
                <span>Battery: <strong className="text-cyan-300">{unit.batteryPercentage == null ? "—" : `${unit.batteryPercentage}%`}</strong></span>
                <span>Last ping: <strong className="text-white">{unit.lastPingTime ? new Date(unit.lastPingTime).toLocaleTimeString() : "—"}</strong></span>
              </div>
              <span className="block text-right text-[10px] font-bold uppercase text-emerald-400">Status: {unit.status.replaceAll("_", " ")}</span>
              <button type="button" onClick={() => shareCurrentLocation(unit)} disabled={feedStatus !== "STOMP"} className="min-h-9 w-full rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-3 py-2 text-[10px] font-bold text-cyan-200 enabled:hover:bg-cyan-900/50 disabled:cursor-not-allowed disabled:opacity-50">
                Share this device location
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
