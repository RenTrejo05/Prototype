import express, { type Request, type Response } from "express";
import cors from "cors";
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from "./routes/products.js";
import { getSales, createSale } from "./routes/sales.js";
import { getAnalytics } from "./routes/analytics.js";
import { getReceipts, getReceiptById, createReceipt } from "./routes/receipts.js";
import { getAdjustments, getAdjustmentById, createAdjustment } from "./routes/adjustments.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT ?? 4000;

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ service: "inventory-api", status: "ok" });
});

app.get("/api/products", getProducts);
app.get("/api/products/:id", getProductById);
app.post("/api/products", createProduct);
app.put("/api/products/:id", updateProduct);
app.delete("/api/products/:id", deleteProduct);

app.get("/api/sales", getSales);
app.post("/api/sales", createSale);

app.get("/api/inventory/analytics", getAnalytics);

app.get("/api/receipts", getReceipts);
app.get("/api/receipts/:id", getReceiptById);
app.post("/api/receipts", createReceipt);

app.get("/api/adjustments", getAdjustments);
app.get("/api/adjustments/:id", getAdjustmentById);
app.post("/api/adjustments", createAdjustment);

app.listen(PORT, () => {
  console.log(`Inventory API listening on http://localhost:${PORT}`);
});
