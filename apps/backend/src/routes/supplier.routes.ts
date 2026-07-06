// ──────────────────────────────────────────────
// Routes: Suppliers & Purchases — Endpoint Wiring Only
// ──────────────────────────────────────────────

import { Router } from "express";
import { supplierController } from "../controllers/supplier.controller.js";

export const supplierRouter = Router();

supplierRouter.get("/", supplierController.getAllSuppliers);
supplierRouter.get("/:id", supplierController.getSupplierById);
supplierRouter.post("/", supplierController.createSupplier);
supplierRouter.put("/:id", supplierController.updateSupplier);
supplierRouter.delete("/:id", supplierController.deleteSupplier);

export const purchaseRouter = Router();

purchaseRouter.get("/", supplierController.getAllPurchaseInvoices);
purchaseRouter.get("/:id", supplierController.getPurchaseInvoiceById);
purchaseRouter.post("/", supplierController.createPurchaseInvoice);
