import React from 'react';
import ProductDetailPage from '@/components/product/ProductDetailPage';
import PageLayoutWrapper from '@/components/layout/PageLayoutWrapper';
import { getProductByIdOrSlug, getActiveProducts } from '@/lib/products';

export default async function ProdukDetailRoutePage({ params }) {
  const resolvedParams = await params;
  const idOrSlug = resolvedParams?.idOrSlug;

  const [product, relatedProducts] = await Promise.all([
    getProductByIdOrSlug(idOrSlug),
    getActiveProducts(12)
  ]);

  return (
    <PageLayoutWrapper>
      <ProductDetailPage 
        idOrSlug={idOrSlug} 
        initialProduct={product} 
        initialRelatedProducts={relatedProducts} 
      />
    </PageLayoutWrapper>
  );
}