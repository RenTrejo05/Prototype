import { popEvent, pushAlert, type StoredAlert } from "./redis.js";

type QueueEvent =
  | { type: "low_stock"; productId: number; productName: string; currentStock: number; minStock: number; timestamp: string }
  | { type: "sale_registered"; saleId: number; total: number; timestamp: string }
  | { type: "restock_suggestion"; productId: number; productName: string; suggestedQty: number; timestamp: string };

function eventToAlert(ev: QueueEvent, id: string): StoredAlert {
  switch (ev.type) {
    case "low_stock":
      return {
        id,
        type: "low_stock",
        message: `Stock bajo: ${ev.productName} (${ev.currentStock} / mínimo ${ev.minStock})`,
        data: {
          productId: ev.productId,
          productName: ev.productName,
          currentStock: ev.currentStock,
          minStock: ev.minStock,
        },
        timestamp: ev.timestamp,
      };
    case "sale_registered":
      return {
        id,
        type: "sale_registered",
        message: `Venta registrada #${ev.saleId} - Total: ${ev.total}`,
        data: { saleId: ev.saleId, total: ev.total },
        timestamp: ev.timestamp,
      };
    case "restock_suggestion":
      return {
        id,
        type: "restock_suggestion",
        message: `Sugerencia: reponer ${ev.suggestedQty} unidades de ${ev.productName}`,
        data: {
          productId: ev.productId,
          productName: ev.productName,
          suggestedQty: ev.suggestedQty,
        },
        timestamp: ev.timestamp,
      };
    default:
      return {
        id,
        type: "unknown",
        message: "Evento desconocido",
        data: ev as Record<string, unknown>,
        timestamp: (ev as { timestamp?: string }).timestamp ?? new Date().toISOString(),
      };
  }
}

/** Process up to maxEvents from the queue and store as alerts. Returns count processed. */
export async function processEvents(maxEvents = 50): Promise<number> {
  let count = 0;
  for (let i = 0; i < maxEvents; i++) {
    const raw = await popEvent();
    if (!raw) break;
    try {
      const ev = JSON.parse(raw) as QueueEvent;
      const id = `alert_${Date.now()}_${i}`;
      const alert = eventToAlert(ev, id);
      await pushAlert(alert);
      count++;
    } catch {
      // skip invalid event
    }
  }
  return count;
}
