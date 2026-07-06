// ──────────────────────────────────────────────
// Controller: Orders — Orchestration & Logging
// ──────────────────────────────────────────────
// Calls service methods, logs via Pino, returns via sendSuccess/sendError.
// Zero business logic.

import type { Request, Response } from "express";
import { logger } from "../utils/logger.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { orderService } from "../services/order.service.js";

export const orderController = {
  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      logger.debug("Fetching all orders");
      const orders = await orderService.getAll();
      sendSuccess(res, orders, "Orders retrieved successfully");
    } catch (error) {
      logger.error(error, "Failed to fetch orders");
      sendError(res, error as Error);
    }
  },

  async getById(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      logger.debug({ id }, "Fetching order by ID");
      const order = await orderService.getById(id);
      sendSuccess(res, order, "Order retrieved successfully");
    } catch (error) {
      logger.error(error, "Failed to fetch order");
      const status = (error as Error).message === "Order not found" ? 404 : 500;
      sendError(res, error as Error, status);
    }
  },

  async getByUserId(req: Request<{ userId: string }>, res: Response): Promise<void> {
    try {
      const userId = req.params.userId as string;
      logger.debug({ userId }, "Fetching orders for user");
      const orders = await orderService.getByUserId(userId);
      sendSuccess(res, orders, "User orders retrieved successfully");
    } catch (error) {
      logger.error(error, "Failed to fetch user orders");
      const status = (error as Error).message === "User not found" ? 404 : 500;
      sendError(res, error as Error, status);
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      logger.info({ body: req.body }, "Creating new order");
      const order = await orderService.create(req.body);
      logger.info({ orderId: order.id }, "Order created successfully");
      sendSuccess(res, order, "Order created successfully", 201);
    } catch (error) {
      logger.error(error, "Failed to create order");
      const message = (error as Error).message;
      const status = message.includes("not found") ? 404 : 400;
      sendError(res, error as Error, status);
    }
  },

  async update(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      logger.info({ id, body: req.body }, "Updating order");
      const order = await orderService.update(id, req.body);
      logger.info({ orderId: order.id }, "Order updated successfully");
      sendSuccess(res, order, "Order updated successfully");
    } catch (error) {
      logger.error(error, "Failed to update order");
      const message = (error as Error).message;
      const status = message === "Order not found" ? 404 : 400;
      sendError(res, error as Error, status);
    }
  },

  async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      logger.info({ id }, "Deleting order");
      const order = await orderService.delete(id);
      logger.info({ orderId: order.id }, "Order deleted successfully");
      sendSuccess(res, order, "Order deleted successfully");
    } catch (error) {
      logger.error(error, "Failed to delete order");
      const status = (error as Error).message === "Order not found" ? 404 : 500;
      sendError(res, error as Error, status);
    }
  },
};
