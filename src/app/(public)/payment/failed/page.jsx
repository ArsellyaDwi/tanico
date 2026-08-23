"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, RefreshCw, ArrowLeft } from 'lucide-react';
import PageLayoutWrapper from '@/components/layout/PageLayoutWrapper';

function FailedContent() {
  const router = useRouter();
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    const cachedId = localStorage.getItem('tanico_active_checkout_id') || '';
    setOrderId(cachedId);
  }, []);

  return (
    <div className="bg-[#FCFCFC] text-[#111111] font-jost pb-24 text-left">
      <div className="max-w-md mx-auto px-6 py-16 text-center space-y-8">
        
        {/* Animated Warning badge */}
        <div className="flex items-center justify-center mx-auto text-red-600">
          <X className="w-10 h-10" />
        </div>

        {/* Greetings */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-sans text-red-600">Pembayaran Gagal</h1>
          <p className="text-gray-500 text-sm">Transaksi Anda ditolak oleh bank atau sistem pembayaran mengalami kendala teknis.</p>
        </div>

        {/* Invoice details */}
        <div className="bg-white border border-[#DDE9DF] rounded-2xl p-6 text-left space-y-3 shadow-xs">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400">ID Transaksi</span>
            <span className="font-bold text-gray-700">{orderId}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400">Status Pembayaran</span>
            <span className="text-red-700 font-bold uppercase tracking-wider text-[9px]">Dibatalkan</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push('/payment')}
            className="w-full h-11.5 flex items-center justify-center gap-2 bg-[#1B4D3E] hover:bg-[#143D31] text-white font-bold text-xs rounded-full shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Coba Pembayaran Lagi</span>
          </button>

          <button
            onClick={() => router.push('/checkout')}
            className="w-full h-11.5 flex items-center justify-center gap-2 bg-white border border-[#DDE9DF] text-gray-600 hover:text-[#1B4D3E] hover:border-[#1B4D3E]/40 font-bold text-xs rounded-full cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Checkout</span>
          </button>
        </div>

      </div>
    </div>
  );
}

export default function FailedPage() {
  return (
    <PageLayoutWrapper>
      <FailedContent />
    </PageLayoutWrapper>
  );
}