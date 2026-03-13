const INVENTORY_API = process.env.NEXT_PUBLIC_INVENTORY_API_URL ?? "http://localhost:4000";
const ALERTS_API = process.env.NEXT_PUBLIC_ALERTS_API_URL ?? "http://localhost:4001";

export function getInventoryApiUrl(path: string): string {
  const base = INVENTORY_API.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getAlertsApiUrl(path: string): string {
  const base = ALERTS_API.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
