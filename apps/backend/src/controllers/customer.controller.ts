// ──────────────────────────────────────────────
// Controller: Customers — Orchestration & Logging
// ──────────────────────────────────────────────

import type { Request, Response } from "express";
import { logger } from "../utils/logger.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { customerService } from "../services/customer.service.js";

export const customerController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      logger.debug({ search }, "Fetching customers");
      const customers = await customerService.getAll(search);
      sendSuccess(res, customers, "Customers retrieved successfully");
    } catch (error) {
      logger.error(error, "Failed to fetch customers");
      sendError(res, error as Error);
    }
  },

  async getById(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.debug({ id }, "Fetching customer by ID");
      const customer = await customerService.getById(id);
      sendSuccess(res, customer, "Customer retrieved successfully");
    } catch (error) {
      logger.error(error, "Failed to fetch customer");
      const status = (error as Error).message === "Customer not found" ? 404 : 500;
      sendError(res, error as Error, status);
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      logger.info({ body: req.body }, "Creating new customer");
      const customer = await customerService.create(req.body);
      logger.info({ customerId: customer.id }, "Customer created successfully");
      sendSuccess(res, customer, "Customer created successfully", 201);
    } catch (error) {
      logger.error(error, "Failed to create customer");
      sendError(res, error as Error, 400);
    }
  },

  async update(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.info({ id, body: req.body }, "Updating customer");
      const customer = await customerService.update(id, req.body);
      logger.info({ customerId: customer.id }, "Customer updated successfully");
      sendSuccess(res, customer, "Customer updated successfully");
    } catch (error) {
      logger.error(error, "Failed to update customer");
      const status = (error as Error).message === "Customer not found" ? 404 : 400;
      sendError(res, error as Error, status);
    }
  },

  async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.info({ id }, "Soft deleting customer");
      const customer = await customerService.delete(id);
      logger.info({ customerId: customer.id }, "Customer deleted successfully");
      sendSuccess(res, customer, "Customer deleted successfully");
    } catch (error) {
      logger.error(error, "Failed to delete customer");
      const status = (error as Error).message === "Customer not found" ? 404 : 500;
      sendError(res, error as Error, status);
    }
  },
};
