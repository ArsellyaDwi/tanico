"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import PageLayoutWrapper from '@/components/layout/PageLayoutWrapper';

const tutorialImages = {
  'how-to-order': '/images/knowledge-base/how-to-order.webp',
  'how-to-checkout': '/images/knowledge-base/how-to-checkout.webp',
  'how-to-use-voucher': '/images/knowledge-base/how-to-use-voucher.webp',
  'how-to-track-order': '/images/knowledge-base/how-to-track-order.webp',
};

function KnowledgeBaseContent() {
  const [selectedTopic, setSelectedTopic] = useState('how-to-order');

  const topics = [
    {
      id: 'how-to-order',
      title: 'Tutorial Belanja',
      steps: [
        { num: "1", heading: "Jelajahi Produk Pilihan", body: "Kunjungi halaman Katalog Produk ('Produk Segar'). Gunakan pencarian atau filter kategori seperti daun hijau, buah, atau rempah untuk menemukan bahan masakan Anda." },
        { num: "2", heading: "Tambahkan ke Keranjang", body: "Tentukan jumlah satuan atau per 250g yang Anda inginkan, lalu klik tombol 'Masukkan Keranjang' di kartu produk." },
        { num: "3", heading: "Selesaikan Checkout", body: "Klik ikon tas belanja di pojok kanan atas Header untuk meninjau sayur-mayur yang telah Anda kumpulkan, lalu lanjutkan ke halaman checkout." }
      ]
    },
    {
      id: 'how-to-checkout',
      title: 'Checkout & Bayar',
      steps: [
        { num: "1", heading: "Lengkapi Alamat Kirim", body: "Pada panel checkout, pastikan nama penerima, nomor WhatsApp aktif, dan koordinat detail alamat pengantaran terisi lengkap." },
        { num: "2", heading: "Pilih Jadwal & Kurir", body: "Pilih jadwal pengantaran fajar kami serta metode bayar digital yang Anda kehendaki (VA Bank, GoPay, QRIS, dll)." },
        { num: "3", heading: "Selesaikan Pembayaran", body: "Klik 'Bayar Sekarang' dan lakukan transfer sesuai nominal. Pesanan Anda otomatis terjadwal untuk panen fajar." }
      ]
    },
    {
      id: 'how-to-use-voucher',
      title: 'Gunakan Voucher',
      steps: [
        { num: "1", heading: "Temukan Kode Promo", body: "Periksa banner halaman beranda atau perhatikan info promo eksklusif bulanan yang dibagikan lewat newsletter TaniCo." },
        { num: "2", heading: "Masukkan di Kolom Voucher", body: "Sebelum menyelesaikan checkout, ketik atau tempelkan kode voucher Anda (contoh: TANICOPERDANA) pada kolom voucher yang tersedia." },
        { num: "3", heading: "Verifikasi Potongan Harga", body: "Sistem otomatis memangkas subtotal belanjaan Anda secara real-time. Pastikan diskon sudah teraplikasi sebelum membayar." }
      ]
    },
    {
      id: 'how-to-track-order',
      title: 'Lihat Pesanan',
      steps: [
        { num: "1", heading: "Kunjungi Halaman Akun", body: "Klik avatar profil Anda di bagian Header atau navigasikan langsung ke alamat halaman /akun." },
        { num: "2", heading: "Pilih Menu Transaksi", body: "Masuk ke sub-menu 'Transaksi Saya' untuk meninjau seluruh riwayat pendaftaran belanja sayuran Anda." },
        { num: "3", heading: "Cek Status Terkini", body: "Pantau label status orderan Anda: Menunggu Pembayaran, Diproses (Sedang Dipanen Fajar), Dikirim (Diperjalanan Kurir), atau Selesai." }
      ]
    }
  ];

  const activeTopicObj = topics.find(t => t.id === selectedTopic);

  return (
    <div className="bg-[#FCFCFC] text-[#111111] font-jost pb-24 text-left">
      {/* Page Header Banner */}
      <section className="relative bg-[#1B4D3E] text-white py-16 px-6 md:px-8 text-center overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A3E635]">
            Panduan Pembelajaran
          </span>
          <h1 className="text-[32px] md:text-[38px] font-bold font-sans tracking-tight">
            Basis Pengetahuan TaniCo
          </h1>
          <p className="text-[#E3EBF0]/80 text-[13px] md:text-[15px] font-light max-w-xl mx-auto">
            Pelajari cara memanfaatkan fitur situs TaniCo untuk pengalaman berbelanja sayur segar organik fajar yang praktis, cepat, dan menguntungkan.
          </p>
        </div>
      </section>

      {/* Main Two-Column Premium Layout */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          
          {/* COLUMN LEFT: STICKY FLAT ILLUSTRATION */}
          <div className="lg:sticky lg:top-24 self-center flex items-center justify-center py-8">
            <div className="w-full max-w-[500px] flex items-center justify-center" id="tutorial-image-container">
              <Image
                src={tutorialImages[selectedTopic] || '/images/knowledge-base/how-to-order.webp'}
                alt="Tutorial TaniCo"
                width={800}
                height={500}
                className="w-full h-auto rounded-3xl object-cover border border-[#DDE9DF]"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* COLUMN RIGHT: TITLE, HORIZONTAL TABS, VERTICAL STEPS AND FOOTER CALLOUT */}
          <div className="space-y-6 relative z-10">
            
            {/* Header Title inside Section */}
            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-[0.24em] font-semibold text-[#4D8B55] inline-block">
                Kategori Panduan Utama
              </p>
              <h2 className="text-[21px] lg:text-[37px] font-extrabold font-sans text-[#1B4D3E] tracking-tight leading-tight">
                Langkah Mudah Menikmati Hasil Kebun Terbaik
              </h2>
              <p className="text-gray-500 text-[13px] leading-relaxed">
                Kami menyederhanakan seluruh alur pembelian agar Anda tetap dapat memantau kesegaran dan transparansi asal sayur mayur lokal pilihan Anda secara real-time.
              </p>
            </div>

            {/* Horizontal Tabs - Pill Buttons Layout */}
            <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-2">
              {topics.map((item) => {
                const isActive = selectedTopic === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedTopic(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedTopic(item.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={`px-3 py-1.5 rounded-full border text-[11px] font-medium cursor-pointer select-none ${
                      isActive
                        ? 'bg-[#1B4D3E] text-white border-[#1B4D3E]'
                        : 'bg-white text-gray-500 border-[#DDE9DF]'
                    }`}
                  >
                    <span>{item.title}</span>
                  </div>
                );
              })}
            </div>

            {/* Static Vertical Steps List - No motion/AnimatePresence */}
            <div className="min-h-[280px]">
              <div className="space-y-5">
                {activeTopicObj.steps.map((st, idx) => (
                  <div key={idx} className="flex gap-6 items-start">
                    {/* Step Number Circle */}
                    <div className="w-10 h-10 rounded-full bg-[#1B4D3E] text-white flex items-center justify-center font-bold shrink-0 text-[13px]">
                      {st.num}
                    </div>
                    
                    {/* Step Content Description */}
                    <div className="space-y-1.5 pt-1.5">
                      <h4 className="font-bold text-[#1B4D3E] text-[15px] leading-snug">{st.heading}</h4>
                      <p className="text-gray-500 text-[12px] md:text-[13px] leading-relaxed">{st.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </section>
    </div>
  );
}

export default function KnowledgeBasePage() {
  return (
    <PageLayoutWrapper>
      <KnowledgeBaseContent />
    </PageLayoutWrapper>
  );
}
