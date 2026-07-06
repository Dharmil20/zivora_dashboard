/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useDb } from '@/context/DbProvider';
import { useToast } from '@/context/ToastProvider';
import { useModal } from '@/context/ModalProvider';
import { escapeHtml } from '@/lib/helpers';

interface ShopSettings {
  shopName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  gstin: string;
  upiId: string;
  billPrefix: string;
  billTerms: string;
}

export default function SettingsPage() {
  const { db, refresh } = useDb();
  const { showToast } = useToast();
  const { confirm } = useModal();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<ShopSettings>({
    shopName: 'My Jewellery Shop',
    address1: '', address2: '', city: '', state: '', pincode: '',
    phone: '', email: '', gstin: '', upiId: '',
    billPrefix: 'INV', billTerms: ''
  });

  useEffect(() => {
    (async () => {
      const s = await db.getShopSettings();
      setSettings(s);
    })();
  }, [db]);

  const handleChange = (key: keyof ShopSettings, val: string) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  const handleSaveSettings = async () => {
    const cleanName = settings.shopName.trim();
    if (!cleanName) {
      showToast('Shop Name is required', 'error');
      return;
    }
    await db.saveShopSettings({
      ...settings,
      shopName: cleanName
    });
    showToast('Settings saved successfully', 'success');
    refresh();
  };

  const handleExportData = async () => {
    try {
      const data = {
        exportDate: new Date().toISOString(),
        categories: await db.getCategories(),
        products: await db.getProducts(),
        variants: await db.getVariants(),
        customers: await db.getCustomers(),
        bills: await db.getBills(),
        billItems: await db.getAllBillItems(),
        inventoryTxns: await db.getInventoryTxns(),
        shopSettings: await db.getShopSettings(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Zivora-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Data exported successfully', 'success');
    } catch (err: any) {
      showToast('Export failed: ' + err.message, 'error');
    }
  };

  const handleImportTrigger = () => {
    fileInputRef.current?.click();
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const dateStr = data.exportDate ? new Date(data.exportDate).toLocaleDateString() : 'unknown date';
      const ok = await confirm(`This will replace all current data with the backup from ${dateStr}. Continue?`, 'Import Backup');
      if (!ok) return;

      // Batch save elements into IndexedDB
      if (data.categories) {
        for (const c of data.categories) await db.saveCategory(c);
      }
      if (data.products) {
        for (const p of data.products) await db.saveProduct(p);
      }
      if (data.variants) {
        for (const v of data.variants) await db.saveVariant(v);
      }
      if (data.customers) {
        for (const c of data.customers) await db.saveCustomer(c);
      }
      if (data.bills) {
        for (const b of data.bills) await db.saveBill(b);
      }
      if (data.billItems) {
        for (const i of data.billItems) await db.saveBillItem(i);
      }
      if (data.inventoryTxns) {
        for (const t of data.inventoryTxns) await db.saveInventoryTxn(t);
      }
      if (data.shopSettings) {
        await db.saveShopSettings(data.shopSettings);
        setSettings(data.shopSettings);
      }

      showToast('Data imported successfully', 'success');
      refresh();
    } catch (err: any) {
      showToast('Import failed: ' + err.message, 'error');
    } finally {
      // Clear input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleResetData = async () => {
    const ok = await confirm('This will permanently delete ALL data including products, bills, and customers. This cannot be undone. Are you sure?', '⚠️ Reset All Data');
    if (ok) {
      // Delete database
      indexedDB.deleteDatabase('Zivora');
      showToast('All data reset. Refreshing...', 'warning');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  return (
    <div className="animate-in" id="settings-page">
      <div className="charts-grid charts-grid-even" style={{ alignItems: 'start' }}>
        {/* Shop Details */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><span className="material-icons-round">store</span> Shop Details</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Shop Name <span className="required">*</span></label>
                <input
                  className="form-input"
                  value={settings.shopName}
                  onChange={(e) => handleChange('shopName', e.target.value)}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Address Line 1</label>
                  <input
                    className="form-input"
                    value={settings.address1}
                    onChange={(e) => handleChange('address1', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Address Line 2</label>
                  <input
                    className="form-input"
                    value={settings.address2}
                    onChange={(e) => handleChange('address2', e.target.value)}
                  />
                </div>
              </div>
              <div className="form-row-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    className="form-input"
                    value={settings.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input
                    className="form-input"
                    value={settings.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Pincode</label>
                  <input
                    className="form-input"
                    value={settings.pincode}
                    maxLength={6}
                    onChange={(e) => handleChange('pincode', e.target.value)}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    className="form-input"
                    value={settings.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    className="form-input"
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">GSTIN</label>
                  <input
                    className="form-input"
                    value={settings.gstin}
                    placeholder="Will appear on invoices once registered"
                    maxLength={15}
                    onChange={(e) => handleChange('gstin', e.target.value)}
                  />
                  <span className="form-helper">Leave blank if not yet registered</span>
                </div>
                <div className="form-group">
                  <label className="form-label">UPI ID</label>
                  <input
                    className="form-input"
                    value={settings.upiId}
                    placeholder="yourname@upi"
                    onChange={(e) => handleChange('upiId', e.target.value)}
                  />
                </div>
              </div>
              <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={handleSaveSettings}>
                <span className="material-icons-round">save</span> Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* Bill Settings */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><span className="material-icons-round">receipt</span> Bill Settings</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Bill Prefix</label>
                <input
                  className="form-input"
                  value={settings.billPrefix}
                  onChange={(e) => handleChange('billPrefix', e.target.value)}
                />
                <span className="form-helper">e.g., INV → INV-2026-0001</span>
              </div>
              <div className="form-group">
                <label className="form-label">Terms & Conditions</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={settings.billTerms}
                  onChange={(e) => handleChange('billTerms', e.target.value)}
                />
                <span className="form-helper">Shown at the bottom of every bill</span>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="card-header" style={{ marginTop: 0 }}>
            <div className="card-title"><span className="material-icons-round">storage</span> Data Management</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                <span className="material-icons-round" style={{ color: 'var(--sapphire)' }}>download</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Export All Data</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Download a JSON backup of all your data</div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={handleExportData}>Export</button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                <span className="material-icons-round" style={{ color: 'var(--amber)' }}>upload</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Import Data</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Restore from a JSON backup file</div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={handleImportTrigger}>Import</button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={handleImportData}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'rgba(231,76,60,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(231,76,60,0.15)' }}>
                <span className="material-icons-round" style={{ color: 'var(--ruby)' }}>warning</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--ruby)' }}>Reset All Data</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Delete everything and start fresh</div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={handleResetData}>Reset</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
