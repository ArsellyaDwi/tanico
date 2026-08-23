"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';

const jost = { className: 'font-jost' };

function Hero({ cms, heroBenefits: initialHeroBenefits = [], onExploreClick, isLoading = false }) {
  const router = useRouter();
  const heroCms = cms || {};
  const rawSlides = Array.isArray(heroCms.slides) ? heroCms.slides : [];
  const slides = rawSlides.filter(slide => slide && (heroCms.allowInactive ? true : slide.active !== false));

  const heroBenefits = Array.isArray(initialHeroBenefits) && initialHeroBenefits.length > 0
    ? initialHeroBenefits
    : (Array.isArray(heroCms.benefits) ? heroCms.benefits : []);

  const defaultIdx = typeof heroCms.defaultFirstSlideIdx === 'number' && heroCms.defaultFirstSlideIdx < slides.length
    ? heroCms.defaultFirstSlideIdx 
    : 0;

  const [activeIndex, setActiveIndex] = useState(defaultIdx);
  const [isPaused, setIsPaused] = useState(false);
  const [imageError, setImageError] = useState(false);
  const intervalRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    setImageError(false);
  }, [activeIndex]);

  const totalSlides = slides.length;
  const autoplayEnabled = heroCms.autoplay ?? true;
  const autoplaySpeed = parseInt(heroCms.autoplaySpeed || '5000', 10);

  useEffect(() => {
    if (typeof heroCms.defaultFirstSlideIdx === 'number') {
      const idx = heroCms.defaultFirstSlideIdx;
      if (idx >= 0 && idx < slides.length) {
        setActiveIndex(idx);
      }
    }
  }, [heroCms.defaultFirstSlideIdx, slides.length]);

  const startAutoplay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!autoplayEnabled || totalSlides <= 1 || isPaused || isLoading || heroCms.show === false) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalSlides);
    }, autoplaySpeed);
  }, [totalSlides, isPaused, autoplayEnabled, autoplaySpeed, isLoading, heroCms.show]);

  useEffect(() => {
    startAutoplay();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startAutoplay]);

  const handleTouchStart = (e) => {
    if (!(heroCms.swipeEnabled ?? true)) return;
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!(heroCms.swipeEnabled ?? true)) return;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!(heroCms.swipeEnabled ?? true)) return;
    const swipeSensitivity = parseInt(heroCms.swipeSensitivity ?? '50', 10);
    const distance = touchStartX.current - touchEndX.current;
    
    if (distance > swipeSensitivity) {
      setActiveIndex((prev) => (prev + 1) % totalSlides);
      if (intervalRef.current) clearInterval(intervalRef.current);
      startAutoplay();
    } else if (distance < -swipeSensitivity) {
      setActiveIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
      if (intervalRef.current) clearInterval(intervalRef.current);
      startAutoplay();
    }
  };

  if (heroCms.show === false) return null;

  if (isLoading) {
    return (
      <section id="hero-section" className={`${jost.className} bg-[#FCFCFC] relative overflow-hidden pt-10 pb-14`}>
        <div className="w-full max-w-7xl mx-auto px-6 md:px-8">
          <div className="w-full h-[380px] md:h-[420px] rounded-2xl bg-gray-100 animate-pulse border border-gray-200/60 flex flex-col justify-between p-8 md:p-12">
            <div className="space-y-4 max-w-xl">
              <div className="h-4 w-28 bg-gray-200/80 rounded-full animate-pulse" />
              <div className="h-8 w-3/4 bg-gray-200/80 rounded-lg animate-pulse" />
              <div className="h-4 w-full bg-gray-200/80 rounded animate-pulse" />
              <div className="h-10 w-36 bg-gray-200/80 rounded-full animate-pulse mt-4" />
            </div>
            <div className="flex gap-2">
              <div className="h-2 w-8 bg-gray-300 rounded-full animate-pulse" />
              <div className="h-2 w-2 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-2 w-2 bg-gray-200 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-6 mt-8 md:mt-10 w-full animate-pulse">
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="flex flex-col items-center text-center sm:items-start sm:text-left space-y-2">
                <div className="w-[60px] h-[60px] bg-gray-200 rounded-lg" />
                <div className="h-4 w-28 bg-gray-200 rounded" />
                <div className="h-3 w-40 bg-gray-100 rounded hidden sm:block" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (slides.length === 0) return null;

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  const goToSlide = (index) => {
    setActiveIndex(index);
    if (intervalRef.current) clearInterval(intervalRef.current);
    startAutoplay();
  };

  const activeSlide = slides[activeIndex] || slides[0] || {};
  const rawDesk = activeSlide.desktopImage || activeSlide.image || '';
  const rawMob = activeSlide.mobileImage || '';
  const slideImg = rawDesk ? (rawDesk.startsWith('http') || rawDesk.startsWith('/') ? rawDesk : `/${rawDesk}`) : '';
  const slideMobileImg = rawMob ? (rawMob.startsWith('http') || rawMob.startsWith('/') ? rawMob : `/${rawMob}`) : '';

  const desktopHeightVal = typeof heroCms.desktopHeight === 'number' ? `${heroCms.desktopHeight}px` : (heroCms.desktopHeight || '420px');
  const mobileHeightVal = typeof heroCms.mobileHeight === 'number' ? `${heroCms.mobileHeight}px` : (heroCms.mobileHeight || '380px');
  const overlayOpacityVal = typeof activeSlide.overlay === 'number' ? activeSlide.overlay / 100 : (typeof heroCms.overlayOpacity === 'number' ? heroCms.overlayOpacity / 100 : 0);
  const blurFilterVal = (heroCms.blurStrength && parseInt(heroCms.blurStrength, 10) > 0) ? `blur(${parseInt(heroCms.blurStrength, 10)}px)` : '';

  const activeBenefits = (Array.isArray(heroBenefits) ? heroBenefits : [])
    .filter(b => b && (b.active !== false))
    .slice(0, 4);

  return (
    <section
      id="hero-section"
      suppressHydrationWarning
      className={`${jost.className} bg-[#FCFCFC] relative overflow-hidden pt-10 pb-14`}
    >
      <style suppressHydrationWarning>{`
        @media (min-width: 768px) {
          .dynamic-hero-height {
            height: ${desktopHeightVal} !important;
            min-height: ${desktopHeightVal} !important;
          }
        }
        @media (max-width: 767px) {
          .dynamic-hero-height {
            height: ${mobileHeightVal} !important;
            min-height: ${mobileHeightVal} !important;
          }
          .hero-slide-img {
            object-position: ${activeSlide.mobileCrop || 'center center'} !important;
          }
        }
      `}</style>

      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div 
          className="absolute inset-0 pointer-events-none z-0 opacity-[0.01]" 
          style={{
            backgroundImage: 'radial-gradient(rgba(0, 0, 0, 0.08) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} 
        />
        <div 
          className="absolute -top-20 -left-20 w-[450px] h-[450px] rounded-full blur-[130px]" 
          style={{ backgroundColor: '#f3f4f6', opacity: 0.25 }}
        />
        <div 
          className="absolute -bottom-20 -right-20 w-[500px] h-[500px] rounded-full blur-[140px]" 
          style={{ backgroundColor: '#e5e7eb', opacity: 0.2 }}
        />
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 md:px-8 relative z-10">
        <div
          className="relative w-full dynamic-hero-height rounded-2xl overflow-hidden border border-[#E7E7E7] shadow-[0_4px_30px_rgba(0,0,0,0.02)] transition-colors duration-500 group/hero-container"
          style={{ backgroundColor: '#ffffff' }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="absolute inset-0 w-full h-full">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 w-full h-full overflow-hidden"
              >
                {(slideImg || slideMobileImg) && !imageError ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={slideImg || slideMobileImg}
                      alt={activeSlide.altText || activeSlide.badge || activeSlide.title || ''}
                      fill
                      priority={activeIndex === 0}
                      quality={80}
                      sizes="100vw"
                      onError={() => setImageError(true)}
                      className="object-cover hero-slide-img select-none pointer-events-none transition-all duration-700 ease-out"
                      style={{ 
                        objectPosition: activeSlide.desktopCrop || activeSlide.cropPosition || 'center center',
                        transform: `scale(${parseFloat(activeSlide.desktopZoom || activeSlide.cropZoom || '100') / 100})`,
                        transformOrigin: activeSlide.desktopCrop || activeSlide.cropPosition || 'center center',
                        filter: blurFilterVal
                      }}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full bg-neutral-100 flex items-center justify-center" />
                )}
                <div 
                  className="absolute inset-0 bg-black pointer-events-none transition-all duration-300"
                  style={{ opacity: overlayOpacityVal }}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="absolute inset-0 z-10 flex flex-col justify-start md:justify-end p-6 sm:p-8 md:p-10 lg:p-12">
            <div className="mb-2 md:mb-3 pt-4 md:pt-0 max-w-[560px] md:max-w-[55%]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="space-y-1.5 md:space-y-2"
                >
                  {activeSlide.title && (
                    <h1 className="text-[22px] sm:text-[30px] lg:text-[38px] font-semibold leading-[1.08] tracking-tight text-black whitespace-pre-line">
                      {activeSlide.title}
                      {activeSlide.subtitle && (
                        <span className="block font-semibold text-black/80 mt-0.5 md:mt-1">
                          {activeSlide.subtitle}
                        </span>
                      )}
                    </h1>
                  )}
                  {activeSlide.description && (
                    <p className="text-[12px] sm:text-[14px] lg:text-[15px] text-black/70 leading-relaxed max-w-[560px] font-normal">
                      {activeSlide.description}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex flex-col gap-3 md:gap-4 w-full items-start max-w-[560px] md:max-w-[55%]">
              {slides.length > 1 && (
                <div className="w-full">
                  <div className="flex flex-wrap items-center gap-x-6 md:gap-x-8 lg:gap-x-10 gap-y-2 text-[12px] sm:text-[13px] md:text-[14px] font-medium select-none">
                    {slides.map((slide, idx) => {
                      const isActive = activeIndex === idx;
                      return (
                        <button
                          key={slide.id || idx}
                          onClick={() => goToSlide(idx)}
                          className={`group flex flex-col items-start gap-1 transition-all duration-300 cursor-pointer ${
                            isActive ? 'opacity-100' : 'opacity-40 hover:opacity-75'
                          }`}
                        >
                          <span className="text-black tracking-wide">{slide.badge || `Slide ${idx + 1}`}</span>
                          <div className="w-full min-w-[40px] h-[2px] bg-black/30 rounded-full overflow-hidden relative">
                            {isActive && autoplayEnabled ? (
                              <motion.div
                                key={activeIndex}
                                initial={{ width: '0%' }}
                                animate={{ width: '100%' }}
                                transition={{ duration: autoplaySpeed / 1000, ease: 'linear' }}
                                className="absolute left-0 top-0 h-full bg-black rounded-full"
                              />
                            ) : isActive ? (
                              <div className="absolute left-0 top-0 h-full w-full bg-black rounded-full" />
                            ) : (
                              <div className="absolute left-0 top-0 h-full w-full bg-transparent rounded-full" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeSlide.buttonText && (
                <button
                  onClick={() => {
                    if (onExploreClick) {
                      onExploreClick(activeSlide.buttonLink || '/produk');
                    } else {
                      router.push(activeSlide.buttonLink || '/produk');
                    }
                  }}
                  className="group inline-flex items-center justify-center bg-[#174C3C] hover:bg-[#1F5C49] text-white px-4 py-2 sm:px-5 sm:py-2.5 text-[12px] sm:text-[13px] md:text-[14px] font-semibold rounded-full transition-colors duration-200 shadow-sm hover:shadow-md cursor-pointer"
                >
                  <span>{activeSlide.buttonText}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {activeBenefits.length > 0 && (
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-40px' }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.05,
                },
              },
            }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-6 mt-8 md:mt-10 w-full"
          >
            {activeBenefits.map((card, idx) => {
              const cardTitle = card.title || card.value || '';
              const cardDesc = card.description || card.label || '';
              const imageSrc = card.image ? (card.image.startsWith('http') || card.image.startsWith('/') ? card.image : `/${card.image}`) : null;

              return (
                <motion.div
                  key={card.id || idx}
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: { duration: 0.3, ease: 'easeOut' },
                    },
                  }}
                  className="flex flex-col items-center text-center sm:items-start sm:text-left"
                >
                  {imageSrc && (
                    <img
                      src={imageSrc}
                      alt={cardTitle}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full max-w-[80px] h-[70px] sm:w-[88px] sm:h-[88px] object-contain select-none pointer-events-none mb-2 sm:mb-3"
                    />
                  )}
                  {cardTitle && (
                    <h3 className="text-[13px] sm:text-[14px] md:text-[16px] font-semibold text-black">
                      {cardTitle}
                    </h3>
                  )}
                  {cardDesc && (
                    <p className="hidden sm:block text-[12px] md:text-[14px] font-normal text-black/60 mt-1 leading-relaxed">
                      {cardDesc}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default React.memo(Hero);