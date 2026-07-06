// ──────────────────────────────────────────────
// Controller: Bills & Sales — Orchestration
// ──────────────────────────────────────────────

import type { Request, Response } from "express";
import { logger } from "../utils/logger.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { billService } from "../services/bill.service.js";

export const billController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { customerId, startDate, endDate, paymentStatus, billStatus } = req.query;
      logger.debug(
        { customerId, startDate, endDate, paymentStatus, billStatus },
        "Fetching bills",
      );
      const bills = await billService.getAll({
        customerId: customerId as string | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        paymentStatus: paymentStatus as string | undefined,
        billStatus: billStatus as string | undefined,
      });
      sendSuccess(res, bills, "Bills retrieved successfully");
    } catch (error) {
      logger.error(error, "Failed to fetch bills");
      sendError(res, error as Error);
    }
  },

  async getById(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.debug({ id }, "Fetching bill by ID");
      const bill = await billService.getById(id);
      sendSuccess(res, bill, "Bill retrieved successfully");
    } catch (error) {
      logger.error(error, "Failed to fetch bill");
      const status = (error as Error).message === "Bill not found" ? 404 : 500;
      sendError(res, error as Error, status);
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      logger.info({ body: req.body }, "Creating new bill");
      const bill = await billService.create(req.body);
      logger.info({ billId: bill.id }, "Bill created successfully");
      sendSuccess(res, bill, "Bill created successfully", 201);
    } catch (error) {
      logger.error(error, "Failed to create bill");
      const message = (error as Error).message;
      const status = message.includes("not found") ? 404 : message.includes("stock") ? 400 : 400;
      sendError(res, error as Error, status);
    }
  },

  async addPayment(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.info({ id, body: req.body }, "Adding payment to bill");
      const payment = await billService.addPayment(id, req.body);
      logger.info({ paymentId: payment.id }, "Payment recorded successfully");
      sendSuccess(res, payment, "Payment recorded successfully", 201);
    } catch (error) {
      logger.error(error, "Failed to add payment to bill");
      const message = (error as Error).message;
      const status = message === "Bill not found" ? 404 : 400;
      sendError(res, error as Error, status);
    }
  },

  async cancel(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.info({ id }, "Cancelling bill");
      const bill = await billService.cancel(id);
      logger.info({ billId: bill.id }, "Bill cancelled successfully");
      sendSuccess(res, bill, "Bill cancelled successfully");
    } catch (error) {
      logger.error(error, "Failed to cancel bill");
      const status = (error as Error).message === "Bill not found" ? 404 : 400;
      sendError(res, error as Error, status);
    }
  },
};
