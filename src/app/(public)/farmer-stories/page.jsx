import React from 'react';
import Image from 'next/image';
import { Quote, MapPin, Users, BookOpen } from 'lucide-react';
import Link from 'next/link';
import PageLayoutWrapper from '@/components/layout/PageLayoutWrapper';
import { getFarmerStoriesData } from '@/lib/home';

export default async function KisahMitraTaniPage() {
  const { farmers, gallery } = await getFarmerStoriesData();

  return (
    <PageLayoutWrapper>
      <div className="bg-[#FCFCFC] text-[#111111] font-jost pb-20">
        {/* Hero Header */}
        <section className="relative bg-[#1B4D3E] text-white py-24 px-6 md:px-8 text-center overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="max-w-3xl mx-auto relative z-10">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-[#A3E635]">
              Kisah Mitra Tani
            </span>
            <h1 className="text-[24px] sm:text-[30px] lg:text-[38px] font-bold font-sans mt-4 tracking-tight leading-tight">
              Para Penjaga Kesuburan Bumi Bangka
            </h1>
            <p className="mt-6 text-[13px] sm:text-[14px] lg:text-[15px] text-[#E3EBF0]/80 leading-relaxed font-light">
              Mengenal lebih dekat kisah dedikasi para petani lokal yang merawat sayuran organik dengan penuh ketulusan demi menghadirkan panen terbaik untuk keluarga Anda.
            </p>
          </div>
        </section>

        {/* Cerita Petani */}
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 space-y-24">
          {farmers.length === 0 ? (
            <div className="text-center py-16 bg-white border border-[#DDE9DF] rounded-2xl max-w-lg mx-auto p-8 space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-[#1B4D3E]/10 text-[#1B4D3E] flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#1B4D3E]">Belum Ada Kisah Mitra</h3>
                <p className="text-sm text-gray-500">
                  Kisah kemitraan petani belum dipublikasikan di database.
                </p>
              </div>
              <Link
                href="/artikel"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B4D3E] text-white text-xs font-semibold rounded-full hover:bg-[#174C3C] transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>Lihat Artikel Lainnya</span>
              </Link>
            </div>
          ) : (
            farmers.map((f, idx) => (
              <div key={f.id || idx} className={`grid grid-cols-1 lg:grid-cols-12 gap-12 items-center ${idx % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                <div className={`lg:col-span-5 ${idx % 2 === 1 ? 'lg:order-last' : ''}`}>
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-[#DDE9DF]/40 bg-gray-100">
                    {f.image ? (
                      <Image 
                        src={f.image} 
                        alt={f.title || 'Mitra Tani'} 
                        fill
                        sizes="(max-width: 1024px) 100vw, 40vw"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#1B4D3E]/10 flex items-center justify-center text-[#1B4D3E]">
                        <Users className="w-12 h-12" />
                      </div>
                    )}
                    {f.author && (
                      <div className="absolute top-4 left-4 text-[9px] sm:text-[10px] font-semibold text-[#1B4D3E] bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full drop-shadow-xs flex items-center gap-1.5 z-10">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{f.author}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="lg:col-span-7 space-y-6">
                  <div className="space-y-1">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#1B4D3E]">
                      {f.category || 'Kisah Mitra'}
                    </span>
                    <h2 className="text-[18px] sm:text-[26px] lg:text-[32px] font-bold font-sans tracking-tight text-[#1B4D3E] pt-2">
                      {f.title}
                    </h2>
                  </div>
                  <p className="text-gray-600 text-[12px] sm:text-[13px] lg:text-[14px] leading-relaxed">
                    {f.excerpt || f.content}
                  </p>

                  {f.subtitle && (
                    <div className="relative p-6 bg-white border border-[#DDE9DF]/40 rounded-2xl space-y-3">
                      <Quote className="w-8 h-8 text-[#A3E635] opacity-40 absolute top-4 right-4" />
                      <p className="text-[#1B4D3E] font-medium text-[12px] sm:text-[13px] lg:text-[14px] italic leading-relaxed pr-8">
                        "{f.subtitle}"
                      </p>
                    </div>
                  )}

                  {f.slug && (
                    <div className="pt-2">
                      <Link
                        href={`/artikel/${f.slug}`}
                        className="inline-flex items-center text-xs font-semibold text-[#1B4D3E] hover:underline"
                      >
                        Baca Cerita Lengkap &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </section>

        {/* Galeri Kegiatan / Foto Diari */}
        {gallery.length > 0 && (
          <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 text-center border-t border-[#DDE9DF]/40">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-[#1B4D3E]">
              Dokumentasi Lapangan
            </span>
            <h2 className="text-[18px] sm:text-[26px] lg:text-[32px] font-bold font-sans tracking-tight mt-3 text-[#1B4D3E]">
              Diari Foto Kegiatan Panen & Kebun
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              {gallery.map((item, i) => (
                <div key={item.id || i} className="bg-white rounded-2xl border border-[#DDE9DF]/40 overflow-hidden group text-left">
                  <div className="aspect-[4/3] overflow-hidden relative">
                    {item.image ? (
                      <Image 
                        src={item.image} 
                        alt={item.title || 'Dokumentasi Kebun'} 
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#1B4D3E]/10 flex items-center justify-center text-[#1B4D3E]">
                        <Users className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="p-5 space-y-1">
                    <h4 className="font-bold text-[#1B4D3E] text-[14px] sm:text-[15px] lg:text-[16px]">{item.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </PageLayoutWrapper>
  );
}

