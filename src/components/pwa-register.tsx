'use client';

import { useEffect } from 'react';

export function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('serviceWorker' in navigator) {
      import('next-pwa/register').catch(() => {
        // ignore registration errors in dev
      });
    }
  }, []);

  return null;
}
