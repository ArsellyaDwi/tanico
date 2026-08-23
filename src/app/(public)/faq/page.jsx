"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, Search, HelpCircle, ArrowRight } from 'lucide-react';
import PageLayoutWrapper from '@/components/layout/PageLayoutWrapper';

const STATIC_FAQS = [
  {
    q: 'Bagaimana TaniCo memastikan kesegaran sayuran yang dikirim?',
    a: 'Kami menerapkan sistem Harvest-to-Doorstep: sayuran baru dipanen dari kebun mitra petani lokal pada fajar hari (pukul 04:00 - 06:00 WIB), disortir secara higienis, dan langsung dikirimkan ke alamat Anda sebelum siang hari.'
  },
  {
    q: 'Apakah semua produk pertanian di TaniCo bersertifikat organik?',
    a: 'Seluruh sayur dan buah yang berlabel Organik dibudidayakan secara alami tanpa pestisida kimia sintetis, menggunakan pupuk kompos hayati, dan diawasi ketat melalui standardisasi Good Agricultural Practices (GAP).'
  },
  {
    q: 'Berapa batas waktu pemesanan untuk pengantaran hari yang sama (Same Day)?',
    a: 'Pemesanan yang masuk sebelum pukul 07:00 WIB akan diproses dan dikirimkan pada jadwal pengantaran pagi/siang hari yang sama. Pesanan setelah pukul 07:00 WIB akan dijadwalkan untuk panen fajar keesokan harinya.'
  },
  {
    q: 'Bagaimana prosedur klaim garansi jika sayuran tiba dalam kondisi rusak atau layu?',
    a: 'TaniCo memberikan Garansi 100% Kesegaran. Jika terdapat produk yang tidak sesuai standar, cukup foto kondisi produk dan hubungi layanan pelanggan kami dalam 1x24 jam sejak pesanan diterima untuk penggantian produk atau pengembalian dana.'
  },
  {
    q: 'Metode pembayaran apa saja yang didukung?',
    a: 'Kami menerima pembayaran melalui Transfer Bank Virtual Account (BCA, Mandiri, BNI, BRI), E-Wallet (GoPay, OVO, ShopeePay, DANA), QRIS, serta layanan Bayar di Tempat (COD) untuk area jangkauan tertentu.'
  },
  {
    q: 'Apakah ada minimal belanja untuk mendapatkan Gratis Ongkir?',
    a: 'Ya, Anda berhak menikmati fasilitas Gratis Ongkir dengan minimal pembelanjaan Rp 50.000 untuk seluruh area pengantaran dalam kota.'
  }
];

function FaqContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openIdx, setOpenIdx] = useState(null);

  const filteredFaqs = STATIC_FAQS.filter(
    item => item.q.toLowerCase().includes(searchTerm.toLowerCase()) || 
            item.a.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-[#FCFCFC] text-[#111111] font-jost pb-12 sm:pb-16 md:pb-24 text-left select-none">
      {/* Header Banner */}
      <section className="relative bg-[#1B4D3E] text-white py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 text-center overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative z-10 max-w-3xl mx-auto space-y-3 sm:space-y-4">
          <span className="text-[9px] sm:text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-[#A3E635]">
            Pusat Bantuan TaniCo
          </span>
          <h1 className="text-[24px] sm:text-[30px] lg:text-[38px] md:text-5xl font-bold font-sans tracking-tight leading-snug sm:leading-tight">
            Pertanyaan yang Sering Diajukan
          </h1>
          <p className="text-[#E3EBF0]/80 text-[13px] sm:text-[14px] lg:text-[15px] md:text-base font-light max-w-xl mx-auto leading-relaxed">
            Temukan jawaban cepat seputar pemesanan hasil bumi, durasi pengantaran fajar, metode transaksi aman, dan prosedur garansi klaim kesegaran sayuran kami.
          </p>

          {/* Quick Search */}
          <div className="relative w-full max-w-md mx-auto h-10 sm:h-12 mt-4 sm:mt-6">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kata kunci pertanyaan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-full bg-white text-gray-800 border border-[#DDE9DF] rounded-full pl-10 sm:pl-12 pr-4 text-xs sm:text-sm font-medium outline-none shadow-sm focus:border-[#1B4D3E]/40 focus:ring-1 focus:ring-[#1B4D3E]/40 transition-all duration-300"
            />
          </div>
        </div>
      </section>

      {/* Accordion FAQ Body */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 mt-8 sm:mt-12 md:mt-16">
        <div className="relative z-10">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-10 sm:py-16 bg-white border border-[#DDE9DF] rounded-3xl p-5 sm:p-6">
              <HelpCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-xs sm:text-sm font-medium">Tidak ada pertanyaan yang sesuai dengan kata kunci pencarian.</p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="mt-4 px-4 py-2 bg-[#1B4D3E] hover:bg-[#143D31] text-white text-[12px] sm:text-xs font-semibold rounded-full transition-colors duration-300 cursor-pointer"
                >
                  Tampilkan Semua
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredFaqs.map((item, idx) => {
                const isOpen = openIdx === idx;
                return (
                  <div 
                    key={idx} 
                    className="bg-white border border-[#DDE9DF] rounded-2xl overflow-hidden transition-colors duration-200"
                  >
                    <div
                      onClick={() => setOpenIdx(isOpen ? null : idx)}
                      className="w-full p-4 sm:p-5 md:p-6 flex justify-between items-center text-left cursor-pointer select-none gap-3"
                    >
                      <span className="pointer-events-none font-bold text-[#1B4D3E] text-[14px] sm:text-[15px] lg:text-[16px] md:text-base leading-snug">{item.q}</span>
                      <span className="p-1 bg-[#1B4D3E]/5 text-[#1B4D3E] rounded-md shrink-0 select-none pointer-events-none">
                        {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </span>
                    </div>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6 text-gray-600 text-[12px] sm:text-[13px] lg:text-[14px] md:text-sm leading-relaxed border-t border-gray-50 pt-3 sm:pt-4">
                            {item.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Alternative Help Channel Call-out */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 mt-10 sm:mt-12 md:mt-16 text-center">
        <div className="relative z-10 bg-[#1B4D3E]/5 border border-[#1B4D3E]/10 rounded-3xl p-5 sm:p-6 md:p-8 space-y-3 sm:space-y-4">
          <HelpCircle className="w-8 h-8 sm:w-10 sm:h-10 text-[#1B4D3E] mx-auto" />
          <h3 className="text-base sm:text-lg md:text-xl font-bold font-sans text-[#1B4D3E]">Pertanyaan Anda Belum Terjawab?</h3>
          <p className="text-gray-500 text-[12px] sm:text-[13px] md:text-sm leading-relaxed max-w-md mx-auto">Tim customer support kami selalu senang menjawab dan memandu belanja sayur harian Anda secara interaktif.</p>
          <Link 
            href="/contact"
            className="inline-flex items-center gap-1.5 px-5 sm:px-6 py-2.5 sm:py-3 bg-[#1B4D3E] hover:bg-[#143D31] text-white text-[12px] sm:text-xs font-bold rounded-full cursor-pointer shadow-xs transition-colors"
          >
            <span>Hubungi Customer Service</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function FaqPage() {
  return (
    <PageLayoutWrapper>
      <FaqContent />
    </PageLayoutWrapper>
  );
}
