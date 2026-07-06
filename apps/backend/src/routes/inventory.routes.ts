// ──────────────────────────────────────────────
// Routes: Inventory Ledger — Endpoint Wiring Only
// ──────────────────────────────────────────────

import { Router } from "express";
import { inventoryController } from "../controllers/inventory.controller.js";

export const inventoryRouter = Router();

inventoryRouter.get("/ledger", inventoryController.getLedger);
inventoryRouter.post("/adjust", inventoryController.adjustStock);
