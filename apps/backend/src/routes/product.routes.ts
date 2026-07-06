// ──────────────────────────────────────────────
// Routes: Products & Variants — Endpoint Wiring Only
// ──────────────────────────────────────────────

import { Router } from "express";
import { productController } from "../controllers/product.controller.js";

export const productRouter = Router();

// Product CRUD
productRouter.get("/", productController.getAll);
productRouter.get("/:id", productController.getById);
productRouter.post("/", productController.create);
productRouter.put("/:id", productController.update);
productRouter.delete("/:id", productController.delete);

// Variant Specific operations
productRouter.get("/variants/:id", productController.getVariantById);
productRouter.get("/variants/sku/:sku", productController.getVariantBySku);
productRouter.post("/:productId/variants", productController.addVariant);
productRouter.put("/variants/:id", productController.updateVariant);
productRouter.delete("/variants/:id", productController.deleteVariant);
