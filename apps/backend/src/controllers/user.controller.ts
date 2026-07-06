// ──────────────────────────────────────────────
// Controller: Users — Orchestration & Logging
// ──────────────────────────────────────────────
// Calls service methods, logs via Pino, returns via sendSuccess/sendError.
// Zero business logic.

import type { Request, Response } from "express";
import { logger } from "../utils/logger.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { userService } from "../services/user.service.js";

export const userController = {
  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      logger.debug("Fetching all users");
      const users = await userService.getAll();
      sendSuccess(res, users, "Users retrieved successfully");
    } catch (error) {
      logger.error(error, "Failed to fetch users");
      sendError(res, error as Error);
    }
  },

  async getById(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      logger.debug({ id }, "Fetching user by ID");
      const user = await userService.getById(id);
      sendSuccess(res, user, "User retrieved successfully");
    } catch (error) {
      logger.error(error, "Failed to fetch user");
      const status = (error as Error).message === "User not found" ? 404 : 500;
      sendError(res, error as Error, status);
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      logger.info({ body: req.body }, "Creating new user");
      const user = await userService.create(req.body);
      logger.info({ userId: user.id }, "User created successfully");
      sendSuccess(res, user, "User created successfully", 201);
    } catch (error) {
      logger.error(error, "Failed to create user");
      const message = (error as Error).message;
      const status = message.includes("already exists") ? 409 : 400;
      sendError(res, error as Error, status);
    }
  },

  async update(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      logger.info({ id, body: req.body }, "Updating user");
      const user = await userService.update(id, req.body);
      logger.info({ userId: user.id }, "User updated successfully");
      sendSuccess(res, user, "User updated successfully");
    } catch (error) {
      logger.error(error, "Failed to update user");
      const message = (error as Error).message;
      const status = message === "User not found" ? 404 : 400;
      sendError(res, error as Error, status);
    }
  },

  async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      logger.info({ id }, "Deleting user");
      const user = await userService.delete(id);
      logger.info({ userId: user.id }, "User deleted successfully");
      sendSuccess(res, user, "User deleted successfully");
    } catch (error) {
      logger.error(error, "Failed to delete user");
      const status = (error as Error).message === "User not found" ? 404 : 500;
      sendError(res, error as Error, status);
    }
  },
};
