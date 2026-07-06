// ──────────────────────────────────────────────
// Routes: Shop Settings — Endpoint Wiring Only
// ──────────────────────────────────────────────

import { Router } from "express";
import { settingController } from "../controllers/setting.controller.js";

export const settingRouter = Router();

settingRouter.get("/", settingController.get);
settingRouter.put("/", settingController.update);
