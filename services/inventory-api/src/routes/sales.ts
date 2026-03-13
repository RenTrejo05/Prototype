import type { Sale, SaleItem } from "../types.js";
import type { Request, Response } from "express";
import { productsCollection, salesCollection } from "../db.js";
import { publishSaleRegistered, publishLowStock } from "../queue.js";

export async function getSales(_req: Request, res: Response): Promise<void> {
  try {
    const col = await salesCollection();
    const list = await col.find({}).sort({ date: -1 }).limit(200).toArray();
    res.json(list);
  } catch (err) {
    console.error("GET /api/sales", err);
    res.status(500).json({ error: "Error al listar ventas" });
  }
}

export async function createSale(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as { items: SaleItem[]; note?: string };
    if (!Array.isArray(body.items) || body.items.length === 0) {
      res.status(400).json({ error: "items (array) es requerido y no vacío" });
      return;
    }
    const productsCol = await productsCollection();
    const salesCol = await salesCollection();
    let total = 0;
    const validatedItems: SaleItem[] = [];

    for (const item of body.items) {
      const productId = Number(item.productId);
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice);
      if (quantity <= 0) continue;
      const product = await productsCol.findOne({ id: productId });
      if (!product) {
        res.status(400).json({ error: `Producto id ${productId} no encontrado` });
        return;
      }
      if (product.stock < quantity) {
        res.status(400).json({
          error: `Stock insuficiente para ${product.name}: tiene ${product.stock}, se piden ${quantity}`,
        });
        return;
      }
      const price = unitPrice >= 0 ? unitPrice : product.price;
      validatedItems.push({ productId, quantity, unitPrice: price });
      total += price * quantity;
    }

    if (validatedItems.length === 0) {
      res.status(400).json({ error: "Ningún ítem válido" });
      return;
    }

    const last = await salesCol.find().sort({ id: -1 }).limit(1).next();
    const nextId = last ? (last.id ?? 0) + 1 : 1;
    const date = new Date().toISOString();
    const sale: Sale = {
      id: nextId,
      date,
      items: validatedItems,
      total,
      note: body.note,
    };
    await salesCol.insertOne(sale);

    for (const item of validatedItems) {
      await productsCol.updateOne(
        { id: item.productId },
        { $inc: { stock: -item.quantity }, $set: { updatedAt: date } },
      );
      const updated = await productsCol.findOne({ id: item.productId });
      if (updated && updated.stock <= updated.minStock) {
        await publishLowStock(updated);
      }
    }

    await publishSaleRegistered(sale.id, sale.total);
    res.status(201).json(sale);
  } catch (err) {
    console.error("POST /api/sales", err);
    res.status(500).json({ error: "Error al registrar venta" });
  }
}
