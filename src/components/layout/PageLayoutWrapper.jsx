"use client";

import React from 'react';
import LayoutWrapper from '@/components/layout/LayoutWrapper';

export default function PageLayoutWrapper({ children, settings = {} }) {
  return (
    <LayoutWrapper settings={settings}>
      {children}
    </LayoutWrapper>
  );
}

