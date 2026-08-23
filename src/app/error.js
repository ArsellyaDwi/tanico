'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { logger } from '@/utils/logger';

export default function Error({ error, reset }) {
  const errorMessage = typeof error?.message === 'string' ? error.message : String(error || '');
  const isChunkError = (
    errorMessage.includes('Loading chunk') || 
    errorMessage.includes('ChunkLoadError') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('404') ||
    errorMessage.includes('dynamically imported module')
  );

  useEffect(() => {
    logger.error('Runtime Application Error:', error);
  }, [error]);

  const handleRetry = () => {
    reset();
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#FCFCFC] text-[#174C3C] px-6 py-20 text-center font-sans">
      <div className="flex items-center justify-center text-red-600 mb-6">
        <AlertCircle size={32} />
      </div>
      <h1 className="text-3xl font-bold font-sans mb-3 text-emerald-950">
        {isChunkError ? 'Pembaruan Aplikasi Tersedia' : 'Terjadi Kesalahan Sistem'}
      </h1>
      <p className="text-gray-600 max-w-md mb-8 leading-relaxed text-sm sm:text-base">
        {isChunkError 
          ? 'Versi aplikasi baru telah diperbarui atau koneksi terputus sejenak. Silakan muat ulang halaman untuk melanjutkan.'
          : 'Sistem mengalami gangguan sementara saat memproses permintaan Anda. Silakan coba muat ulang halaman atau kembali ke beranda.'}
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <button
          onClick={handleRetry}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#174C3C] text-white font-medium rounded-full hover:bg-[#123b2e] transition-all duration-200 shadow-sm text-sm cursor-pointer"
        >
          <RefreshCw size={16} />
          {isChunkError ? 'Muat Ulang Halaman' : 'Coba Lagi'}
        </button>
        <Link 
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#174C3C] border border-emerald-200 font-medium rounded-full hover:bg-emerald-50 transition-all duration-200 shadow-sm text-sm"
        >
          <Home size={16} />
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}

