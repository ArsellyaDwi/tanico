import React from 'react';
import Image from 'next/image';
import { Users, TrendingUp, Sparkles, Handshake } from 'lucide-react';
import PageLayoutWrapper from '@/components/layout/PageLayoutWrapper';
import { getAboutData } from '@/lib/home';

export default async function TentangKamiPage() {
  const { benefits, partners, settings } = await getAboutData();

  return (
    <PageLayoutWrapper>
      <div className="bg-[#FCFCFC] text-[#111111] font-jost pb-12 sm:pb-16 md:pb-20 select-none">
        {/* Hero Section - Brand Philosophy */}
        <section className="relative bg-[#1B4D3E] text-white py-12 sm:py-16 md:py-24 px-4 sm:px-6 md:px-8 text-center overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="max-w-3xl mx-auto relative z-10">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#A3E635]">
              Filosofi TaniCo
            </span>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold font-sans mt-3 sm:mt-4 tracking-tight leading-snug sm:leading-tight">
              Menghubungkan Kebun Organik Langsung ke Meja Makan
            </h1>
            <p className="mt-3 sm:mt-6 text-[13px] sm:text-base md:text-lg text-[#E3EBF0]/80 leading-relaxed font-light">
              {settings?.tagline ? `${settings.tagline} — ` : ''}TaniCo lahir dari komitmen menjaga kelestarian lingkungan dan transparansi rantai pasok hasil bumi lokal dengan kualitas panen fajar terbaik.
            </p>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-16 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center">
            <div className="space-y-3 sm:space-y-5">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#1B4D3E]">
                Kisah Kami
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-sans tracking-tight text-[#1B4D3E]">
                Dedikasi Panen Segar & Pertanian Ramah Lingkungan
              </h2>
              <p className="text-gray-600 text-[13px] sm:text-sm md:text-base leading-relaxed">
                TaniCo didirikan dengan misi sederhana: memfasilitasi petani lokal menyalurkan hasil kebun organik mereka secara adil dan langsung ke tangan konsumen. Kami menjunjung tinggi kelestarian ekosistem tanah dan nutrisi alami tanpa residu kimia berbahaya.
              </p>
              <p className="text-gray-600 text-[13px] sm:text-sm md:text-base leading-relaxed">
                Seluruh sayur dipetik saat fajar dan didistribusikan dengan standar higienis tinggi agar kesegaran dan cita rasa alami tetap terjaga sempurna hingga tiba di dapur Anda.
              </p>
            </div>
            {/* Static image from public folder - not from API */}
            <div className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xs border border-[#DDE9DF] bg-[#174C3C]/10 flex items-center justify-center">
              <Image
                src="/images/about/perkebunan.webp"
                alt="Perkebunan TaniCo"
                width={800}
                height={600}
                className="w-full h-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </section>

        {/* Vision & Mission Section */}
        <section className="bg-white py-10 sm:py-16 md:py-20 border-y border-[#DDE9DF]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 lg:gap-12">
              <div className="p-5 sm:p-6 md:p-8 bg-white rounded-2xl border border-[#DDE9DF] space-y-3 sm:space-y-4">
                <span className="p-2.5 sm:p-3 bg-[#1B4D3E]/5 text-[#1B4D3E] rounded-xl inline-block">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-sans text-[#1B4D3E]">Visi Kami</h3>
                <p className="text-gray-600 text-[13px] sm:text-sm leading-relaxed">
                  Menjadi pelopor distribusi hasil pangan organik terpercaya, menginspirasi pola makan sehat alami, dan mengangkat kesejahteraan petani lokal secara berkelanjutan.
                </p>
              </div>
              <div className="p-5 sm:p-6 md:p-8 bg-white rounded-2xl border border-[#DDE9DF] space-y-3 sm:space-y-4">
                <span className="p-2.5 sm:p-3 bg-[#1B4D3E]/5 text-[#1B4D3E] rounded-xl inline-block">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-sans text-[#1B4D3E]">Misi Kami</h3>
                <ul className="text-gray-600 text-[13px] sm:text-sm space-y-1.5 sm:space-y-2 list-disc pl-5 leading-relaxed">
                  <li>Menjalin kemitraan yang transparan dan adil bersama kelompok tani binaan.</li>
                  <li>Menyediakan pangan organik berkualitas prima bebas pestisida kimia sintetis.</li>
                  <li>Menjaga rantai distribusi cepat dan higienis langsung dari kebun fajar ke dapur konsumen.</li>
                  <li>Mendukung kelestarian alam melalui praktik budidaya ramah lingkungan.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits / Advantages Section - Data from API */}
        {benefits.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-14 md:py-16 text-center">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#1B4D3E]">
              Keunggulan Kami
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-sans tracking-tight mt-2 sm:mt-3 text-[#1B4D3E]">
              Prinsip & Jaminan Mutu TaniCo
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8 text-left max-w-5xl mx-auto">
              {benefits.map((b, i) => (
                <div key={b.id || i} className="bg-white border border-[#DDE9DF] rounded-2xl shadow-xs overflow-hidden flex flex-col">
                  {b.image ? (
                    <div className="aspect-[16/10] relative w-full overflow-hidden bg-gray-50">
                      <img
                        src={b.image}
                        alt={b.title || 'Keunggulan TaniCo'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/10] bg-[#1B4D3E]/5 flex items-center justify-center text-[#1B4D3E]">
                      <Sparkles className="w-8 h-8" />
                    </div>
                  )}
                  <div className="p-4 sm:p-5 flex-grow space-y-1.5 sm:space-y-2">
                    <h4 className="text-sm sm:text-base font-bold font-sans text-[#1B4D3E]">{b.title || b.value}</h4>
                    <p className="text-gray-600 text-[12px] sm:text-xs leading-relaxed">{b.description || b.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Partners Section - Data from API */}
        {partners.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-14 md:py-16 text-center border-t border-[#DDE9DF]">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#1B4D3E]">
              Kemitraan
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-sans tracking-tight mt-2 sm:mt-3 text-[#1B4D3E]">
              Mitra Kebun & Kolaborator Kami
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 mt-6 sm:mt-8 max-w-4xl mx-auto">
              {partners.map((p, i) => (
                <div key={p.id || i} className="bg-white border border-[#DDE9DF] rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2">
                  {p.logo ? (
                    <img 
                      src={p.logo} 
                      alt={p.name} 
                      className="h-12 w-auto max-w-[120px] object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-[#1B4D3E]/5 flex items-center justify-center text-[#1B4D3E]">
                      <Handshake className="w-6 h-6" />
                    </div>
                  )}
                  <p className="text-xs font-bold text-[#1B4D3E]">{p.name}</p>
                  {p.location && (
                    <p className="text-[10px] text-gray-500">{p.location}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </PageLayoutWrapper>
  );
}