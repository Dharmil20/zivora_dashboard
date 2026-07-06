// ──────────────────────────────────────────────
// Shop Setting DTOs / Interfaces
// ──────────────────────────────────────────────

export interface ShopSetting {
  id: string;
  shopName: string;
  address: string | null;
  gstin: string | null;
  phone: string | null;
  email: string | null;
  upiId: string | null;
  invoicePrefix: string;
  billTerms: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateShopSettingDto {
  shopName?: string;
  address?: string;
  gstin?: string;
  phone?: string;
  email?: string;
  upiId?: string;
  invoicePrefix?: string;
  billTerms?: string;
}
