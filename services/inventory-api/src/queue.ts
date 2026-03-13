import type { Product } from "./types.js";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const QUEUE_KEY = "inventory-events";

export type QueueEvent =
  | { type: "low_stock"; productId: number; productName: string; currentStock: number; minStock: number; timestamp: string }
  | { type: "sale_registered"; saleId: number; total: number; timestamp: string }
  | { type: "restock_suggestion"; productId: number; productName: string; suggestedQty: number; timestamp: string };

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

export async function publishEvent(event: QueueEvent): Promise<void> {
  const payload = JSON.stringify(event);
  await redisCommand(["LPUSH", QUEUE_KEY, payload]);
}

export async function publishLowStock(product: Product): Promise<void> {
  await publishEvent({
    type: "low_stock",
    productId: product.id,
    productName: product.name,
    currentStock: product.stock,
    minStock: product.minStock,
    timestamp: new Date().toISOString(),
  });
}

export async function publishSaleRegistered(saleId: number, total: number): Promise<void> {
  await publishEvent({
    type: "sale_registered",
    saleId,
    total,
    timestamp: new Date().toISOString(),
  });
}

export async function publishRestockSuggestion(product: Product, suggestedQty: number): Promise<void> {
  await publishEvent({
    type: "restock_suggestion",
    productId: product.id,
    productName: product.name,
    suggestedQty,
    timestamp: new Date().toISOString(),
  });
}
