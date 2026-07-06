// ──────────────────────────────────────────────
// Routes: Orders — Endpoint Wiring Only
// ──────────────────────────────────────────────
// No logic here — just maps HTTP verbs to controller methods.

import { Router } from "express";
import { orderController } from "../controllers/order.controller.js";

export const orderRouter = Router();

orderRouter.get("/", orderController.getAll);
orderRouter.get("/:id", orderController.getById);
orderRouter.get("/user/:userId", orderController.getByUserId);
orderRouter.post("/", orderController.create);
orderRouter.put("/:id", orderController.update);
orderRouter.delete("/:id", orderController.delete);
