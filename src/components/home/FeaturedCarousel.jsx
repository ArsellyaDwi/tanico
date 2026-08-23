"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Heart, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatRupiah } from '@/utils/formatters';
import { isActiveProduct } from '@/utils/helpers';

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
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 260px"
        quality={75}
        onError={() => setError(true)}
        referrerPolicy="no-referrer"
        className="object-cover pointer-events-none transition-transform duration-500 ease-out group-hover:scale-[1.04]"
      />
    </div>
  );
}

function FeaturedCarousel({
  cms,
  products: propProducts = [],
  onOpenProductDetail,
  onToggleWishlist,
  onAddToCart,
  wishlist = [],
  isLoading = false
}) {
  const router = useRouter();
  const safeAllProducts = Array.isArray(propProducts) ? propProducts : [];
  const [currentIndex, setCurrentIndex] = useState(0);

  // Helper to determine visible items count strictly by breakpoint
  const getVisibleItemsForWidth = (width) => {
    if (width >= 1280) return 5;
    if (width >= 1024) return 4;
    if (width >= 640) return 3;
    return 2;
  };

  // Initial state derived synchronously from window if available to prevent desktop rendering on mobile/tablet initial frame
  const [visibleItems, setVisibleItems] = useState(4);
  const [containerWidth, setContainerWidth] = useState(0);

  const [isPaused, setIsPaused] = useState(false);

  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const lastWheelTime = useRef(0);

  // Drag vs Click detection refs
  const isDraggingRef = useRef(false);
  const pointerStartPos = useRef({ x: 0, y: 0 });

  const featCms = cms || {};

  // Phase 8: Product Priority System with useMemo
  const finalProducts = useMemo(() => {
    const selectedIds = Array.isArray(featCms.selectedProductIds) ? featCms.selectedProductIds : [];
    const orderIds = Array.isArray(featCms.order) ? featCms.order : [];

    let displayProducts = [];
    if (selectedIds.length > 0) {
      const activeProds = safeAllProducts.filter(p => p && isActiveProduct(p));
      const selectedProds = activeProds.filter(p => selectedIds.includes(p?.id));
      
      if (selectedProds.length > 0) {
        selectedProds.sort((a, b) => {
          const idxA = orderIds.indexOf(a?.id);
          const idxB = orderIds.indexOf(b?.id);
          if (idxA === -1 && idxB === -1) return 0;
          if (idxA === -1) return 1;
          if (idxB === -1) return -1;
          return idxA - idxB;
        });
        displayProducts = selectedProds;
      }
    }

    if (displayProducts.length === 0) {
      displayProducts = safeAllProducts.filter(p => p && (p.isFeatured || p.isBestSeller) && isActiveProduct(p));
      if (displayProducts.length === 0) {
        displayProducts = safeAllProducts.filter(p => p && isActiveProduct(p));
      }
      if (orderIds.length > 0) {
        displayProducts.sort((a, b) => {
          const idxA = orderIds.indexOf(a?.id);
          const idxB = orderIds.indexOf(b?.id);
          if (idxA === -1 && idxB === -1) return 0;
          if (idxA === -1) return 1;
          if (idxB === -1) return -1;
          return idxA - idxB;
        });
      }
    }

    const limitValue = featCms.limit ?? 12;
    return displayProducts.slice(0, limitValue);
  }, [safeAllProducts, featCms.selectedProductIds, featCms.order, featCms.limit]);

  const totalItems = finalProducts.length;

  // Responsive items count and container width observer
  useEffect(() => {
    const handleResize = () => {
      const winWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
      setVisibleItems(getVisibleItemsForWidth(winWidth));

      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    handleResize();

    let observer;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          if (entry.contentRect && entry.contentRect.width > 0) {
            setContainerWidth(entry.contentRect.width);
          }
        }
        const currentWinWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
        setVisibleItems(getVisibleItemsForWidth(currentWinWidth));
      });
      observer.observe(containerRef.current);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (observer) observer.disconnect();
    };
  }, []);

  const maxIndex = Math.max(0, totalItems - visibleItems);

  // Clamp current index if totalItems or visibleItems change
  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  // Handle dynamic auto slide
  const autoplayEnabled = featCms.autoplay ?? true;
  const autoplaySpeed = featCms.autoplaySpeed ?? 6000;

  useEffect(() => {
    if (!autoplayEnabled) return;
    if (totalItems <= visibleItems) return;
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= maxIndex) {
          return 0; // Wrap back to start
        }
        return prev + 1;
      });
    }, autoplaySpeed);

    return () => clearInterval(interval);
  }, [totalItems, visibleItems, isPaused, autoplayEnabled, autoplaySpeed, maxIndex]);

  if (featCms.show === false) return null;

  if (isLoading) {
    return (
      <section id="featured-carousel-section" className="bg-[#FCFCFC] py-12 relative overflow-hidden select-none">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-2">
              <div className="h-3 w-32 bg-gray-200/80 animate-pulse rounded-full" />
              <div className="h-6 w-64 bg-gray-200/80 animate-pulse rounded-lg" />
            </div>
            <div className="h-10 w-24 bg-gray-200/80 animate-pulse rounded-full" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-[#E7E7E7] overflow-hidden animate-pulse flex flex-col">
                <div className="aspect-square bg-gray-200/80 w-full" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200/80 rounded-md" />
                  <div className="h-3 w-1/2 bg-gray-100 rounded-md" />
                  <div className="h-5 w-2/3 bg-gray-200/80 rounded-md pt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (totalItems === 0) {
    return (
      <section id="featured-products-section" className="bg-[#FCFCFC] border-t border-gray-100 py-16 text-center select-none">
        <div className="max-w-md mx-auto px-6 space-y-2">
          <h3 className="text-[18px] sm:text-[20px] font-semibold text-[#174C3C]">Produk belum tersedia</h3>
          <p className="text-[13px] sm:text-[14px] text-[#666666] leading-relaxed">
            Belum ada produk aktif yang ditambahkan melalui Dashboard Admin.
          </p>
        </div>
      </section>
    );
  }

  // Layout calculations
  const gap = 20; // 20px uniform gap
  const computedContainerWidth = containerWidth > 0 ? containerWidth : 1000;
  const cardWidth = Math.max(120, (computedContainerWidth - (visibleItems - 1) * gap) / visibleItems);
  const cardWidthAndGap = cardWidth + gap;
  const maxDrag = Math.max(0, (totalItems * cardWidthAndGap) - computedContainerWidth - gap);

  // Carousel handlers
  const handlePrev = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
  };

  // Mouse Wheel / Trackpad support
  const handleWheel = (e) => {
    const now = Date.now();
    if (now - lastWheelTime.current < 400) return;

    if (Math.abs(e.deltaX) > 15 || Math.abs(e.deltaY) > 25) {
      if (e.deltaX > 15 || e.deltaY > 25) {
        if (currentIndex < maxIndex) {
          setCurrentIndex(prev => prev + 1);
          lastWheelTime.current = now;
        }
      } else if (e.deltaX < -15 || e.deltaY < -25) {
        if (currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
          lastWheelTime.current = now;
        }
      }
    }
  };

  // Pointer position tracker for reliable Drag vs Click detection
  const handlePointerDown = (e) => {
    pointerStartPos.current = {
      x: e.clientX || e.touches?.[0]?.clientX || 0,
      y: e.clientY || e.touches?.[0]?.clientY || 0
    };
    isDraggingRef.current = false;
  };

  const handlePointerMove = (e) => {
    const currentX = e.clientX || e.touches?.[0]?.clientX || 0;
    const currentY = e.clientY || e.touches?.[0]?.clientY || 0;
    const dist = Math.hypot(currentX - pointerStartPos.current.x, currentY - pointerStartPos.current.y);
    if (dist > 6) {
      isDraggingRef.current = true;
    }
  };

  // Framer Motion Drag handlers
  const handleDragStart = () => {
    isDraggingRef.current = true;
  };

  const handleDragEnd = (event, info) => {
    const swipeThreshold = 30;
    const velocityThreshold = 100;

    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset < -swipeThreshold || velocity < -velocityThreshold) {
      if (currentIndex < maxIndex) {
        setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
      }
    } else if (offset > swipeThreshold || velocity > velocityThreshold) {
      if (currentIndex > 0) {
        setCurrentIndex(prev => Math.max(0, prev - 1));
      }
    }

    // Keep isDraggingRef true briefly so trailing click event is blocked
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 80);
  };

  // Click handler for product detail navigation
  const handleCardClick = (e, p) => {
    if (isDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (onOpenProductDetail) {
      onOpenProductDetail(p);
    } else if (p.id || p.slug) {
      router.push(`/produk/${p.slug || p.id}`);
    }
  };

  // Button disabled states
  const isPrevDisabled = currentIndex === 0;
  const isNextDisabled = currentIndex >= maxIndex;

  // CMS bindings
  const sectionTitle = featCms.title || 'Pilihan Hasil Panen Hari Ini';
  const sectionSubtitle = featCms.description || featCms.subtitle || 'Dipanen pagi ini langsung dari petani lokal Bangka.';
  const badgeText = featCms.badge || 'Koleksi Premium';
  const exploreBtnText = featCms.buttonText || 'Eksplorasi Katalog Lengkap';

  const handleExploreClick = () => {
    const buttonLink = featCms.buttonLink ?? '/produk';
    if (buttonLink.startsWith('/') || buttonLink.startsWith('http')) {
      router.push(buttonLink);
    } else if (buttonLink.startsWith('#')) {
      const id = buttonLink.substring(1);
      const el = document.getElementById(id) || document.getElementById('catalog-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.location.hash = '#catalog';
      const catalogEl = document.getElementById('catalog-section');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      } else {
        const event = new CustomEvent('navigate_catalog');
        window.dispatchEvent(event);
      }
    }
  };

  return (
    <section 
      className="bg-[#FCFCFC] border-t border-gray-100 pt-10 pb-10 overflow-hidden relative select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Subtle background light blurs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/3 w-[350px] h-[350px] rounded-full bg-gray-100/40 blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] rounded-full bg-gray-50/50 blur-[80px]" />
      </div>

      {/* Title & Metadata Header */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="max-w-7xl mx-auto px-6 md:px-8 mb-6 text-center space-y-4 sm:space-y-4 lg:space-y-5"
      >
        <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.24em] font-semibold text-[#4D8B55] inline-block">
          {badgeText}
        </p>
        
        <h2 className="text-[22px] sm:text-[30px] lg:text-[38px] font-semibold tracking-tight leading-[1.08] text-[#174C3C]">
          {sectionTitle}
        </h2>

        <p className="text-[12px] sm:text-[14px] lg:text-[15px] font-normal text-[#666666] max-w-2xl mx-auto leading-relaxed">
          {sectionSubtitle}
        </p>
      </motion.div>

      {/* Main Carousel Viewport */}
      <div className="relative max-w-7xl mx-auto px-6 md:px-8" onWheel={handleWheel}>
        
        {/* Navigation Arrows */}
        {(featCms.showArrows ?? true) && totalItems > visibleItems && (
          <div className="absolute top-[-70px] right-8 z-20 hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrev}
              disabled={isPrevDisabled}
              className={`w-11 h-11 rounded-full border border-[#ECECE6] bg-white text-[#173F35] flex items-center justify-center transition-colors duration-200 ${
                isPrevDisabled 
                  ? 'opacity-30 cursor-not-allowed' 
                  : 'hover:bg-[#174C3C] hover:text-white hover:border-[#174C3C] shadow-sm cursor-pointer'
              }`}
              aria-label="Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2]" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={isNextDisabled}
              className={`w-11 h-11 rounded-full border border-[#ECECE6] bg-white text-[#173F35] flex items-center justify-center transition-colors duration-200 ${
                isNextDisabled 
                  ? 'opacity-30 cursor-not-allowed' 
                  : 'hover:bg-[#174C3C] hover:text-white hover:border-[#174C3C] shadow-sm cursor-pointer'
              }`}
              aria-label="Berikutnya"
            >
              <ChevronRight className="w-4 h-4 stroke-[2]" />
            </button>
          </div>
        )}

        {/* Outer Clip Box */}
        <div ref={containerRef} className="overflow-hidden py-4 relative">
          
          {totalItems === 0 ? (
            <div className="text-center py-12 bg-white/60 rounded-2xl border border-[#ECECE6] p-6 space-y-2 max-w-md mx-auto">
              <p className="text-sm font-medium text-gray-500">Belum ada produk unggulan yang tersedia.</p>
            </div>
          ) : (
            /* Framer Motion Track */
            <motion.div
              ref={trackRef}
              drag="x"
              dragConstraints={{ left: -maxDrag, right: 0 }}
              dragElastic={0.08}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              className="flex cursor-grab active:cursor-grabbing"
              style={{ gap: `${gap}px` }}
              animate={{ x: -currentIndex * cardWidthAndGap }}
              transition={{ type: "spring", stiffness: 220, damping: 28 }}
            >
              {finalProducts.map((p, index) => {
                const priceFormatted = formatRupiah(p.price);
                const showDiscount = featCms.showDiscountPrice ?? true;
                const discPriceFormatted = (p.discountPrice && showDiscount) 
                  ? formatRupiah(p.discountPrice) 
                  : null;
                
                const isWish = wishlist.some(item => item.id === p.id);

                return (
                  <div
                    key={p.id || index}
                    className="flex-shrink-0 flex flex-col justify-between bg-transparent text-left relative overflow-hidden"
                    style={{ width: `${cardWidth}px` }}
                  >
                    {/* Product Image Container */}
                    <div 
                      className="group relative aspect-square w-full overflow-hidden rounded-2xl mb-3.5 bg-gray-50 cursor-pointer select-none"
                      onClick={(e) => handleCardClick(e, p)}
                    >
                      <ProductCardImage product={p} />

                      {/* Action buttons (Wishlist & Cart) - Desktop Hover */}
                      <div className="hidden md:flex absolute top-3 right-3 z-20 flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
                        {(onToggleWishlist && (featCms.showWishlistButton ?? true)) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isDraggingRef.current) return;
                              onToggleWishlist(p);
                            }}
                            className="w-9 h-9 rounded-full bg-white/90 border border-white/60 flex items-center justify-center text-[#173F35] hover:text-red-500 hover:bg-white shadow-xs transition-colors duration-200 cursor-pointer"
                            title="Simpan ke Favorit"
                          >
                            <Heart className={`w-4 h-4 ${isWish ? 'text-red-500 fill-red-500' : ''}`} strokeWidth={1.5} />
                          </button>
                        )}
                        
                        {(onAddToCart && (featCms.showCartButton ?? true)) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isDraggingRef.current) return;
                              onAddToCart(p);
                            }}
                            className="w-9 h-9 rounded-full bg-white/90 border border-white/60 flex items-center justify-center text-[#173F35] hover:text-[#174C3C] hover:bg-white shadow-xs transition-colors duration-200 cursor-pointer"
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

                        {/* Product name + Mobile Actions */}
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            onClick={(e) => handleCardClick(e, p)}
                            className="text-[13.5px] md:text-[14.5px] font-semibold text-[#174C3C] tracking-tight leading-tight line-clamp-1 cursor-pointer flex-1 hover:text-[#205E49] transition-colors"
                          >
                            {p.name}
                          </h3>

                          {/* MOBILE: Wishlist + Cart */}
                          <div className="flex md:hidden items-center gap-1.5 shrink-0">

                            {/* Wishlist */}
                            {(onToggleWishlist && (featCms.showWishlistButton ?? true)) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isDraggingRef.current) return;
                                  onToggleWishlist(p);
                                }}
                                className="p-1 text-[#173F35] hover:text-red-500 transition-colors duration-200 cursor-pointer"
                                title="Simpan ke Favorit"
                              >
                                <Heart
                                  className={`w-[16px] h-[16px] ${
                                    isWish ? 'text-red-500 fill-red-500' : ''
                                  }`}
                                  strokeWidth={1.5}
                                />
                              </button>
                            )}

                            {/* Cart */}
                            {(onAddToCart && (featCms.showCartButton ?? true)) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isDraggingRef.current) return;
                                  onAddToCart(p);
                                }}
                                className="p-1 text-[#173F35] hover:text-[#174C3C] transition-colors duration-200 cursor-pointer"
                                title="Tambah ke Keranjang"
                              >
                                <ShoppingBag
                                  className="w-[16px] h-[16px]"
                                  strokeWidth={1.5}
                                />
                              </button>
                            )}

                          </div>
                        </div>

                        {/* Category */}
                        {(featCms.showCategory ?? true) && (
                          <span className="text-[11.5px] md:text-[12.5px] font-normal text-[#666666] mt-1 block leading-tight">
                            {p.categoryName ||
                              (typeof p.category === 'object'
                                ? p.category?.name
                                : p.category) ||
                              ''}
                          </span>
                        )}

                        {/* Price */}
                        <div className="mt-1.5">
                          {discPriceFormatted ? (
                            <div className="flex items-baseline gap-1.5 leading-none">
                              <span className="text-[#174C3C] font-semibold text-[13px] md:text-[14px]">
                                {discPriceFormatted}
                              </span>

                              <span className="text-gray-400 line-through text-[11px]">
                                {priceFormatted}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[#174C3C] font-semibold text-[13px] md:text-[14px] leading-none">
                              {priceFormatted}
                            </span>
                          )}
                        </div>

                        {/* Unit */}
                        {(featCms.showUnit ?? true) && (
                          <span className="text-gray-400 text-[11px] font-normal mt-1 block leading-none">
                            (ex. PPN/{p.unit || 'kg'})
                          </span>
                        )}

                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </div>

      </div>

      {/* Bottom Navigation button */}
      {(featCms.showViewAllButton ?? true) && (
        <div className="max-w-7xl mx-auto px-6 md:px-8 mt-8 flex flex-col items-center justify-center gap-4">
          <div className="text-center mt-1">
            <button
              type="button"
              onClick={handleExploreClick}
              className="group inline-flex items-center justify-center px-4 py-2 text-[12px] md:text-[14px] font-medium bg-[#174C3C] hover:bg-[#205E49] active:bg-[#123A2E] text-white rounded-full transition-colors duration-200 shadow-sm cursor-pointer"
            >
              <span>{exploreBtnText}</span>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
            </button>
          </div>
        </div>
      )}

    </section>
  );
}

export default React.memo(FeaturedCarousel);