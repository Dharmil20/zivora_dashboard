'use client';

import { useState } from 'react';
import { useDb } from '@/context/DbProvider';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { ready } = useDb();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!ready) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', width: '100vw', background: 'var(--bg-primary)',
      }}>
        <div style={{
          width: 64, height: 64, background: 'var(--gold-gradient)', borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
          color: '#1A1A2E', marginBottom: 20, boxShadow: '0 8px 32px rgba(212,175,55,0.3)',
        }}>
          <span className="material-icons-round">diamond</span>
        </div>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700,
          background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 8
        }}>Zivora</div>
        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Setting up your shop...</div>
      </div>
    );
  }

  return (
    <div id="app">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
