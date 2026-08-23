'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowRight, Leaf, ChevronRight } from 'lucide-react';
const jost = { className: 'font-jost' };

const slugify = (text) => {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

function UmkmStory({ cms, articles: propArticles = [] }) {
  const router = useRouter();
  const articles = Array.isArray(propArticles) ? propArticles : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const data = cms || {};

  // Single source of truth from REST API (/api/articles)
  const allArticles = Array.isArray(articles) ? articles : [];

  // Filter out Draft and Nonaktif status
  const publishedArticles = allArticles.filter(art => {
    if (!art) return false;
    const st = String(art.status || 'published').toLowerCase();
    return st !== 'draft' && st !== 'nonaktif';
  });

  const selectedIds = data?.selectedArticleIds || data?.featuredArticles || data?.homepageArticles;
  let selectedArticles = [];

  if (Array.isArray(selectedIds) && selectedIds.length > 0) {
    selectedArticles = selectedIds
      .map(id => publishedArticles.find(a => a && (String(a.id) === String(id) || a.slug === id)))
      .filter(Boolean);
  } else {
    const markedArticles = publishedArticles.filter(a => a && a.showOnHomepage !== false);
    selectedArticles = markedArticles.length > 0 ? markedArticles : publishedArticles;
  }

  const limit = Number(data?.limit) || 4;
  const activeArticles = (Array.isArray(selectedArticles) ? selectedArticles : []).slice(0, limit);

  // Map articles to slides
  const slides = activeArticles.map((item, idx) => {
    const img = item?.image ? (item.image.startsWith('http') || item.image.startsWith('/') ? item.image : `/${item.image}`) : null;
    return {
      id: item?.id || `art-${idx}`,
      slug: item?.slug || slugify(item?.title) || '',
      image: img,
      title: item?.title || '',
      description: item?.excerpt || item?.subtitle || item?.content || '',
      category: item?.category || ''
    };
  });

  // Auto-slide trigger: every 5 seconds
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Render component directly

  if (data?.show === false) return null;

  if (slides.length === 0) {
    return (
      <section id="umkm-story-section" className={`${jost.className} bg-[#FCFCFC] border-t border-gray-100 py-16 text-center select-none`}>
        <div className="max-w-md mx-auto px-6 space-y-4">
          <div className="flex items-center justify-center text-[#174C3C] mx-auto">
            <Leaf className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-[16px] sm:text-[19px] font-semibold text-[#174C3C]">
              Artikel belum tersedia
            </h3>
            <p className="text-[13px] sm:text-[13px] text-[#666666] leading-relaxed">
              Belum ada artikel yang dipublikasikan melalui Dashboard Admin.
            </p>
          </div>
          <button
            onClick={() => router.push('/artikel')}
            className="inline-flex items-center justify-center px-4 py-2 text-[12px] sm:text-[13px] font-medium bg-[#174C3C] hover:bg-[#1F5C49] text-white rounded-full transition-colors duration-200 shadow-sm hover:shadow-md cursor-pointer"
          >
            <span>Lihat Semua Artikel</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </section>
    );
  }

  // Clamp activeIndex to ensure it is always valid and safe against dynamic slide updates
  const safeActiveIndex = (slides.length > 0 && activeIndex < slides.length && activeIndex >= 0) ? activeIndex : 0;
  const currentSlide = slides[safeActiveIndex] || { image: '', title: '', description: '' };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const imageContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  };

  const textContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  };

  const textItemVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        duration: 0.25,
        ease: 'easeOut',
      },
    },
  };

  const titleRevealVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        duration: 0.25,
        ease: 'easeOut',
      },
    },
  };

  const slideVariants = {
    enter: {
      opacity: 0,
    },
    center: {
      zIndex: 1,
      opacity: 1,
      transition: {
        duration: 0.25,
        ease: 'easeOut',
      },
    },
    exit: {
      zIndex: 0,
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      },
    },
  };

  return (
    <section 
      id="about-section" 
      className={`${jost.className} bg-[#FCFCFC] border-t border-gray-100 pt-10 pb-10 relative overflow-hidden select-none`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10">
        
        {/* HEADER - Tanpa gambar di atas */}
        <motion.div 
          variants={textContainerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-3xl mx-auto text-center mb-8 space-y-4 sm:space-y-4 lg:space-y-5"
        >
          {data?.badge ? (
            <motion.div variants={titleRevealVariants}>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.24em] font-semibold text-[#4D8B55] inline-block">
                {data.badge}
              </span>
            </motion.div>
          ) : null}
          
          {data?.title ? (
            <motion.h2 
              variants={titleRevealVariants}
              className="text-[22px] sm:text-[29px] lg:text-[37px] font-semibold text-[#174C3C] leading-[1.08] tracking-tight"
            >
              {data.title}
            </motion.h2>
          ) : null}
          
          {data?.subtitle ? (
            <motion.p 
              variants={titleRevealVariants}
              className="text-[12px] sm:text-[13px] lg:text-[13.5px] text-[#123524]/80 max-w-2xl mx-auto leading-relaxed font-medium"
            >
              {data.subtitle}
            </motion.p>
          ) : null}
        </motion.div>

        {/* MAIN BAGIAN (EDITORIAL 2-COLUMN GRID) */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-4 sm:gap-6 lg:gap-5 lg:items-stretch items-start"
        >
          {/* KOLOM KIRI (Slideshow Besar Dominan) */}
              <motion.div 
                variants={imageContainerVariants}
                className="flex flex-col justify-between h-full"
              >
                <div>
                  {/* Slideshow Image Container Frame - rounded-2xl mengikuti Hero */}
                  <div 
                    onClick={() => router.push(`/artikel/${currentSlide.slug}`)}
                    className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-[#E7E7E7]/40 bg-[#FAFAF7] group select-none cursor-pointer"
                  >
                    
                    {/* Slides content */}
                    <AnimatePresence mode="wait" custom={direction}>
                      <motion.div
                        key={safeActiveIndex}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        onDragEnd={(event, info) => {
                          const swipeThreshold = 50;
                          if (info.offset.x < -swipeThreshold) {
                            // swipe left -> next
                            setDirection(1);
                            setActiveIndex((prev) => (prev + 1) % slides.length);
                          } else if (info.offset.x > swipeThreshold) {
                            // swipe right -> prev
                            setDirection(-1);
                            setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
                          }
                        }}
                        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
                      >
                        {currentSlide.image ? (
                          <Image 
                            src={currentSlide.image} 
                            alt={currentSlide.title || ''} 
                            fill
                            sizes="(max-width: 1024px) 100vw, 55vw"
                            quality={75}
                            className="object-cover select-none pointer-events-none"
                            referrerPolicy="no-referrer"
                          />
                        ) : null}
                      </motion.div>
                    </AnimatePresence>
   
                    {/* Subtle bottom gradient overlay for depth */}
                    <div 
                      className="absolute inset-x-0 bottom-0 h-28 pointer-events-none z-10 opacity-20"
                      style={{
                        background: 'linear-gradient(to top, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 100%)'
                      }}
                    />
                    
                  </div>
                </div>

                {/* Active Article Details below the main image */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={safeActiveIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    onClick={() => router.push(`/artikel/${currentSlide.slug}`)}
                    className="mt-4 space-y-2 sm:space-y-3 lg:space-y-4 text-left lg:mb-2 cursor-pointer group"
                  >
                    <span className="text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.3em] text-[#123524]/90 block">
                      {currentSlide.category}
                    </span>
                    <h3 className="text-[16px] sm:text-[19px] lg:text-[27px] font-semibold text-[#123524] leading-snug tracking-tight transition-colors">
                      {currentSlide.title}
                    </h3>
                    <p className="text-[13px] sm:text-[13.5px] lg:text-[15px] text-[#123524]/80 leading-relaxed line-clamp-3 font-medium">
                      {currentSlide.description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </motion.div>

              {/* KOLOM KANAN (Daftar Artikel Editorial Vertikal) */}
              <motion.div 
                variants={textContainerVariants}
                className="flex flex-col justify-start space-y-3 sm:space-y-3 lg:space-y-4 py-1"
              >
                {slides.slice(0, 4).map((item, idx) => {
                  const isActive = safeActiveIndex === idx;

                  return (
                    <motion.div
                      key={item.id || idx}
                      variants={textItemVariants}
                      onClick={() => {
                        router.push(`/artikel/${item.slug}`);
                      }}
                      className="group flex gap-5 sm:gap-6 items-start cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    >
                      {/* Gambar kecil: 120px x 120px, rounded-xl, no border, no background, no shadow */}
                      <div className="relative w-20 h-20 sm:w-[120px] sm:h-[120px] rounded-xl overflow-hidden shrink-0 select-none bg-[#E7E7E7]/20 flex items-center justify-center">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.title} 
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Leaf className="w-6 h-6 text-[#174C3C]/30" />
                        )}
                      </div>

                      {/* Teks: Kategori, Judul, Deskripsi */}
                      <div className="flex flex-col justify-start text-left flex-1 min-w-0 py-1">
                        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#4D8B55] mb-1.5 block">
                          {item.category}
                        </span>
                        
                        {/* Title with animatable line underneath */}
                        <div className="relative inline-block pb-1 self-start">
                          <h3 className={`text-[13.5px] sm:text-[16px] font-semibold leading-snug tracking-tight transition-colors duration-300 ${
                            isActive ? 'text-[#123524]' : 'text-[#123524]/75 group-hover:text-[#123524]'
                          }`}>
                            {item.title}
                          </h3>
                          <div className={`absolute bottom-0 left-0 h-[1px] bg-[#174C3C] transition-opacity duration-300 ${
                            isActive 
                              ? 'w-full opacity-100' 
                              : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-100'
                          }`} />
                        </div>

                        <p className="text-[12px] sm:text-[13px] text-[#123524]/75 leading-relaxed line-clamp-2 mt-2 font-medium">
                          {item.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
        </motion.div>

        {/* CTA BUTTON - Hover Hijau Konsisten */}
        <motion.div 
          variants={textItemVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="flex justify-center mt-8 md:mt-10"
        >
          <button 
            onClick={() => router.push(data?.buttonLink || '/artikel')}
            className="inline-flex items-center justify-center px-4 py-2 text-[12px] md:text-[14px] font-medium bg-[#174C3C] hover:bg-[#205E49] active:bg-[#123A2E] text-white rounded-full transition-colors duration-200 shadow-sm cursor-pointer"
          >
            <span>{data?.buttonText || "Lihat Semua Cerita"}</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
          </button>
        </motion.div>

      </div>
    </section>
  );
}

export default React.memo(UmkmStory);