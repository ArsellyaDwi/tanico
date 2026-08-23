"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowRight,
  TrendingUp,
  Users,
  Grid,
  Award
} from 'lucide-react';

function CategoryItemImage({ cat }) {
  const [error, setError] = useState(false);
  const rawUrl = cat.image ? (cat.image.startsWith('http') || cat.image.startsWith('/') ? cat.image : `/${cat.image}`) : null;
  const imageUrl = rawUrl;

  if (!imageUrl || error) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center select-none">
        <span className="text-[10px] font-medium text-gray-400 text-center">Gambar belum tersedia</span>
      </div>
    );
  }

  const cropZoom = parseFloat(cat.cropZoom || '100') / 100;

  return (
    <div className="w-full h-full overflow-hidden transition-transform duration-500 ease-out group-hover:scale-[1.04]">
      <Image
        src={imageUrl}
        alt={cat.name}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 250px"
        quality={75}
        onError={() => setError(true)}
        style={{
          objectPosition: cat.cropPosition || 'center center',
          transform: `scale(${cropZoom})`
        }}
        className="object-cover select-none pointer-events-none origin-center"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

export default function CategoryPage({ initialCategories = [], initialProducts = [] }) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts || []);
  const [categories, setCategories] = useState(initialCategories || []);
  const [isLoading, setIsLoading] = useState(!initialCategories?.length);

  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setCategories(initialCategories);
      if (initialProducts && initialProducts.length > 0) {
        setProducts(initialProducts);
      }
      setIsLoading(false);
      return;
    }

    async function loadData() {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/products')
        ]);
        if (catRes.ok) {
          const cats = await catRes.json();
          setCategories(cats || []);
        }
        if (prodRes.ok) {
          const prods = await prodRes.json();
          setProducts(prods || []);
        }
      } catch (err) {
        console.error('Error loading category page data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [initialCategories, initialProducts]);

  const displayCategories = [...categories]
    .filter(cat => cat && cat.status !== 'Nonaktif')
    .sort((a, b) => {
      const rawA = parseInt(a.sortOrder, 10);
      const rawB = parseInt(b.sortOrder, 10);
      const orderA = !isNaN(rawA) ? rawA : 0;
      const orderB = !isNaN(rawB) ? rawB : 0;
      return orderA - orderB;
    });

  const statsData = [
    { icon: <TrendingUp className="w-5 h-5 text-[#4D8B55]" />, value: '100+', label: 'Produk Segar' },
    { icon: <Users className="w-5 h-5 text-[#4D8B55]" />, value: '24', label: 'Petani Lokal' },
    { icon: <Grid className="w-5 h-5 text-[#4D8B55]" />, value: `${displayCategories.length}`, label: 'Kategori Hasil Tani' },
    { icon: <Award className="w-5 h-5 text-[#4D8B55]" />, value: '98%', label: 'Tingkat Kepuasan' }
  ];

  const handleCategoryClick = (category) => {
    if (!category) return;
    const catSlug = typeof category === 'object' ? (category.slug || category.name) : category;
    router.push(`/produk?category=${encodeURIComponent(catSlug)}`);
  };

  const handleNavigateToCatalog = () => {
    router.push('/produk');
  };

  return (
    <div className="w-full bg-[#FCFCFC] min-h-screen text-[#666666] antialiased font-jost pb-16">
      
      {/* 1. BREADCRUMB */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 pt-8 pb-2 text-left select-none">
        <nav className="flex items-center gap-1.5 text-xs tracking-[0.12em] text-[#6B7280] font-medium">
          <span 
            onClick={() => router.push('/')} 
            className="hover:text-[#174C3C] transition-colors cursor-pointer"
          >
            Beranda
          </span>
          <span className="text-gray-300">/</span>
          <span className="text-[#174C3C] font-semibold">Kategori</span>
        </nav>
      </div>

      {/* 2. SECTION WRAPPER & HEADER */}
      <section 
        id="categories-section" 
        className="bg-[#FCFCFC] border-t border-gray-100 pt-10 pb-10 relative overflow-hidden select-none"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          
          {/* SECTION HEADER */}
          <div className="text-center max-w-[700px] mx-auto mb-6 space-y-3">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.24em] font-semibold text-[#4D8B55] inline-flex items-center">
              PILIHAN KATEGORI
            </p>
            
            <h2 className="text-[#174C3C] text-[22px] sm:text-[30px] lg:text-[38px] font-semibold tracking-tight leading-[1.08]">
              Temukan Kategori Hasil Bumi
            </h2>
            
            <p className="text-[12px] sm:text-[14px] lg:text-[15px] font-normal text-[#666666] leading-relaxed">
              Produk segar pilihan dari petani lokal Bangka untuk berbagai kebutuhan sehari-hari.
            </p>
          </div>

          {/* Categories Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 h-[270px] md:h-[280px] flex flex-col justify-between animate-pulse">
                  <div className="h-[155px] w-full bg-gray-200 rounded-t-2xl" />
                  <div className="space-y-2 pt-3">
                    <div className="h-4 w-3/4 bg-gray-200 rounded-md" />
                    <div className="h-3 w-1/2 bg-gray-100 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayCategories.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
              <p className="text-[14px] text-gray-500 font-medium">Belum ada kategori hasil bumi yang aktif saat ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
              {displayCategories.map((category) => (
                <div
                  key={category.id || category.name}
                  className="w-full h-full"
                >
                  <div
                    onClick={() => handleCategoryClick(category)}
                    className="relative bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col justify-between cursor-pointer h-[270px] md:h-[280px] w-full mx-auto shadow-sm"
                  >
                    {/* Image Frame */}
                    <div className="group h-[155px] w-full overflow-hidden relative bg-gray-50 rounded-t-2xl shrink-0">
                      <div className="w-full h-full overflow-hidden rounded-t-2xl">
                        <CategoryItemImage cat={category} />
                      </div>
                      
                      {category.badge && (
                        <div className="absolute top-2.5 left-2.5 z-20 px-2 py-0.5 bg-white/90 text-[#174C3C] rounded-full text-[9px] font-bold uppercase">
                          {category.badge}
                        </div>
                      )}

                      {/* Smooth Vignette Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent z-10 pointer-events-none" />
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 px-4 py-3 flex flex-col justify-between bg-white border-t border-[#FAFAF9] rounded-b-2xl text-left overflow-hidden">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-1.5">
                          <h3 className="text-[13px] md:text-[14px] font-semibold text-[#174C3C] tracking-tight leading-tight">
                            {category.name}
                          </h3>
                        </div>
                        {category.description && (
                          <p className="text-[11px] text-gray-500 font-normal leading-normal line-clamp-2">
                            {category.description}
                          </p>
                        )}
                      </div>

                      {/* CTA Button */}
                      {category.ctaText && (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCategoryClick(category);
                          }}
                          className="flex items-center text-[#174C3C] font-semibold text-[11px] sm:text-[12px] tracking-wide mt-1 hover:underline cursor-pointer group-hover:text-[#205E49]"
                        >
                          <span>{category.ctaText}</span>
                          <span className="inline-block ml-1">→</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* 4. STATISTIK KATEGORI */}
      <section className="bg-[#FCFCFC] py-14 border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {statsData.map((stat, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 flex flex-col justify-center text-left cursor-default shadow-xs"
              >
                <div className="text-[24px] md:text-[30px] font-semibold text-[#174C3C] tracking-tight leading-none">
                  {stat.value}
                </div>
                <div className="text-[13px] md:text-[14px] text-[#666666] font-normal leading-relaxed mt-1.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. BANNER CTA */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pt-16">
        <div className="relative bg-white border border-gray-100 rounded-2xl p-8 sm:p-12 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          
          {/* Circular soft ornament glow */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#4D8B55]/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-[#174C3C]/6 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-2 relative z-10 text-center md:text-left max-w-lg">
            <h3 className="text-[20px] sm:text-[22px] font-semibold text-[#174C3C] tracking-tight">
              Belum menemukan yang dicari?
            </h3>
            <p className="text-[13px] sm:text-[14px] text-[#666666]">
              Jelajahi seluruh katalog produk TaniCo untuk menemukan sayuran, buah, dan rempah segar lainnya.
            </p>
          </div>

          <div className="relative z-10 shrink-0">
            <button
              onClick={handleNavigateToCatalog}
              className="px-6 py-3 bg-[#174C3C] hover:bg-[#205E49] active:bg-[#123A2E] text-white text-xs font-semibold uppercase tracking-widest rounded-full transition-colors duration-200 inline-flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <span>Lihat Semua Produk</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}