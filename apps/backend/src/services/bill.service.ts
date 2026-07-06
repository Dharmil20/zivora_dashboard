// ──────────────────────────────────────────────
// Service: Bills & Sales — All Business Logic
// ──────────────────────────────────────────────

import { z } from "zod";
import { billDao } from "../dao/bill.dao.js";
import { customerDao } from "../dao/customer.dao.js";
import { userDao } from "../dao/user.dao.js";

// ── Validation Schemas ──────────────────────

const createBillItemSchema = z.object({
  variantId: z.string().uuid("Invalid variant ID"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  sellingPrice: z.union([z.string(), z.number()]).transform(v => String(v)),
  discount: z.union([z.string(), z.number()]).optional().default("0").transform(v => String(v)),
});

const createBillPaymentSchema = z.object({
  paymentMethod: z.enum(["CASH", "CARD", "UPI"]),
  amount: z.union([z.string(), z.number()]).transform(v => String(v)),
  transactionRef: z.string().optional().nullable(),
});

const createBillSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID").optional().nullable(),
  soldById: z.string().uuid("Invalid user ID").optional().nullable(),
  discount: z.union([z.string(), z.number()]).optional().default("0").transform(v => String(v)),
  gst: z.union([z.string(), z.number()]).optional().default("0").transform(v => String(v)),
  items: z.array(createBillItemSchema).min(1, "Bill must contain at least one item"),
  payments: z.array(createBillPaymentSchema).optional().default([]),
});

const addPaymentSchema = z.object({
  paymentMethod: z.enum(["CASH", "CARD", "UPI"]),
  amount: z.union([z.string(), z.number()]).transform(v => String(v)),
  transactionRef: z.string().optional().nullable(),
});

// ── Service ─────────────────────────────────

export const billService = {
  async getAll(filters?: {
    customerId?: string;
    startDate?: string;
    endDate?: string;
    paymentStatus?: string;
    billStatus?: string;
  }) {
    const queryFilters: {
      customerId?: string;
      startDate?: Date;
      endDate?: Date;
      paymentStatus?: string;
      billStatus?: string;
    } = {
      customerId: filters?.customerId,
      paymentStatus: filters?.paymentStatus,
      billStatus: filters?.billStatus,
    };

    if (filters?.startDate) {
      queryFilters.startDate = new Date(filters.startDate);
    }
    if (filters?.endDate) {
      queryFilters.endDate = new Date(filters.endDate);
    }

    return billDao.findAll(queryFilters);
  },

  async getById(id: string) {
    const bill = await billDao.findById(id);
    if (!bill) {
      throw new Error("Bill not found");
    }
    return bill;
  },

  async create(data: unknown) {
    const validated = createBillSchema.parse(data);

    // Business rule: customer must exist if provided
    if (validated.customerId) {
      const customer = await customerDao.findById(validated.customerId);
      if (!customer) {
        throw new Error("Customer not found");
      }
    }

    // Business rule: staff user must exist if provided
    if (validated.soldById) {
      const user = await userDao.findById(validated.soldById);
      if (!user) {
        throw new Error("User (staff) not found");
      }
    }

    return billDao.create({
      billData: {
        customerId: validated.customerId || null,
        soldById: validated.soldById || null,
        discount: validated.discount,
        gst: validated.gst,
      },
      items: validated.items,
      payments: validated.payments,
    });
  },

  async addPayment(billId: string, data: unknown) {
    const validated = addPaymentSchema.parse(data);
    return billDao.addPayment(billId, validated);
  },

  async cancel(id: string) {
    return billDao.cancel(id);
  },
};
