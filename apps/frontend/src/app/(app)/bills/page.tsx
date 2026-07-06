/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useDb } from '@/context/DbProvider';
import { useToast } from '@/context/ToastProvider';
import { useModal } from '@/context/ModalProvider';
import {
  formatCurrency, formatDateTime, getVariantLabel,
  escapeHtml, Variant
} from '@/lib/helpers';
import { generateBillPDF } from '@/lib/bill-pdf';

interface Customer {
  id: string;
  name: string;
  mobile?: string;
  email?: string;
}

interface Product {
  id: string;
  name: string;
}

interface Bill {
  id: string;
  billNumber: string;
  customerId: string | null;
  billDate: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
}

interface BillItem {
  id: string;
  billId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export default function BillsPage() {
  const { db, refreshKey } = useDb();
  const { showToast } = useToast();
  const { openModal } = useModal();

  const [bills, setBills] = useState<Bill[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [billItems, setBillItems] = useState<BillItem[]>([]);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    (async () => {
      const [b, c, v, p, bi] = await Promise.all([
        db.getBills(),
        db.getCustomers(),
        db.getVariants(),
        db.getProducts(),
        db.getAllBillItems(),
      ]);
      setBills(b);
      setCustomers(c);
      setVariants(v);
      setProducts(p);
      setBillItems(bi);
    })();
  }, [db, refreshKey]);

  // Maps
  const customerMap = useMemo(() => {
    const map: Record<string, Customer> = {};
    customers.forEach(c => map[c.id] = c);
    return map;
  }, [customers]);

  const variantMap = useMemo(() => {
    const map: Record<string, Variant> = {};
    variants.forEach(v => map[v.id] = v);
    return map;
  }, [variants]);

  const productMap = useMemo(() => {
    const map: Record<string, Product> = {};
    products.forEach(p => map[p.id] = p);
    return map;
  }, [products]);

  // Math
  const totalRevenue = useMemo(() => {
    return bills.reduce((s, b) => s + (b.totalAmount || 0), 0);
  }, [bills]);

  const avgBillValue = useMemo(() => {
    return bills.length > 0 ? totalRevenue / bills.length : 0;
  }, [bills, totalRevenue]);

  // Filtered bills
  const sortedFilteredBills = useMemo(() => {
    const filtered = bills.filter(b => {
      const cust = customerMap[b.customerId || ''];
      const searchStr = `${b.billNumber} ${cust?.name || 'walk-in'}`.toLowerCase();
      return !searchQuery || searchStr.includes(searchQuery.toLowerCase());
    });
    return filtered.sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime());
  }, [bills, customerMap, searchQuery]);

  // Direct download PDF
  const handleDownloadPDF = async (bill: Bill) => {
    try {
      const items = billItems.filter(item => item.billId === bill.id);
      const shop = await db.getShopSettings();
      const customer = bill.customerId ? customerMap[bill.customerId] : null;

      await generateBillPDF(bill, items, shop, customer, variantMap, productMap);
      showToast(`PDF generated for ${bill.billNumber}`, 'success');
    } catch (err: any) {
      showToast('Error generating PDF: ' + err.message, 'error');
    }
  };

  // View Bill details in modal
  const handleViewBill = async (bill: Bill) => {
    const items = billItems.filter(item => item.billId === bill.id);
    const shop = await db.getShopSettings();
    const customer = bill.customerId ? customerMap[bill.customerId] : null;
    const cgst = Math.round((bill.taxAmount / 2) * 100) / 100;
    const sgst = cgst;

    openModal({
      title: 'Tax Invoice Details',
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
        showToast('PDF downloaded', 'success');
      }
    });
  };

  return (
    <div className="animate-in" id="bills-page">
      <div className="stats-grid mb-md" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-card-icon gold"><span className="material-icons-round">receipt_long</span></div>
          <div className="stat-card-label">Total Bills</div>
          <div className="stat-card-value">{bills.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon emerald"><span className="material-icons-round">payments</span></div>
          <div className="stat-card-label">Total Revenue</div>
          <div className="stat-card-value">{formatCurrency(totalRevenue)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon sapphire"><span className="material-icons-round">trending_up</span></div>
          <div className="stat-card-label">Avg. Bill Value</div>
          <div className="stat-card-value">{formatCurrency(avgBillValue)}</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-box" style={{ width: 300 }}>
            <span className="material-icons-round">search</span>
            <input
              className="form-input"
              placeholder="Search by bill #, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="toolbar-right">
          <Link href="/billing" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            <span className="material-icons-round">add</span> New Bill
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0, maxHeight: 'calc(100vh - 340px)', overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Bill #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedFilteredBills.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <span className="material-icons-round empty-state-icon">receipt_long</span>
                      <div className="empty-state-title">No bills found</div>
                      <div className="empty-state-desc">Generate your first bill from the POS billing page</div>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedFilteredBills.map(b => {
                  const cust = customerMap[b.customerId || ''];
                  return (
                    <tr key={b.id}>
                      <td className="font-mono" style={{ fontWeight: 600, fontSize: '0.82rem' }}>{b.billNumber}</td>
                      <td className="text-muted" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatDateTime(b.billDate)}</td>
                      <td>
                        {cust ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--gold-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-on-gold)' }}>
                              {cust.name.charAt(0)}
                            </div>
                            {cust.name}
                          </div>
                        ) : (
                          <span className="text-muted">Walk-in</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(b.totalAmount)}</td>
                      <td><span className="badge badge-gold">{b.paymentMethod || '—'}</span></td>
                      <td><span className="badge badge-emerald">{b.paymentStatus || b.status || 'PAID'}</span></td>
                      <td className="cell-actions">
                        <button className="btn btn-ghost btn-icon sm" title="View Bill" onClick={() => handleViewBill(b)}>
                          <span className="material-icons-round" style={{ fontSize: 16 }}>visibility</span>
                        </button>
                        <button className="btn btn-ghost btn-icon sm" title="Download PDF" onClick={() => handleDownloadPDF(b)}>
                          <span className="material-icons-round" style={{ fontSize: 16 }}>download</span>
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
  );
}
