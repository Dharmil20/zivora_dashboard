'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface HeaderProps {
  onMenuToggle: () => void;
}

const TITLE_MAP: Record<string, { title: string; subtitle?: string }> = {
  '/': { title: 'Dashboard' },
  '/products': { title: 'Products & Categories' },
  '/inventory': { title: 'Inventory Management' },
  '/billing': { title: 'New Bill (POS)' },
  '/bills': { title: 'Bills History' },
  '/customers': { title: 'Customers' },
  '/settings': { title: 'Settings' }
};

export default function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const now = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDateStr(now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
  }, []);

  const info = TITLE_MAP[pathname] || { title: 'Zivora' };

  return (
    <header className="main-header">
      <div className="main-header-left">
        <button className="btn btn-ghost btn-icon" id="menu-toggle" onClick={onMenuToggle}>
          <span className="material-icons-round">menu</span>
        </button>
        <div>
          <h1 className="main-header-title" id="page-title">{info.title}</h1>
          <div className="main-header-subtitle" id="page-subtitle">{dateStr}</div>
        </div>
      </div>
      <div className="main-header-right">
        <button className="btn btn-ghost btn-icon" id="notifications-btn" title="Notifications">
          <span className="material-icons-round">notifications</span>
        </button>
        {pathname !== '/billing' && (
          <button className="btn btn-primary" id="header-new-bill" onClick={() => router.push('/billing')}>
            <span className="material-icons-round">add</span> New Bill
          </button>
        )}
      </div>
    </header>
  );
}
