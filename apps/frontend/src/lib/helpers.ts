/**
 * Zivora — Utility Helpers (TypeScript port)
 */

export function formatCurrency(amount: number | string): string {
  const num = Number(amount) || 0;
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function timeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(dateStr);
}

export function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export function isThisWeek(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  return d >= weekAgo && d <= now;
}

export function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number = 300): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

export interface StockStatus {
  label: string;
  class: string;
  badge: string;
}

export function getStockStatus(currentStock: number, reorderLevel: number = 5): StockStatus {
  if (currentStock <= 0) return { label: 'Out of Stock', class: 'out-of-stock', badge: 'badge-ruby' };
  if (currentStock <= reorderLevel) return { label: 'Low Stock', class: 'low-stock', badge: 'badge-amber' };
  return { label: 'In Stock', class: 'in-stock', badge: 'badge-emerald' };
}

export function escapeHtml(text: string): string {
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (div) {
    div.textContent = text;
    return div.innerHTML;
  }
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export interface Variant {
  id: string;
  productId: string;
  sku: string;
  color?: string;
  size?: string;
  finish?: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  reservedStock?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export function getVariantLabel(variant: Variant | { color?: string; size?: string; finish?: string; sellingPrice?: number }): string {
  const parts: string[] = [];
  if (variant.color) parts.push(variant.color);
  if (variant.size) parts.push(variant.size);
  if (variant.finish) parts.push(variant.finish);
  if (parts.length > 0) return parts.join(' / ');
  if (variant.sellingPrice) return `₹${Number(variant.sellingPrice).toLocaleString('en-IN')}`;
  return 'Default';
}

export function getPriceTierLabel(price: number): string {
  return `₹${Number(price).toLocaleString('en-IN')}`;
}

export function percentChange(current: number, previous: number): number {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}
