"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

// Core layout & design components
import Hero from '@/components/home/Hero';
import Categories from '@/components/category/Categories';
import FeaturedCarousel from '@/components/home/FeaturedCarousel';
import PartnersCarousel from '@/components/home/PartnersCarousel';
import UmkmStory from '@/components/home/UmkmStory';
import Testimonials from '@/components/home/Testimonials';
import Gallery from '@/components/home/Gallery';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import PageLayoutWrapper from '@/components/layout/PageLayoutWrapper';

function StorefrontHomePageContent({ initialData = null }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();

  const [data, setData] = React.useState(initialData || {});
  const [loading, setLoading] = React.useState(!initialData);

  React.useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setData(initialData);
      setLoading(false);
      return;
    }
    let isMounted = true;
    async function loadHome() {
      try {
        setLoading(true);
        const res = await fetch('/api/home');
        if (res.ok) {
          const fresh = await res.json();
          if (isMounted) setData(fresh || {});
        }
      } catch (err) {
        console.error('Error fetching /api/home:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadHome();
    return () => { isMounted = false; };
  }, [initialData]);

  const homeData = data || {};

  const handleOpenProductDetail = React.useCallback((p) => {
    if (!p) return;
    const slug = p.slug || (p.name ? p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : '');
    if (slug) router.push(`/produk/${slug}`);
  }, [router]);

  const handleCategorySelect = React.useCallback((cat) => {
    if (!cat) return;
    const catSlug = typeof cat === 'object' ? (cat.slug || cat.name) : cat;
    router.push(`/produk?category=${encodeURIComponent(catSlug)}`);
  }, [router]);

  const handleExploreClick = React.useCallback(() => {
    router.push('/produk');
  }, [router]);

  const products = homeData?.featuredProducts || homeData?.products || [];
  const categories = homeData?.categories || [];
  const partners = homeData?.partners || [];
  const gallery = homeData?.gallery || [];
  const testimonials = homeData?.testimonials || [];
  const articles = homeData?.latestArticles || homeData?.articles || [];
  const cms = homeData?.homepageCMS || homeData?.settings?.homepageCMS || {};

  return (
    <div className="overflow-hidden bg-[#FCFCFC]">
      {/* 1. Hero Section */}
      {cms?.hero?.show !== false && (
        <Hero 
          cms={cms?.hero}
          heroBenefits={homeData?.heroBenefits || cms?.hero?.benefits || []}
          onExploreClick={handleExploreClick}
          isLoading={false}
        />
      )}

      {/* 2. Categories Showcase */}
      {cms?.categories?.show !== false && (
        <Categories
          cms={cms?.categories}
          categories={categories}
          onCategorySelect={handleCategorySelect}
          isLoading={false}
        />
      )}

      {/* 3. Featured Carousel Block */}
      {cms?.featuredProducts?.show !== false && (
        <FeaturedCarousel 
          cms={cms?.featuredProducts}
          products={products}
          onOpenProductDetail={handleOpenProductDetail}
          onToggleWishlist={toggleWishlist}
          onAddToCart={addToCart}
          wishlist={wishlist}
          isLoading={false}
        />
      )}

      {/* 4. Infinite Partners Marquee */}
      {cms?.partners?.show !== false && (
        <PartnersCarousel cms={cms?.partners} partners={partners} />
      )}

      {/* 5. Instagram Style Gallery */}
      {cms?.gallery?.show !== false && (
        <Gallery cms={cms?.gallery} gallery={gallery} />
      )}

      {/* 6. Customer Testimonials */}
      {cms?.testimonials?.show !== false && (
        <Testimonials cms={cms?.testimonials} testimonials={testimonials} />
      )}

      {/* 7. Local Farmers Story Block */}
      {cms?.farmer?.show !== false && (
        <UmkmStory cms={cms?.farmer} articles={articles} />
      )}
    </div>
  );
}

export default function StorefrontHomePageClient({ initialData = null }) {
  return (
    <PageLayoutWrapper settings={initialData?.settings}>
      <StorefrontHomePageContent initialData={initialData} />
    </PageLayoutWrapper>
  );
}

