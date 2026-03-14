import type { InventoryAdjustment } from "../types.js";
import type { Request, Response } from "express";
import { productsCollection, adjustmentsCollection } from "../db.js";
import { publishLowStock } from "../queue.js";

const VALID_REASONS: InventoryAdjustment["reason"][] = [
  "conteo_fisico",
  "dano",
  "uso_interno",
  "transferencia",
  "correccion",
  "otro",
];

export async function getAdjustments(_req: Request, res: Response): Promise<void> {
  try {
    const col = await adjustmentsCollection();
    const list = await col.find({}).sort({ date: -1 }).limit(200).toArray();
    res.json(list);
  } catch (err) {
    console.error("GET /api/adjustments", err);
    res.status(500).json({ error: "Error al listar ajustes" });
  }
}

export async function getAdjustmentById(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const col = await adjustmentsCollection();
    const adjustment = await col.findOne({ id });
    if (!adjustment) {
      res.status(404).json({ error: "Ajuste no encontrado" });
      return;
    }
    res.json(adjustment);
  } catch (err) {
    console.error("GET /api/adjustments/:id", err);
    res.status(500).json({ error: "Error al obtener ajuste" });
  }
}

export async function createAdjustment(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as {
      type: InventoryAdjustment["type"];
      reason: InventoryAdjustment["reason"];
      productId: number;
      quantity: number;
      referenceDocument?: string;
      note?: string;
    };
    if (
      !body.type ||
      !body.reason ||
      body.productId == null ||
      body.quantity == null ||
      Number(body.quantity) <= 0
    ) {
      res.status(400).json({
        error: "type, reason, productId y quantity (positivo) son requeridos",
      });
      return;
    }
    if (!VALID_REASONS.includes(body.reason)) {
      res.status(400).json({
        error: `reason debe ser uno de: ${VALID_REASONS.join(", ")}`,
      });
      return;
    }
    const type = body.type === "decrease" ? "decrease" : "increase";
    const productId = Number(body.productId);
    const quantity = Number(body.quantity);

    const productsCol = await productsCollection();
    const adjustmentsCol = await adjustmentsCollection();
    const product = await productsCol.findOne({ id: productId });
    if (!product) {
      res.status(400).json({ error: `Producto id ${productId} no encontrado` });
      return;
    }
    if (type === "decrease" && product.stock < quantity) {
      res.status(400).json({
        error: `Stock insuficiente: ${product.name} tiene ${product.stock}, se solicitan ${quantity}`,
      });
      return;
    }

    const last = await adjustmentsCol.find().sort({ id: -1 }).limit(1).next();
    const nextId = last ? (last.id ?? 0) + 1 : 1;
    const date = new Date().toISOString();

    const adjustment: InventoryAdjustment = {
      id: nextId,
      date,
      type,
      reason: body.reason,
      productId,
      quantity,
      referenceDocument: body.referenceDocument?.trim(),
      note: body.note?.trim(),
      createdAt: date,
    };
    await adjustmentsCol.insertOne(adjustment);

    const delta = type === "increase" ? quantity : -quantity;
    await productsCol.updateOne(
      { id: productId },
      { $inc: { stock: delta }, $set: { updatedAt: date } },
    );
    const updated = await productsCol.findOne({ id: productId });
    if (updated && updated.stock <= updated.minStock) {
      await publishLowStock(updated);
    }

    res.status(201).json(adjustment);
  } catch (err) {
    console.error("POST /api/adjustments", err);
    res.status(500).json({ error: "Error al registrar ajuste" });
  }
}
