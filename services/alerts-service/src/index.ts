import express from "express";
import cors from "cors";
import { getAlerts } from "./redis.js";
import { processEvents } from "./processor.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT ?? 4001;

app.get("/api/health", (_req, res) => {
  res.json({ service: "alerts-service", status: "ok" });
});

app.get("/api/alerts", async (_req, res) => {
  try {
    const limit = Math.min(Number((_req.query.limit as string) || 100) || 100, 200);
    const alerts = await getAlerts(limit);
    res.json(alerts);
  } catch (err) {
    console.error("GET /api/alerts", err);
    res.status(500).json({ error: "Error al obtener alertas" });
  }
});

/** Called by cron or scheduler to process pending queue events. */
app.post("/api/internal/process", async (_req, res) => {
  try {
    const max = Math.min(Number((_req.query.max as string) || 50) || 50, 100);
    const count = await processEvents(max);
    res.json({ processed: count });
  } catch (err) {
    console.error("POST /api/internal/process", err);
    res.status(500).json({ error: "Error al procesar cola" });
  }
});

app.listen(PORT, () => {
  console.log(`Alerts Service listening on http://localhost:${PORT}`);
});
