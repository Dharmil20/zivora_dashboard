// ──────────────────────────────────────────────
// Service: Inventory Ledger — Business Logic
// ──────────────────────────────────────────────

import { z } from "zod";
import { inventoryDao } from "../dao/inventory.dao.js";
import { productDao } from "../dao/product.dao.js";

// ── Validation Schemas ──────────────────────

const manualAdjustmentSchema = z.object({
  variantId: z.string().uuid("Invalid variant ID"),
  quantity: z.number().int().refine((v) => v !== 0, {
    message: "Adjustment quantity cannot be zero",
  }),
});

// ── Service ─────────────────────────────────

export const inventoryService = {
  async getLedger(filters?: { variantId?: string; transactionType?: string }) {
    if (filters?.variantId) {
      // Validate variant exists
      const variant = await productDao.findVariantById(filters.variantId);
      if (!variant) {
        throw new Error("Product variant not found");
      }
    }
    return inventoryDao.findAll(filters);
  },

  async adjustStock(data: unknown) {
    const validated = manualAdjustmentSchema.parse(data);
    return inventoryDao.adjustStock(validated.variantId, validated.quantity);
  },
};
