'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useDb } from '@/context/DbProvider';
import { useToast } from '@/context/ToastProvider';
import { useModal } from '@/context/ModalProvider';
import {
  formatCurrency, formatDate, formatDateTime,
  escapeHtml
} from '@/lib/helpers';

interface Customer {
  id: string;
  name: string;
  mobile?: string;
  email?: string;
  address?: string;
}

interface Bill {
  id: string;
  customerId: string | null;
  totalAmount: number;
  billDate: string;
  billNumber: string;
  paymentMethod: string;
}

interface CustomerStats {
  totalSpent: number;
  billCount: number;
  lastVisit: string | null;
}

export default function CustomersPage() {
  const { db, refreshKey, refresh } = useDb();
  const { showToast } = useToast();
  const { openModal, closeModal, confirm } = useModal();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    (async () => {
      const [c, b] = await Promise.all([
        db.getCustomers(),
        db.getBills(),
      ]);
      setCustomers(c);
      setBills(b);
    })();
  }, [db, refreshKey]);

  // Calculations
  const customerStatsMap = useMemo(() => {
    const map: Record<string, CustomerStats> = {};
    bills.forEach(b => {
      if (!b.customerId) return;
      if (!map[b.customerId]) {
        map[b.customerId] = { totalSpent: 0, billCount: 0, lastVisit: null };
      }
      map[b.customerId].totalSpent += b.totalAmount || 0;
      map[b.customerId].billCount++;
      if (!map[b.customerId].lastVisit || new Date(b.billDate) > new Date(map[b.customerId].lastVisit!)) {
        map[b.customerId].lastVisit = b.billDate;
      }
    });
    return map;
  }, [bills]);

  const statsSummary = useMemo(() => {
    const repeatCount = Object.values(customerStatsMap).filter(s => s.billCount > 1).length;
    const totalCustRevenue = Object.values(customerStatsMap).reduce((s, c) => s + c.totalSpent, 0);
    return { repeatCount, totalCustRevenue };
  }, [customerStatsMap]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const searchStr = `${c.name} ${c.mobile || ''} ${c.email || ''}`.toLowerCase();
      return !searchQuery || searchStr.includes(searchQuery.toLowerCase());
    });
  }, [customers, searchQuery]);

  // Add / Edit customer profile modal
  const openCustomerFormModal = (cust: Customer | null = null) => {
    let name = cust ? cust.name : '';
    let mobile = cust ? cust.mobile || '' : '';
    let email = cust ? cust.email || '' : '';
    let address = cust ? cust.address || '' : '';

    openModal({
      title: cust ? 'Edit Customer' : 'Add Customer',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Customer Name <span className="required">*</span></label>
            <input className="form-input" placeholder="Full name" defaultValue={name} onChange={(e) => name = e.target.value} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Mobile</label>
              <input className="form-input" placeholder="10 digit number" defaultValue={mobile} onChange={(e) => mobile = e.target.value} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="email@example.com" defaultValue={email} onChange={(e) => email = e.target.value} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea className="form-textarea" placeholder="Address details" defaultValue={address} onChange={(e) => address = e.target.value} />
          </div>
        </div>
      ),
      submitLabel: cust ? 'Update' : 'Save',
      onSubmit: async () => {
        const cleanName = name.trim();
        if (!cleanName) { showToast('Customer name is required', 'error'); return false; }

        await db.saveCustomer({
          ...(cust || {}),
          name: cleanName,
          mobile: mobile.trim(),
          email: email.trim(),
          address: address.trim()
        });

        showToast(cust ? 'Customer updated' : 'Customer saved', 'success');
        refresh();
        return true;
      }
    });
  };

  // Delete customer profile
  const handleDeleteCustomer = async (cust: Customer) => {
    const ok = await confirm(`Are you sure you want to delete profile for "${cust.name}"?`, 'Delete Customer');
    if (ok) {
      await db.deleteCustomer(cust.id);
      showToast('Customer deleted', 'success');
      refresh();
    }
  };

  // View Customer Purchase history modal
  const handleViewHistory = async (cust: Customer) => {
    const customerBills = bills.filter(b => b.customerId === cust.id).sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime());

    openModal({
      title: `${cust.name} — Purchase History`,
      content: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <strong>Total Bills:</strong> {customerBills.length} | <strong>Total Spent:</strong> {formatCurrency(customerStatsMap[cust.id]?.totalSpent || 0)}
            </div>
          </div>
          {customerBills.length === 0 ? (
            <div className="empty-state" style={{ padding: 20 }}>
              <div className="empty-state-desc">No purchase history recorded for this customer yet.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 350, overflowY: 'auto' }}>
              {customerBills.map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{b.billNumber}</div>
                    <div className="text-muted" style={{ fontSize: '0.72rem', marginTop: 2 }}>{formatDateTime(b.billDate)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--gold-400)' }}>{formatCurrency(b.totalAmount)}</div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>via {b.paymentMethod}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
      showFooter: false,
      size: 'lg'
    });
  };

  return (
    <div className="animate-in" id="customers-page">
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-box" style={{ width: 300 }}>
            <span className="material-icons-round">search</span>
            <input
              className="form-input"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={() => openCustomerFormModal()}>
            <span className="material-icons-round">person_add</span> Add Customer
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-grid mb-md" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 14 }}>
        <div className="stat-card">
          <div className="stat-card-icon sapphire"><span className="material-icons-round">groups</span></div>
          <div className="stat-card-label">Total Customers</div>
          <div className="stat-card-value">{customers.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon emerald"><span className="material-icons-round">repeat</span></div>
          <div className="stat-card-label">Repeat Customers</div>
          <div className="stat-card-value">{statsSummary.repeatCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon gold"><span className="material-icons-round">payments</span></div>
          <div className="stat-card-label">Total Customer Revenue</div>
          <div className="stat-card-value">{formatCurrency(statsSummary.totalCustRevenue)}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>Total Spent</th>
                <th>Bills</th>
                <th>Last Visit</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <span className="material-icons-round empty-state-icon">people</span>
                      <div className="empty-state-title">No customers found</div>
                      <div className="empty-state-desc">Try another search or add a customer to build loyalty</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => {
                  const stats = customerStatsMap[c.id] || { totalSpent: 0, billCount: 0, lastVisit: null };
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--gold-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--text-on-gold)', fontSize: 13, flexShrink: 0 }}>
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{c.name}</div>
                            {c.address && <div className="text-muted" style={{ fontSize: '0.7rem' }}>{c.address}</div>}
                          </div>
                        </div>
                      </td>
                      <td>{c.mobile || '—'}</td>
                      <td className="text-muted">{c.email || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(stats.totalSpent)}</td>
                      <td><span className="badge badge-sapphire">{stats.billCount}</span></td>
                      <td className="text-muted" style={{ fontSize: '0.78rem' }}>{stats.lastVisit ? formatDate(stats.lastVisit) : '—'}</td>
                      <td className="cell-actions">
                        <button className="btn btn-ghost btn-icon sm" title="View History" onClick={() => handleViewHistory(c)}>
                          <span className="material-icons-round" style={{ fontSize: 16 }}>visibility</span>
                        </button>
                        <button className="btn btn-ghost btn-icon sm" title="Edit" onClick={() => openCustomerFormModal(c)}>
                          <span className="material-icons-round" style={{ fontSize: 16 }}>edit</span>
                        </button>
                        <button className="btn btn-ghost btn-icon sm" title="Delete" onClick={() => handleDeleteCustomer(c)}>
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
  );
}
