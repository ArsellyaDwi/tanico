import React from 'react';
import ProductPage from '@/components/product/ProductPage';
import PageLayoutWrapper from '@/components/layout/PageLayoutWrapper';
import { getActiveProducts } from '@/lib/products';
import { getActiveCategories } from '@/lib/categories';

export default async function ProdukRoutePage() {
  const [products, categories] = await Promise.all([
    getActiveProducts(100),
    getActiveCategories()
  ]);

  return (
    <PageLayoutWrapper>
      <React.Suspense fallback={<div className="min-h-screen bg-[#FDFBF7]" />}>
        <ProductPage initialProducts={products} initialCategories={categories} />
      </React.Suspense>
    </PageLayoutWrapper>
  );
}