'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const PremiumCursor = dynamic(
  () => import('@/components/ui/PremiumCursor').catch((err) => {
    console.warn('PremiumCursor failed to load:', err);
    return () => null;
  }),
  { ssr: false }
);

export default function ClientCursor() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch) return;

    if ('requestIdleCallback' in window) {
      const handle = window.requestIdleCallback(() => setLoaded(true), { timeout: 1000 });
      return () => window.cancelIdleCallback(handle);
    } else {
      setLoaded(true);
    }
  }, []);

  if (!loaded) return null;
  return <PremiumCursor />;
}
