/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDb } from '@/context/DbProvider';
import {
  formatCurrency, isToday, isThisWeek, isThisMonth, percentChange,
  formatDateTime, getStockStatus, getVariantLabel, Variant
} from '@/lib/helpers';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, ArcElement
);

interface DashboardData {
  todayRevenue: number;
  todayBillsCount: number;
  avgBillValue: number;
  totalStock: number;
  inventoryRetail: number;
  inventoryCost: number;
  lowStockCount: number;
  outOfStockCount: number;
  revenueChange: number;
  monthBillsCount: number;
  lowStockItems: any[];
  recentBills: any[];
  lineChartData: { labels: string[]; datasets: any[] };
  doughnutChartData: { labels: string[]; datasets: any[] };
}

export default function Dashboard() {
  const { db, refreshKey } = useDb();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    (async () => {
      const [bills, variants, products, categories, customers, billItems] = await Promise.all([
        db.getBills(),
        db.getVariants(),
        db.getProducts(),
        db.getCategories(),
        db.getCustomers(),
        db.getAllBillItems(),
      ]);

      const productMap: Record<string, any> = {};
      products.forEach((p: any) => productMap[p.id] = p);
      const categoryMap: Record<string, any> = {};
      categories.forEach((c: any) => categoryMap[c.id] = c);
      const variantMap: Record<string, any> = {};
      variants.forEach((v: any) => variantMap[v.id] = v);

      // Calculations
      const todayBills = bills.filter((b: any) => isToday(b.billDate) && b.status === 'COMPLETED');
      const weekBills = bills.filter((b: any) => isThisWeek(b.billDate) && b.status === 'COMPLETED');
      const monthBills = bills.filter((b: any) => isThisMonth(b.billDate) && b.status === 'COMPLETED');

      const todayRevenue = todayBills.reduce((s: number, b: any) => s + (b.totalAmount || 0), 0);
      const weekRevenue = weekBills.reduce((s: number, b: any) => s + (b.totalAmount || 0), 0);
      const monthRevenue = monthBills.reduce((s: number, b: any) => s + (b.totalAmount || 0), 0);

      // Yesterday comparison
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayBills = bills.filter((b: any) => {
        const d = new Date(b.billDate);
        return d.toDateString() === yesterday.toDateString() && b.status === 'COMPLETED';
      });
      const yesterdayRevenue = yesterdayBills.reduce((s: number, b: any) => s + (b.totalAmount || 0), 0);
      const revenueChange = percentChange(todayRevenue, yesterdayRevenue);

      const totalStock = variants.reduce((s: number, v: any) => s + (v.currentStock || 0), 0);
      const inventoryCost = variants.reduce((s: number, v: any) => s + (v.currentStock || 0) * (v.costPrice || 0), 0);
      const inventoryRetail = variants.reduce((s: number, v: any) => s + (v.currentStock || 0) * (v.sellingPrice || 0), 0);

      const lowStockVariants = variants.filter((v: any) => {
        const prod = productMap[v.productId];
        const reorderLevel = prod ? prod.reorderLevel : 5;
        return v.currentStock > 0 && v.currentStock <= reorderLevel && v.isActive !== false;
      });
      const outOfStockVariants = variants.filter((v: any) => v.currentStock <= 0 && v.isActive !== false);

      const avgBillValue = todayBills.length > 0 ? todayRevenue / todayBills.length : 0;

      // Line Chart data (7 Days)
      const lineLabels: string[] = [];
      const lineValues: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        lineLabels.push(d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }));
        const dayRevenue = bills
          .filter((b: any) => new Date(b.billDate).toDateString() === d.toDateString() && b.status === 'COMPLETED')
          .reduce((s: number, b: any) => s + (b.totalAmount || 0), 0);
        lineValues.push(dayRevenue);
      }

      const lineChart = {
        labels: lineLabels,
        datasets: [{
          label: 'Revenue',
          data: lineValues,
          borderColor: '#D4AF37',
          backgroundColor: 'rgba(212, 175, 55, 0.08)',
          borderWidth: 2.5,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#D4AF37',
          pointBorderColor: '#D4AF37',
          pointHoverRadius: 6,
          pointRadius: 3,
        }]
      };

      // Doughnut Chart data (Sales by Category)
      const catRevenue: Record<string, number> = {};
      billItems.forEach((item: any) => {
        const variant = variantMap[item.variantId];
        if (!variant) return;
        const product = productMap[variant.productId];
        if (!product) return;
        const catName = categoryMap[product.categoryId]?.name || 'Other';
        catRevenue[catName] = (catRevenue[catName] || 0) + (item.totalPrice || 0);
      });

      const sortedCatRev = Object.entries(catRevenue).sort((a, b) => b[1] - a[1]);
      const colors = ['#D4AF37', '#B76E79', '#3498DB', '#2ECC71', '#9B59B6', '#F39C12', '#E74C3C'];
      const doughnutChart = {
        labels: sortedCatRev.map(s => s[0]),
        datasets: [{
          data: sortedCatRev.map(s => s[1]),
          backgroundColor: colors.slice(0, sortedCatRev.length),
          borderColor: '#12121F',
          borderWidth: 3,
          hoverOffset: 8,
        }]
      };

      setData({
        todayRevenue,
        todayBillsCount: todayBills.length,
        avgBillValue,
        totalStock,
        inventoryRetail,
        inventoryCost,
        lowStockCount: lowStockVariants.length,
        outOfStockCount: outOfStockVariants.length,
        revenueChange,
        monthBillsCount: monthBills.length,
        lowStockItems: [...outOfStockVariants, ...lowStockVariants].slice(0, 10).map(v => ({
          id: v.id,
          productName: productMap[v.productId]?.name || '—',
          variantLabel: getVariantLabel(v),
          stock: v.currentStock,
          status: getStockStatus(v.currentStock, productMap[v.productId]?.reorderLevel)
        })),
        recentBills: [...bills].sort((a: any, b: any) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime()).slice(0, 8),
        lineChartData: lineChart,
        doughnutChartData: doughnutChart
      });
    })();
  }, [db, refreshKey]);

  if (!data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-tertiary)' }}>
          <span className="material-icons-round" style={{ animation: 'pulse 1.5s infinite' }}>hourglass_top</span>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card" id="stat-revenue">
          <div className="stat-card-icon gold"><span className="material-icons-round">payments</span></div>
          <div className="stat-card-label">Today&apos;s Revenue</div>
          <div className="stat-card-value">{formatCurrency(data.todayRevenue)}</div>
          {data.revenueChange !== 0 && (
            <div className={`stat-card-change ${data.revenueChange >= 0 ? 'up' : 'down'}`}>
              <span className="material-icons-round" style={{ fontSize: 12 }}>
                {data.revenueChange >= 0 ? 'trending_up' : 'trending_down'}
              </span>
              {Math.abs(data.revenueChange)}% vs yesterday
            </div>
          )}
        </div>
        <div className="stat-card" id="stat-bills">
          <div className="stat-card-icon sapphire"><span className="material-icons-round">receipt_long</span></div>
          <div className="stat-card-label">Today&apos;s Bills</div>
          <div className="stat-card-value">{data.todayBillsCount}</div>
          <div className="stat-card-change" style={{ background: 'rgba(52,152,219,0.12)', color: 'var(--sapphire)' }}>
            Avg {formatCurrency(data.avgBillValue)}
          </div>
        </div>
        <div className="stat-card" id="stat-stock">
          <div className="stat-card-icon amethyst"><span className="material-icons-round">inventory_2</span></div>
          <div className="stat-card-label">Total Units in Stock</div>
          <div className="stat-card-value">{data.totalStock.toLocaleString()}</div>
        </div>
        <div className="stat-card" id="stat-inventory-value">
          <div className="stat-card-icon gold"><span className="material-icons-round">account_balance</span></div>
          <div className="stat-card-label">Inventory Value</div>
          <div className="stat-card-value">{formatCurrency(data.inventoryRetail)}</div>
          <div className="stat-card-change" style={{ background: 'rgba(212,175,55,0.12)', color: 'var(--gold-400)' }}>
            Cost: {formatCurrency(data.inventoryCost)}
          </div>
        </div>
        <Link href="/inventory" className="stat-card" id="stat-low-stock" style={{ textDecoration: 'none' }}>
          <div className="stat-card-icon amber"><span className="material-icons-round">warning</span></div>
          <div className="stat-card-label">Low Stock Items</div>
          <div className="stat-card-value">{data.lowStockCount}</div>
        </Link>
        <Link href="/inventory" className="stat-card" id="stat-oos" style={{ textDecoration: 'none' }}>
          <div className="stat-card-icon ruby"><span className="material-icons-round">remove_shopping_cart</span></div>
          <div className="stat-card-label">Out of Stock</div>
          <div className="stat-card-value">{data.outOfStockCount}</div>
        </Link>
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title"><span className="material-icons-round">show_chart</span> Revenue Trend (7 Days)</div>
          </div>
          <div className="card-body">
            <div className="chart-container">
              <Line
                data={data.lineChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: '#1A1A2E',
                      titleColor: '#EAEAF2',
                      bodyColor: '#A0A0B8',
                      borderColor: 'rgba(212,175,55,0.3)',
                      borderWidth: 1,
                      padding: 12,
                      displayColors: false,
                      callbacks: {
                        label: (ctx) => `Revenue: ₹${(ctx.parsed.y ?? 0).toLocaleString('en-IN')}`,
                      },
                    },
                  },
                  scales: {
                    x: {
                      grid: { color: 'rgba(255,255,255,0.04)' },
                      ticks: { color: '#6A6A82', font: { size: 11 } },
                    },
                    y: {
                      grid: { color: 'rgba(255,255,255,0.04)' },
                      ticks: {
                        color: '#6A6A82',
                        font: { size: 11 },
                        callback: (v: any) => '₹' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v),
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title"><span className="material-icons-round">donut_large</span> Sales by Category</div>
          </div>
          <div className="card-body">
            <div className="chart-container">
              <Doughnut
                data={data.doughnutChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '65%',
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: '#A0A0B8',
                        padding: 12,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: { size: 11 },
                      },
                    },
                    tooltip: {
                      backgroundColor: '#1A1A2E',
                      titleColor: '#EAEAF2',
                      bodyColor: '#A0A0B8',
                      borderColor: 'rgba(212,175,55,0.3)',
                      borderWidth: 1,
                      padding: 12,
                      callbacks: {
                        label: (ctx) => ` ${ctx.label}: ₹${ctx.parsed.toLocaleString('en-IN')}`,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="charts-grid charts-grid-even">
        {/* Low Stock */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><span className="material-icons-round">warning</span> Low Stock Alerts</div>
            <span className="badge badge-amber">{data.lowStockItems.length} items</span>
          </div>
          <div className="card-body" style={{ padding: 0, maxHeight: 300, overflowY: 'auto' }}>
            {data.lowStockItems.length === 0 ? (
              <div className="empty-state" style={{ padding: 30 }}>
                <span className="material-icons-round empty-state-icon" style={{ fontSize: 36 }}>verified</span>
                <div className="empty-state-title" style={{ fontSize: '0.9rem' }}>All stocked up!</div>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>Product</th><th>Variant</th><th>Stock</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {data.lowStockItems.map(item => (
                    <tr key={item.id}>
                      <td>{item.productName}</td>
                      <td className="text-muted">{item.variantLabel}</td>
                      <td><strong>{item.stock}</strong></td>
                      <td><span className={`badge ${item.status.badge}`}>{item.status.label}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Bills */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><span className="material-icons-round">receipt</span> Recent Bills</div>
            <span className="badge badge-sapphire">{data.monthBillsCount} this month</span>
          </div>
          <div className="card-body" style={{ padding: 0, maxHeight: 300, overflowY: 'auto' }}>
            {data.recentBills.length === 0 ? (
              <div className="empty-state" style={{ padding: 30 }}>
                <span className="material-icons-round empty-state-icon" style={{ fontSize: 36 }}>receipt_long</span>
                <div className="empty-state-title" style={{ fontSize: '0.9rem' }}>No bills yet</div>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>Bill #</th><th>Amount</th><th>Payment</th><th>Time</th></tr>
                </thead>
                <tbody>
                  {data.recentBills.map(b => (
                    <tr key={b.id}>
                      <td className="font-mono" style={{ fontSize: '0.78rem' }}>{b.billNumber}</td>
                      <td><strong>{formatCurrency(b.totalAmount)}</strong></td>
                      <td><span className="badge badge-gold">{b.paymentMethod || '—'}</span></td>
                      <td className="text-muted" style={{ fontSize: '0.78rem' }}>{formatDateTime(b.billDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link href="/billing" className="quick-action-btn" style={{ textDecoration: 'none' }}>
          <span className="material-icons-round">add_shopping_cart</span> New Bill
        </Link>
        <Link href="/inventory" className="quick-action-btn" style={{ textDecoration: 'none' }}>
          <span className="material-icons-round">add_box</span> Add Stock
        </Link>
        <Link href="/products" className="quick-action-btn" style={{ textDecoration: 'none' }}>
          <span className="material-icons-round">add_circle</span> Add Product
        </Link>
        <Link href="/customers" className="quick-action-btn" style={{ textDecoration: 'none' }}>
          <span className="material-icons-round">person_add</span> Add Customer
        </Link>
      </div>
    </div>
  );
}
