import React from 'react';
import CategoryPage from '@/components/category/CategoryPage';
import PageLayoutWrapper from '@/components/layout/PageLayoutWrapper';
import { getActiveCategories } from '@/lib/categories';
import { getActiveProducts } from '@/lib/products';

export default async function KategoriRoutePage() {
  const [categories, products] = await Promise.all([
    getActiveCategories(),
    getActiveProducts(100)
  ]);

  return (
    <PageLayoutWrapper>
      <CategoryPage initialCategories={categories} initialProducts={products} />
    </PageLayoutWrapper>
  );
}