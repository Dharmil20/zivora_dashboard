/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useDb } from '@/context/DbProvider';
import { useToast } from '@/context/ToastProvider';
import { useModal } from '@/context/ModalProvider';
import {
  formatCurrency, getVariantLabel, getPriceTierLabel,
  escapeHtml, Variant
} from '@/lib/helpers';
import { generateBillPDF } from '@/lib/bill-pdf';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  categoryId: string;
  name: string;
  brand?: string;
  material?: string;
  reorderLevel: number;
}

interface Customer {
  id: string;
  name: string;
  mobile?: string;
  email?: string;
}

interface CartItem {
  variantId: string;
  variant: Variant;
  product: Product;
  quantity: number;
  unitPrice: number;
}

export default function BillingPage() {
  const { db, refreshKey, refresh } = useDb();
  const { showToast } = useToast();
  const { openModal, closeModal } = useModal();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // POS configurations
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [billDiscount, setBillDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');

  // Search & Category Filters on Products Grid
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | string>('all');

  // Price input editing states (per index)
  const [editingPriceIdx, setEditingPriceIdx] = useState<number | null>(null);
  const [tempPriceVal, setTempPriceVal] = useState('');

  // Fetch baseline data
  useEffect(() => {
    (async () => {
      const [v, p, c, cust] = await Promise.all([
        db.getVariants(),
        db.getProducts(),
        db.getCategories(),
        db.getCustomers(),
      ]);
      setVariants(v);
      setProducts(p);
      setCategories(c);
      setCustomers(cust);
    })();
  }, [db, refreshKey]);

  // Maps
  const productMap = useMemo(() => {
    const map: Record<string, Product> = {};
    products.forEach(p => map[p.id] = p);
    return map;
  }, [products]);

  const categoryMap = useMemo(() => {
    const map: Record<string, Category> = {};
    categories.forEach(c => map[c.id] = c);
    return map;
  }, [categories]);

  const customerMap = useMemo(() => {
    const map: Record<string, Customer> = {};
    customers.forEach(cust => map[cust.id] = cust);
    return map;
  }, [customers]);

  const selectedCustomer = selectedCustomerId ? customerMap[selectedCustomerId] : null;

  // Filtered variants to display
  const activeVariants = useMemo(() => {
    return variants.filter(v => v.isActive !== false).filter(v => {
      const prod = productMap[v.productId];
      const matchCat = activeCategoryFilter === 'all' || prod?.categoryId === activeCategoryFilter;
      const matchSearch = !searchQuery ||
        (prod?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.color || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [variants, productMap, activeCategoryFilter, searchQuery]);

  // Cart math
  const subtotal = useMemo(() => {
    return cart.reduce((s, item) => s + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const taxAmount = useMemo(() => {
    return Math.round(subtotal * 0.03 * 100) / 100;
  }, [subtotal]);

  const totalAmount = useMemo(() => {
    return Math.round((subtotal + taxAmount - billDiscount) * 100) / 100;
  }, [subtotal, taxAmount, billDiscount]);

  // Add to cart handler
  const handleAddToCart = (v: Variant) => {
    const prod = productMap[v.productId];
    if (!prod) return;

    const existingIdx = cart.findIndex(item => item.variantId === v.id);

    if (existingIdx !== -1) {
      const item = cart[existingIdx];
      if (item.quantity >= v.currentStock) {
        showToast('Not enough stock available', 'warning');
        return;
      }
      const updated = [...cart];
      updated[existingIdx] = { ...item, quantity: item.quantity + 1 };
      setCart(updated);
    } else {
      if (v.currentStock <= 0) {
        showToast('Item is out of stock', 'warning');
        return;
      }
      setCart([...cart, {
        variantId: v.id,
        variant: v,
        product: prod,
        quantity: 1,
        unitPrice: v.sellingPrice
      }]);
    }
    showToast(`Added ${prod.name} to cart`, 'success');
  };

  // Adjust cart qty
  const handleCartQty = (idx: number, delta: number) => {
    const item = cart[idx];
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      const updated = [...cart];
      updated.splice(idx, 1);
      setCart(updated);
    } else if (newQty > item.variant.currentStock) {
      showToast('Maximum available stock reached', 'warning');
    } else {
      const updated = [...cart];
      updated[idx] = { ...item, quantity: newQty };
      setCart(updated);
    }
  };

  // Price tier editing
  const commitPriceChange = (idx: number) => {
    const item = cart[idx];
    if (!item) return;

    const newPrice = parseFloat(tempPriceVal);
    const costPrice = item.variant.costPrice || 0;

    if (isNaN(newPrice) || newPrice <= 0) {
      showToast('Enter a valid price', 'error');
      setEditingPriceIdx(null);
      return;
    }
    if (newPrice < costPrice) {
      showToast(`Price cannot be less than cost price (${formatCurrency(costPrice)})`, 'error');
      setEditingPriceIdx(null);
      return;
    }

    const updated = [...cart];
    updated[idx] = { ...item, unitPrice: newPrice };
    setCart(updated);
    setEditingPriceIdx(null);
    showToast(`Price updated to ${formatCurrency(newPrice)}`, 'success');
  };

  // Select customer modal
  const handleOpenCustomerModal = () => {
    openModal({
      title: 'Select Customer',
      content: (
        <div>
          <div style={{ marginBottom: 12 }}>
            <button className="btn btn-secondary w-full" onClick={() => {
              setSelectedCustomerId(null);
              closeModal();
              showToast('Walk-in customer', 'info');
            }}>
              <span className="material-icons-round">person_outline</span> Walk-in Customer
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {customers.map(cust => (
              <div
                key={cust.id}
                className="pos-product-card customer-select-item"
                style={{ cursor: 'pointer', padding: 12, flexDirection: 'row', alignItems: 'center', display: 'flex' }}
                onClick={() => {
                  setSelectedCustomerId(cust.id);
                  closeModal();
                  showToast(`Selected: ${cust.name}`, 'success');
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gold-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--text-on-gold)', fontSize: 14, flexShrink: 0 }}>
                  {cust.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, marginLeft: 10 }}>
                  <div style={{ fontWeight: 600 }}>{cust.name}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>{cust.mobile || cust.email || ''}</div>
                </div>
                {cust.id === selectedCustomerId && <span className="badge badge-emerald">Selected</span>}
              </div>
            ))}
          </div>
        </div>
      ),
      showFooter: false
    });
  };

  // Apply discount modal
  const handleOpenDiscountModal = () => {
    let discVal = billDiscount;
    openModal({
      title: 'Apply Discount',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Discount Amount (₹)</label>
            <input
              className="form-input"
              type="number"
              min="0"
              defaultValue={billDiscount}
              onChange={(e) => { discVal = parseFloat(e.target.value) || 0; }}
            />
          </div>
        </div>
      ),
      submitLabel: 'Apply',
      onSubmit: () => {
        setBillDiscount(discVal);
        showToast(discVal > 0 ? `Discount of ${formatCurrency(discVal)} applied` : 'Discount removed', 'success');
      }
    });
  };

  // Generate POS Bill
  const handleGenerateBill = async () => {
    if (cart.length === 0) return;

    const billObj = {
      billNumber: db.generateBillNumber(),
      customerId: selectedCustomerId,
      subtotal,
      discountAmount: billDiscount,
      taxAmount,
      totalAmount,
      paymentMethod,
      paymentStatus: 'PAID',
      amountPaid: totalAmount,
      amountDue: 0
    };

    const billItems = cart.map(item => ({
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      costPriceAtSale: item.variant.costPrice,
      discountAmount: 0,
      totalPrice: item.unitPrice * item.quantity
    }));

    try {
      const savedBill = await db.recordSale(billObj, billItems, selectedCustomerId);
      showToast(`Bill ${savedBill.billNumber} generated successfully!`, 'success');

      // Pop invoice review modal
      await showBillPreviewModal(savedBill, billItems);

      // Clean Cart/POS settings
      setCart([]);
      setSelectedCustomerId(null);
      setBillDiscount(0);
      setPaymentMethod('CASH');
      refresh();
    } catch (err: any) {
      showToast('Error generating bill: ' + err.message, 'error');
    }
  };

  const showBillPreviewModal = async (bill: any, items: any[]) => {
    const shop = await db.getShopSettings();
    const customer = bill.customerId ? await db.getCustomer(bill.customerId) : null;
    const allVariants = await db.getVariants();
    const allProducts = await db.getProducts();

    const variantMap: Record<string, Variant> = {};
    allVariants.forEach((v: any) => variantMap[v.id] = v);

    const productMap: Record<string, any> = {};
    allProducts.forEach((p: any) => productMap[p.id] = p);

    const cgst = Math.round((bill.taxAmount / 2) * 100) / 100;
    const sgst = cgst;

    openModal({
      title: 'Bill Generated ✓',
      content: (
        <div className="bill-preview">
          <h2>{shop.shopName}</h2>
          <div className="bill-address">
            {shop.address1 && <>{shop.address1}<br /></>}
            {shop.city && <>{shop.city}, </>}
            {shop.state} {shop.pincode}
            <br />
            {shop.phone && <>Ph: {shop.phone}</>}
            {shop.gstin && <><br />GSTIN: {shop.gstin}</>}
          </div>
          <div style={{ borderTop: '1px dashed #ccc', paddingTop: 8, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span><strong>Invoice:</strong> {bill.billNumber}</span>
              <span>{new Date(bill.billDate).toLocaleDateString('en-IN')}</span>
            </div>
            {customer ? (
              <div>Customer: {customer.name} {customer.mobile ? `| ${customer.mobile}` : ''}</div>
            ) : (
              <div>Walk-in Customer</div>
            )}
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Rate</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const v = variantMap[item.variantId];
                const prod = v ? productMap[v.productId] : null;
                return (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{prod?.name || '?'} <span style={{ color: '#888', fontSize: 10 }}>{v ? getVariantLabel(v) : ''}</span></td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>₹{item.unitPrice.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right' }}>₹{item.totalPrice.toLocaleString('en-IN')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ textAlign: 'right', marginTop: 8 }}>
            <div>Subtotal: ₹{bill.subtotal.toLocaleString('en-IN')}</div>
            <div>CGST (1.5%): ₹{cgst}</div>
            <div>SGST (1.5%): ₹{sgst}</div>
            {bill.discountAmount > 0 && <div style={{ color: 'green' }}>Discount: −₹{bill.discountAmount.toLocaleString('en-IN')}</div>}
            <div className="bill-total-row" style={{ marginTop: 6, paddingTop: 6 }}>Total: ₹{bill.totalAmount.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>Paid via {bill.paymentMethod}</div>
          </div>
          <div style={{ marginTop: 12, textAlign: 'center', fontSize: 10, color: '#888', borderTop: '1px dashed #ccc', paddingTop: 8, whiteSpace: 'pre-line' }}>
            {shop.billTerms}
          </div>
        </div>
      ),
      size: 'lg',
      submitLabel: 'Download PDF',
      onSubmit: async () => {
        await generateBillPDF(bill, items, shop, customer, variantMap, productMap);
        showToast('PDF Invoice Downloaded', 'success');
      }
    });
  };

  return (
    <div className="pos-layout animate-in" id="billing-page">
      {/* Products Grid Panel */}
      <div className="pos-products card" id="pos-products-panel">
        <div className="card-header">
          <div className="card-title"><span className="material-icons-round">storefront</span> Products</div>
        </div>
        <div style={{ padding: '12px 16px' }}>
          <div className="search-box">
            <span className="material-icons-round">search</span>
            <input
              className="form-input"
              placeholder="Search products, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
          <div className="filter-chips mt-sm">
            <button
              className={`filter-chip ${activeCategoryFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategoryFilter('all')}
            >
              All
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                className={`filter-chip ${activeCategoryFilter === c.id ? 'active' : ''}`}
                onClick={() => setActiveCategoryFilter(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="pos-product-grid">
          {activeVariants.map(v => {
            const prod = productMap[v.productId];
            const isOOS = v.currentStock <= 0;
            const hasAttributes = v.color || v.size || v.finish;
            const rl = prod?.reorderLevel || 5;

            return (
              <div
                key={v.id}
                className={`pos-product-card ${isOOS ? 'out-of-stock' : ''}`}
                onClick={() => !isOOS && handleAddToCart(v)}
              >
                <div className="pos-product-name">{prod ? prod.name : '?'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span className="price-tier-badge" style={{ fontSize: '0.75rem' }}>{getPriceTierLabel(v.sellingPrice)}</span>
                  {hasAttributes && <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{getVariantLabel(v)}</span>}
                </div>
                <div className="pos-product-bottom">
                  <div className="pos-product-price">{formatCurrency(v.sellingPrice)}</div>
                  <div className="pos-product-stock">
                    <span className="stock-indicator">
                      <span className={`stock-dot ${isOOS ? 'out-of-stock' : v.currentStock <= rl ? 'low-stock' : 'in-stock'}`}></span>
                      {v.currentStock}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart Panel */}
      <div className="pos-cart card" id="pos-cart-panel">
        <div className="card-header">
          <div className="card-title"><span className="material-icons-round">shopping_cart</span> Cart</div>
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--ruby)' }} onClick={() => setCart([])}>
            <span className="material-icons-round" style={{ fontSize: 15 }}>delete_sweep</span> Clear
          </button>
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <span className="material-icons-round empty-state-icon" style={{ fontSize: 40 }}>add_shopping_cart</span>
              <div className="empty-state-title" style={{ fontSize: '0.9rem' }}>Cart is empty</div>
              <div className="empty-state-desc" style={{ fontSize: '0.8rem' }}>Click products to add them</div>
            </div>
          ) : (
            cart.map((item, idx) => {
              const hasAttr = item.variant.color || item.variant.size || item.variant.finish;
              return (
                <div key={item.variantId} className="cart-item">
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.product.name}</div>
                    <div className="cart-item-price" style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                      {editingPriceIdx === idx ? (
                        <input
                          type="number"
                          className="cart-price-input"
                          value={tempPriceVal}
                          min={item.variant.costPrice}
                          step="1"
                          onChange={(e) => setTempPriceVal(e.target.value)}
                          onBlur={() => commitPriceChange(idx)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              commitPriceChange(idx);
                            }
                            if (e.key === 'Escape') {
                              setEditingPriceIdx(null);
                            }
                          }}
                          autoFocus
                          style={{
                            width: 75, padding: '2px 6px', fontSize: '0.75rem', borderRadius: 12,
                            background: 'var(--bg-surface)', border: '1px solid var(--gold-500)',
                            color: 'var(--gold-400)', outline: 'none', fontWeight: 700, textAlign: 'center'
                          }}
                        />
                      ) : (
                        <span
                          className="price-tier-badge cart-price-display"
                          style={{ fontSize: '0.68rem', padding: '1px 7px', cursor: 'pointer', position: 'relative' }}
                          title="Click to edit price"
                          onClick={() => {
                            setEditingPriceIdx(idx);
                            setTempPriceVal(item.unitPrice.toString());
                          }}
                        >
                          {getPriceTierLabel(item.unitPrice)}
                          <span className="material-icons-round" style={{ fontSize: 11, verticalAlign: 'middle', marginLeft: 2, opacity: 0.7 }}>edit</span>
                        </span>
                      )}
                      {hasAttr && <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{getVariantLabel(item.variant)}</span>}
                    </div>
                  </div>
                  <div className="cart-item-qty">
                    <button onClick={() => handleCartQty(idx, -1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => handleCartQty(idx, 1)}>+</button>
                  </div>
                  <div className="cart-item-total">{formatCurrency(item.unitPrice * item.quantity)}</div>
                </div>
              );
            })
          )}
        </div>

        {cart.length > 0 && (
          <>
            <div className="cart-summary">
              <div className="cart-summary-row"><span className="text-muted">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="cart-summary-row"><span className="text-muted">GST (3%)</span><span>{formatCurrency(taxAmount)}</span></div>
              {billDiscount > 0 && (
                <div className="cart-summary-row">
                  <span className="text-muted">Discount</span>
                  <span style={{ color: 'var(--emerald)' }}>−{formatCurrency(billDiscount)}</span>
                </div>
              )}
              <div className="cart-summary-row total"><span>Total</span><span>{formatCurrency(totalAmount)}</span></div>
            </div>

            <div className="cart-actions">
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button className="btn btn-secondary btn-sm flex-1" onClick={handleOpenCustomerModal}>
                  <span className="material-icons-round" style={{ fontSize: 15 }}>person</span>
                  {selectedCustomerId ? 'Customer Selected ✓' : 'Select Customer'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={handleOpenDiscountModal}>
                  <span className="material-icons-round" style={{ fontSize: 15 }}>local_offer</span>
                  Discount
                </button>
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {(['CASH', 'UPI', 'CARD'] as const).map(m => (
                  <button
                    key={m}
                    className={`filter-chip ${paymentMethod === m ? 'active' : ''}`}
                    onClick={() => setPaymentMethod(m)}
                    style={{ flex: 1, textAlign: 'center' }}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <button className="btn btn-primary btn-lg w-full" style={{ fontSize: '1rem' }} onClick={handleGenerateBill}>
                <span className="material-icons-round">receipt</span>
                Generate Bill — {formatCurrency(totalAmount)}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
