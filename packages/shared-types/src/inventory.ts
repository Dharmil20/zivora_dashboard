// ──────────────────────────────────────────────
// Inventory DTOs / Interfaces
// ──────────────────────────────────────────────

export interface InventoryTransaction {
  id: string;
  variantId: string;
  transactionType: "PURCHASE" | "SALE" | "RETURN" | "MANUAL_ADJUSTMENT";
  referenceType: "bill" | "purchase_invoice" | "manual" | "initial";
  referenceId: string | null;
  quantity: number;
  createdAt: string;
}

export interface ManualStockAdjustmentDto {
  variantId: string;
  quantity: number; // Positive to add stock, negative to subtract
  reason?: string;
}
