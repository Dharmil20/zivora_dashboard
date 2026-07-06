// ──────────────────────────────────────────────
// Controller: Products & Variants — Orchestration
// ──────────────────────────────────────────────

import type { Request, Response } from "express";
import { logger } from "../utils/logger.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { productService } from "../services/product.service.js";

export const productController = {
  // ── Product Endpoints ─────────────────────────

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const categoryId = req.query.categoryId as string | undefined;
      const isActive = req.query.isActive === undefined ? undefined : req.query.isActive === "true";
      logger.debug({ categoryId, isActive }, "Fetching products");
      const products = await productService.getAll({ categoryId, isActive });
      sendSuccess(res, products, "Products retrieved successfully");
    } catch (error) {
      logger.error(error, "Failed to fetch products");
      sendError(res, error as Error);
    }
  },

  async getById(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.debug({ id }, "Fetching product by ID");
      const product = await productService.getById(id);
      sendSuccess(res, product, "Product retrieved successfully");
    } catch (error) {
      logger.error(error, "Failed to fetch product");
      const status = (error as Error).message === "Product not found" ? 404 : 500;
      sendError(res, error as Error, status);
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      logger.info({ body: req.body }, "Creating new product");
      const product = await productService.create(req.body);
      logger.info({ productId: product.id }, "Product created successfully");
      sendSuccess(res, product, "Product created successfully", 201);
    } catch (error) {
      logger.error(error, "Failed to create product");
      const message = (error as Error).message;
      const status = message.includes("not found") ? 404 : 400;
      sendError(res, error as Error, status);
    }
  },

  async update(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.info({ id, body: req.body }, "Updating product");
      const product = await productService.update(id, req.body);
      logger.info({ productId: product.id }, "Product updated successfully");
      sendSuccess(res, product, "Product updated successfully");
    } catch (error) {
      logger.error(error, "Failed to update product");
      const message = (error as Error).message;
      const status = message === "Product not found" ? 404 : 400;
      sendError(res, error as Error, status);
    }
  },

  async delete(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.info({ id }, "Soft deleting product");
      const product = await productService.delete(id);
      logger.info({ productId: product.id }, "Product deleted successfully");
      sendSuccess(res, product, "Product deleted successfully");
    } catch (error) {
      logger.error(error, "Failed to delete product");
      const status = (error as Error).message === "Product not found" ? 404 : 500;
      sendError(res, error as Error, status);
    }
  },

  // ── Variant Endpoints ─────────────────────────

  async getVariantById(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.debug({ id }, "Fetching variant by ID");
      const variant = await productService.getVariantById(id);
      sendSuccess(res, variant, "Variant retrieved successfully");
    } catch (error) {
      logger.error(error, "Failed to fetch variant");
      const status = (error as Error).message === "Product variant not found" ? 404 : 500;
      sendError(res, error as Error, status);
    }
  },

  async getVariantBySku(req: Request<{ sku: string }>, res: Response): Promise<void> {
    try {
      const { sku } = req.params;
      logger.debug({ sku }, "Fetching variant by SKU");
      const variant = await productService.getVariantBySku(sku);
      sendSuccess(res, variant, "Variant retrieved successfully");
    } catch (error) {
      logger.error(error, "Failed to fetch variant by SKU");
      const status = (error as Error).message.includes("not found") ? 404 : 500;
      sendError(res, error as Error, status);
    }
  },

  async addVariant(req: Request<{ productId: string }>, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      logger.info({ productId, body: req.body }, "Adding variant to product");
      const variant = await productService.addVariant(productId, req.body);
      logger.info({ variantId: variant.id }, "Variant added successfully");
      sendSuccess(res, variant, "Variant added successfully", 201);
    } catch (error) {
      logger.error(error, "Failed to add variant");
      const message = (error as Error).message;
      const status = message.includes("not found") ? 404 : 400;
      sendError(res, error as Error, status);
    }
  },

  async updateVariant(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.info({ id, body: req.body }, "Updating variant");
      const variant = await productService.updateVariant(id, req.body);
      logger.info({ variantId: variant.id }, "Variant updated successfully");
      sendSuccess(res, variant, "Variant updated successfully");
    } catch (error) {
      logger.error(error, "Failed to update variant");
      const message = (error as Error).message;
      const status = message === "Product variant not found" ? 404 : 400;
      sendError(res, error as Error, status);
    }
  },

  async deleteVariant(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.info({ id }, "Soft deleting variant");
      const variant = await productService.deleteVariant(id);
      logger.info({ variantId: variant.id }, "Variant deleted successfully");
      sendSuccess(res, variant, "Variant deleted successfully");
    } catch (error) {
      logger.error(error, "Failed to delete variant");
      const status = (error as Error).message === "Product variant not found" ? 404 : 500;
      sendError(res, error as Error, status);
    }
  },
};
