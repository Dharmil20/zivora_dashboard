// ──────────────────────────────────────────────
// API: Shop Settings — Frontend API Layer
// ──────────────────────────────────────────────

import { apiClient } from "../api-client";
import type { ShopSetting, UpdateShopSettingDto } from "@jewellery-pos/shared-types";

export const settingApi = {
  /** GET /api/settings */
  get(): Promise<ShopSetting> {
    return apiClient.get<ShopSetting>("/settings");
  },

  /** PUT /api/settings */
  update(data: UpdateShopSettingDto): Promise<ShopSetting> {
    return apiClient.put<ShopSetting>("/settings", data);
  },
};
