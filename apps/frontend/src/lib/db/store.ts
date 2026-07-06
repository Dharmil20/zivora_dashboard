/**
 * Zivora — Data Store (IndexedDB) with Backend API synchronization
 * Provides CRUD operations for all entities.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { categoryApi } from '../api/category.api';
import { productApi } from '../api/product.api';
import { customerApi } from '../api/customer.api';
import { billApi } from '../api/bill.api';
import { supplierApi } from '../api/supplier.api';
import { inventoryApi } from '../api/inventory.api';
import { settingApi } from '../api/setting.api';

const DB_NAME = 'Zivora';
const DB_VERSION = 2;

const STORES = {
  categories: 'categories',
  products: 'products',
  variants: 'variants',
  customers: 'customers',
  bills: 'bills',
  billItems: 'billItems',
  inventoryTxns: 'inventoryTxns',
  settings: 'settings',
} as const;

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORES.categories)) {
        db.createObjectStore(STORES.categories, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.products)) {
        const ps = db.createObjectStore(STORES.products, { keyPath: 'id' });
        ps.createIndex('categoryId', 'categoryId', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.variants)) {
        const vs = db.createObjectStore(STORES.variants, { keyPath: 'id' });
        vs.createIndex('productId', 'productId', { unique: false });
        vs.createIndex('sku', 'sku', { unique: false });
      } else {
        const transaction = (e.target as IDBOpenDBRequest).transaction;
        if (transaction) {
          const vs = transaction.objectStore(STORES.variants);
          if (vs.indexNames.contains('sku')) {
            vs.deleteIndex('sku');
          }
          vs.createIndex('sku', 'sku', { unique: false });
        }
      }
      if (!db.objectStoreNames.contains(STORES.customers)) {
        db.createObjectStore(STORES.customers, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.bills)) {
        const bs = db.createObjectStore(STORES.bills, { keyPath: 'id' });
        bs.createIndex('customerId', 'customerId', { unique: false });
        bs.createIndex('billDate', 'billDate', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.billItems)) {
        const bi = db.createObjectStore(STORES.billItems, { keyPath: 'id' });
        bi.createIndex('billId', 'billId', { unique: false });
        bi.createIndex('variantId', 'variantId', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.inventoryTxns)) {
        const it = db.createObjectStore(STORES.inventoryTxns, { keyPath: 'id' });
        it.createIndex('variantId', 'variantId', { unique: false });
        it.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.settings)) {
        db.createObjectStore(STORES.settings, { keyPath: 'key' });
      }
    };
    req.onsuccess = (e) => {
      dbInstance = (e.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };
    req.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
  });
}

// ---- Generic CRUD ----

async function getAll(storeName: string): Promise<any[]> {
  const idb = await openDB();
  return new Promise((resolve, reject) => {
    const txn = idb.transaction(storeName, 'readonly');
    const store = txn.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getById(storeName: string, id: string): Promise<any> {
  const idb = await openDB();
  return new Promise((resolve, reject) => {
    const txn = idb.transaction(storeName, 'readonly');
    const store = txn.objectStore(storeName);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function put(storeName: string, data: any): Promise<any> {
  const idb = await openDB();
  return new Promise((resolve, reject) => {
    const txn = idb.transaction(storeName, 'readwrite');
    const store = txn.objectStore(storeName);
    const req = store.put(data);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function deleteById(storeName: string, id: string): Promise<void> {
  const idb = await openDB();
  return new Promise((resolve, reject) => {
    const txn = idb.transaction(storeName, 'readwrite');
    const store = txn.objectStore(storeName);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function getByIndex(storeName: string, indexName: string, value: any): Promise<any[]> {
  const idb = await openDB();
  return new Promise((resolve, reject) => {
    const txn = idb.transaction(storeName, 'readonly');
    const store = txn.objectStore(storeName);
    const index = store.index(indexName);
    const req = index.getAll(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ---- Helper: Generate ID ----
function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() :
    'xxxx-xxxx-xxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));
}

function generateBillNumber(): string {
  const now = new Date();
  const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const seq = Date.now().toString().slice(-6);
  return `INV-${fy}-${seq}`;
}

function generateSKU(category: string, product: string, variant: string): string {
  const cat = (category || 'XX').substring(0, 3).toUpperCase();
  const prod = (product || 'XX').substring(0, 4).toUpperCase();
  const v = (variant || '').substring(0, 4).toUpperCase();
  const rand = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${cat}-${prod}-${v}-${rand}`.replace(/\s/g, '');
}

function normalizeBill(b: any): any {
  if (!b) return b;
  return {
    ...b,
    id: b.id,
    billNumber: b.billNumber,
    customerId: b.customerId,
    soldById: b.soldById,
    billDate: b.billDate || b.createdAt,
    status: b.billStatus || b.status || 'COMPLETED',
    subtotal: Number(b.subtotal || 0),
    discountAmount: Number(b.discountAmount ?? b.discount ?? 0),
    taxAmount: Number(b.taxAmount ?? b.gst ?? 0),
    totalAmount: Number(b.totalAmount ?? b.total ?? 0),
    amountPaid: Number(b.amountPaid || 0),
    amountDue: Number(b.amountDue || 0),
    paymentStatus: b.paymentStatus || 'PAID',
    paymentMethod: b.paymentMethod || (b.payments?.[0]?.paymentMethod) || 'CASH',
    items: b.items ? b.items.map(normalizeBillItem) : undefined,
  };
}

function normalizeBillItem(item: any): any {
  if (!item) return item;
  return {
    ...item,
    id: item.id,
    billId: item.billId,
    variantId: item.variantId,
    quantity: Number(item.quantity || 0),
    unitPrice: Number(item.unitPrice ?? item.sellingPrice ?? 0),
    costPriceAtSale: Number(item.costPriceAtSale ?? item.costPriceSnapshot ?? 0),
    discountAmount: Number(item.discountAmount ?? item.discount ?? 0),
    totalPrice: Number(item.totalPrice ?? item.total ?? 0),
  };
}

// ---- Domain API ----
export const db = {
  // Categories
  async getCategories() {
    try {
      const cats = await categoryApi.getAll();
      for (const cat of cats) {
        await put(STORES.categories, cat);
      }
      return cats;
    } catch (err) {
      console.warn("Backend failed, falling back to IndexedDB for categories:", err);
      return getAll(STORES.categories);
    }
  },

  async getCategory(id: string) {
    try {
      const cat = await categoryApi.getById(id);
      await put(STORES.categories, cat);
      return cat;
    } catch (err) {
      console.warn("Backend failed, falling back to IndexedDB for category:", err);
      return getById(STORES.categories, id);
    }
  },

  async saveCategory(cat: any) {
    try {
      let res;
      if (cat.id) {
        try {
          res = await categoryApi.update(cat.id, cat);
        } catch (err: any) {
          if (err.message?.includes("404") || err.message?.includes("not found")) {
            res = await categoryApi.create(cat);
          } else {
            throw err;
          }
        }
      } else {
        res = await categoryApi.create(cat);
      }
      await put(STORES.categories, res);
      return res;
    } catch (err) {
      console.warn("Backend save failed, using IndexedDB fallback:", err);
      if (!cat.id) cat.id = generateId();
      if (!cat.createdAt) cat.createdAt = new Date().toISOString();
      cat.updatedAt = new Date().toISOString();
      await put(STORES.categories, cat);
      return cat;
    }
  },

  async deleteCategory(id: string) {
    try {
      const res = await categoryApi.delete(id);
      await put(STORES.categories, res);
      return res;
    } catch (err) {
      console.warn("Backend delete failed, using IndexedDB fallback:", err);
      return deleteById(STORES.categories, id);
    }
  },

  // Products
  async getProducts() {
    try {
      const prods = await productApi.getAll();
      for (const p of prods) {
        const { variants, ...prodData } = p;
        await put(STORES.products, prodData);
      }
      return prods;
    } catch (err) {
      console.warn("Backend failed, falling back to IndexedDB for products:", err);
      return getAll(STORES.products);
    }
  },

  async getProduct(id: string) {
    try {
      const prod = await productApi.getById(id);
      const { variants, ...prodData } = prod;
      await put(STORES.products, prodData);
      if (variants) {
        for (const v of variants) {
          await put(STORES.variants, v);
        }
      }
      return prod;
    } catch (err) {
      console.warn("Backend failed, falling back to IndexedDB for product:", err);
      return getById(STORES.products, id);
    }
  },

  async getProductsByCategory(catId: string) {
    try {
      return await productApi.getAll({ categoryId: catId });
    } catch (err) {
      console.warn("Backend failed, falling back to IndexedDB for products by category:", err);
      return getByIndex(STORES.products, 'categoryId', catId);
    }
  },

  async saveProduct(prod: any) {
    try {
      let res;
      if (prod.id) {
        try {
          res = await productApi.update(prod.id, prod);
        } catch (err: any) {
          if (err.message?.includes("404") || err.message?.includes("not found")) {
            res = await productApi.create(prod);
          } else {
            throw err;
          }
        }
      } else {
        res = await productApi.create(prod);
      }
      const { variants, ...prodData } = res;
      await put(STORES.products, prodData);
      return res;
    } catch (err) {
      console.warn("Backend save failed, using IndexedDB fallback:", err);
      if (!prod.id) prod.id = generateId();
      if (!prod.createdAt) prod.createdAt = new Date().toISOString();
      prod.updatedAt = new Date().toISOString();
      await put(STORES.products, prod);
      return prod;
    }
  },

  async deleteProduct(id: string) {
    try {
      const res = await productApi.delete(id);
      const { variants, ...prodData } = res;
      await put(STORES.products, prodData);
      return res;
    } catch (err) {
      console.warn("Backend delete failed, using IndexedDB fallback:", err);
      return deleteById(STORES.products, id);
    }
  },

  // Variants
  async getVariants() {
    try {
      const prods = await productApi.getAll();
      const allVariants: any[] = [];
      prods.forEach(p => {
        if (p.variants) {
          allVariants.push(...p.variants);
        }
      });
      for (const v of allVariants) {
        await put(STORES.variants, v);
      }
      return allVariants;
    } catch (err) {
      console.warn("Backend failed, falling back to IndexedDB for variants:", err);
      return getAll(STORES.variants);
    }
  },

  async getVariant(id: string) {
    try {
      const v = await productApi.getVariantById(id);
      await put(STORES.variants, v);
      return v;
    } catch (err) {
      console.warn("Backend failed, falling back to IndexedDB for variant:", err);
      return getById(STORES.variants, id);
    }
  },

  async getVariantsByProduct(prodId: string) {
    try {
      const prod = await productApi.getById(prodId);
      return prod.variants || [];
    } catch (err) {
      console.warn("Backend failed, falling back to IndexedDB for variants by product:", err);
      return getByIndex(STORES.variants, 'productId', prodId);
    }
  },

  async saveVariant(v: any) {
    try {
      let res;
      if (v.id) {
        try {
          res = await productApi.updateVariant(v.id, v);
        } catch (err: any) {
          if (err.message?.includes("404") || err.message?.includes("not found")) {
            res = await productApi.addVariant(v.productId, v);
          } else {
            throw err;
          }
        }
      } else {
        res = await productApi.addVariant(v.productId, v);
      }
      await put(STORES.variants, res);
      return res;
    } catch (err) {
      console.warn("Backend save failed, using IndexedDB fallback:", err);
      if (!v.id) v.id = generateId();
      if (!v.sku) v.sku = generateSKU('', '', v.id.substring(0, 6));
      if (!v.createdAt) v.createdAt = new Date().toISOString();
      v.updatedAt = new Date().toISOString();
      await put(STORES.variants, v);
      return v;
    }
  },

  async deleteVariant(id: string) {
    try {
      const res = await productApi.deleteVariant(id);
      await put(STORES.variants, res);
      return res;
    } catch (err) {
      console.warn("Backend delete failed, using IndexedDB fallback:", err);
      return deleteById(STORES.variants, id);
    }
  },

  // Customers
  async getCustomers() {
    try {
      const custs = await customerApi.getAll();
      for (const c of custs) {
        await put(STORES.customers, c);
      }
      return custs;
    } catch (err) {
      console.warn("Backend failed, falling back to IndexedDB for customers:", err);
      return getAll(STORES.customers);
    }
  },

  async getCustomer(id: string) {
    try {
      const c = await customerApi.getById(id);
      await put(STORES.customers, c);
      return c;
    } catch (err) {
      console.warn("Backend failed, falling back to IndexedDB for customer:", err);
      return getById(STORES.customers, id);
    }
  },

  async saveCustomer(c: any) {
    try {
      let res;
      if (c.id) {
        try {
          res = await customerApi.update(c.id, c);
        } catch (err: any) {
          if (err.message?.includes("404") || err.message?.includes("not found")) {
            res = await customerApi.create(c);
          } else {
            throw err;
          }
        }
      } else {
        res = await customerApi.create(c);
      }
      await put(STORES.customers, res);
      return res;
    } catch (err) {
      console.warn("Backend save failed, using IndexedDB fallback:", err);
      if (!c.id) c.id = generateId();
      if (!c.createdAt) c.createdAt = new Date().toISOString();
      c.updatedAt = new Date().toISOString();
      await put(STORES.customers, c);
      return c;
    }
  },

  async deleteCustomer(id: string) {
    try {
      const res = await customerApi.delete(id);
      await put(STORES.customers, res);
      return res;
    } catch (err) {
      console.warn("Backend delete failed, using IndexedDB fallback:", err);
      return deleteById(STORES.customers, id);
    }
  },

  // Bills
  async getBills() {
    try {
      const billsData = await billApi.getAll();
      const normalized = billsData.map(normalizeBill);
      for (const b of normalized) {
        await put(STORES.bills, b);
      }
      return normalized;
    } catch (err) {
      console.warn("Backend failed, falling back to IndexedDB for bills:", err);
      const billsData = await getAll(STORES.bills);
      return billsData.map(normalizeBill);
    }
  },

  async getBill(id: string) {
    try {
      const b = await billApi.getById(id);
      const normalizedBill = normalizeBill(b);
      await put(STORES.bills, normalizedBill);
      if (b.items) {
        for (const item of b.items) {
          await put(STORES.billItems, normalizeBillItem(item));
        }
      }
      return normalizedBill;
    } catch (err) {
      console.warn("Backend failed, falling back to IndexedDB for bill:", err);
      const b = await getById(STORES.bills, id);
      return normalizeBill(b);
    }
  },

  async getBillsByCustomer(custId: string) {
    try {
      const billsData = await billApi.getAll({ customerId: custId });
      return billsData.map(normalizeBill);
    } catch (err) {
      console.warn("Backend failed, falling back to IndexedDB for bills by customer:", err);
      const billsData = await getByIndex(STORES.bills, 'customerId', custId);
      return billsData.map(normalizeBill);
    }
  },

  async saveBill(b: any) {
    const normalized = normalizeBill(b);
    if (!normalized.id) normalized.id = generateId();
    if (!normalized.billNumber) normalized.billNumber = generateBillNumber();
    if (!normalized.createdAt) normalized.createdAt = new Date().toISOString();
    return put(STORES.bills, normalized);
  },

  // Bill Items
  async getBillItems(billId: string) {
    try {
      const b = await billApi.getById(billId);
      if (b.items) {
        const normalizedItems = b.items.map(normalizeBillItem);
        for (const item of normalizedItems) {
          await put(STORES.billItems, item);
        }
        return normalizedItems;
      }
      return [];
    } catch (err) {
      console.warn("Backend failed, falling back to IndexedDB for bill items:", err);
      const items = await getByIndex(STORES.billItems, 'billId', billId);
      return items.map(normalizeBillItem);
    }
  },

  async saveBillItem(item: any) {
    const normalized = normalizeBillItem(item);
    if (!normalized.id) normalized.id = generateId();
    return put(STORES.billItems, normalized);
  },

  async getAllBillItems() {
    const items = await getAll(STORES.billItems);
    return items.map(normalizeBillItem);
  },

  // Inventory Transactions
  async getInventoryTxns() {
    try {
      const txns = await inventoryApi.getLedger();
      for (const txn of txns) {
        await put(STORES.inventoryTxns, txn);
      }
      return txns;
    } catch (err) {
      console.warn("Backend failed, falling back to IndexedDB for inventory txns:", err);
      return getAll(STORES.inventoryTxns);
    }
  },

  async getInventoryTxnsByVariant(variantId: string) {
    try {
      return await inventoryApi.getLedger({ variantId });
    } catch (err) {
      console.warn("Backend failed, falling back to IndexedDB for inventory txns by variant:", err);
      return getByIndex(STORES.inventoryTxns, 'variantId', variantId);
    }
  },

  async saveInventoryTxn(txn: any) {
    if (!txn.id) txn.id = generateId();
    if (!txn.createdAt) txn.createdAt = new Date().toISOString();
    return put(STORES.inventoryTxns, txn);
  },

  // Settings
  async getSetting(key: string) {
    const s = await getById(STORES.settings, key);
    return s ? s.value : null;
  },

  async saveSetting(key: string, value: any) {
    return put(STORES.settings, { key, value });
  },

  async getShopSettings() {
    try {
      const s = await settingApi.get();
      const mappedSettings = {
        shopName: s.shopName,
        address1: s.address || '',
        address2: '',
        city: '',
        state: '',
        pincode: '',
        phone: s.phone || '',
        email: s.email || '',
        gstin: s.gstin || '',
        upiId: s.upiId || '',
        billPrefix: s.invoicePrefix || 'INV',
        billTerms: s.billTerms || 'Thank you for your purchase!\nExchange within 7 days with bill.',
      };
      await put(STORES.settings, { key: 'shop', value: mappedSettings });
      return mappedSettings;
    } catch (err) {
      console.warn("Backend failed, falling back to IndexedDB for shop settings:", err);
      return await db.getSetting('shop') || {
        shopName: 'My Jewellery Shop',
        address1: '', address2: '', city: '', state: '', pincode: '',
        phone: '', email: '', gstin: '', upiId: '',
        billPrefix: 'INV',
        billTerms: 'Thank you for your purchase!\nExchange within 7 days with bill.',
      };
    }
  },

  async saveShopSettings(settings: any) {
    try {
      const payload = {
        shopName: settings.shopName,
        address: [settings.address1, settings.address2].filter(Boolean).join(', '),
        phone: settings.phone,
        email: settings.email,
        gstin: settings.gstin,
        upiId: settings.upiId,
        invoicePrefix: settings.billPrefix,
        billTerms: settings.billTerms,
      };
      const res = await settingApi.update(payload);
      await put(STORES.settings, { key: 'shop', value: settings });
      return settings;
    } catch (err) {
      console.warn("Backend save failed, using IndexedDB fallback:", err);
      return db.saveSetting('shop', settings);
    }
  },

  // Composite: Record a sale
  async recordSale(bill: any, items: any[], customerId: string | null) {
    try {
      const dto = {
        customerId: customerId || undefined,
        soldById: undefined,
        discount: Number(bill.discountAmount || bill.discount || 0),
        gst: Number(bill.taxAmount || bill.gst || 0),
        items: items.map(item => ({
          variantId: item.variantId,
          quantity: Number(item.quantity),
          sellingPrice: Number(item.unitPrice ?? item.sellingPrice ?? 0),
          discount: Number(item.discountAmount ?? item.discount ?? 0),
        })),
        payments: [
          {
            paymentMethod: (bill.paymentMethod || 'CASH') as 'CASH' | 'CARD' | 'UPI',
            amount: Number(bill.amountPaid || bill.totalAmount || bill.total || 0),
          },
        ],
      };

      const createdBill = await billApi.create(dto);
      const normalizedBill = normalizeBill(createdBill);
      await put(STORES.bills, normalizedBill);
      
      const fullBill = await billApi.getById(createdBill.id);
      if (fullBill.items) {
        for (const item of fullBill.items) {
          await put(STORES.billItems, normalizeBillItem(item));
        }
      }

      await db.getProducts();

      return normalizedBill;
    } catch (err) {
      console.warn("Backend recordSale failed, using IndexedDB fallback:", err);
      
      const normalizedBill = normalizeBill(bill);
      normalizedBill.id = normalizedBill.id || generateId();
      normalizedBill.customerId = customerId || null;
      normalizedBill.billDate = normalizedBill.billDate || new Date().toISOString();
      normalizedBill.status = 'COMPLETED';
      
      await put(STORES.bills, normalizedBill);
      
      for (const item of items) {
        const normalizedItem = normalizeBillItem(item);
        normalizedItem.id = normalizedItem.id || generateId();
        normalizedItem.billId = normalizedBill.id;
        await put(STORES.billItems, normalizedItem);
        
        const variant = await db.getVariant(normalizedItem.variantId);
        if (variant) {
          variant.currentStock = (variant.currentStock || 0) - normalizedItem.quantity;
          await put(STORES.variants, variant);
        }
        
        await put(STORES.inventoryTxns, {
          id: generateId(),
          variantId: normalizedItem.variantId,
          transactionType: 'SALE',
          quantity: -normalizedItem.quantity,
          referenceType: 'bill',
          referenceId: normalizedBill.id,
          createdAt: new Date().toISOString(),
        });
      }
      return normalizedBill;
    }
  },

  // Composite: Add stock
  async addStock(variantId: string, quantity: number, notes: string = '') {
    try {
      await inventoryApi.adjustStock({ variantId, quantity });
      const variant = await db.getVariant(variantId);
      if (variant) {
        variant.currentStock = (variant.currentStock || 0) + quantity;
        await put(STORES.variants, variant);
      }
      return variant;
    } catch (err) {
      console.warn("Backend addStock failed, using IndexedDB fallback:", err);
      const variant = await getById(STORES.variants, variantId);
      if (!variant) throw new Error('Variant not found');
      variant.currentStock = (variant.currentStock || 0) + quantity;
      await put(STORES.variants, variant);
      await put(STORES.inventoryTxns, {
        id: generateId(),
        variantId,
        transactionType: 'PURCHASE',
        quantity,
        referenceType: 'manual',
        referenceId: null,
        createdAt: new Date().toISOString(),
      });
      return variant;
    }
  },

  // Composite: Adjust stock
  async adjustStock(variantId: string, newQty: number, reason: string = '') {
    try {
      const variant = await db.getVariant(variantId);
      if (!variant) throw new Error('Variant not found');
      const diff = newQty - (variant.currentStock || 0);
      await inventoryApi.adjustStock({ variantId, quantity: diff });
      variant.currentStock = newQty;
      await put(STORES.variants, variant);
      return variant;
    } catch (err) {
      console.warn("Backend adjustStock failed, using IndexedDB fallback:", err);
      const variant = await getById(STORES.variants, variantId);
      if (!variant) throw new Error('Variant not found');
      const diff = newQty - (variant.currentStock || 0);
      variant.currentStock = newQty;
      await put(STORES.variants, variant);
      await put(STORES.inventoryTxns, {
        id: generateId(),
        variantId,
        transactionType: 'MANUAL_ADJUSTMENT',
        quantity: diff,
        referenceType: 'manual',
        referenceId: null,
        createdAt: new Date().toISOString(),
      });
      return variant;
    }
  },

  async resetBackend() {
    await settingApi.reset();
  },

  generateId,
  generateBillNumber,
  generateSKU,
};

export default db;
