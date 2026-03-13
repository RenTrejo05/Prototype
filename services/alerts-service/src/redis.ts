const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const QUEUE_KEY = "inventory-events";
const ALERTS_KEY = "alerts";
const ALERTS_MAX = 500;

export interface StoredAlert {
  id: string;
  type: string;
  message: string;
  data: Record<string, unknown>;
  timestamp: string;
}

async function redisCommand(args: string[]): Promise<unknown> {
  if (!REDIS_URL || !REDIS_TOKEN) return null;
  const res = await fetch(REDIS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { result?: unknown };
  return data.result;
}

/** Pop one event from the queue (right side = oldest). Returns null if empty. */
export async function popEvent(): Promise<string | null> {
  const raw = await redisCommand(["RPOP", QUEUE_KEY]);
  return typeof raw === "string" ? raw : null;
}

/** Push alert to the list (left side), trim to max. */
export async function pushAlert(alert: StoredAlert): Promise<void> {
  const payload = JSON.stringify(alert);
  await redisCommand(["LPUSH", ALERTS_KEY, payload]);
  await redisCommand(["LTRIM", ALERTS_KEY, "0", String(ALERTS_MAX - 1)]);
}

/** Get all alerts (newest first). */
export async function getAlerts(limit = 100): Promise<StoredAlert[]> {
  const raw = await redisCommand(["LRANGE", ALERTS_KEY, "0", String(limit - 1)]);
  if (!Array.isArray(raw)) return [];
  const list: StoredAlert[] = [];
  for (const s of raw) {
    if (typeof s !== "string") continue;
    try {
      list.push(JSON.parse(s) as StoredAlert);
    } catch {
      // skip invalid
    }
  }
  return list;
}
