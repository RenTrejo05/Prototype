import type { Product, InventoryAnalytics } from "../types.js";
import type { Request, Response } from "express";
import { productsCollection } from "../db.js";

export async function getAnalytics(_req: Request, res: Response): Promise<void> {
  try {
    const col = await productsCollection();
    const products = await col.find({ active: true }).sort({ id: 1 }).toArray();

    const totalProducts = products.length;
    const totalStockUnits = products.reduce((s, p) => s + p.stock, 0);
    const totalStockValue = products.reduce((s, p) => s + p.stock * p.cost, 0);

    const lowStockProducts = products.filter((p) => p.stock <= p.minStock);
    const suggestedRestocks: { product: Product; suggestedQty: number }[] = lowStockProducts.map(
      (p) => ({ product: p, suggestedQty: Math.max(p.minStock * 2 - p.stock, 1) }),
    );

    const analytics: InventoryAnalytics = {
      totalProducts,
      totalStockUnits,
      totalStockValue,
      lowStockProducts,
      suggestedRestocks,
    };
    res.json(analytics);
  } catch (err) {
    console.error("GET /api/inventory/analytics", err);
    res.status(500).json({ error: "Error al calcular analytics" });
  }
}
