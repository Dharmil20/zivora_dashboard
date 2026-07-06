/**
 * Zivora — Seed Demo Data (TypeScript Port)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { db } from './store';

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() :
    'xxxx-xxxx-xxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));
}

function generateSKU(category: string, product: string, variant: string): string {
  const cat = (category || 'XX').substring(0, 3).toUpperCase();
  const prod = (product || 'XX').substring(0, 4).toUpperCase();
  const v = (variant || '').substring(0, 4).toUpperCase();
  const rand = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${cat}-${prod}-${v}-${rand}`.replace(/\s/g, '');
}

export async function seedDemoData() {
  const cats = await db.getCategories();
  if (cats.length > 0) return;

  const catRings = { id: generateId(), name: 'Rings', description: 'Finger rings', isActive: true };
  const catNecklaces = { id: generateId(), name: 'Necklaces', description: 'Necklaces & chains', isActive: true };
  const catEarrings = { id: generateId(), name: 'Earrings', description: 'Earrings & studs', isActive: true };
  const catBracelets = { id: generateId(), name: 'Bracelets', description: 'Bracelets & bangles', isActive: true };
  const catAnklets = { id: generateId(), name: 'Anklets', description: 'Anklets & payal', isActive: true };
  const catSets = { id: generateId(), name: 'Jewellery Sets', description: 'Complete jewellery sets', isActive: true };

  for (const c of [catRings, catNecklaces, catEarrings, catBracelets, catAnklets, catSets]) {
    await db.saveCategory(c);
  }

  const productsData = [
    { name: 'Butterfly Ring', categoryId: catRings.id, brand: 'JewelCraft', material: 'Alloy, Gold Plated', reorderLevel: 5, priceTiers: [299, 349], variants: [
      { color: 'Gold', size: 'S6', costPrice: 120, sellingPrice: 299, stock: 15 },
      { color: 'Gold', size: 'S7', costPrice: 120, sellingPrice: 299, stock: 12 },
      { color: 'Rose Gold', size: 'S6', costPrice: 140, sellingPrice: 349, stock: 8 },
    ]},
    { name: 'Pearl Necklace', categoryId: catNecklaces.id, brand: 'ElegantGems', material: 'Pearl, Alloy', reorderLevel: 3, priceTiers: [599, 649], variants: [
      { color: 'White', size: '18 inch', costPrice: 280, sellingPrice: 599, stock: 10 },
      { color: 'Cream', size: '20 inch', costPrice: 300, sellingPrice: 649, stock: 6 },
    ]},
    { name: 'Crystal Drop Earrings', categoryId: catEarrings.id, brand: 'SparkleStone', material: 'Crystal, Silver Plated', reorderLevel: 5, priceTiers: [99, 199, 249, 299], variants: [
      { color: 'Silver', finish: 'Matte', costPrice: 90, sellingPrice: 199, stock: 20 },
      { color: 'Gold', finish: 'Glossy', costPrice: 100, sellingPrice: 249, stock: 18 },
    ]},
    { name: 'Kundan Choker', categoryId: catNecklaces.id, brand: 'RoyalJewels', material: 'Kundan, Gold Plated', reorderLevel: 2, priceTiers: [799, 999], variants: [
      { color: 'Gold/Red', size: '14 inch', costPrice: 450, sellingPrice: 999, stock: 5 },
      { color: 'Gold/Green', size: '14 inch', costPrice: 450, sellingPrice: 999, stock: 4 },
    ]},
    { name: 'Charm Bracelet', categoryId: catBracelets.id, brand: 'JewelCraft', material: 'Alloy, Enamel', reorderLevel: 4, priceTiers: [199, 229, 249], variants: [
      { color: 'Silver', size: '7 inch', costPrice: 80, sellingPrice: 199, stock: 22 },
      { color: 'Gold', size: '7 inch', costPrice: 90, sellingPrice: 229, stock: 15 },
      { color: 'Rose Gold', size: '7.5 inch', costPrice: 95, sellingPrice: 249, stock: 10 },
    ]},
    { name: 'Jhumka Earrings', categoryId: catEarrings.id, brand: 'TraditionalArt', material: 'Oxidised Silver', reorderLevel: 5, priceTiers: [99, 179, 229, 399], variants: [
      { color: 'Silver', size: 'Medium', costPrice: 70, sellingPrice: 179, stock: 25 },
      { color: 'Gold', size: 'Large', costPrice: 85, sellingPrice: 229, stock: 3 },
    ]},
    { name: 'Payal Silver Anklet', categoryId: catAnklets.id, brand: 'TraditionalArt', material: 'German Silver', reorderLevel: 3, priceTiers: [199, 279, 399], variants: [
      { color: 'Silver', size: '10 inch', costPrice: 110, sellingPrice: 279, stock: 12 },
    ]},
    { name: 'Bridal Jewellery Set', categoryId: catSets.id, brand: 'RoyalJewels', material: 'Kundan, Gold Plated', reorderLevel: 1, priceTiers: [1499, 1999, 2499], variants: [
      { color: 'Gold/Red', size: 'Standard', costPrice: 1200, sellingPrice: 2499, stock: 3 },
      { color: 'Gold/Green', size: 'Standard', costPrice: 1200, sellingPrice: 2499, stock: 2 },
    ]},
    { name: 'Statement Ring', categoryId: catRings.id, brand: 'SparkleStone', material: 'CZ, Alloy', reorderLevel: 4, priceTiers: [299, 349, 399], variants: [
      { color: 'Silver', size: 'S7', costPrice: 150, sellingPrice: 349, stock: 0 },
      { color: 'Gold', size: 'S8', costPrice: 160, sellingPrice: 399, stock: 7 },
    ]},
    { name: 'Temple Necklace', categoryId: catNecklaces.id, brand: 'TraditionalArt', material: 'Gold Plated Brass', reorderLevel: 2, priceTiers: [499, 699, 799], variants: [
      { color: 'Gold', size: '16 inch', costPrice: 350, sellingPrice: 799, stock: 6 },
    ]},
  ];

  const allCats = [catRings, catNecklaces, catEarrings, catBracelets, catAnklets, catSets];

  for (const p of productsData) {
    const product: any = {
      id: generateId(), categoryId: p.categoryId, name: p.name, brand: p.brand,
      material: p.material, description: '', reorderLevel: p.reorderLevel,
      priceTiers: p.priceTiers || [], isActive: true,
    };
    await db.saveProduct(product);

    for (const v of p.variants) {
      const catObj = allCats.find(c => c.id === p.categoryId);
      const sku = generateSKU(catObj?.name || '', p.name, `${v.color}-${(v as any).size || (v as any).finish || ''}`);
      const variant: any = {
        id: generateId(), productId: product.id, sku,
        color: v.color, size: (v as any).size || '', finish: (v as any).finish || '',
        costPrice: v.costPrice, sellingPrice: v.sellingPrice,
        currentStock: v.stock, reservedStock: 0, isActive: true,
      };
      await db.saveVariant(variant);
      if (v.stock > 0) {
        await db.saveInventoryTxn({
          variantId: variant.id, transactionType: 'PURCHASE',
          quantityChange: v.stock, referenceType: 'initial',
          referenceId: null, notes: 'Initial stock',
        });
      }
    }
  }

  // Customers
  const customers = [
    { name: 'Priya Sharma', mobile: '9876543210', email: 'priya@email.com', address: '42 MG Road, Pune' },
    { name: 'Anita Patel', mobile: '9876543211', email: 'anita@email.com', address: '15 FC Road, Pune' },
    { name: 'Rekha Mehta', mobile: '9876543212', email: '', address: '' },
  ];
  for (const c of customers) {
    await db.saveCustomer({ ...c, id: generateId() });
  }

  // Sample bills for dashboard
  const allVariants = await db.getVariants();
  const allCustomers = await db.getCustomers();
  const now = new Date();

  for (let d = 6; d >= 0; d--) {
    const billCount = Math.floor(Math.random() * 3) + 1;
    for (let b = 0; b < billCount; b++) {
      const billDate = new Date(now);
      billDate.setDate(billDate.getDate() - d);
      billDate.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));

      const itemCount = Math.floor(Math.random() * 3) + 1;
      const items: any[] = [];
      let subtotal = 0;

      for (let i = 0; i < itemCount; i++) {
        const v = allVariants[Math.floor(Math.random() * allVariants.length)];
        const qty = Math.floor(Math.random() * 2) + 1;
        const total = v.sellingPrice * qty;
        subtotal += total;
        items.push({
          id: generateId(), variantId: v.id, quantity: qty,
          unitPrice: v.sellingPrice, costPriceAtSale: v.costPrice,
          discountAmount: 0, totalPrice: total,
        });
      }

      const bill: any = {
        id: generateId(),
        billNumber: `INV-${now.getFullYear()}-${String(Date.now()).slice(-6)}${d}${b}`,
        customerId: Math.random() > 0.4 ? allCustomers[Math.floor(Math.random() * allCustomers.length)].id : null,
        billDate: billDate.toISOString(),
        subtotal,
        discountAmount: 0,
        taxAmount: Math.round(subtotal * 0.03 * 100) / 100,
        totalAmount: Math.round(subtotal * 1.03 * 100) / 100,
        paymentMethod: ['CASH', 'UPI', 'CARD'][Math.floor(Math.random() * 3)],
        paymentStatus: 'PAID',
        amountPaid: Math.round(subtotal * 1.03 * 100) / 100,
        amountDue: 0,
        status: 'COMPLETED',
      };

      await db.saveBill(bill);
      for (const item of items) {
        item.billId = bill.id;
        await db.saveBillItem(item);
      }
    }
  }

  // Default shop settings
  await db.saveShopSettings({
    shopName: 'Sparkle Jewellers',
    address1: 'Shop No. 12, City Mall', address2: 'MG Road',
    city: 'Pune', state: 'Maharashtra', pincode: '411001',
    phone: '9876543210', email: 'contact@sparklejewellers.com',
    gstin: '', upiId: 'sparkle@upi', billPrefix: 'INV',
    billTerms: 'Thank you for your purchase!\nExchange within 7 days with original bill.\nNo returns on earrings.',
  });
}
