// ──────────────────────────────────────────────
// Service: Shop Settings — Business Logic
// ──────────────────────────────────────────────

import { z } from "zod";
import { settingDao } from "../dao/setting.dao.js";

// ── Validation Schemas ──────────────────────

const updateSettingSchema = z.object({
  shopName: z.string().min(1, "Shop name cannot be empty").optional(),
  address: z.string().optional().nullable(),
  gstin: z.string().max(15, "GSTIN must be max 15 characters").optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email format").optional().nullable().or(z.literal("")),
  upiId: z.string().optional().nullable(),
  invoicePrefix: z.string().min(1, "Invoice prefix cannot be empty").optional(),
  billTerms: z.string().optional().nullable(),
});

// ── Service ─────────────────────────────────

export const settingService = {
  async get() {
    return settingDao.get();
  },

  async update(data: unknown) {
    const validated = updateSettingSchema.parse(data);
    
    const payload = {
      ...validated,
      ...(validated.email === "" ? { email: null } : {}),
    };

    return settingDao.update(payload);
  },
};
