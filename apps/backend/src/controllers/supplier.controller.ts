// ──────────────────────────────────────────────
// Controller: Suppliers & Purchases — Orchestration
// ──────────────────────────────────────────────

import type { Request, Response } from "express";
import { logger } from "../utils/logger.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { supplierService } from "../services/supplier.service.js";

export const supplierController = {
  // ── Supplier Endpoints ────────────────────────

  async getAllSuppliers(_req: Request, res: Response): Promise<void> {
    try {
      logger.debug("Fetching all suppliers");
      const suppliers = await supplierService.getAllSuppliers();
      sendSuccess(res, suppliers, "Suppliers retrieved successfully");
    } catch (error) {
      logger.error(error, "Failed to fetch suppliers");
      sendError(res, error as Error);
    }
  },

  async getSupplierById(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.debug({ id }, "Fetching supplier by ID");
      const supplier = await supplierService.getSupplierById(id);
      sendSuccess(res, supplier, "Supplier retrieved successfully");
    } catch (error) {
      logger.error(error, "Failed to fetch supplier");
      const status = (error as Error).message === "Supplier not found" ? 404 : 500;
      sendError(res, error as Error, status);
    }
  },

  async createSupplier(req: Request, res: Response): Promise<void> {
    try {
      logger.info({ body: req.body }, "Creating new supplier");
      const supplier = await supplierService.createSupplier(req.body);
      logger.info({ supplierId: supplier.id }, "Supplier created successfully");
      sendSuccess(res, supplier, "Supplier created successfully", 201);
    } catch (error) {
      logger.error(error, "Failed to create supplier");
      sendError(res, error as Error, 400);
    }
  },

  async updateSupplier(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.info({ id, body: req.body }, "Updating supplier");
      const supplier = await supplierService.updateSupplier(id, req.body);
      logger.info({ supplierId: supplier.id }, "Supplier updated successfully");
      sendSuccess(res, supplier, "Supplier updated successfully");
    } catch (error) {
      logger.error(error, "Failed to update supplier");
      const status = (error as Error).message === "Supplier not found" ? 404 : 400;
      sendError(res, error as Error, status);
    }
  },

  async deleteSupplier(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.info({ id }, "Deleting supplier");
      const supplier = await supplierService.deleteSupplier(id);
      logger.info({ supplierId: supplier.id }, "Supplier deleted successfully");
      sendSuccess(res, supplier, "Supplier deleted successfully");
    } catch (error) {
      logger.error(error, "Failed to delete supplier");
      const status = (error as Error).message === "Supplier not found" ? 404 : 500;
      sendError(res, error as Error, status);
    }
  },

  // ── Purchase Invoice Endpoints ────────────────

  async getAllPurchaseInvoices(_req: Request, res: Response): Promise<void> {
    try {
      logger.debug("Fetching all purchase invoices");
      const invoices = await supplierService.getAllPurchaseInvoices();
      sendSuccess(res, invoices, "Purchase invoices retrieved successfully");
    } catch (error) {
      logger.error(error, "Failed to fetch purchase invoices");
      sendError(res, error as Error);
    }
  },

  async getPurchaseInvoiceById(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      logger.debug({ id }, "Fetching purchase invoice by ID");
      const invoice = await supplierService.getPurchaseInvoiceById(id);
      sendSuccess(res, invoice, "Purchase invoice retrieved successfully");
    } catch (error) {
      logger.error(error, "Failed to fetch purchase invoice");
      const status = (error as Error).message === "Purchase invoice not found" ? 404 : 500;
      sendError(res, error as Error, status);
    }
  },

  async createPurchaseInvoice(req: Request, res: Response): Promise<void> {
    try {
      logger.info({ body: req.body }, "Recording new purchase invoice");
      const invoice = await supplierService.createPurchaseInvoice(req.body);
      logger.info({ invoiceId: invoice.id }, "Purchase invoice recorded successfully");
      sendSuccess(res, invoice, "Purchase invoice recorded successfully", 201);
    } catch (error) {
      logger.error(error, "Failed to record purchase invoice");
      const message = (error as Error).message;
      const status = message.includes("not found") ? 404 : 400;
      sendError(res, error as Error, status);
    }
  },
};
