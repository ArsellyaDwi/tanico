"use client";

import React, { useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, BookOpen, ChevronRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageLayoutWrapper from '@/components/layout/PageLayoutWrapper';

function ArtikelContent({ initialArticles = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams?.get('kategori') || searchParams?.get('category') || 'all';

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState(categoryParam);
  const [articles, setArticles] = useState(Array.isArray(initialArticles) ? initialArticles : []);
  const [isLoading, setIsLoading] = useState(!initialArticles?.length);

  React.useEffect(() => {
    if (initialArticles && initialArticles.length > 0) {
      setArticles(initialArticles);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    async function fetchArticles() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/articles');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setArticles(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error fetching articles:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchArticles();
    return () => { isMounted = false; };
  }, [initialArticles]);

  const publishedArticles = (Array.isArray(articles) ? articles : []).filter(art => {
    if (!art) return false;
    const st = String(art?.status || 'published').toLowerCase();
    return st !== 'draft' && st !== 'nonaktif';
  });

  const dynamicCategories = Array.from(
    new Set((Array.isArray(publishedArticles) ? publishedArticles : []).map(a => a?.category).filter(Boolean))
  );

  const categories = [
    { id: 'all', label: 'Semua Artikel' },
    ...(Array.isArray(dynamicCategories) ? dynamicCategories : []).map(cat => ({ id: String(cat || ''), label: String(cat || '') }))
  ];

  const filteredArticles = (Array.isArray(publishedArticles) ? publishedArticles : []).filter(art => {
    if (!art) return false;
    const titleStr = String(art?.title || '');
    const excerptStr = String(art?.excerpt || art?.subtitle || art?.content || '');
    const termStr = String(searchTerm || '').toLowerCase();
    const matchesSearch = titleStr.toLowerCase().includes(termStr) || excerptStr.toLowerCase().includes(termStr);
    const matchesFilter = (activeFilter || 'all').toLowerCase() === 'all' || 
                          String(art?.category || '').toLowerCase() === String(activeFilter || '').toLowerCase();
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-[#FCFCFC] text-[#111111] font-jost pb-24 text-left">
      {/* Header Banner */}
      <section className="bg-white border-b border-[#DDE9DF] py-16 px-6 md:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-[#1B4D3E]">
            Arsip Pengetahuan & Inspirasi
          </span>
          <h1 className="text-[24px] sm:text-[30px] lg:text-[38px] font-bold font-sans tracking-tight text-[#1B4D3E]">
            Blog & Artikel TaniCo
          </h1>
          <p className="text-gray-500 text-[13px] sm:text-[14px] lg:text-[15px] leading-relaxed font-light max-w-2xl">
            Selamat datang di basis artikel kami. Temukan ribuan panduan praktis memasak, tips berkebun perkotaan, hingga edukasi nutrisi alami langsung dari pakar kemitraan kami.
          </p>

          {/* Search Bar & Categories Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-8 items-center">
            <div className="relative h-10 lg:col-span-4">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari judul artikel atau topik..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-full bg-[#FCFCFC] border border-[#DDE9DF] rounded-xl pl-12 pr-4 text-[13px] sm:text-[14px] font-medium focus:border-[#1B4D3E] outline-none transition-all duration-300"
              />
            </div>
            
            <div className="lg:col-span-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveFilter(cat.id);
                    if (cat.id === 'all') {
                      router.push('/artikel');
                    } else {
                      router.push(`/artikel?kategori=${encodeURIComponent(cat.id)}`);
                    }
                  }}
                  className={`px-4.5 py-2.5 rounded-full text-[11px] sm:text-[12px] font-semibold whitespace-nowrap transition-colors duration-300 cursor-pointer ${
                    activeFilter.toLowerCase() === cat.id.toLowerCase()
                      ? 'bg-[#1B4D3E] text-white'
                      : 'bg-white border border-[#DDE9DF] text-gray-600 hover:border-[#1B4D3E]/40'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Articles Grid layout */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 mt-12">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#DDE9DF] p-8">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-[18px] sm:text-[22px] lg:text-[28px] font-bold font-sans text-gray-700">Artikel Tidak Ditemukan</h3>
            <p className="text-gray-500 text-[13px] sm:text-[14px] leading-relaxed mt-1 max-w-md mx-auto">Kami tidak dapat menemukan hasil untuk pencarian Anda. Coba kata kunci lain atau pilih filter kategori yang berbeda.</p>
            <button
              onClick={() => { setSearchTerm(''); setActiveFilter('all'); router.push('/artikel'); }}
              className="mt-6 px-6 py-2.5 bg-[#1B4D3E] text-white text-[12px] sm:text-[13px] font-semibold rounded-full cursor-pointer"
            >
              Reset Filter & Cari
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
            <AnimatePresence mode="popLayout">
              {filteredArticles.map((art, idx) => {
                if (!art) return null;
                const artSlug = art.slug || art.id || `article-${idx}`;
                const artTitle = art.title || '';
                const artExcerpt = art.excerpt || art.subtitle || art.content || '';
                const artImage = art.image ? (art.image.startsWith('http') || art.image.startsWith('/') ? art.image : `/${art.image}`) : null;
                const artCategory = art.category || '';
                const artAuthor = art.author || '';
                const artDate = art.date || (art.createdAt ? new Date(art.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '');
                const artReadTime = art.readTime || '';

                return (
                  <motion.div
                    key={artSlug}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                    onClick={() => router.push(`/artikel/${artSlug}`)}
                    className="bg-white rounded-[20px] border border-[#DDE9DF] overflow-hidden group flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      <div className="aspect-[4/3] overflow-hidden relative bg-[#E7F3EC]/40 flex items-center justify-center">
                        {artImage ? (
                          <img 
                            src={artImage} 
                            alt={artTitle} 
                            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <BookOpen className="w-10 h-10 text-[#174C3C]/30 stroke-[1.5]" />
                        )}
                      </div>
                      <div className="p-4 sm:p-5 space-y-2.5">
                        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] lg:text-[12px] text-gray-400">
                          {artCategory && (
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveFilter(artCategory);
                                router.push(`/artikel?kategori=${encodeURIComponent(artCategory)}`);
                              }}
                              className="text-[#174C3C] font-semibold hover:underline cursor-pointer"
                            >
                              {artCategory}
                            </span>
                          )}
                          {artCategory && (artDate || artReadTime) && <span>•</span>}
                          {artDate && <span>{artDate}</span>}
                          {artDate && artReadTime && <span>•</span>}
                          {artReadTime && <span>{artReadTime}</span>}
                        </div>
                        <h3 className="font-bold text-[14px] sm:text-[15px] lg:text-[16px] tracking-tight text-[#1B4D3E] font-sans leading-snug">
                          {artTitle}
                        </h3>
                        <p className="text-gray-600 text-[12px] sm:text-[13px] lg:text-[14px] leading-relaxed line-clamp-3">
                          {artExcerpt}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 sm:p-5 pt-0 border-t border-[#DDE9DF]/10 flex items-center justify-between">
                      <span className="text-[10px] sm:text-[11px] lg:text-[12px] font-medium text-gray-500">Oleh: {artAuthor}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/artikel/${artSlug}`);
                        }}
                        className="flex items-center gap-1.5 text-[10px] sm:text-[11px] lg:text-[12px] font-bold text-[#1B4D3E] hover:underline cursor-pointer"
                      >
                        <span>Baca</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}

export default function ArticlesPageClient({ initialArticles = [] }) {
  return (
    <PageLayoutWrapper>
      <Suspense fallback={
        <div className="bg-[#FCFCFC] font-jost pb-24 text-left animate-pulse">
          <div className="w-full bg-emerald-950/5 py-12 px-6 md:px-8 border-b border-gray-100">
            <div className="max-w-7xl mx-auto space-y-3">
              <div className="h-3 w-28 bg-gray-200 rounded-full" />
              <div className="h-7 sm:h-9 w-64 sm:w-96 bg-gray-200 rounded-xl" />
              <div className="h-4 w-72 bg-gray-100 rounded-lg" />
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-6 md:px-8 pt-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#DDE9DF] p-4 space-y-3">
                  <div className="aspect-[16/10] w-full bg-gray-200 rounded-xl" />
                  <div className="space-y-2 pt-1">
                    <div className="h-3 w-20 bg-gray-200 rounded-full" />
                    <div className="h-4.5 w-full bg-gray-200 rounded-md" />
                    <div className="h-3 w-3/4 bg-gray-100 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      }>
        <ArtikelContent initialArticles={initialArticles} />
      </Suspense>
    </PageLayoutWrapper>
  );
}
