"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { 
  Heart, 
  Search, 
  SlidersHorizontal, 
  X,
  ChevronDown,
  ShoppingBag
} from 'lucide-react';
import { formatRupiah } from '@/utils/formatters';

function ProductCardImage({ product }) {
  const [error, setError] = useState(false);
  const rawImg = product.image;
  const imageUrl = rawImg ? (rawImg.startsWith('http') || rawImg.startsWith('/') ? rawImg : `/${rawImg}`) : null;

  if (!imageUrl || error) {
    return (
      <div className="w-full h-full bg-[#FCFCFC] border border-gray-100 flex flex-col items-center justify-center p-3 text-gray-400 select-none">
        <ShoppingBag className="w-8 h-8 text-gray-400 mb-1 stroke-[1.5]" />
        <span className="text-[11px] font-medium text-gray-500 text-center">Gambar belum tersedia</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Image
        src={imageUrl}
        alt={product.name}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
        quality={75}
        onError={() => setError(true)}
        referrerPolicy="no-referrer"
        className="object-cover pointer-events-none transition-transform duration-500 ease-out group-hover:scale-[1.04]"
      />
    </div>
  );
}

const ProductCard = React.memo(function ProductCard({
  product,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onOpenProductDetail
}) {
  const priceFormatted = formatRupiah(product.price);
  const discPriceFormatted = product.discountPrice 
    ? formatRupiah(product.discountPrice) 
    : null;

  return (
    <motion.div
      className="flex flex-col justify-between bg-transparent text-left relative overflow-hidden h-full"
    >
      {/* Container gambar dengan group untuk hover efek */}
      <div 
        className="group relative aspect-square w-full overflow-hidden rounded-2xl mb-4 bg-gray-50 cursor-pointer"
        onClick={() => onOpenProductDetail && onOpenProductDetail(product)}
      >
        <ProductCardImage product={product} />

        {/* Action buttons (Wishlist & Cart) in corner, appear on hover (Desktop only) */}
        <div className="hidden md:flex absolute top-4 right-4 z-20 flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
          {onToggleWishlist && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWishlist(product);
              }}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/80 border border-white/50 flex items-center justify-center text-[#173F35] hover:text-red-500 hover:bg-white shadow-xs transition-colors duration-200 cursor-pointer"
              title="Simpan ke Favorit"
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'text-red-500 fill-red-500' : ''}`} strokeWidth={1.5} />
            </button>
          )}
          
          {onAddToCart && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/80 border border-white/50 flex items-center justify-center text-[#173F35] hover:text-[#174C3C] hover:bg-white shadow-xs transition-colors duration-200 cursor-pointer"
              title="Tambah ke Keranjang"
            >
              <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* Product Metadata */}
      <div className="flex flex-col justify-between flex-1">
        <div className="flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <h3 
              onClick={() => onOpenProductDetail && onOpenProductDetail(product)}
              className="text-[13.5px] md:text-[14.5px] font-semibold text-[#174C3C] tracking-tight leading-tight line-clamp-1 cursor-pointer flex-1"
            >
              {product.name}
            </h3>

            {/* Mobile Action Buttons (Wishlist & Cart) - visible on < md only */}
            <div className="flex md:hidden items-center gap-2 shrink-0">
              {onToggleWishlist && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWishlist(product);
                  }}
                  className="p-1 text-[#173F35] hover:text-red-500 transition-colors duration-200 cursor-pointer"
                  title="Simpan ke Favorit"
                >
                  <Heart className={`w-[16px] h-[16px] ${isWishlisted ? 'text-red-500 fill-red-500' : ''}`} strokeWidth={1.5} />
                </button>
              )}
              {onAddToCart && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(product);
                  }}
                  className="p-1 text-[#173F35] hover:text-[#174C3C] transition-colors duration-200 cursor-pointer"
                  title="Tambah ke Keranjang"
                >
                  <ShoppingBag className="w-[16px] h-[16px]" strokeWidth={1.5} />
                </button>
              )}
            </div>
          </div>
          
          <span className="text-[11.5px] md:text-[12.5px] font-normal text-[#666666] mt-1 block leading-tight">
            {product.categoryName || (typeof product.category === 'object' ? product.category?.name : product.category) || ''}
          </span>
          
          <div className="mt-1.5">
            {discPriceFormatted ? (
              <div className="flex items-baseline gap-1.5 leading-none">
                <span className="text-[#174C3C] font-semibold text-[13px] md:text-[14px]">{discPriceFormatted}</span>
                <span className="text-gray-400 line-through text-[11px]">{priceFormatted}</span>
              </div>
            ) : (
              <span className="text-[#174C3C] font-semibold text-[13px] md:text-[14px] leading-none">{priceFormatted}</span>
            )}
          </div>
          
          <span className="text-gray-400 text-[11px] font-normal mt-1 block leading-none">
            (ex. PPN{product.unit ? `/${product.unit}` : ''})
          </span>
        </div>
      </div>
    </motion.div>
  );
});

export default function ProductGrid({
  products,
  wishlist = [],
  searchQuery: homepageSearchQuery,
  onToggleWishlist,
  onAddToCart,
  onOpenProductDetail,
  onResetFilters,
  isCatalog = false,
  isLoading = false
}) {
  const [activeTab, setActiveTab] = useState('Untuk Anda');
  const [localSearch, setLocalSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('Semua');
  const [maxPrice, setMaxPrice] = useState(150000);

  useEffect(() => {
    if (homepageSearchQuery) {
      setLocalSearch(homepageSearchQuery);
    }
  }, [homepageSearchQuery]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(localSearch);
    }, 250);
    return () => clearTimeout(handler);
  }, [localSearch]);

  const tabs = [
    'Untuk Anda',
    'Paling Populer',
    'Baru Dipanen',
    'Musiman',
    'Organik',
    'Hidroponik',
    'Best Seller'
  ];

  const locations = useMemo(() => {
    const locs = new Set(products.map(p => p.farmerLocation?.name || p.origin));
    return ['Semua', ...Array.from(locs).filter(Boolean)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (isCatalog) {
      return products;
    }
    let result = [...products];

    if (activeTab === 'Untuk Anda') {
      result = result.filter(p => p.isFeatured === true);
    } else if (activeTab === 'Paling Populer') {
      result = result.filter(p => p.isPopular === true || p.rating >= 4.8);
    } else if (activeTab === 'Baru Dipanen') {
      result = result.filter(p => p.isNew === true);
    } else if (activeTab === 'Musiman') {
      result = result.filter(p => p.isSeasonal === true);
    } else if (activeTab === 'Organik') {
      result = result.filter(p => p.isOrganic === true || p.name.toLowerCase().includes('organik') || p.description.toLowerCase().includes('organik'));
    } else if (activeTab === 'Hidroponik') {
      result = result.filter(p => p.isHydroponic === true || p.name.toLowerCase().includes('hidroponik') || p.description.toLowerCase().includes('hidroponik'));
    } else if (activeTab === 'Best Seller') {
      result = result.filter(p => p.isBestSeller === true || p.rating >= 4.9);
    }

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(p => {
        const catStr = (p.categoryName || (typeof p.category === 'object' ? p.category?.name : p.category) || '').toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          catStr.includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.origin || '').toLowerCase().includes(q)
        );
      });
    }

    if (selectedLocation !== 'Semua') {
      result = result.filter(p => (p.farmerLocation?.name || p.origin) === selectedLocation);
    }

    result = result.filter(p => p.price <= maxPrice);

    return result;
  }, [products, activeTab, debouncedSearch, selectedLocation, maxPrice, isCatalog]);

  const handleResetAll = () => {
    setActiveTab('Untuk Anda');
    setLocalSearch('');
    setSelectedLocation('Semua');
    setMaxPrice(150000);
    if (onResetFilters) onResetFilters();
  };

  if (isLoading) {
    return (
      <div className={isCatalog ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 xl:gap-6" : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-3 space-y-3 animate-pulse">
            <div className="aspect-square w-full bg-gray-200 rounded-xl" />
            <div className="space-y-2 pt-1">
              <div className="h-4 w-3/4 bg-gray-200 rounded-md" />
              <div className="h-3 w-1/2 bg-gray-100 rounded-md" />
              <div className="h-4 w-2/3 bg-gray-200 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isCatalog) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 xl:gap-6">
        {products.map((product, idx) => {
          const isWishlisted = wishlist.includes(product.id) || wishlist.some(item => item.id === product.id || item === product.id);
          return (
            <div key={`${product.id || 'prod'}-${idx}`}>
              <ProductCard
                product={product}
                isWishlisted={isWishlisted}
                onToggleWishlist={onToggleWishlist}
                onAddToCart={onAddToCart}
                onOpenProductDetail={onOpenProductDetail}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <section id="catalog-section" className="bg-[#FCFCFC] py-20 border-t border-slate-100 font-sans">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        
        {/* Editorial Text Block */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 text-left">
          <div className="space-y-2 max-w-[650px]">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#174C3C] tracking-tight leading-tight">
              Kurasi Hasil Tani Hari Ini
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
              Temukan sayuran organik, hidroponik, dan bumbu rempah premium yang dipetik segar fajar tadi oleh mitra petani lokal Kabupaten Bangka.
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={handleResetAll}
              className="inline-flex items-center justify-center bg-[#174C3C] hover:bg-[#1F5C49] text-white px-7 h-11 text-[11px] uppercase tracking-wider font-bold transition-colors duration-200 rounded-full shadow-sm hover:shadow-md cursor-pointer"
            >
              Lihat Seluruh Katalog
            </button>
          </div>
        </div>

        {/* Interactive Query & Filtering Row */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-8">
          
          {/* horizontal scroll tab pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none shrink-0 -mx-6 px-6 lg:mx-0 lg:px-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-4.5 text-[10px] uppercase tracking-wider font-bold rounded-full transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'bg-[#174C3C] text-white shadow-sm' 
                      : 'bg-white text-slate-500 border border-slate-100 hover:text-[#174C3C] hover:border-[#174C3C]'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Search container & Advanced button */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-60">
              <input
                type="text"
                placeholder="Cari sayur premium..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full h-10 bg-white text-xs text-[#174C3C] py-2 pl-4 pr-10 border border-slate-100 focus:outline-none focus:border-[#6E9C7C] rounded-full transition-all shadow-2xs font-medium"
              />
              <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`w-10 h-10 rounded-full border transition-all duration-300 cursor-pointer flex items-center justify-center ${
                showFilters || selectedLocation !== 'Semua' || maxPrice < 150000
                  ? 'bg-[#174C3C]/10 border-[#174C3C]/20 text-[#174C3C]'
                  : 'bg-white border-slate-100 text-slate-500 hover:border-[#174C3C] hover:text-[#174C3C] shadow-2xs'
              }`}
              title="Filter Lanjutan"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Collapsible Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-8"
            >
              <div className="bg-white border border-zinc-200 p-6 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-6 text-left shadow-xs">
                
                {/* Farmer Locs */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-[#174C3C] font-extrabold block">Asal Mitra Tani</label>
                  <div className="relative">
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full bg-slate-50/60 border border-zinc-200 px-4 py-2.5 text-xs focus:outline-none focus:border-[#174C3C] rounded-md font-medium text-slate-700 appearance-none cursor-pointer"
                    >
                      {locations.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-3.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Price cap */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#174C3C] font-extrabold">
                    <span>Harga Maksimal</span>
                    <span className="text-[#6E9C7C]">{formatRupiah(maxPrice)}</span>
                  </div>
                  <input
                    type="range"
                    min="10000"
                    max="150000"
                    step="5000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-[#174C3C] h-1.5 bg-slate-100 rounded-lg cursor-pointer mt-2"
                  />
                </div>

                {/* Resets drawer */}
                <div className="flex items-end justify-start md:justify-end">
                  <button
                    onClick={() => {
                      setSelectedLocation('Semua');
                      setMaxPrice(150000);
                      setLocalSearch('');
                    }}
                    className="text-[11px] uppercase tracking-wider font-extrabold text-rose-600 hover:text-rose-800 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Hapus Saringan Lanjutan</span>
                  </button>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty list illustration */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-20 bg-white border border-zinc-200 max-w-md mx-auto px-8 space-y-5 rounded-lg shadow-xs">
            <div className="w-12 h-12 bg-slate-50 flex items-center justify-center mx-auto text-slate-400 rounded-full border border-slate-100">
              <Search className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg text-slate-800 font-extrabold">Hasil Sayur Nihil</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Maaf, tidak berhasil menemukan sayuran di kategori "{activeTab}" yang sesuai dengan kriteria saringan Anda.
              </p>
            </div>
            <button
              onClick={handleResetAll}
              className="px-6 h-11 bg-[#174C3C] hover:bg-[#1a5543] text-white text-[11px] uppercase tracking-wider font-bold rounded-full transition-all duration-300 shadow-sm"
            >
              Reset Semua Filter
            </button>
          </div>
        )}

        {/* Product Grid Panel */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {filteredProducts.map((product, idx) => {
            const isWishlisted = wishlist.includes(product.id) || wishlist.some(item => item && (item.id === product.id || item.productId === product.id));
            return (
              <div key={`${product.id || 'prod'}-${idx}`}>
                <ProductCard
                  product={product}
                  isWishlisted={isWishlisted}
                  onToggleWishlist={onToggleWishlist}
                  onAddToCart={onAddToCart}
                  onOpenProductDetail={onOpenProductDetail}
                />
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}