'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { section: 'Main', items: [{ key: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '/' }] },
  { section: 'Catalog', items: [
    { key: 'products', label: 'Products', icon: 'diamond', href: '/products' },
    { key: 'inventory', label: 'Inventory', icon: 'inventory_2', href: '/inventory' }
  ]},
  { section: 'Sales', items: [
    { key: 'billing', label: 'New Bill', icon: 'point_of_sale', href: '/billing' },
    { key: 'bills', label: 'Bills History', icon: 'receipt_long', href: '/bills' },
    { key: 'customers', label: 'Customers', icon: 'people', href: '/customers' }
  ]},
  { section: 'System', items: [{ key: 'settings', label: 'Settings', icon: 'settings', href: '/settings' }] }
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isLinkActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className={`sidebar ${isOpen ? 'open' : ''}`} id="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <span className="material-icons-round">diamond</span>
        </div>
        <span className="sidebar-brand-text">Zivora</span>
      </div>
      <div className="sidebar-nav" id="sidebar-nav">
        {NAV_ITEMS.map((section, idx) => (
          <React.Fragment key={idx}>
            <div className="sidebar-section-label">{section.section}</div>
            {section.items.map(item => {
              const active = isLinkActive(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`sidebar-link ${active ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <span className="material-icons-round">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div className="sidebar-footer">
        <div className="sidebar-footer-avatar">A</div>
        <div className="sidebar-footer-info">
          <div className="sidebar-footer-name">Admin</div>
          <div className="sidebar-footer-role">Owner</div>
        </div>
      </div>
    </nav>
  );
}

import React from 'react';
