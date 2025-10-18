'use client';

import { useEffect } from 'react';

export function PWARegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof window === 'undefined') return;
    if ('serviceWorker' in navigator) {
      import('next-pwa/register').catch(() => {
        // ignore registration errors in dev
      });
    }
  }, []);

  return null;
}
