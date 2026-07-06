// ──────────────────────────────────────────────
// Express App — Entry Point
// ──────────────────────────────────────────────

import "dotenv/config";
import express from "express";
import cors from "cors";
import { logger } from "./utils/logger.js";
import { apiRouter } from "./routes/index.js";

const app = express();
const PORT = parseInt(process.env.PORT || "4000", 10);

// ── Middleware ───────────────────────────────
app.use(cors());
app.use(express.json());

// ── Request Logging ─────────────────────────
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, "Incoming request");
  next();
});

// ── Routes ──────────────────────────────────
app.use("/api", apiRouter);

// ── Health Check ────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Start Server ────────────────────────────
app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV }, "🚀 Server started");
});

export default app;
