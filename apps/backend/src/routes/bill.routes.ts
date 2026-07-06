// ──────────────────────────────────────────────
// Routes: Bills & Sales — Endpoint Wiring Only
// ──────────────────────────────────────────────

import { Router } from "express";
import { billController } from "../controllers/bill.controller.js";

export const billRouter = Router();

billRouter.get("/", billController.getAll);
billRouter.get("/:id", billController.getById);
billRouter.post("/", billController.create);
billRouter.post("/:id/payments", billController.addPayment);
billRouter.post("/:id/cancel", billController.cancel);
