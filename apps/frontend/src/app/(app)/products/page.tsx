/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useDb } from '@/context/DbProvider';
import { useToast } from '@/context/ToastProvider';
import { useModal } from '@/context/ModalProvider';
import {
  formatCurrency, getStockStatus, getVariantLabel,
  getPriceTierLabel, Variant
} from '@/lib/helpers';

interface Category {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

interface Product {
  id: string;
  categoryId: string;
  name: string;
  brand?: string;
  material?: string;
  description?: string;
  reorderLevel: number;
  priceTiers: number[];
  isActive?: boolean;
}

export default function ProductsPage() {
  const { db, refreshKey, refresh } = useDb();
  const { showToast } = useToast();
  const { openModal, closeModal, confirm } = useModal();

  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);

  // Filters/Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Fetch page data
  useEffect(() => {
    (async () => {
      const [p, c, v] = await Promise.all([
        db.getProducts(),
        db.getCategories(),
        db.getVariants(),
      ]);
      setProducts(p);
      setCategories(c);
      setVariants(v);
    })();
  }, [db, refreshKey]);

  // Derived maps
  const categoryMap = useMemo(() => {
    const map: Record<string, Category> = {};
    categories.forEach(c => map[c.id] = c);
    return map;
  }, [categories]);

  const variantsByProduct = useMemo(() => {
    const map: Record<string, Variant[]> = {};
    variants.forEach(v => {
      if (!map[v.productId]) map[v.productId] = [];
      map[v.productId].push(v);
    });
    return map;
  }, [variants]);

