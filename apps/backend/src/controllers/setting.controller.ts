// ──────────────────────────────────────────────
// Controller: Shop Settings — Orchestration
// ──────────────────────────────────────────────

import type { Request, Response } from "express";
import { logger } from "../utils/logger.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { settingService } from "../services/setting.service.js";

export const settingController = {
  async get(_req: Request, res: Response): Promise<void> {
    try {
      logger.debug("Fetching shop settings");
      const settings = await settingService.get();
      sendSuccess(res, settings, "Shop settings retrieved successfully");
    } catch (error) {
      logger.error(error, "Failed to fetch shop settings");
      sendError(res, error as Error);
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      logger.info({ body: req.body }, "Updating shop settings");
      const settings = await settingService.update(req.body);
      logger.info({ settingsId: settings.id }, "Shop settings updated successfully");
      sendSuccess(res, settings, "Shop settings updated successfully");
    } catch (error) {
      logger.error(error, "Failed to update shop settings");
      sendError(res, error as Error, 400);
    }
  },

  async reset(_req: Request, res: Response): Promise<void> {
    try {
      logger.warn("Resetting all database data");
      await settingService.reset();
      sendSuccess(res, null, "All database data reset successfully");
    } catch (error) {
      logger.error(error, "Failed to reset database data");
      sendError(res, error as Error);
    }
  },
};
