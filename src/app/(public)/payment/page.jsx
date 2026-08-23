"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLayout } from '@/context/LayoutContext';
import { useCart } from '@/context/CartContext';
import { CreditCard, ShieldCheck, ArrowRight, Wallet, Landmark } from 'lucide-react';
import PageLayoutWrapper from '@/components/layout/PageLayoutWrapper';
import { formatRupiah } from '@/utils/formatters';

function PaymentContent() {
  const router = useRouter();
  const { addToast } = useLayout();
  const { clearCart } = useCart();
  const [orderId, setOrderId] = useState('');
  const [total, setTotal] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('bank');

  useEffect(() => {
    const cachedId = localStorage.getItem('tanico_active_checkout_id');
    const cachedTotal = localStorage.getItem('tanico_active_checkout_total');

    if (cachedId && cachedTotal) {
      setOrderId(cachedId);
      setTotal(Number(cachedTotal));
    } else {
      setOrderId(cachedId || '');
      setTotal(Number(cachedTotal) || 0);
    }
  }, []);

  const handleSimulatePayment = async (success) => {
    setIsProcessing(true);
    const newStatus = success ? 'Diproses' : 'Dibatalkan';

    try {
      if (orderId) {
        await fetch('/api/orders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: orderId, status: newStatus })
        });
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
    }

    setIsProcessing(false);
    if (success) {
      // Clear cart after successful payment
      if (clearCart) clearCart();

      if (addToast) addToast('Simulasi Pembayaran Sukses! Selamat menikmati sayuran Anda.', 'success');
      router.push('/payment/success');
    } else {
      if (addToast) addToast('Simulasi Pembayaran Gagal atau Dibatalkan.', 'error');
      router.push('/payment/failed');
    }
  };

  const paymentMethods = [
    {
      id: 'bank',
      title: 'Transfer Bank',
      description: 'Virtual Account Mandiri, BCA, BRI',
      icon: <Landmark className="w-5 h-5 text-[#1B4D3E]" />
    },
    {
      id: 'wallet',
      title: 'E-Wallet',
      description: 'GoPay, OVO, ShopeePay, Dana',
      icon: <Wallet className="w-5 h-5 text-[#1B4D3E]" />
    },
    {
      id: 'qris',
      title: 'QRIS',
      description: 'Gunakan kamera untuk scan barcode',
      icon: <CreditCard className="w-5 h-5 text-[#1B4D3E]" />
    }
  ];

  return (
    <div className="bg-[#FCFCFC] text-[#111111] font-jost pb-24 text-left min-h-screen">
      <div className="max-w-lg mx-auto px-6 py-16">
        <div className="bg-white border border-[#DDE9DF] rounded-[32px] overflow-hidden shadow-sm p-8 sm:p-10 space-y-8">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="text-[#1B4D3E]">
              <ShieldCheck className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h1 className="text-[28px] font-semibold tracking-tight text-black font-sans leading-none">
              TaniCo Pay
            </h1>
            <p className="text-[14px] text-gray-500 font-medium">
              Pembayaran aman dan terenkripsi.
            </p>
          </div>

          {/* Card total pembayaran */}
          <div className="bg-[#FCFCFC] p-6 rounded-2xl border border-[#DDE9DF] space-y-2 text-center">
            <p className="text-[12px] text-gray-400 uppercase tracking-widest font-semibold">Total Pembayaran</p>
            <p className="text-[36px] font-bold text-[#1B4D3E] tracking-tight">
              {formatRupiah(total)}
            </p>
            <div className="text-[12px] text-gray-500 font-medium inline-block">
              ID Transaksi: <span className="font-bold text-gray-800">{orderId}</span>
            </div>
          </div>

          {/* Metode Pembayaran Section */}
          <div className="space-y-3.5">
            <h3 className="text-[13px] text-gray-400 font-semibold uppercase tracking-widest">Pilih Metode Pembayaran</h3>
            
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((method) => {
                const isSelected = selectedMethod === method.id;
                return (
                  <div
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`h-16 rounded-xl p-3 border transition-all duration-300 cursor-pointer flex flex-col justify-between items-start ${
                      isSelected 
                        ? 'border-[#1B4D3E] bg-[#1B4D3E]/5 shadow-sm' 
                        : 'border-[#DDE9DF] hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="shrink-0 text-[#1B4D3E]">
                        {method.icon}
                      </div>
                      <div className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center shrink-0">
                        {isSelected && <div className="w-2 h-2 rounded-full bg-[#1B4D3E]" />}
                      </div>
                    </div>
                    <p className="text-[11px] sm:text-[12px] font-semibold text-gray-900 leading-none truncate w-full mt-1">
                      {method.title}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-[10px] pt-2">
            <button
              onClick={() => handleSimulatePayment(true)}
              disabled={isProcessing}
              className="w-full h-[44px] px-[18px] bg-[#1B4D3E] hover:bg-[#153C30] text-white font-semibold text-[13px] rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Bayar Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              onClick={() => handleSimulatePayment(false)}
              disabled={isProcessing}
              className="w-full h-[44px] bg-white border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium text-[13px] rounded-full cursor-pointer transition-all flex items-center justify-center"
            >
              Batalkan Pembayaran
            </button>
          </div>

          {/* Secure Indicators */}
          <div className="space-y-4 pt-2 border-t border-[#DDE9DF]/40 text-center select-none">
            <div className="flex items-center justify-center gap-2 text-[12px] font-medium text-[#1B4D3E] max-w-[280px] mx-auto">
              <ShieldCheck className="w-4 h-4 text-[#1B4D3E] shrink-0" />
              <span>Dilindungi enkripsi 256-bit</span>
            </div>
            
            <p className="text-[10px] text-gray-400 leading-relaxed max-w-[340px] mx-auto font-light">
              Pembayaran ini hanya simulasi untuk pengujian sistem checkout TaniCo.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <PageLayoutWrapper>
      <PaymentContent />
    </PageLayoutWrapper>
  );
}