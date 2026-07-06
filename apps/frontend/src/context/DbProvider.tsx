'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { db } from '@/lib/db/store';
import { seedDemoData } from '@/lib/db/seed';

interface DbContextValue {
  db: typeof db;
  ready: boolean;
  refresh: () => void;
  refreshKey: number;
}

const DbContext = createContext<DbContextValue | null>(null);

export function DbProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    (async () => {
      const hasApiUrl = !!process.env.NEXT_PUBLIC_API_URL;
      const hasSeeded = typeof window !== 'undefined' && localStorage.getItem('zivora_has_seeded') === 'true';

      if (!hasApiUrl && !hasSeeded) {
        await seedDemoData();
        if (typeof window !== 'undefined') {
          localStorage.setItem('zivora_has_seeded', 'true');
        }
      }
      setReady(true);
    })();
  }, []);

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  return (
    <DbContext.Provider value={{ db, ready, refresh, refreshKey }}>
      {children}
    </DbContext.Provider>
  );
}

export function useDb() {
  const ctx = useContext(DbContext);
  if (!ctx) throw new Error('useDb must be used within DbProvider');
  return ctx;
}
