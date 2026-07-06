// ──────────────────────────────────────────────
// Controller: Categories — Orchestration & Logging
// ──────────────────────────────────────────────

import type { Request, Response } from "express";
import { logger } from "../utils/logger.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { categoryService } from "../services/category.service.js";

export const categoryController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const activeOnly = req.query.active === "true";
      logger.debug({ activeOnly }, "Fetching categories");
      const categories = await categoryService.getAll(activeOnly);
      sendSuccess(res, categories, "Categories retrieved successfully");
    } catch (error) {
      logger.error(error, "Failed to fetch categories");
      sendError(res, error as Error);
    }
  },

  async getById(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.debug({ id }, "Fetching category by ID");
      const category = await categoryService.getById(id);
      sendSuccess(res, category, "Category retrieved successfully");
    } catch (error) {
      logger.error(error, "Failed to fetch category");
      const status = (error as Error).message === "Category not found" ? 404 : 500;
      sendError(res, error as Error, status);
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      logger.info({ body: req.body }, "Creating new category");
      const category = await categoryService.create(req.body);
      logger.info({ categoryId: category.id }, "Category created successfully");
      sendSuccess(res, category, "Category created successfully", 201);
    } catch (error) {
      logger.error(error, "Failed to create category");
      sendError(res, error as Error, 400);
    }
  },

  async update(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.info({ id, body: req.body }, "Updating category");
      const category = await categoryService.update(id, req.body);
      logger.info({ categoryId: category.id }, "Category updated successfully");
      sendSuccess(res, category, "Category updated successfully");
    } catch (error) {
      logger.error(error, "Failed to update category");
      const status = (error as Error).message === "Category not found" ? 404 : 400;
      sendError(res, error as Error, status);
    }
  },

  async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.info({ id }, "Soft deleting category");
      const category = await categoryService.delete(id);
      logger.info({ categoryId: category.id }, "Category deleted successfully");
      sendSuccess(res, category, "Category deleted successfully");
    } catch (error) {
      logger.error(error, "Failed to delete category");
      const status = (error as Error).message === "Category not found" ? 404 : 500;
      sendError(res, error as Error, status);
    }
  },
};
