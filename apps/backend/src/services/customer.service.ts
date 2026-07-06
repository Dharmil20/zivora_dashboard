// ──────────────────────────────────────────────
// Service: Customers — All Business Logic
// ──────────────────────────────────────────────

import { z } from "zod";
import { customerDao } from "../dao/customer.dao.js";
import type { SelectCustomer } from "../dao/customer.dao.js";

// ── Validation Schemas ──────────────────────

const createCustomerSchema = z.object({
  id: z.string().uuid("Invalid customer ID format").optional(),
  name: z.string().min(1, "Name is required"),
  mobile: z.string().min(10, "Mobile number must be at least 10 characters"),
  email: z.string().email("Invalid email format").optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  mobile: z.string().min(10).optional(),
  email: z.string().email("Invalid email format").optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// ── Service ─────────────────────────────────

export const customerService = {
  async getAll(search?: string): Promise<SelectCustomer[]> {
    return customerDao.findAll(search);
  },

  async getById(id: string): Promise<SelectCustomer> {
    const customer = await customerDao.findById(id);
    if (!customer) {
      throw new Error("Customer not found");
    }
    return customer;
  },

  async create(data: unknown): Promise<SelectCustomer> {
    const validated = createCustomerSchema.parse(data);

    // Business rule: unique mobile check
    const existing = await customerDao.findByMobile(validated.mobile);
    if (existing) {
      throw new Error(`Customer with mobile number "${validated.mobile}" already exists.`);
    }

    // Convert empty email to null
    const payload = {
      ...validated,
      email: validated.email || null,
    };

    return customerDao.create(payload);
  },

  async update(id: string, data: unknown): Promise<SelectCustomer> {
    const validated = updateCustomerSchema.parse(data);

    const existing = await customerDao.findById(id);
    if (!existing) {
      throw new Error("Customer not found");
    }

    if (validated.mobile && validated.mobile !== existing.mobile) {
      const isMobileTaken = await customerDao.findByMobile(validated.mobile);
      if (isMobileTaken) {
        throw new Error(`Customer with mobile number "${validated.mobile}" already exists.`);
      }
    }

    const payload = {
      ...validated,
      ...(validated.email === "" ? { email: null } : {}),
    };

    const updated = await customerDao.update(id, payload);
    if (!updated) {
      throw new Error("Failed to update customer");
    }
    return updated;
  },

  async delete(id: string): Promise<SelectCustomer> {
    const deleted = await customerDao.delete(id);
    if (!deleted) {
      throw new Error("Customer not found");
    }
    return deleted;
  },
};
