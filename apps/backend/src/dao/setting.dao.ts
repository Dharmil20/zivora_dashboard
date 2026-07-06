// ──────────────────────────────────────────────
// DAO: Shop Settings — Pure Database Access
// ──────────────────────────────────────────────

import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { shopSettings } from "../db/schema/index.js";

export type InsertShopSetting = typeof shopSettings.$inferInsert;
export type SelectShopSetting = typeof shopSettings.$inferSelect;

export const settingDao = {
  /** Fetch the singleton settings row. Creates a default one if none exists. */
  async get(): Promise<SelectShopSetting> {
    const rows = await db.select().from(shopSettings).limit(1);
    if (rows.length > 0) {
      return rows[0];
    }

    // Initialize with default setting if table is empty
    const [defaultSetting] = await db
      .insert(shopSettings)
      .values({
        shopName: "My Jewellery Shop",
        invoicePrefix: "INV",
      })
      .returning();

    return defaultSetting!;
  },

  /** Update settings. */
  async update(data: Partial<InsertShopSetting>): Promise<SelectShopSetting> {
    const current = await this.get();
    const [updated] = await db
      .update(shopSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(shopSettings.id, current.id))
      .returning();

    return updated!;
  },
};
