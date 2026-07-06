// ──────────────────────────────────────────────
// Routes: Categories — Endpoint Wiring Only
// ──────────────────────────────────────────────

import { Router } from "express";
import { categoryController } from "../controllers/category.controller.js";

export const categoryRouter = Router();

categoryRouter.get("/", categoryController.getAll);
categoryRouter.get("/:id", categoryController.getById);
categoryRouter.post("/", categoryController.create);
categoryRouter.put("/:id", categoryController.update);
categoryRouter.delete("/:id", categoryController.delete);
