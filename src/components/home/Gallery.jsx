'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';

function GalleryMediaImage({ mediaSrc, alt, className }) {
  const [error, setError] = useState(false);
  const srcUrl = mediaSrc ? (mediaSrc.startsWith('http') || mediaSrc.startsWith('/') ? mediaSrc : `/${mediaSrc}`) : null;

  if (!srcUrl || error) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center select-none">
        <span className="text-[10px] font-medium text-gray-400 text-center">Gambar belum tersedia</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Image
        src={srcUrl}
        alt={alt || ''}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
        quality={75}
        referrerPolicy="no-referrer"
        className={className}
        onError={() => setError(true)}
      />
    </div>
  );
}

function Gallery({ cms: passedCms, gallery: propGallery = [] }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const galleryItems = Array.isArray(propGallery) ? propGallery : [];
  const data = passedCms?.gallery || passedCms || {};

  const show = data?.show ?? true;
  const badgeText = data?.badge ?? "GALERI TANI";
  const sectionTitle = data?.title ?? "Kehidupan di Balik Hasil Panen";
  const sectionSubtitle = data?.description ?? "Lihat lebih dekat aktivitas para petani lokal Bangka, proses panen, serta perjalanan hasil bumi terbaik hingga sampai ke rumah Anda.";
  const background = "#FCFCFC";
  const backgroundImage = data?.backgroundImage ?? "";
  const limit = data?.limit ?? 6;
  const cardBackground = data?.cardBackground ?? "#FFFFFF";
  const cardBorder = data?.cardBorder ?? "#FFFFFF";
  const showLightbox = data?.showLightbox ?? true;

  // Single Source of Truth from DB
  const activeItems = useMemo(() => {
    const dbGallery = galleryItems && Array.isArray(galleryItems) ? galleryItems : [];
    return dbGallery
      .filter((item) => {
        if (!item) return false;
        const imgSrc = item.image || item.url || item.src || item.mediaSrc;
        if (!imgSrc) return false;

        const st = String(item.status || '').toLowerCase();
        if (st === 'nonaktif' || st === 'draft' || st === 'inactive' || st === 'hidden') {
          return false;
        }

        if (item.active === false || item.active === 'false') return false;
        if (item.published === false || item.published === 'false') return false;
        if (item.show === false || item.show === 'false') return false;

        return true;
      })
      .slice(0, limit);
  }, [galleryItems, limit]);

  const totalItems = activeItems.length;

  // Lock scroll & handle Escape key when lightbox is open
  useEffect(() => {
    if (lightboxIndex === null) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev !== null ? (prev === 0 ? totalItems - 1 : prev - 1) : null));
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev !== null ? (prev === totalItems - 1 ? 0 : prev + 1) : null));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow || '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxIndex, totalItems]);

  const handleCloseLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const handlePrevImage = useCallback((e) => {
    e.stopPropagation();
    if (totalItems <= 1) return;
    setLightboxIndex((prev) => (prev !== null ? (prev === 0 ? totalItems - 1 : prev - 1) : null));
  }, [totalItems]);

  const handleNextImage = useCallback((e) => {
    e.stopPropagation();
    if (totalItems <= 1) return;
    setLightboxIndex((prev) => (prev !== null ? (prev === totalItems - 1 ? 0 : prev + 1) : null));
  }, [totalItems]);

  const currentLightboxItem = lightboxIndex !== null && activeItems[lightboxIndex] ? activeItems[lightboxIndex] : null;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        duration: 0.25,
        ease: "easeOut",
      },
    },
  };

  // 6 GRID – 6 Columns, 2 Rows (Editorial Mosaic Structure)
  const gridConfigs = [
    { col: "col-span-1 lg:col-span-1", row: "row-span-1 lg:row-span-1", rounded: "rounded-2xl" }, // Card 1
    { col: "col-span-1 lg:col-span-2", row: "row-span-2 lg:row-span-2", rounded: "rounded-2xl" }, // Card 2
    { col: "col-span-1 lg:col-span-1", row: "row-span-1 lg:row-span-1", rounded: "rounded-2xl" }, // Card 3
    { col: "col-span-1 lg:col-span-2", row: "row-span-1 lg:row-span-1", rounded: "rounded-2xl" }, // Card 4
    { col: "col-span-1 lg:col-span-1", row: "row-span-1 lg:row-span-1", rounded: "rounded-2xl" }, // Card 5
    { col: "col-span-3 lg:col-span-3", row: "row-span-1 lg:row-span-1", rounded: "rounded-2xl" }, // Card 6
  ];

  if (!show) return null;

  return (
    <section 
      id="gallery-section" 
      className="bg-[#FCFCFC] border-t border-gray-100 pt-10 pb-10 overflow-hidden relative select-none text-left"
    >
      {/* Subtle gray glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/2 -left-32 -translate-y-1/2 w-96 h-96 rounded-full bg-gray-100/40 blur-[130px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10">
        
        {/* HEADER SECTION */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="text-center mb-6 space-y-3 max-w-3xl mx-auto"
        >
          <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.24em] font-semibold text-[#4D8B55] inline-block">
            {badgeText}
          </span>
          
          <h2 className="text-[22px] sm:text-[30px] lg:text-[38px] font-semibold text-[#174C3C] tracking-tight leading-[1.08]">
            {sectionTitle}
          </h2>

          <p className="text-[12px] sm:text-[14px] lg:text-[15px] font-normal leading-relaxed text-[#666666] max-w-[680px] mx-auto">
            {sectionSubtitle}
          </p>
        </motion.div>

        {/* GALLERY GRID - 4 columns, 2 rows (6 items) */}
        {totalItems === 0 ? (
          <section id="gallery-section-empty" className="bg-[#FCFCFC] border-t border-gray-100 py-16 text-center select-none">
            <div className="max-w-md mx-auto px-6 space-y-2">
              <h3 className="text-[18px] sm:text-[20px] font-semibold text-[#174C3C]">Galeri belum tersedia</h3>
              <p className="text-[13px] sm:text-[14px] text-[#666666] leading-relaxed">
                Belum ada foto yang dipublikasikan melalui Dashboard Admin.
              </p>
            </div>
          </section>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-3 lg:grid-cols-6 grid-rows-3 lg:grid-rows-2 gap-2 sm:gap-3 md:gap-4 lg:gap-6 h-[360px] sm:h-[440px] md:h-[480px] lg:h-[520px]"
          >
            {activeItems.map((item, index) => {
              const isVideo = item.isVideo || item.type === 'video';
              const mediaSrc = item.image || item.url || item.src || null;
              const posterSrc = item.poster || null;
              const hasMetadata = item.title || item.description;
              const config = gridConfigs[index] || gridConfigs[0];

              const containerClasses = `
                group relative overflow-hidden ${config.rounded} 
                bg-[#FCFCFC] border border-[#DDE9DF]/40 
                shadow-xs
                transition-colors duration-300 cursor-pointer 
                ${config.col} ${config.row}
                h-full
              `;

              const mediaClasses = `
                relative z-0 w-full h-full object-cover 
                filter grayscale-[20%] 
                transition-all duration-500 ease-out 
                group-hover:grayscale-0 group-hover:scale-[1.03]
              `;

              return (
                <motion.div
                  key={item.id || `gallery-item-${index}`}
                  variants={itemVariants}
                  className={containerClasses}
                  onClick={() => setLightboxIndex(index)}
                  style={{
                    backgroundColor: cardBackground,
                    borderColor: cardBorder
                  }}
                >
                  <div className="absolute inset-0 w-full h-full select-none overflow-hidden">
                    <div className="absolute inset-0 bg-[#174C3C]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

                    {isVideo ? (
                      <video
                        src={mediaSrc}
                        poster={posterSrc}
                        muted
                        playsInline
                        className={mediaClasses}
                      />
                    ) : (
                      <GalleryMediaImage
                        mediaSrc={mediaSrc}
                        alt={item.title || "Galeri"}
                        className={mediaClasses}
                      />
                    )}
                  </div>

                  {/* Video Badge */}
                  {isVideo && (
                    <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-20 text-[8px] sm:text-[10px] uppercase tracking-[0.15em] text-[#E7F3EC] font-bold flex items-center gap-1 sm:gap-1.5">
                      <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span>Video</span>
                    </div>
                  )}

                  {/* Play button overlay for video */}
                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                      <div className="w-8 h-8 sm:w-14 sm:h-14 rounded-full bg-white/25 backdrop-blur-xs border border-white/30 flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.15)] transition-colors duration-300 group-hover:bg-[#174C3C]/40 group-hover:border-[#6E9C7C]/50">
                        <Play className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white ml-0.5 fill-current" />
                      </div>
                    </div>
                  )}

                  {/* Caption text placed directly at the bottom-left corner */}
                  {hasMetadata && (
                    <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 z-20 text-left pointer-events-none">
                      <h3 className="text-white font-medium text-xs sm:text-base md:text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-white/90 text-[10px] sm:text-xs font-normal drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] mt-0.5 max-w-[90%] line-clamp-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}

      </div>

      {/* LIGHTBOX MODAL PORTAL */}
      {mounted && typeof document !== 'undefined' && document.body && createPortal(
        <AnimatePresence>
          {showLightbox && currentLightboxItem && (
            <motion.div 
              key="gallery-lightbox-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 md:p-8 backdrop-blur-md bg-black/25 select-none"
              onClick={handleCloseLightbox}
            >
              {/* Minimalist Image Viewer Wrapper */}
              <div 
                className="relative flex items-center justify-center w-[min(84vw,78vh,560px)]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Main 1:1 Square Image Container with Side Navigation */}
                <div className="relative w-full aspect-square flex items-center justify-center">
                  <button 
                    onClick={handleCloseLightbox}
                    className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 md:top-2.5 md:right-2.5 z-40 p-1 text-[#174C3C] hover:text-[#0f3328] hover:scale-110 active:scale-95 transition-all duration-150 cursor-pointer flex items-center justify-center drop-shadow-sm"
                    title="Tutup"
                    aria-label="Tutup"
                  >
                    <X className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
                  </button>

                  {totalItems > 1 && (
                    <button
                      onClick={handlePrevImage}
                      className="absolute -left-7 sm:-left-11 md:-left-12 top-1/2 -translate-y-1/2 z-30 p-1.5 text-[#174C3C] hover:text-[#0f3328] hover:scale-110 active:scale-95 transition-all duration-150 cursor-pointer flex items-center justify-center"
                      title="Sebelumnya"
                      aria-label="Sebelumnya"
                    >
                      <ChevronLeft className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 stroke-[2.5]" />
                    </button>
                  )}

                  {/* Pure 1:1 Image Display */}
                  <motion.div 
                    key={`gallery-lightbox-media-${lightboxIndex}`}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="w-full h-full flex items-center justify-center overflow-hidden"
                  >
                    {currentLightboxItem.isVideo || currentLightboxItem.type === 'video' ? (
                      <video 
                        src={currentLightboxItem.image || currentLightboxItem.url || currentLightboxItem.src} 
                        poster={currentLightboxItem.poster}
                        controls
                        autoPlay
                        className="w-full h-full object-contain select-none"
                      />
                    ) : (
                      <img 
                        src={currentLightboxItem.image || currentLightboxItem.url || currentLightboxItem.src} 
                        alt={currentLightboxItem.title || 'Preview Galeri'} 
                        className="w-full h-full object-contain select-none drop-shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </motion.div>

                  {totalItems > 1 && (
                    <button
                      onClick={handleNextImage}
                      className="absolute -right-7 sm:-right-11 md:-right-12 top-1/2 -translate-y-1/2 z-30 p-1.5 text-[#174C3C] hover:text-[#0f3328] hover:scale-110 active:scale-95 transition-all duration-150 cursor-pointer flex items-center justify-center"
                      title="Berikutnya"
                      aria-label="Berikutnya"
                    >
                      <ChevronRight className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 stroke-[2.5]" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </section>
  );
}

export default React.memo(Gallery);