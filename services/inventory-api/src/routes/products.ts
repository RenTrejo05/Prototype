import type { Product } from "../types.js";
import type { Request, Response } from "express";
import { productsCollection } from "../db.js";
import { publishLowStock } from "../queue.js";

export async function getProducts(_req: Request, res: Response): Promise<void> {
  try {
    const col = await productsCollection();
    const list = await col.find({}).sort({ id: 1 }).toArray();
    res.json(list);
  } catch (err) {
    console.error("GET /api/products", err);
    res.status(500).json({ error: "Error al listar productos" });
  }
}

export async function getProductById(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const col = await productsCollection();
    const product = await col.findOne({ id });
    if (!product) {
      res.status(404).json({ error: "Producto no encontrado" });
      return;
    }
    res.json(product);
  } catch (err) {
    console.error("GET /api/products/:id", err);
    res.status(500).json({ error: "Error al obtener producto" });
  }
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Omit<Product, "id" | "createdAt" | "updatedAt">;
    if (!body.name || body.sku == null) {
      res.status(400).json({ error: "name y sku son requeridos" });
      return;
    }
    const col = await productsCollection();
    const last = await col.find().sort({ id: -1 }).limit(1).next();
    const nextId = last ? (last.id ?? 0) + 1 : 1;
    const now = new Date().toISOString();
    const product: Product = {
      id: nextId,
      name: body.name,
      sku: String(body.sku),
      category: body.category ?? "",
      price: Number(body.price) ?? 0,
      cost: Number(body.cost) ?? 0,
      stock: Number(body.stock) ?? 0,
      minStock: Number(body.minStock) ?? 0,
      active: body.active !== false,
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne(product);
    if (product.stock <= product.minStock) {
      await publishLowStock(product);
    }
    res.status(201).json(product);
  } catch (err) {
    console.error("POST /api/products", err);
    res.status(500).json({ error: "Error al crear producto" });
  }
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const body = req.body as Partial<Product>;
    const col = await productsCollection();
    const existing = await col.findOne({ id });
    if (!existing) {
      res.status(404).json({ error: "Producto no encontrado" });
      return;
    }
    const updateData: Partial<Product> = {
      ...body,
      updatedAt: new Date().toISOString(),
    };
    delete (updateData as Record<string, unknown>).id;
    delete (updateData as Record<string, unknown>)._id;
    await col.updateOne({ id }, { $set: updateData });
    const updated = await col.findOne({ id });
    if (updated && updated.stock <= updated.minStock) {
      await publishLowStock(updated);
    }
    res.json(updated);
  } catch (err) {
    console.error("PUT /api/products/:id", err);
    res.status(500).json({ error: "Error al actualizar producto" });
  }
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const col = await productsCollection();
    const result = await col.deleteOne({ id });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: "Producto no encontrado" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/products/:id", err);
    res.status(500).json({ error: "Error al eliminar producto" });
  }
}