  const productCounts = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach(p => {
      map[p.categoryId] = (map[p.categoryId] || 0) + 1;
    });
    return map;
  }, [products]);

  // Filters for Product Table
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.brand || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = !categoryFilter || p.categoryId === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, categoryFilter]);

  // Filters for Category Table
  const filteredCategories = useMemo(() => {
    return categories.filter(c => {
      return !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [categories, searchQuery]);

  // ================= CATEGORIES CRUD =================
  const handleAddCategory = () => {
    openCategoryModal();
  };

  const handleEditCategory = (c: Category) => {
    openCategoryModal(c);
  };

  const handleDeleteCategory = async (c: Category) => {
    const count = productCounts[c.id] || 0;
    if (count > 0) {
      showToast(`Cannot delete — ${count} products use this category`, 'error');
      return;
    }
    const ok = await confirm(`Delete the category "${c.name}"?`, 'Delete Category');
    if (ok) {
      await db.deleteCategory(c.id);
      showToast('Category deleted', 'success');
      refresh();
    }
  };

  const openCategoryModal = (cat: Category | null = null) => {
    let name = cat ? cat.name : '';
    let description = cat ? cat.description || '' : '';

    openModal({
      title: cat ? 'Edit Category' : 'Add Category',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Name <span className="required">*</span></label>
            <input
              className="form-input"
              defaultValue={name}
              placeholder="e.g., Rings"
              onChange={(e) => { name = e.target.value; }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              defaultValue={description}
              rows={2}
              placeholder="Optional"
              onChange={(e) => { description = e.target.value; }}
            />
          </div>
        </div>
      ),
      submitLabel: cat ? 'Update' : 'Add',
      onSubmit: async () => {
        const cleanName = name.trim();
        if (!cleanName) {
          showToast('Category name is required', 'error');
          return false;
        }
        await db.saveCategory({
          ...(cat || {}),
          name: cleanName,
          description: description.trim(),
          isActive: true
        });
        showToast(cat ? 'Category updated' : 'Category added', 'success');
        refresh();
      }
    });
  };

  // ================= PRODUCTS CRUD =================
  const handleAddProduct = () => {
    openProductModal();
  };

  const handleEditProduct = (p: Product) => {
    openProductModal(p);
  };

  const handleDeleteProduct = async (p: Product) => {
    const ok = await confirm(`Are you sure you want to delete product "${p.name}" and all its variants?`, 'Delete Product');
    if (ok) {
      const pvariants = variantsByProduct[p.id] || [];
      for (const v of pvariants) {
        await db.deleteVariant(v.id);
      }
      await db.deleteProduct(p.id);
      showToast('Product deleted', 'success');
      refresh();
    }
  };

  // Imperative Modal trigger passing parameters
  const openProductModal = (product: Product | null = null) => {
    // Store variables to mutate on submit
    let currentName = product ? product.name : '';
    let currentCategoryId = product ? product.categoryId : '';
    let currentBrand = product ? product.brand || '' : '';
    let currentMaterial = product ? product.material || '' : '';
    let currentDesc = product ? product.description || '' : '';
    let currentReorder = product ? product.reorderLevel : 5;
    let currentTiers: number[] = product ? [...product.priceTiers] : [];

    openModal({
      title: product ? 'Edit Product' : 'Add New Product',
      content: (
        <ProductForm
          categories={categories}
          initialProduct={product}
          onChange={(fields) => {
            if (fields.name !== undefined) currentName = fields.name;
            if (fields.categoryId !== undefined) currentCategoryId = fields.categoryId;
            if (fields.brand !== undefined) currentBrand = fields.brand;
            if (fields.material !== undefined) currentMaterial = fields.material;
            if (fields.description !== undefined) currentDesc = fields.description;
            if (fields.reorderLevel !== undefined) currentReorder = fields.reorderLevel;
            if (fields.priceTiers !== undefined) currentTiers = fields.priceTiers;
          }}
        />
      ),
      submitLabel: product ? 'Update' : 'Add Product',
      onSubmit: async () => {
        const cleanName = currentName.trim();
        if (!cleanName) { showToast('Product name is required', 'error'); return false; }
        if (!currentCategoryId) { showToast('Category is required', 'error'); return false; }
        if (currentTiers.length === 0) { showToast('Add at least one price tier', 'error'); return false; }

        const prodData = {
          ...(product || {}),
          name: cleanName,
          categoryId: currentCategoryId,
          brand: currentBrand.trim(),
          material: currentMaterial.trim(),
          description: currentDesc.trim(),
          reorderLevel: currentReorder,
          priceTiers: [...currentTiers],
          isActive: true
        };

        const saved = await db.saveProduct(prodData);

        // If new product, auto-create default variants for each price tier
        if (!product) {
          const cat = categories.find(c => c.id === currentCategoryId);
          for (const tier of currentTiers) {
            const costPrice = Math.round(tier * 0.6);
            const sku = db.generateSKU(cat?.name || '', cleanName, `T${tier}`);
            await db.saveVariant({
              productId: saved.id,
              color: '', size: '', finish: '',
              costPrice, sellingPrice: tier, sku,
              currentStock: 0, reservedStock: 0, isActive: true
            });
          }
          showToast(`Product added with ${currentTiers.length} price tier${currentTiers.length > 1 ? 's' : ''}`, 'success');
        } else {
          // If existing, check if new price tiers were added and auto-create variants for them
          const existingVariants = await db.getVariantsByProduct(product.id);
          const existingPrices = existingVariants.map(v => v.sellingPrice);
          const cat = categories.find(c => c.id === currentCategoryId);
          for (const tier of currentTiers) {
            if (!existingPrices.includes(tier)) {
              const costPrice = Math.round(tier * 0.6);
              const sku = db.generateSKU(cat?.name || '', cleanName, `T${tier}`);
              await db.saveVariant({
                productId: product.id,
                color: '', size: '', finish: '',
                costPrice, sellingPrice: tier, sku,
                currentStock: 0, reservedStock: 0, isActive: true
              });
            }
          }
          showToast('Product updated', 'success');
        }

        refresh();
      }
    });
  };

  // ================= VARIANTS MANAGEMENT =================
  const handleManageVariants = (p: Product) => {
    openModal({
      title: 'Manage Variants',
      content: (
        <VariantManager
          product={p}
          categories={categories}
          db={db}
          showToast={showToast}
          openModal={openModal}
          closeModal={closeModal}
          refreshPage={refresh}
        />
      ),
      showFooter: false,
      size: 'lg'
    });
  };

  return (
    <div className="animate-in" id="products-page">
      <div className="tabs" id="product-tabs">
        <div className={`tab ${activeTab === 'products' ? 'active' : ''}`} onClick={() => { setActiveTab('products'); setSearchQuery(''); }}>Products</div>
        <div className={`tab ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => { setActiveTab('categories'); setSearchQuery(''); }}>Categories</div>
      </div>

      <div id="tab-content">
        {activeTab === 'products' ? (
          <div>
            <div className="toolbar">
              <div className="toolbar-left">
                <div className="search-box" style={{ width: 300 }}>
                  <span className="material-icons-round">search</span>
                  <input
                    className="form-input"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  className="form-select"
                  style={{ width: 180 }}
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="toolbar-right">
                <button className="btn btn-primary" onClick={handleAddProduct}>
                  <span className="material-icons-round">add</span> Add Product
                </button>
              </div>
            </div>
            <div className="card">
              <div className="card-body" style={{ padding: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price Tiers</th>
                      <th>Variants</th>
                      <th>Total Stock</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <div className="empty-state">
                            <span className="material-icons-round empty-state-icon">diamond</span>
                            <div className="empty-state-title">No products found</div>
                            <div className="empty-state-desc">Try search terms or add a new product</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map(p => {
                        const pvariants = variantsByProduct[p.id] || [];
                        const totalStock = pvariants.reduce((s, v) => s + (v.currentStock || 0), 0);
                        const status = getStockStatus(totalStock, p.reorderLevel);
                        const cat = categoryMap[p.categoryId];
                        const sortedTiers = [...(p.priceTiers || [])].sort((a, b) => a - b);

                        return (
                          <tr key={p.id}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{p.name}</div>
                              <div className="text-muted" style={{ fontSize: '0.72rem' }}>{p.material || '—'}</div>
                            </td>
                            <td><span className="badge badge-gold">{cat ? cat.name : '—'}</span></td>
                            <td>
                              <div className="price-tiers-cell">
                                {sortedTiers.length > 0 ? sortedTiers.map((t, idx) => (
                                  <span key={idx} className="price-tier-badge">{getPriceTierLabel(t)}</span>
                                )) : <span className="text-muted" style={{ fontSize: '0.75rem' }}>No tiers</span>}
                              </div>
                            </td>
                            <td>{pvariants.length}</td>
                            <td>
                              <div className="stock-indicator">
                                <span className={`stock-dot ${status.class}`}></span>
                                {totalStock}
                              </div>
                            </td>
                            <td><span className={`badge ${status.badge}`}>{status.label}</span></td>
                            <td className="cell-actions">
                              <button className="btn btn-ghost btn-icon sm" title="Edit" onClick={() => handleEditProduct(p)}>
                                <span className="material-icons-round" style={{ fontSize: 16 }}>edit</span>
                              </button>
                              <button className="btn btn-ghost btn-icon sm" title="Variants" onClick={() => handleManageVariants(p)}>
                                <span className="material-icons-round" style={{ fontSize: 16 }}>layers</span>
                              </button>
                              <button className="btn btn-ghost btn-icon sm" title="Delete" onClick={() => handleDeleteProduct(p)}>
                                <span className="material-icons-round" style={{ fontSize: 16, color: 'var(--ruby)' }}>delete</span>
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
                    placeholder="Search categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="toolbar-right">
                <button className="btn btn-primary" onClick={handleAddCategory}>
                  <span className="material-icons-round">add</span> Add Category
                </button>
              </div>
            </div>
            <div className="card">
              <div className="card-body" style={{ padding: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Products</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.length === 0 ? (
                      <tr>
                        <td colSpan={5}>
                          <div className="empty-state">
                            <span className="material-icons-round empty-state-icon">category</span>
                            <div className="empty-state-title">No categories found</div>
                            <div className="empty-state-desc">Try another search or add a category</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredCategories.map(c => (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 600 }}>{c.name}</td>
                          <td className="text-muted">{c.description || '—'}</td>
                          <td><span className="badge badge-gold">{productCounts[c.id] || 0}</span></td>
                          <td><span className="badge badge-emerald">Active</span></td>
                          <td className="cell-actions">
                            <button className="btn btn-ghost btn-icon sm" onClick={() => handleEditCategory(c)}>
                              <span className="material-icons-round" style={{ fontSize: 16 }}>edit</span>
                            </button>
                            <button className="btn btn-ghost btn-icon sm" onClick={() => handleDeleteCategory(c)}>
                              <span className="material-icons-round" style={{ fontSize: 16, color: 'var(--ruby)' }}>delete</span>
                            </button>
                          </td>
                        </tr>
                      ))
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

// ================= SUB-COMPONENTS =================

interface ProductFormProps {
  categories: Category[];
  initialProduct: Product | null;
  onChange: (fields: Partial<{
    name: string;
    categoryId: string;
    brand: string;
    material: string;
    description: string;
    reorderLevel: number;
    priceTiers: number[];
  }>) => void;
}

function ProductForm({ categories, initialProduct, onChange }: ProductFormProps) {
  const [ptiers, setPtiers] = useState<number[]>(initialProduct ? [...initialProduct.priceTiers] : []);
  const [newTierPrice, setNewTierPrice] = useState('');

  const handleAddTier = () => {
    const val = parseFloat(newTierPrice);
    if (!val || val <= 0) return;
    if (ptiers.includes(val)) return;
    const updated = [...ptiers, val].sort((a, b) => a - b);
    setPtiers(updated);
    onChange({ priceTiers: updated });
    setNewTierPrice('');
  };

  const handleRemoveTier = (idx: number) => {
    const updated = [...ptiers];
    updated.splice(idx, 1);
    setPtiers(updated);
    onChange({ priceTiers: updated });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Product Name <span className="required">*</span></label>
          <input
            className="form-input"
            defaultValue={initialProduct?.name || ''}
            placeholder="e.g., Earrings, Butterfly Ring"
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Category <span className="required">*</span></label>
          <select
            className="form-select"
            defaultValue={initialProduct?.categoryId || ''}
            onChange={(e) => onChange({ categoryId: e.target.value })}
          >
            <option value="">Select category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Brand</label>
          <input
            className="form-input"
            defaultValue={initialProduct?.brand || ''}
            placeholder="e.g., JewelCraft"
            onChange={(e) => onChange({ brand: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Material</label>
          <input
            className="form-input"
            defaultValue={initialProduct?.material || ''}
            placeholder="e.g., Gold Plated, Alloy"
            onChange={(e) => onChange({ material: e.target.value })}
          />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          className="form-textarea"
          defaultValue={initialProduct?.description || ''}
          rows={2}
          placeholder="Optional description"
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Price Tiers <span className="required">*</span></label>
        <div className="price-tiers-container">
          {ptiers.map((tier, idx) => (
            <div key={idx} className="price-tier-chip">
              {getPriceTierLabel(tier)}
              <button type="button" className="tier-remove" onClick={() => handleRemoveTier(idx)}>✕</button>
            </div>
          ))}
          <div className="price-tier-add-form">
            <input
              type="number"
              placeholder="₹ Price"
              min="1"
              value={newTierPrice}
              onChange={(e) => setNewTierPrice(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTier(); } }}
            />
            <button type="button" onClick={handleAddTier}>+</button>
          </div>
        </div>
        {ptiers.length === 0 && (
          <span className="form-helper" style={{ marginTop: 4 }}>Add at least one price tier (e.g., 99, 299, 399)</span>
        )}
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Reorder Level</label>
          <input
            className="form-input"
            type="number"
            min="0"
            defaultValue={initialProduct?.reorderLevel || 5}
            onChange={(e) => onChange({ reorderLevel: parseInt(e.target.value) || 5 })}
          />
          <span className="form-helper">Alert when stock falls below this</span>
        </div>
      </div>
    </div>
  );
}

interface VariantManagerProps {
  product: Product;
  categories: Category[];
  db: any;
  showToast: (msg: string, type?: any) => void;
  openModal: (opts: any) => void;
  closeModal: () => void;
  refreshPage: () => void;
}

function VariantManager({ product, categories, db, showToast, openModal, closeModal, refreshPage }: VariantManagerProps) {
  const [vars, setVars] = useState<Variant[]>([]);

  const loadVars = async () => {
    const v = await db.getVariantsByProduct(product.id);
    setVars((v as Variant[]).sort((a, b) => a.sellingPrice - b.sellingPrice));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadVars();
  }, []);

  const handleDelete = async (vId: string) => {
    await db.deleteVariant(vId);
    showToast('Variant deleted', 'success');
    loadVars();
    refreshPage();
  };

  const handleAddPriceTierVariant = () => {
    let selectedTier: number | 'custom' | null = null;
    let customPrice = '';
    let costPrice = '';

    const cat = categories.find(c => c.id === product.categoryId);
    const existingPrices = vars.map(v => v.sellingPrice);
    const tiers = [...product.priceTiers].sort((a, b) => a - b);

    const PriceTierVariantForm = () => {
      const [sel, setSel] = useState<number | 'custom' | null>(null);
      const [costVal, setCostVal] = useState('');
      const [customVal, setCustomVal] = useState('');

      const autoFillCost = (sellPrice: number) => {
        if (!costVal) {
          const autoCost = Math.round(sellPrice * 0.6).toString();
          setCostVal(autoCost);
          costPrice = autoCost;
        }
      };

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{product.name}</div>
          <div className="form-group">
            <label className="form-label">Select Price Tier</label>
            <div className="price-tier-grid" id="tier-select-grid">
              {tiers.map((t, idx) => (
                <div
                  key={idx}
                  className={`price-tier-card ${sel === t ? 'selected' : ''}`}
                  onClick={() => {
                    setSel(t);
                    selectedTier = t;
                    autoFillCost(t);
                  }}
                >
                  <div className="price-tier-card-price">{getPriceTierLabel(t)}</div>
                  <div className="price-tier-card-stock">
                    {existingPrices.includes(t) ? 'Existing' : 'New Variant'}
                  </div>
                </div>
              ))}
              <div
                className={`price-tier-card add-new ${sel === 'custom' ? 'selected' : ''}`}
                onClick={() => {
                  setSel('custom');
                  selectedTier = 'custom';
                }}
              >
                <span className="material-icons-round">add</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Custom Price</span>
              </div>
            </div>
          </div>

          {sel === 'custom' && (
            <div className="form-group">
              <label className="form-label">Custom Price (₹)</label>
              <input
                className="form-input"
                type="number"
                min="1"
                placeholder="Enter price"
                value={customVal}
                onChange={(e) => {
                  setCustomVal(e.target.value);
                  customPrice = e.target.value;
                  const p = parseFloat(e.target.value);
                  if (p > 0) {
                    const autoCost = Math.round(p * 0.6).toString();
                    setCostVal(autoCost);
                    costPrice = autoCost;
                  }
                }}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Cost Price (₹)</label>
            <input
              className="form-input"
              type="number"
              min="0"
              placeholder="Auto-calculated at 60%"
              value={costVal}
              onChange={(e) => {
                setCostVal(e.target.value);
                costPrice = e.target.value;
              }}
            />
            <span className="form-helper">Default: 60% of selling price</span>
          </div>
        </div>
      );
    };

    openModal({
      title: 'Add Price Tier Variant',
      content: <PriceTierVariantForm />,
      submitLabel: 'Add Variant',
      onSubmit: async () => {
        let price = selectedTier;
        if (price === 'custom') {
          const parsed = parseFloat(customPrice);
          if (!parsed || parsed <= 0) {
            showToast('Enter a valid custom price', 'error');
            return false;
          }
          price = parsed;
          if (!product.priceTiers.includes(price)) {
            product.priceTiers.push(price);
            await db.saveProduct(product);
          }
        }
        if (!price) {
          showToast('Select a price tier', 'error');
          return false;
        }

        const costVal = parseFloat(costPrice) || Math.round(price * 0.6);
        const sku = db.generateSKU(cat?.name || '', product.name, `T${price}`);

        await db.saveVariant({
          productId: product.id,
          color: '', size: '', finish: '',
          costPrice: costVal, sellingPrice: price, sku,
          currentStock: 0, reservedStock: 0, isActive: true
        });

        showToast(`Variant at ${getPriceTierLabel(price)} added`, 'success');
        loadVars();
        refreshPage();
        return true;
      }
    });
  };

  const handleAddCustomVariant = () => {
    openVariantFormDetail(null);
  };

  const handleEditVariant = (v: Variant) => {
    openVariantFormDetail(v);
  };

  const openVariantFormDetail = (v: Variant | null = null) => {
    const cat = categories.find(c => c.id === product.categoryId);

    // Form inputs state
    let sellPriceStr = v ? v.sellingPrice.toString() : '';
    let costPriceStr = v ? v.costPrice.toString() : '';
    let color = v ? v.color || '' : '';
    let size = v ? v.size || '' : '';
    let finish = v ? v.finish || '' : '';
    let sku = v ? v.sku || '' : '';
    let initialStock = v ? v.currentStock : 0;

    const VariantFormDetails = () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Selling Price (₹) <span className="required">*</span></label>
            <input
              className="form-input"
              type="number"
              min="0"
              step="0.01"
              defaultValue={sellPriceStr}
              placeholder="0.00"
              onChange={(e) => { sellPriceStr = e.target.value; }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Cost Price (₹) <span className="required">*</span></label>
            <input
              className="form-input"
              type="number"
              min="0"
              step="0.01"
              defaultValue={costPriceStr}
              placeholder="0.00"
              onChange={(e) => { costPriceStr = e.target.value; }}
            />
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
          <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: 10 }}>Optional attributes (for extra detail)</div>
          <div className="form-row-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Color</label>
              <input
                className="form-input"
                defaultValue={color}
                placeholder="e.g., Gold"
                onChange={(e) => { color = e.target.value; }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Size</label>
              <input
                className="form-input"
                defaultValue={size}
                placeholder="e.g., S6, 18 inch"
                onChange={(e) => { size = e.target.value; }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Finish</label>
              <input
                className="form-input"
                defaultValue={finish}
                placeholder="e.g., Matte"
                onChange={(e) => { finish = e.target.value; }}
              />
            </div>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">SKU</label>
            <input
              className="form-input"
              defaultValue={sku}
              placeholder="Auto-generated if empty"
              onChange={(e) => { sku = e.target.value; }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Initial Stock</label>
            <input
              className="form-input"
              type="number"
              min="0"
              defaultValue={initialStock}
              disabled={!!v}
              title={v ? 'Use Inventory page to adjust stock' : ''}
              onChange={(e) => { initialStock = parseInt(e.target.value) || 0; }}
            />
            {v && <span className="form-helper">Use Inventory page to adjust stock</span>}
          </div>
        </div>
      </div>
    );

    openModal({
      title: v ? 'Edit Variant' : 'Add Custom Variant',
      content: <VariantFormDetails />,
      submitLabel: v ? 'Update' : 'Add Variant',
      onSubmit: async () => {
        const parsedSell = parseFloat(sellPriceStr);
        const parsedCost = parseFloat(costPriceStr);

        if (isNaN(parsedSell) || parsedSell < 0) { showToast('Valid selling price is required', 'error'); return false; }
        if (isNaN(parsedCost) || parsedCost < 0) { showToast('Valid cost price is required', 'error'); return false; }

        const cleanSku = sku.trim() || db.generateSKU(cat?.name || '', product.name, `${color.trim()}-${size.trim() || finish.trim() || 'T' + parsedSell}`);

        const variantData = {
          ...(v || {}),
          productId: product.id,
          color: color.trim(),
          size: size.trim(),
          finish: finish.trim(),
          costPrice: parsedCost,
          sellingPrice: parsedSell,
          sku: cleanSku,
          currentStock: v ? v.currentStock : initialStock,
          reservedStock: v ? v.reservedStock || 0 : 0,
          isActive: true
        };

        const savedVariant = await db.saveVariant(variantData);

        if (!v && initialStock > 0) {
          await db.saveInventoryTxn({
            variantId: savedVariant.id,
            transactionType: 'PURCHASE',
            quantityChange: initialStock,
            referenceType: 'initial',
            notes: 'Initial stock'
          });
        }

        // Add selling price to product's priceTiers if not there
        if (!product.priceTiers.includes(parsedSell)) {
          product.priceTiers.push(parsedSell);
          await db.saveProduct(product);
        }

        showToast(v ? 'Variant updated' : 'Variant added', 'success');
        loadVars();
        refreshPage();
        return true;
      }
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>{product.name}</div>
        <div className="text-muted" style={{ fontSize: '0.8rem' }}>{vars.length} variant{vars.length !== 1 ? 's' : ''}</div>
        {product.priceTiers.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <span className="text-muted" style={{ fontSize: '0.72rem', marginRight: 6 }}>Price Tiers:</span>
            {product.priceTiers.sort((a, b) => a - b).map((t, i) => (
              <span key={i} className="price-tier-badge" style={{ marginRight: 4 }}>{getPriceTierLabel(t)}</span>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleAddPriceTierVariant}>
          <span className="material-icons-round">add</span> Add Price Tier Variant
        </button>
        <button className="btn btn-ghost" onClick={handleAddCustomVariant}>
          <span className="material-icons-round" style={{ fontSize: 16 }}>tune</span> Custom
        </button>
      </div>
      {vars.length === 0 ? (
        <div className="empty-state" style={{ padding: 20 }}>
          <div className="empty-state-desc">No variants yet. Add variants with price tiers to start selling.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {vars.map(v => {
            const status = getStockStatus(v.currentStock, product.reorderLevel);
            const hasAttributes = v.color || v.size || v.finish;
            return (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="price-tier-badge" style={{ fontSize: '0.82rem', padding: '3px 12px' }}>{getPriceTierLabel(v.sellingPrice)}</span>
                    {hasAttributes && <span className="text-muted" style={{ fontSize: '0.75rem' }}>{getVariantLabel(v)}</span>}
                  </div>
                  <div className="font-mono text-muted" style={{ fontSize: '0.7rem', marginTop: 3 }}>{v.sku}</div>
                </div>
                <div style={{ textAlign: 'center', minWidth: 60 }}>
                  <div className="stock-indicator"><span className={`stock-dot ${status.class}`}></span>{v.currentStock}</div>
                  <div className="text-muted" style={{ fontSize: '0.65rem' }}>stock</div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 70 }}>
                  <div style={{ fontWeight: 600, color: 'var(--gold-400)' }}>{formatCurrency(v.sellingPrice)}</div>
                  <div className="text-muted" style={{ fontSize: '0.7rem' }}>Cost: {formatCurrency(v.costPrice)}</div>
                </div>
                <div className="cell-actions">
                  <button className="btn btn-ghost btn-icon sm" onClick={() => handleEditVariant(v)}>
                    <span className="material-icons-round" style={{ fontSize: 15 }}>edit</span>
                  </button>
                  <button className="btn btn-ghost btn-icon sm" onClick={() => handleDelete(v.id)}>
                    <span className="material-icons-round" style={{ fontSize: 15, color: 'var(--ruby)' }}>delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
