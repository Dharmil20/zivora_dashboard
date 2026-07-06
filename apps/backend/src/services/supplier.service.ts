// ──────────────────────────────────────────────
// Service: Suppliers & Purchases — Business Logic
// ──────────────────────────────────────────────

import { z } from "zod";
import { supplierDao } from "../dao/supplier.dao.js";
import { productDao } from "../dao/product.dao.js";
import type { SelectSupplier, SelectPurchaseInvoice } from "../dao/supplier.dao.js";

// ── Validation Schemas ──────────────────────

const createSupplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactPerson: z.string().optional().nullable(),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Invalid email format").optional().nullable().or(z.literal("")),
  gstin: z.string().max(15, "GSTIN must be max 15 characters").optional().nullable(),
});

const updateSupplierSchema = z.object({
  name: z.string().min(1).optional(),
  contactPerson: z.string().optional().nullable(),
  phone: z.string().min(10).optional(),
  email: z.string().email("Invalid email format").optional().nullable().or(z.literal("")),
  gstin: z.string().max(15).optional().nullable(),
});

const purchaseInvoiceItemSchema = z.object({
  variantId: z.string().uuid("Invalid variant ID"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  costPrice: z.union([z.string(), z.number()]).optional().transform((v) => (v !== undefined ? String(v) : undefined)),
});

const createPurchaseInvoiceSchema = z.object({
  supplierId: z.string().uuid("Invalid supplier ID"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  purchaseDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid purchase date format",
  }),
  totalAmount: z.union([z.string(), z.number()]).transform((v) => String(v)),
  items: z.array(purchaseInvoiceItemSchema).min(1, "Invoice must contain at least one item"),
});

// ── Service ─────────────────────────────────

export const supplierService = {
  // ── Supplier Service Methods ───────────────

  async getAllSuppliers(): Promise<SelectSupplier[]> {
    return supplierDao.findAllSuppliers();
  },

  async getSupplierById(id: string): Promise<SelectSupplier> {
    const supplier = await supplierDao.findSupplierById(id);
    if (!supplier) {
      throw new Error("Supplier not found");
    }
    return supplier;
  },

  async createSupplier(data: unknown): Promise<SelectSupplier> {
    const validated = createSupplierSchema.parse(data);

    // Business rule: unique phone check
    const existing = await supplierDao.findSupplierByPhone(validated.phone);
    if (existing) {
      throw new Error(`Supplier with phone number "${validated.phone}" already exists.`);
    }

    // Convert empty email to null
    const payload = {
      ...validated,
      email: validated.email || null,
    };

    return supplierDao.createSupplier(payload);
  },

  async updateSupplier(id: string, data: unknown): Promise<SelectSupplier> {
    const validated = updateSupplierSchema.parse(data);

    const existing = await supplierDao.findSupplierById(id);
    if (!existing) {
      throw new Error("Supplier not found");
    }

    if (validated.phone && validated.phone !== existing.phone) {
      const isPhoneTaken = await supplierDao.findSupplierByPhone(validated.phone);
      if (isPhoneTaken) {
        throw new Error(`Supplier with phone number "${validated.phone}" already exists.`);
      }
    }

    const payload = {
      ...validated,
      ...(validated.email === "" ? { email: null } : {}),
    };

    const updated = await supplierDao.updateSupplier(id, payload);
    if (!updated) {
      throw new Error("Failed to update supplier");
    }
    return updated;
  },

  async deleteSupplier(id: string): Promise<SelectSupplier> {
    const deleted = await supplierDao.deleteSupplier(id);
    if (!deleted) {
      throw new Error("Supplier not found");
    }
    return deleted;
  },

  // ── Purchase Invoice Service Methods ────────

  async getAllPurchaseInvoices(): Promise<SelectPurchaseInvoice[]> {
    return supplierDao.findAllPurchaseInvoices();
  },

  async getPurchaseInvoiceById(id: string): Promise<SelectPurchaseInvoice> {
    const invoice = await supplierDao.findPurchaseInvoiceById(id);
    if (!invoice) {
      throw new Error("Purchase invoice not found");
    }
    return invoice;
  },

  async createPurchaseInvoice(data: unknown): Promise<SelectPurchaseInvoice> {
    const validated = createPurchaseInvoiceSchema.parse(data);

    // Business rule: Supplier must exist
    const supplier = await supplierDao.findSupplierById(validated.supplierId);
    if (!supplier) {
      throw new Error("Supplier not found");
    }

    // Business rule: All variant items must exist
    for (const item of validated.items) {
      const variant = await productDao.findVariantById(item.variantId);
      if (!variant) {
        throw new Error(`Product variant with ID ${item.variantId} does not exist`);
      }
    }

    // Transform costPrice from string back to number if needed for item array format in DAO
    const itemsPayload = validated.items.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity,
      costPrice: item.costPrice ? Number(item.costPrice) : undefined,
    }));

    return supplierDao.createPurchaseInvoice(
      {
        supplierId: validated.supplierId,
        invoiceNumber: validated.invoiceNumber,
        purchaseDate: validated.purchaseDate,
        totalAmount: validated.totalAmount,
      },
      itemsPayload,
    );
  },
};
