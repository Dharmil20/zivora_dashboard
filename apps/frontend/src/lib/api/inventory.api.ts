// ──────────────────────────────────────────────
// API: Inventory Ledger — Frontend API Layer
// ──────────────────────────────────────────────

import { apiClient } from "../api-client";
import type { InventoryTransaction, ManualStockAdjustmentDto } from "@jewellery-pos/shared-types";

export const inventoryApi = {
  /** GET /api/inventory/ledger */
  getLedger(filters?: { variantId?: string; transactionType?: string }): Promise<InventoryTransaction[]> {
    const params = new URLSearchParams();
    if (filters?.variantId) {
      params.append("variantId", filters.variantId);
    }
    if (filters?.transactionType) {
      params.append("transactionType", filters.transactionType);
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get<InventoryTransaction[]>(`/inventory/ledger${query}`);
  },

  /** POST /api/inventory/adjust */
  adjustStock(data: ManualStockAdjustmentDto): Promise<InventoryTransaction> {
    return apiClient.post<InventoryTransaction>("/inventory/adjust", data);
  },
};
