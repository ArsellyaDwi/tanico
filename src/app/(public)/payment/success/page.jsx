"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import PageLayoutWrapper from '@/components/layout/PageLayoutWrapper';
import { formatRupiah } from '@/utils/formatters';

function SuccessContent() {
  const router = useRouter();
  const [orderId, setOrderId] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const cachedId = localStorage.getItem('tanico_active_checkout_id') || '';
    const cachedTotal = localStorage.getItem('tanico_active_checkout_total') || '0';
    setOrderId(cachedId);
    setTotal(Number(cachedTotal));
  }, []);

  return (
    <div className="bg-[#FCFCFC] text-[#111111] font-jost pb-24 text-left">
      <div className="max-w-md mx-auto px-6 py-16 text-center space-y-8">
        
        {/* Animated Check badge */}
        <div className="relative flex items-center justify-center mx-auto text-green-700">
          <Check className="w-10 h-10" />
          <Sparkles className="w-5 h-5 text-green-500 absolute -top-1 -right-1" />
        </div>

        {/* Greetings */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-sans text-[#1B4D3E]">Pembayaran Berhasil!</h1>
          <p className="text-gray-500 text-sm">Terima kasih atas pesanan Anda. Kami telah mendaftarkan sayur pilihan Anda untuk dijadwalkan panen fajar besok.</p>
        </div>

        {/* Invoice details */}
        <div className="bg-white border border-[#DDE9DF] rounded-2xl p-6 text-left space-y-3 shadow-xs">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400">ID Transaksi</span>
            <span className="font-bold text-gray-700">{orderId}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400">Status Pembayaran</span>
            <span className="text-green-700 font-bold uppercase tracking-wider text-[9px]">Lunas (Paid)</span>
          </div>
          <div className="border-t border-[#DDE9DF] pt-3 flex justify-between items-center text-sm">
            <span className="font-bold text-[#1B4D3E]">TOTAL BAYAR</span>
            <span className="font-extrabold text-[#1B4D3E]">{formatRupiah(total)}</span>
          </div>
        </div>

        {/* Call to Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push('/akun/transaksi')}
            className="w-full h-11.5 flex items-center justify-center gap-2 bg-[#1B4D3E] hover:bg-[#143D31] text-white font-bold text-xs rounded-full shadow-xs cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Lihat Riwayat Transaksi</span>
          </button>

          <button
            onClick={() => router.push('/produk')}
            className="w-full h-11.5 flex items-center justify-center gap-2 bg-white border border-[#DDE9DF] text-gray-600 hover:text-[#1B4D3E] hover:border-[#1B4D3E]/40 font-bold text-xs rounded-full cursor-pointer transition-colors"
          >
            <span>Lanjutkan Belanja</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <PageLayoutWrapper>
      <SuccessContent />
    </PageLayoutWrapper>
  );
}