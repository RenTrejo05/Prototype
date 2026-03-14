import type { GoodsReceipt, GoodsReceiptItem } from "../types.js";
import type { Request, Response } from "express";
import { productsCollection, receiptsCollection } from "../db.js";
import { publishLowStock } from "../queue.js";

export async function getReceipts(_req: Request, res: Response): Promise<void> {
  try {
    const col = await receiptsCollection();
    const list = await col.find({}).sort({ date: -1 }).limit(200).toArray();
    res.json(list);
  } catch (err) {
    console.error("GET /api/receipts", err);
    res.status(500).json({ error: "Error al listar recepciones" });
  }
}

export async function getReceiptById(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const col = await receiptsCollection();
    const receipt = await col.findOne({ id });
    if (!receipt) {
      res.status(404).json({ error: "Recepción no encontrada" });
      return;
    }
    res.json(receipt);
  } catch (err) {
    console.error("GET /api/receipts/:id", err);
    res.status(500).json({ error: "Error al obtener recepción" });
  }
}

export async function createReceipt(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as {
      referenceType: GoodsReceipt["referenceType"];
      referenceNumber: string;
      supplier?: string;
      items: GoodsReceiptItem[];
      note?: string;
    };
    if (
      !body.referenceType ||
      !body.referenceNumber?.trim() ||
      !Array.isArray(body.items) ||
      body.items.length === 0
    ) {
      res.status(400).json({
        error: "referenceType, referenceNumber e items (array no vacío) son requeridos",
      });
      return;
    }
    const refType =
      body.referenceType === "purchase_order" ? "purchase_order" : "invoice";
    const productsCol = await productsCollection();
    const receiptsCol = await receiptsCollection();

    const validatedItems: GoodsReceiptItem[] = [];
    for (const item of body.items) {
      const productId = Number(item.productId);
      const quantity = Number(item.quantity) || 0;
      if (quantity <= 0) continue;
      const product = await productsCol.findOne({ id: productId });
      if (!product) {
        res.status(400).json({ error: `Producto id ${productId} no encontrado` });
        return;
      }
      validatedItems.push({
        productId,
        quantity,
        unitCost: item.unitCost != null ? Number(item.unitCost) : undefined,
        note: item.note,
      });
    }

    if (validatedItems.length === 0) {
      res.status(400).json({ error: "Ningún ítem válido" });
      return;
    }

    const last = await receiptsCol.find().sort({ id: -1 }).limit(1).next();
    const nextId = last ? (last.id ?? 0) + 1 : 1;
    const date = new Date().toISOString();

    const receipt: GoodsReceipt = {
      id: nextId,
      date,
      referenceType: refType,
      referenceNumber: body.referenceNumber.trim(),
      supplier: body.supplier?.trim(),
      items: validatedItems,
      note: body.note?.trim(),
      createdAt: date,
    };
    await receiptsCol.insertOne(receipt);

    for (const item of validatedItems) {
      const update: Record<string, unknown> = {
        $inc: { stock: item.quantity },
        $set: { updatedAt: date },
      };
      if (item.unitCost != null && item.unitCost >= 0) {
        update.$set = {
          ...(update.$set as object),
          cost: item.unitCost,
        } as Record<string, unknown>;
      }
      await productsCol.updateOne({ id: item.productId }, update);
      const updated = await productsCol.findOne({ id: item.productId });
      if (updated && updated.stock <= updated.minStock) {
        await publishLowStock(updated);
      }
    }

    res.status(201).json(receipt);
  } catch (err) {
    console.error("POST /api/receipts", err);
    res.status(500).json({ error: "Error al registrar recepción" });
  }
}
