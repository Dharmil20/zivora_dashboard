// ──────────────────────────────────────────────
// Controller: Inventory Ledger — Orchestration
// ──────────────────────────────────────────────

import type { Request, Response } from "express";
import { logger } from "../utils/logger.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { inventoryService } from "../services/inventory.service.js";

export const inventoryController = {
  async getLedger(req: Request, res: Response): Promise<void> {
    try {
      const { variantId, transactionType } = req.query;
      logger.debug({ variantId, transactionType }, "Fetching inventory ledger");
      const ledger = await inventoryService.getLedger({
        variantId: variantId as string | undefined,
        transactionType: transactionType as string | undefined,
      });
      sendSuccess(res, ledger, "Inventory ledger retrieved successfully");
    } catch (error) {
      logger.error(error, "Failed to fetch inventory ledger");
      sendError(res, error as Error);
    }
  },

  async adjustStock(req: Request, res: Response): Promise<void> {
    try {
      logger.info({ body: req.body }, "Adjusting stock levels manually");
      const txn = await inventoryService.adjustStock(req.body);
      logger.info({ txnId: txn.id }, "Stock adjusted successfully");
      sendSuccess(res, txn, "Stock adjusted successfully", 201);
    } catch (error) {
      logger.error(error, "Failed to adjust stock");
      const message = (error as Error).message;
      const status = message.includes("not found") ? 404 : 400;
      sendError(res, error as Error, status);
    }
  },
};
