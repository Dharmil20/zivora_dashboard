// ──────────────────────────────────────────────
// Routes: Users — Endpoint Wiring Only
// ──────────────────────────────────────────────
// No logic here — just maps HTTP verbs to controller methods.

import { Router } from "express";
import { userController } from "../controllers/user.controller.js";

export const userRouter = Router();

userRouter.get("/", userController.getAll);
userRouter.get("/:id", userController.getById);
userRouter.post("/", userController.create);
userRouter.put("/:id", userController.update);
userRouter.delete("/:id", userController.delete);
