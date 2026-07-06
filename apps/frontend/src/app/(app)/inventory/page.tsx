'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useDb } from '@/context/DbProvider';
import { useToast } from '@/context/ToastProvider';
import { useModal } from '@/context/ModalProvider';
import {
  formatCurrency, formatDateTime, getStockStatus,
  getVariantLabel, getPriceTierLabel, Variant
} from '@/lib/helpers';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  categoryId: string;
  name: string;
  reorderLevel: number;
}

interface InventoryTxn {
  id: string;
  variantId: string;
  transactionType: 'PURCHASE' | 'SALE' | 'MANUAL_ADJUSTMENT';
  quantityChange: number;
  createdAt: string;
  notes?: string;
  referenceType?: string;
  referenceId?: string;
}

export default function InventoryPage() {
  const { db, refreshKey, refresh } = useDb();
  const { showToast } = useToast();
  const { openModal, closeModal } = useModal();

  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
  const [variants, setVariants] = useState<Variant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [txns, setTxns] = useState<InventoryTxn[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');

  useEffect(() => {
    (async () => {
      const [v, p, c, t] = await Promise.all([
        db.getVariants(),
        db.getProducts(),
        db.getCategories(),
        db.getInventoryTxns(),
      ]);
      setVariants(v);
      setProducts(p);
      setCategories(c);
      setTxns(t);
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

  const variantMap = useMemo(() => {
    const map: Record<string, Variant> = {};
    variants.forEach(v => map[v.id] = v);
    return map;
  }, [variants]);

  // Count summaries
  const counts = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    variants.forEach(v => {
      const prod = productMap[v.productId];
      const rl = prod?.reorderLevel || 5;
      if (v.currentStock <= 0) outOfStock++;
      else if (v.currentStock <= rl) lowStock++;
      else inStock++;
    });

    return { inStock, lowStock, outOfStock };
  }, [variants, productMap]);

  // Sort: out-of-stock first, then low-stock, then by name
  const sortedVariants = useMemo(() => {
    return [...variants].sort((a, b) => {
      if (a.currentStock <= 0 && b.currentStock > 0) return -1;
      if (a.currentStock > 0 && b.currentStock <= 0) return 1;

      const prodA = productMap[a.productId];
      const prodB = productMap[b.productId];
      const rlA = prodA?.reorderLevel || 5;
      const rlB = prodB?.reorderLevel || 5;

      const isLowA = a.currentStock <= rlA;
      const isLowB = b.currentStock <= rlB;

      if (isLowA && !isLowB) return -1;
      if (!isLowA && isLowB) return 1;

      return (prodA?.name || '').localeCompare(prodB?.name || '');
    });
  }, [variants, productMap]);

  // Filtered variants
  const filteredVariants = useMemo(() => {
    return sortedVariants.filter(v => {
      const prod = productMap[v.productId];
      const rl = prod?.reorderLevel || 5;

      const matchesSearch = !searchQuery ||
        (prod?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.color || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (stockFilter === 'all') return true;
      if (stockFilter === 'out-of-stock') return v.currentStock <= 0;
      if (stockFilter === 'low-stock') return v.currentStock > 0 && v.currentStock <= rl;
      if (stockFilter === 'in-stock') return v.currentStock > rl;

      return true;
    });
  }, [sortedVariants, productMap, searchQuery, stockFilter]);

  // Filtered/sorted txns (newest first)
  const filteredTxns = useMemo(() => {
    const sorted = [...txns].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return sorted.filter(t => {
      const v = variantMap[t.variantId];
      const prod = v ? productMap[v.productId] : null;
      return !searchQuery ||
        (prod?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        v?.sku.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [txns, variantMap, productMap, searchQuery]);

  // Add stock modal
  const openAddStockModal = (variantId: string | null = null) => {
    let selectedId = variantId || '';
    let qty = 1;
    let notes = '';

    const AddStockForm = () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {!variantId ? (
          <div className="form-group">
            <label className="form-label">Select Variant <span className="required">*</span></label>
            <select className="form-select" defaultValue={selectedId} onChange={(e) => selectedId = e.target.value}>
              <option value="">Choose item...</option>
              {variants.map(v => {
                const prod = productMap[v.productId];
                const lbl = getVariantLabel(v);
                return (
                  <option key={v.id} value={v.id}>
                    {prod?.name || '?'} — {v.sku} {lbl !== 'Default' ? `(${lbl})` : ''} [Stock: {v.currentStock}]
                  </option>
                );
              })}
            </select>
          </div>
        ) : (
          <div style={{ fontWeight: 600 }}>
            {productMap[variantMap[variantId]?.productId]?.name || '?'}
            <span style={{ fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 8 }}>
              ({getVariantLabel(variantMap[variantId])})
            </span>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Quantity to Add <span className="required">*</span></label>
          <input className="form-input" type="number" min="1" defaultValue={qty} onChange={(e) => qty = parseInt(e.target.value) || 0} />
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <input className="form-input" placeholder="e.g., Supplier batch, manual stock-up" onChange={(e) => notes = e.target.value} />
        </div>
      </div>
    );

    openModal({
      title: 'Add Stock',
      content: <AddStockForm />,
      submitLabel: 'Add Stock',
      onSubmit: async () => {
        if (!selectedId) { showToast('Select a variant', 'error'); return false; }
        if (qty <= 0) { showToast('Enter a valid quantity', 'error'); return false; }

        await db.addStock(selectedId, qty, notes.trim());
        showToast(`Stock updated: +${qty} units`, 'success');
        refresh();
        return true;
      }
    });
  };

  // Adjust stock modal
  const openAdjustStockModal = (variantId: string) => {
    const v = variantMap[variantId];
    const prod = productMap[v?.productId];
    let newQty = v ? v.currentStock : 0;
    let reason = '';

    const AdjustForm = () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontWeight: 600 }}>
          {prod?.name || '?'}
          <span style={{ fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 8 }}>
            ({getVariantLabel(v)})
          </span>
        </div>
        <div className="form-group">
          <label className="form-label">Current Stock</label>
          <input className="form-input" type="number" disabled value={v?.currentStock || 0} />
        </div>
        <div className="form-group">
          <label className="form-label">New Stock Level <span className="required">*</span></label>
          <input className="form-input" type="number" min="0" defaultValue={newQty} onChange={(e) => newQty = parseInt(e.target.value) || 0} />
        </div>
        <div className="form-group">
          <label className="form-label">Reason for adjustment <span className="required">*</span></label>
          <input className="form-input" placeholder="e.g., Damaged item, physical count correction" onChange={(e) => reason = e.target.value} />
        </div>
      </div>
    );

    openModal({
      title: 'Adjust Stock Level',
      content: <AdjustForm />,
      submitLabel: 'Apply Adjustment',
      onSubmit: async () => {
        if (newQty < 0) { showToast('Quantity cannot be negative', 'error'); return false; }
        const cleanReason = reason.trim();
        if (!cleanReason) { showToast('Reason is required', 'error'); return false; }

        await db.adjustStock(variantId, newQty, cleanReason);
        showToast('Stock adjusted successfully', 'success');
        refresh();
        return true;
      }
    });
  };

  return (
    <div className="animate-in" id="inventory-page">
      <div className="tabs" id="inv-tabs">
        <div className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => { setActiveTab('overview'); setSearchQuery(''); }}>Stock Overview</div>
        <div className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => { setActiveTab('history'); setSearchQuery(''); }}>Transaction History</div>
      </div>

      <div id="inv-tab-content">
        {activeTab === 'overview' ? (
          <div>
            <div className="toolbar">
              <div className="toolbar-left">
                <div className="search-box" style={{ width: 300 }}>
                  <span className="material-icons-round">search</span>
                  <input
                    className="form-input"
                    placeholder="Search by product, SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="filter-chips">
                  <button className={`filter-chip ${stockFilter === 'all' ? 'active' : ''}`} onClick={() => setStockFilter('all')}>
                    All ({variants.length})
                  </button>
                  <button className={`filter-chip ${stockFilter === 'in-stock' ? 'active' : ''}`} onClick={() => setStockFilter('in-stock')}>
                    In Stock ({counts.inStock})
                  </button>
                  <button className={`filter-chip ${stockFilter === 'low-stock' ? 'active' : ''}`} onClick={() => setStockFilter('low-stock')}>
                    Low Stock ({counts.lowStock})
                  </button>
                  <button className={`filter-chip ${stockFilter === 'out-of-stock' ? 'active' : ''}`} onClick={() => setStockFilter('out-of-stock')}>
                    Out of Stock ({counts.outOfStock})
                  </button>
                </div>
              </div>
              <div className="toolbar-right">
                <button className="btn btn-primary" onClick={() => openAddStockModal()}>
                  <span className="material-icons-round">add_box</span> Add Stock
                </button>
              </div>
            </div>

            <div className="card">
              <div className="card-body" style={{ padding: 0, maxHeight: 'calc(100vh - 260px)', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price Tier</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th>Cost</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVariants.length === 0 ? (
                      <tr>
                        <td colSpan={8}>
                          <div className="empty-state">
                            <span className="material-icons-round empty-state-icon">inventory_2</span>
                            <div className="empty-state-title">No inventory found</div>
                            <div className="empty-state-desc">Try search keywords or select another filter</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredVariants.map(v => {
                        const prod = productMap[v.productId];
                        const cat = prod ? categoryMap[prod.categoryId] : null;
                        const status = getStockStatus(v.currentStock, prod?.reorderLevel);

                        return (
                          <tr key={v.id}>
                            <td style={{ fontWeight: 600 }}>{prod?.name || '—'}</td>
                            <td>
                              <span className="price-tier-badge" style={{ fontSize: '0.78rem', padding: '3px 10px' }}>
                                {getPriceTierLabel(v.sellingPrice)}
                              </span>
                              {(v.color || v.size || v.finish) && (
                                <div className="text-muted" style={{ fontSize: '0.7rem', marginTop: 2 }}>{getVariantLabel(v)}</div>
                              )}
                            </td>
                            <td className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>{v.sku}</td>
                            <td><span className="badge badge-gold">{cat ? cat.name : '—'}</span></td>
                            <td className="text-muted">{formatCurrency(v.costPrice)}</td>
                            <td>
                              <div className="stock-indicator">
                                <span className={`stock-dot ${status.class}`}></span>
                                <strong>{v.currentStock}</strong>
                              </div>
                            </td>
                            <td><span className={`badge ${status.badge}`}>{status.label}</span></td>
                            <td className="cell-actions">
                              <button className="btn btn-secondary btn-sm" onClick={() => openAddStockModal(v.id)}>
                                <span className="material-icons-round" style={{ fontSize: 14 }}>add</span> Add
                              </button>
                              <button className="btn btn-ghost btn-sm" onClick={() => openAdjustStockModal(v.id)}>
                                <span className="material-icons-round" style={{ fontSize: 14 }}>tune</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="toolbar">
              <div className="toolbar-left">
                <div className="search-box" style={{ width: 300 }}>
                  <span className="material-icons-round">search</span>
                  <input
                    className="form-input"
                    placeholder="Search by product, SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body" style={{ padding: 0, maxHeight: 'calc(100vh - 260px)', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Type</th>
                      <th>Qty Change</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTxns.length === 0 ? (
                      <tr>
                        <td colSpan={6}>
                          <div className="empty-state">
                            <span className="material-icons-round empty-state-icon">receipt_long</span>
                            <div className="empty-state-title">No transactions recorded</div>
                            <div className="empty-state-desc">Transactions occur when sales are generated or stock is manually added</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredTxns.map(t => {
                        const v = variantMap[t.variantId];
                        const prod = v ? productMap[v.productId] : null;
                        const vlabel = v ? getVariantLabel(v) : '';

                        let typeBadge = 'badge-gold';
                        if (t.transactionType === 'PURCHASE') typeBadge = 'badge-emerald';
                        else if (t.transactionType === 'SALE') typeBadge = 'badge-sapphire';
                        else if (t.transactionType === 'MANUAL_ADJUSTMENT') typeBadge = 'badge-amber';

                        return (
                          <tr key={t.id}>
                            <td className="text-muted" style={{ fontSize: '0.78rem' }}>{formatDateTime(t.createdAt)}</td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{prod?.name || '—'}</div>
                              {vlabel !== 'Default' && <div className="text-muted" style={{ fontSize: '0.7rem' }}>{vlabel}</div>}
                            </td>
                            <td className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>{v?.sku || '—'}</td>
                            <td><span className={`badge ${typeBadge}`}>{t.transactionType}</span></td>
                            <td>
                              <strong style={{ color: t.quantityChange > 0 ? 'var(--emerald)' : 'var(--ruby)' }}>
                                {t.quantityChange > 0 ? `+${t.quantityChange}` : t.quantityChange}
                              </strong>
                            </td>
                            <td className="text-muted" style={{ fontSize: '0.8rem' }}>{t.notes || '—'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
