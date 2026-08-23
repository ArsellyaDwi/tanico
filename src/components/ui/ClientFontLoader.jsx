'use client';

import { useEffect } from 'react';

export default function ClientFontLoader() {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const fontId = 'tanico-jost-font-link';
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  return null;
}
