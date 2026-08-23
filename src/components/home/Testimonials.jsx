'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';

function TestimonialAvatar({ avatar, name }) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [avatar]);

  const cleanAvatar = typeof avatar === 'string' ? avatar.trim() : (avatar?.url || avatar?.src || '');
  const avatarUrl = cleanAvatar ? (cleanAvatar.startsWith('http') || cleanAvatar.startsWith('/') ? cleanAvatar : `/${cleanAvatar}`) : null;

  if (!avatarUrl || error) {
    const initials = name ? name.substring(0, 2).toUpperCase() : 'U';
    return (
      <div className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-[12px] sm:text-[14px] select-none">
        {initials}
      </div>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={name || ''}
      onError={() => {
        setError(true);
      }}
      className="w-full h-full object-cover"
      referrerPolicy="no-referrer"
      loading="lazy"
      decoding="async"
    />
  );
}

function Testimonials({ cms, testimonials: propTestimonials = [] }) {
  const testimonials = Array.isArray(propTestimonials) ? propTestimonials : [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [mounted, setMounted] = useState(false);

  const lockGestureRef = useRef(false);
  const pointerStartXRef = useRef(0);
  const pointerStartYRef = useRef(0);
  const isPointerDownRef = useRef(false);
  const lockTimeoutRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
    };
  }, []);

  // Sync visible count with screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setVisibleCount(1);
      } else if (window.innerWidth < 1024) {
        setVisibleCount(2);
      } else {
        setVisibleCount(3);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sectionCms = cms?.testimonials || cms || {};
  const showSection = sectionCms?.show ?? true;

  const sectionTitle = sectionCms?.title || 'Apa Kata Pelanggan Kami';
  const sectionSubtitle = sectionCms?.description || 'Cerita dan pengalaman pelanggan setia TaniCo.';
  const badgeText = sectionCms?.badge || 'TESTIMONI PELANGGAN';
  const sectionNum = sectionCms?.sectionNum ?? '09';
  const background = '#FCFCFC';
  const backgroundImage = sectionCms?.backgroundImage || '';
  const layout = sectionCms?.layout || 'carousel';
  const autoplay = sectionCms?.autoplay ?? true;
  const autoplaySpeed = sectionCms?.autoplaySpeed ?? 5000;
  const showRating = sectionCms?.showRating ?? true;
  const showAvatar = sectionCms?.showAvatar ?? true;
  const maxItems = sectionCms?.limit ?? 8;

  // Card customization
  const cardStyle = 'modern';
  const cardBackground = '#FFFFFF';

  // DB Fallback map
  const safeTestimonials = Array.isArray(testimonials) ? testimonials : [];
  const dbList = safeTestimonials.map((item, idx) => ({
    id: item?.id || `db_testi_${idx}`,
    name: item?.name || '',
    role: item?.role || 'Pelanggan',
    location: item?.location || item?.city || '',
    avatar: item?.avatar || item?.image || item?.photo || '',
    rating: Number(item?.rating) || 5,
    comment: item?.comment || item?.review || '',
    review: item?.comment || item?.review || '',
    active: item?.active !== false,
  }));

  const activeList = dbList.filter((item) => item && item.active !== false).slice(0, maxItems);
  const lockDuration = 650;
  const SWIPE_THRESHOLD = 80;

  // Reset index if visibleCount or activeList changes
  useEffect(() => {
    setCurrentIndex(0);
    lockGestureRef.current = false;
    isPointerDownRef.current = false;
  }, [visibleCount, activeList.length]);

  // Autoplay
  useEffect(() => {
    if (layout !== 'carousel' || !autoplay || isPaused || activeList.length <= visibleCount) return;
    const interval = setInterval(() => {
      if (lockGestureRef.current || isPointerDownRef.current) return;
      const maxIndex = activeList.length - visibleCount;
      if (maxIndex <= 0) return;

      lockGestureRef.current = true;
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));

      if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
      lockTimeoutRef.current = setTimeout(() => {
        lockGestureRef.current = false;
      }, lockDuration);
    }, autoplaySpeed);
    return () => clearInterval(interval);
  }, [layout, autoplay, autoplaySpeed, isPaused, activeList.length, visibleCount, lockDuration]);

  const handlePointerDown = (e) => {
    if (lockGestureRef.current || activeList.length <= visibleCount) return;
    isPointerDownRef.current = true;
    pointerStartXRef.current = e.clientX;
    pointerStartYRef.current = e.clientY;
    setIsPaused(true);
  };

  const handlePointerUp = (e) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    setIsPaused(false);

    if (lockGestureRef.current || activeList.length <= visibleCount) return;

    const deltaX = e.clientX - pointerStartXRef.current;
    const deltaY = e.clientY - pointerStartYRef.current;

    // Ignore if vertical scrolling is dominant
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return;
    }

    const maxIndex = Math.max(0, activeList.length - visibleCount);

    if (deltaX <= -SWIPE_THRESHOLD) {
      // Swipe left -> advance exactly 1 card
      if (currentIndex < maxIndex) {
        lockGestureRef.current = true;
        setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
        if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
        lockTimeoutRef.current = setTimeout(() => {
          lockGestureRef.current = false;
        }, lockDuration);
      }
    } else if (deltaX >= SWIPE_THRESHOLD) {
      // Swipe right -> retreat exactly 1 card
      if (currentIndex > 0) {
        lockGestureRef.current = true;
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
        if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
        lockTimeoutRef.current = setTimeout(() => {
          lockGestureRef.current = false;
        }, lockDuration);
      }
    }
  };

  const handlePointerCancel = () => {
    isPointerDownRef.current = false;
    setIsPaused(false);
  };

  if (!showSection) return null;

  const styleMap = {
    modern: 'rounded-2xl border border-gray-100 shadow-sm',
    minimal: 'rounded-2xl border border-gray-100 shadow-sm',
    glass: 'rounded-2xl border border-gray-100 shadow-sm',
    bordered: 'rounded-2xl border border-gray-100 shadow-sm',
  };

  const shadowClass = 'shadow-sm';
  const styleClass = styleMap[cardStyle] ?? 'rounded-2xl border border-gray-100 shadow-sm';

  const cardCustomStyle = {
    backgroundColor: '#FFFFFF',
    borderColor: '#ECECEC',
  };

  // Flat hover - border transition only
  const hoverClasses = 'transition-all duration-300 hover:border-[#174C3C]';

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  };

  const nextSlide = () => {
    if (lockGestureRef.current) return;
    const maxIndex = activeList.length - visibleCount;
    if (maxIndex <= 0) return;

    if (currentIndex < maxIndex) {
      lockGestureRef.current = true;
      setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
      if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
      lockTimeoutRef.current = setTimeout(() => {
        lockGestureRef.current = false;
      }, lockDuration);
    }
  };

  const prevSlide = () => {
    if (lockGestureRef.current) return;
    const maxIndex = activeList.length - visibleCount;
    if (maxIndex <= 0) return;

    if (currentIndex > 0) {
      lockGestureRef.current = true;
      setCurrentIndex((prev) => Math.max(0, prev - 1));
      if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
      lockTimeoutRef.current = setTimeout(() => {
        lockGestureRef.current = false;
      }, lockDuration);
    }
  };

  if (activeList.length === 0) {
    return (
      <section id="testimonials-section" className="bg-[#FCFCFC] border-t border-gray-100 py-16 text-center select-none">
        <div className="max-w-md mx-auto px-6 space-y-2">
          <h3 className="text-[18px] sm:text-[20px] font-semibold text-[#174C3C]">Testimoni belum tersedia</h3>
          <p className="text-[13px] sm:text-[14px] text-[#666666] leading-relaxed">
            Belum ada ulasan atau testimoni pelanggan yang dipublikasikan.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="testimonials-section"
      className="bg-[#FCFCFC] border-t border-gray-100 pt-10 pb-12 overflow-hidden relative text-left"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* HEADER SECTION */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="text-center mb-4 sm:mb-6 space-y-1.5 sm:space-y-3 max-w-3xl mx-auto"
        >
          <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.24em] font-semibold text-[#4D8B55] inline-block select-none">
            {badgeText}
          </span>

          <h2 className="text-[22px] sm:text-[30px] lg:text-[38px] font-semibold text-[#174C3C] tracking-tight leading-[1.08]">
            {sectionTitle}
          </h2>

          <p className="text-[12px] sm:text-[14px] lg:text-[15px] font-normal text-[#666666] max-w-[650px] mx-auto leading-relaxed">
            {sectionSubtitle}
          </p>
        </motion.div>

        {layout === 'carousel' ? (
          <div>
            {/* Sliding Cards Container with controlled manual pointer swipe */}
            <div
              className="overflow-hidden pt-4 sm:pt-8 pb-2 sm:pb-4 cursor-grab active:cursor-grabbing select-none"
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              onPointerLeave={handlePointerCancel}
              style={{ touchAction: 'pan-y' }}
            >
              <motion.div
                className="flex"
                animate={{ x: `-${currentIndex * (100 / activeList.length)}%` }}
                transition={{ duration: 0.65, ease: [0.25, 0.1, 0.25, 1] }}
                style={{
                  width: `${(activeList.length / visibleCount) * 100}%`,
                  touchAction: 'pan-y',
                }}
              >
                {activeList.map((item, index) => {
                  const reviewerDesc = [item.role, item.location].filter(Boolean).join(' • ') || 'Pelanggan Setia';
                  const reviewText = item.comment || item.review || '';
                  const cardPadding = 'p-3 sm:p-5 md:p-6';

                  const finalCardStyle = {
                    ...cardCustomStyle,
                    background: cardBackground,
                  };

                  return (
                    <div
                      key={item.id || index}
                      style={{ width: `${100 / activeList.length}%` }}
                      className="px-2 select-none"
                    >
                      <div
                        className={`relative ${cardPadding} flex flex-col justify-between h-full ${styleClass} ${shadowClass} ${hoverClasses} min-h-[160px] sm:min-h-[210px]`}
                        style={finalCardStyle}
                      >
                        {/* Review Body */}
                        <div className="flex-1">
                          {/* Ratings */}
                          {showRating && (
                            <div className="flex gap-1 mb-2.5 sm:mb-3 select-none">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                                    i < (item.rating || 5)
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-gray-200 fill-gray-200'
                                  }`}
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          )}
                          <p className="text-[11.5px] sm:text-[12.5px] md:text-[13.5px] font-normal leading-relaxed text-[#444444]">
                            “{reviewText}”
                          </p>
                        </div>

                        {/* Bottom Metadata */}
                        <div className="flex items-center gap-2.5 sm:gap-3 pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-gray-100">
                          {showAvatar && (
                            <div className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full overflow-hidden bg-[#F7F7F5] border border-[#E7E7E7] shrink-0">
                              <TestimonialAvatar avatar={item.avatar} name={item.name} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-[11.5px] sm:text-[13px] md:text-[14px] font-semibold text-[#111111] tracking-tight leading-tight truncate">
                              {item.name}
                            </h4>
                            <p className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-[#666666] font-bold mt-0.5 sm:mt-1 truncate">
                              {reviewerDesc}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </div>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-85px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-8"
          >
            {activeList.map((item, index) => {
              const reviewerDesc = [item.role, item.location].filter(Boolean).join(' • ') || 'Pelanggan Setia';
              const reviewText = item.comment || item.review || '';

              const finalCardStyle = {
                ...cardCustomStyle,
                background: cardBackground,
              };

              return (
                <motion.div
                  key={item.id || index}
                  variants={cardVariants}
                  className={`relative p-4 sm:p-6 md:p-7 flex flex-col justify-between h-full ${styleClass} ${shadowClass} ${hoverClasses}`}
                  style={finalCardStyle}
                >
                  <div className="flex-1">
                    {showRating && (
                      <div className="flex gap-1 mb-2.5 sm:mb-4 select-none">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                              i < (item.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'
                            }`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    )}
                    <p className="text-[11.5px] sm:text-[12.5px] md:text-[13.5px] font-normal leading-relaxed text-[#444444]">
                      “{reviewText}”
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 sm:gap-3 pt-3 sm:pt-5 mt-3 sm:mt-5 border-t border-gray-100">
                    {showAvatar && (
                      <div className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full overflow-hidden bg-[#F7F7F5] border border-[#E7E7E7] shrink-0">
                        <TestimonialAvatar avatar={item.avatar} name={item.name} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-[11.5px] sm:text-[13px] md:text-[14px] font-semibold text-[#111111] tracking-tight leading-tight truncate">
                        {item.name}
                      </h4>
                      <p className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-[#666666] font-bold mt-0.5 sm:mt-1 truncate">
                        {reviewerDesc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default React.memo(Testimonials);