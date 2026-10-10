const STORAGE_KEY = "dr_offline_usage_v1";
const MAX_BATCHES = 30;
const MAX_COUNT_PER_EVENT = 10_000;
const allowedEvents = new Set<string>([
  "offline_session",
  "offline_page_view",
  "offline_sos_blocked",
  "offline_guidance_used",
]);

export const OFFLINE_USAGE_EVENTS = [
  "offline_session",
  "offline_page_view",
  "offline_sos_blocked",
  "offline_guidance_used",
] as const;

export type OfflineUsageEvent = (typeof OFFLINE_USAGE_EVENTS)[number];

interface OfflineUsageBatch {
  batchId: string;
  eventDate: string;
  counts: Partial<Record<OfflineUsageEvent, number>>;
}

const batchesInFlight = new Set<string>();
let flushInProgress = false;

function isOfflineUsageBatch(value: unknown): value is OfflineUsageBatch {
  if (!value || typeof value !== "object") return false;
  const batch = value as Partial<OfflineUsageBatch>;
  if (typeof batch.eventDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(batch.eventDate)) return false;
  const parsedDate = new Date(`${batch.eventDate}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.valueOf()) || parsedDate.toISOString().slice(0, 10) !== batch.eventDate) return false;
  if (!batch.counts || typeof batch.counts !== "object" || Array.isArray(batch.counts)) return false;
  const counts = batch.counts as Record<string, unknown>;

  return typeof batch.batchId === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(batch.batchId)
    && Object.keys(counts).length > 0
    && Object.entries(counts).every(([eventName, count]) =>
      allowedEvents.has(eventName)
      && typeof count === "number"
      && Number.isInteger(count)
      && count > 0
      && count <= MAX_COUNT_PER_EVENT
    );
}

function readPendingBatches(): OfflineUsageBatch[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) throw new Error("Expected an array of offline usage batches");
    return parsed.filter(isOfflineUsageBatch);
  } catch (error) {
    console.error("[Offline usage] Could not read saved counters:", error);
    return [];
  }
}

function savePendingBatches(batches: OfflineUsageBatch[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(batches));
  } catch (error) {
    console.warn("[Offline usage] Could not save counters on this device:", error);
  }
}

export function recordOfflineUsage(eventName: OfflineUsageEvent): void {
  if (typeof window === "undefined" || navigator.onLine) return;

  const batches = readPendingBatches();
  const eventDate = new Date().toISOString().slice(0, 10);
  let batch = [...batches].reverse().find(
    (candidate) => candidate.eventDate === eventDate && !batchesInFlight.has(candidate.batchId),
  );

  if (!batch) {
    batch = { batchId: crypto.randomUUID(), eventDate, counts: {} };
    batches.push(batch);
  }

  batch.counts[eventName] = Math.min(
    MAX_COUNT_PER_EVENT,
    (batch.counts[eventName] || 0) + 1,
  );
  savePendingBatches(batches.slice(-MAX_BATCHES));
}

async function flushPendingBatches(): Promise<void> {
  if (typeof window === "undefined" || !navigator.onLine || flushInProgress) return;
  flushInProgress = true;

  try {
    for (const batch of readPendingBatches()) {
      batchesInFlight.add(batch.batchId);
      try {
        const response = await fetch("/api/analytics/offline-usage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batch),
          keepalive: true,
        });
        if (!response.ok) {
          console.warn(`[Offline usage] Sync was rejected (${response.status}); counters remain on this device.`);
          break;
        }
        savePendingBatches(readPendingBatches().filter((item) => item.batchId !== batch.batchId));
      } catch (error) {
        console.warn("[Offline usage] Sync failed; counters remain on this device:", error);
        break;
      } finally {
        batchesInFlight.delete(batch.batchId);
      }
    }
  } finally {
    flushInProgress = false;
  }
}

export function startOfflineUsageSync(): () => void {
  if (typeof window === "undefined") return () => undefined;

  const onOffline = () => recordOfflineUsage("offline_session");
  const onOnline = () => void flushPendingBatches();
  const onVisibilityChange = () => {
    if (document.visibilityState === "visible") void flushPendingBatches();
  };

  window.addEventListener("offline", onOffline);
  window.addEventListener("online", onOnline);
  document.addEventListener("visibilitychange", onVisibilityChange);

  if (!navigator.onLine) onOffline();
  else void flushPendingBatches();

  return () => {
    window.removeEventListener("offline", onOffline);
    window.removeEventListener("online", onOnline);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}
