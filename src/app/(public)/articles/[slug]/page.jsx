import React from 'react';
import { ArrowLeft, Clock, Calendar, User, Share2, Heart, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import PageLayoutWrapper from '@/components/layout/PageLayoutWrapper';
import { getArticleBySlug } from '@/lib/articles';

export default async function ArtikelDetailPage({ params }) {
  const resolvedParams = await params;
  const rawSlug = resolvedParams?.slug || '';
  let slug = '';
  try {
    slug = decodeURIComponent(rawSlug);
  } catch (e) {
    slug = rawSlug;
  }

  const rawArticle = await getArticleBySlug(slug);

  if (!rawArticle) {
    return (
      <PageLayoutWrapper>
        <div className="bg-[#FCFCFC] text-[#111111] font-jost min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-20">
          <h2 className="text-[18px] sm:text-[22px] lg:text-[28px] font-bold text-[#1B4D3E] font-sans mb-3 tracking-tight">
            Artikel Tidak Ditemukan
          </h2>
          <p className="text-gray-600 text-[13px] sm:text-[14px] max-w-md mb-6 leading-relaxed">
            Artikel mungkin telah dihapus atau belum dipublikasikan.
          </p>
          <Link
            href="/artikel"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-[12px] sm:text-[13px] font-bold bg-[#1B4D3E] text-white rounded-full hover:bg-[#123524] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>KEMBALI KE SEMUA ARTIKEL</span>
          </Link>
        </div>
      </PageLayoutWrapper>
    );
  }

  const rawImage = rawArticle.image ? (rawArticle.image.startsWith('http') || rawArticle.image.startsWith('/') ? rawArticle.image : `/${rawArticle.image}`) : '';
  const article = {
    category: rawArticle.category || '',
    title: rawArticle.title || '',
    subtitle: rawArticle.excerpt || rawArticle.subtitle || '',
    author: rawArticle.author || '',
    date: rawArticle.date || (rawArticle.createdAt ? new Date(rawArticle.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''),
    readTime: rawArticle.readTime || '',
    image: rawImage,
    content: rawArticle.content || rawArticle.excerpt || ''
  };

  const hasValidImage = Boolean(article.image && typeof article.image === 'string' && article.image.trim() !== '');

  return (
    <PageLayoutWrapper>
      <div className="bg-[#FCFCFC] text-[#111111] font-jost pb-24 text-left">
        {/* Top Navigator */}
        <div className="max-w-4xl mx-auto px-6 pt-8 pb-4">
          <Link 
            href="/artikel"
            className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] lg:text-[12px] font-bold text-[#1B4D3E] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>KEMBALI KE SEMUA ARTIKEL</span>
          </Link>
        </div>

        {/* Hero Header Cover */}
        <section className="max-w-4xl mx-auto px-6">
          <div className="space-y-4">
            <Link
              href={`/artikel?kategori=${encodeURIComponent(article.category)}`}
              className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-[#174C3C] hover:underline inline-block transition-colors cursor-pointer"
            >
              {article.category}
            </Link>
            <h1 className="text-[24px] sm:text-[30px] lg:text-[38px] font-bold font-sans tracking-tight text-[#1B4D3E] leading-tight">
              {article.title}
            </h1>
            {article.subtitle && (
              <p className="text-[#666666] text-[13px] sm:text-[14px] lg:text-[15px] italic leading-relaxed">
                "{article.subtitle}"
              </p>
            )}

            <div className="flex flex-wrap items-center gap-6 pt-4 text-[10px] sm:text-[11px] lg:text-[12px] text-gray-500 border-t border-[#DDE9DF]">
              {article.author && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#1B4D3E]" />
                  <span className="font-semibold text-gray-700">{article.author}</span>
                </div>
              )}
              {article.date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{article.date}</span>
                </div>
              )}
              {article.readTime && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{article.readTime}</span>
                </div>
              )}
            </div>
          </div>

          {/* Big Banner Image */}
          {hasValidImage && (
            <div className="mt-8 aspect-[16/9] rounded-2xl overflow-hidden">
              <img 
                src={article.image} 
                alt={article.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {/* Main Paragraph Contents */}
          <article className="mt-12 prose prose-emerald max-w-none text-[#333333] space-y-6">
            {String(article.content || '').split('\n\n').map((paragraph, idx) => {
              if (!paragraph.trim()) return null;
              if (paragraph.startsWith('Bahan Utama:') || paragraph.startsWith('Cara Memasak:') || paragraph.startsWith('Berikut adalah') || paragraph.startsWith('Tips:')) {
                return (
                  <h3 key={idx} className="text-[18px] sm:text-[22px] lg:text-[26px] font-bold font-sans tracking-tight text-[#1B4D3E] pt-4">
                    {paragraph}
                  </h3>
                );
              }
              return (
                <p key={idx} className="whitespace-pre-line text-gray-700 text-[12px] sm:text-[13px] lg:text-[14px] leading-8">
                  {paragraph}
                </p>
              );
            })}
          </article>

          {/* Reaction Bar */}
          <div className="mt-12 pt-6 border-t border-[#DDE9DF] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1.5 text-[10px] sm:text-[11px] lg:text-[12px] text-gray-500 hover:text-red-500 transition-colors">
                <Heart className="w-4.5 h-4.5" />
                <span>Suka (24)</span>
              </button>
              <button className="flex items-center gap-1.5 text-[10px] sm:text-[11px] lg:text-[12px] text-gray-500 hover:text-[#1B4D3E] transition-colors">
                <MessageSquare className="w-4.5 h-4.5" />
                <span>Komentar (8)</span>
              </button>
            </div>
            <button className="flex items-center gap-1.5 text-[10px] sm:text-[11px] lg:text-[12px] text-gray-500 hover:text-[#1B4D3E] transition-colors">
              <Share2 className="w-4.5 h-4.5" />
              <span>Bagikan</span>
            </button>
          </div>
        </section>
      </div>
    </PageLayoutWrapper>
  );
}