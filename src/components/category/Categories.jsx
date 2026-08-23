"use client";

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Leaf, ChevronRight } from 'lucide-react';

function CategoryItemImage({ cat }) {
  const [error, setError] = useState(false);
  const rawImg = cat.image || cat.imageUrl || null;
  const imageUrl = rawImg ? (rawImg.startsWith('http') || rawImg.startsWith('/') ? rawImg : `/${rawImg}`) : null;

  if (!imageUrl || error) {
    return (
      <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center p-3 text-gray-400 select-none">
        <Leaf className="w-7 h-7 text-gray-400 mb-1 stroke-[1.5]" />
        <span className="text-[10px] font-medium text-gray-500 text-center">Gambar belum tersedia</span>
      </div>
    );
  }

  const cropZoom = parseFloat(cat.cropZoom || '100') / 100;

  return (
    <div className="relative w-full h-full overflow-hidden transition-transform duration-500 ease-out group-hover:scale-[1.04]">
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

function Categories({ 
  cms,
  categories: propCategories = [], 
  onCategorySelect, 
  selectedCategory, 
  setSelectedCategory, 
  onSelectCategory,
  isLoading = false
}) {
  const router = useRouter();
  const rawCategories = Array.isArray(propCategories) ? propCategories : [];
  const activeCms = cms || {};
  const badgeText = activeCms?.badge || "PILIHAN KATEGORI";
  const sectionTitle = activeCms?.title || "Temukan Hasil Bumi untuk Setiap Kebutuhan";
  const sectionSubtitle = activeCms?.description || "Dipilih langsung dari petani lokal Bangka dengan kualitas terbaik untuk kebutuhan sehari-hari Anda.";

  const limit = activeCms?.limit ?? 5;
  const showCategoryDescription = activeCms?.showCategoryDescription ?? true;
  const showViewAllButton = activeCms?.showViewAllButton ?? true;
  const viewAllButtonText = activeCms?.viewAllButtonText ?? 'Lihat Semua Kategori';
  const rawViewAllLink = activeCms?.viewAllButtonLink ?? '/kategori';
  const viewAllButtonLink = (typeof rawViewAllLink === 'string' && rawViewAllLink.startsWith('/produk'))
    ? '/kategori'
    : rawViewAllLink;

  // Filter and sort categories based on sortOrder and homepage settings
  const displayCategories = React.useMemo(() => {
    return [...(Array.isArray(rawCategories) ? rawCategories : [])]
      .filter(cat => {
        if (!cat) return false;
        const st = String(cat.status || '').toLowerCase().trim();
        return st !== 'nonaktif' && cat.showOnHomepage !== false;
      })
      .sort((a, b) => {
        const rawA = parseInt(a.sortOrder, 10);
        const rawB = parseInt(b.sortOrder, 10);
        const orderA = !isNaN(rawA) ? rawA : 0;
        const orderB = !isNaN(rawB) ? rawB : 0;
        return orderA - orderB;
      })
      .slice(0, limit);
  }, [rawCategories, limit]);

  if (activeCms.show === false) return null;

  if (isLoading) {
    return (
      <section id="categories-section" className="bg-[#FCFCFC] border-t border-gray-100 pt-10 pb-10 relative overflow-hidden select-none">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
            <div className="h-3 w-28 bg-gray-200/80 animate-pulse mx-auto rounded-full" />
            <div className="h-6 w-64 sm:w-80 bg-gray-200/80 animate-pulse mx-auto rounded-lg" />
            <div className="h-3.5 w-72 sm:w-96 bg-gray-100 animate-pulse mx-auto rounded-md" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-5">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-[#E7E7E7] p-4 flex flex-col items-center gap-3 animate-pulse">
                <div className="w-20 h-20 rounded-xl bg-gray-200/80" />
                <div className="h-4 w-24 bg-gray-200/80 rounded-md" />
                <div className="h-3 w-16 bg-gray-100 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (displayCategories.length === 0) {
    return (
      <section id="categories-section" className="bg-[#FCFCFC] border-t border-gray-100 py-16 text-center select-none">
        <div className="max-w-md mx-auto px-6 space-y-2">
          <h3 className="text-[18px] sm:text-[20px] font-semibold text-[#174C3C]">Kategori belum tersedia</h3>
          <p className="text-[13px] sm:text-[14px] text-[#666666] leading-relaxed">
            Belum ada kategori aktif yang ditambahkan melalui Dashboard Admin.
          </p>
        </div>
      </section>
    );
  }

  const handleSelect = (cat) => {
    if (!cat) return;
    const catSlug = typeof cat === 'object' ? (cat.slug || cat.name) : cat;
    const catName = typeof cat === 'object' ? cat.name : cat;

    if (typeof onCategorySelect === 'function') {
      onCategorySelect(catSlug);
    } else if (typeof onSelectCategory === 'function') {
      onSelectCategory(catSlug);
    } else if (typeof setSelectedCategory === 'function') {
      setSelectedCategory(catName);
    } else {
      router.push(`/produk?category=${encodeURIComponent(catSlug)}`);
    }
  };

  return (
    <section 
      id="categories-section" 
      className="bg-[#FCFCFC] border-t border-gray-100 pt-10 pb-10 relative overflow-hidden select-none"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        
        {/* SECTION HEADER - Unchanged text design */}
        <div className="text-center max-w-[700px] mx-auto mb-6 space-y-3">
          <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.24em] font-semibold text-[#4D8B55] inline-flex items-center">
            {badgeText}
          </p>
          
          <h2 className="text-[#174C3C] text-[22px] sm:text-[30px] lg:text-[38px] font-semibold tracking-tight leading-[1.08]">
            {sectionTitle}
          </h2>
          
          <p className="text-[12px] sm:text-[14px] lg:text-[15px] font-normal text-[#666666] leading-relaxed">
            {sectionSubtitle}
          </p>
        </div>

        {/* Categories Grid - 5 categories in 1 row on xl */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
          {displayCategories.map((cat, index) => {
            const isSelected = selectedCategory === cat.name;

            return (
              <motion.div
                key={cat.id || cat.name}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.25, delay: index * 0.03 }}
                className="w-full h-full"
              >
                <div
                  onClick={() => handleSelect(cat)}
                  className={`relative bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col justify-between cursor-pointer h-[270px] md:h-[280px] w-full mx-auto shadow-sm ${
                    isSelected ? 'border-[#174C3C] ring-4 ring-[#174C3C]/5 shadow-sm' : ''
                  }`}
                >
                  {/* Image Frame with cropZoom support */}
                  <div className="group h-[155px] w-full overflow-hidden relative bg-gray-50 rounded-t-2xl shrink-0">
                    <div className="w-full h-full overflow-hidden rounded-t-2xl">
                      <CategoryItemImage cat={cat} />
                    </div>
                    
                    {/* Smooth Vignette Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent z-10 pointer-events-none" />
                  </div>

                  {/* Content Section with description */}
                  <div className="flex-1 px-4 py-3 flex flex-col justify-between bg-white border-t border-[#FAFAF9] rounded-b-2xl text-left overflow-hidden">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-1.5">
                        <h3 className="text-[13px] md:text-[14px] font-semibold text-[#174C3C] tracking-tight leading-tight">
                          {cat.name}
                        </h3>
                      </div>
                      {showCategoryDescription && cat.description && (
                        <p className="text-[11px] text-gray-500 font-normal leading-normal line-clamp-2">
                          {cat.description}
                        </p>
                      )}
                    </div>

                    {/* Lihat Kategori Button */}
                    {cat.ctaText && (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(cat);
                        }}
                        className="flex items-center text-[#174C3C] font-semibold text-[11px] sm:text-[12px] tracking-wide mt-1 hover:underline cursor-pointer group-hover:text-[#205E49]"
                      >
                        <span>{cat.ctaText}</span>
                        <span className="inline-block ml-1">
                          →
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* View All Button below categories grid */}
        {showViewAllButton && (
          <div className="mt-8 text-center">
            <a 
              href={viewAllButtonLink}
              className="inline-flex items-center justify-center px-4 py-2 text-[12px] md:text-[14px] font-medium bg-[#174C3C] hover:bg-[#205E49] active:bg-[#123A2E] text-white rounded-full transition-colors duration-200 shadow-sm cursor-pointer"
            >
              <span>{viewAllButtonText}</span>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
            </a>
          </div>
        )}

      </div>
    </section>
  );
}

export default React.memo(Categories);
