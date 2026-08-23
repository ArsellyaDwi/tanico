"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useLayout } from '@/context/LayoutContext';
import { motion } from 'motion/react';
import { ArrowLeft, User, Phone, MapPin, Printer, ClipboardCheck, AlertCircle, Calendar } from 'lucide-react';
import PageLayoutWrapper from '@/components/layout/PageLayoutWrapper';
import { formatRupiah, formatDate } from '@/utils/formatters';

function DetailTransaksiContent({ params }) {
  const unwrappedParams = (params && typeof params.then === 'function') ? use(params) : params;
  const router = useRouter();
  const { currentUser, addToast } = useLayout();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    const orderId = unwrappedParams.id;
    fetch('/api/orders')
      .then((res) => res.ok ? res.json() : [])
      .then((orders) => {
        const foundOrder = (orders || []).find(o => o.id === orderId);
        if (foundOrder) {
          setOrder(foundOrder);
        } else {
          addToast('Transaksi tidak ditemukan.', 'error');
        }
      })
      .catch(() => addToast('Gagal memuat transaksi.', 'error'));
  }, [currentUser, unwrappedParams, router]);

  if (!order) {
    return (
      <div className="bg-[#FCFCFC] text-[#111111] font-jost pb-24 text-left animate-pulse">
        <div className="max-w-4xl mx-auto px-6 pt-8 space-y-6">
          <div className="h-4 w-36 bg-gray-200 rounded-md" />
          <div className="bg-white border border-[#DDE9DF] rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-gray-100 pb-6">
              <div className="space-y-2">
                <div className="h-6 w-48 bg-gray-200 rounded-md" />
                <div className="h-3.5 w-32 bg-gray-100 rounded-md" />
              </div>
              <div className="h-8 w-28 bg-gray-200 rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="h-4 w-32 bg-gray-200 rounded-md" />
                <div className="h-3.5 w-48 bg-gray-100 rounded-md" />
                <div className="h-3.5 w-40 bg-gray-100 rounded-md" />
              </div>
              <div className="space-y-3">
                <div className="h-4 w-32 bg-gray-200 rounded-md" />
                <div className="h-3.5 w-56 bg-gray-100 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-[#FCFCFC] text-[#111111] font-jost pb-24 text-left">
      {/* Print Overlay - visible only when printing */}
      <div className="hidden print:block fixed inset-0 bg-white z-[99999] p-12 text-black">
        <div className="border border-black p-8 max-w-2xl mx-auto space-y-6">
          <div className="flex justify-between items-center border-b border-black pb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">TANICO INVOICE</h1>
              <p className="text-xs text-gray-500">UMKM Sayur Segar Organik Kab. Bangka</p>
            </div>
            <div className="text-right text-xs">
              <p className="font-bold">{order.id}</p>
              <p>{new Date(order.createdAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-bold text-gray-400">PENERIMA:</p>
              <p className="font-bold">{order.customerName}</p>
              <p>{order.phone}</p>
              <p>{order.address}, {order.subdistrict || ''}</p>
            </div>
            <div>
              <p className="font-bold text-gray-400">INFO METODE BAYAR:</p>
              <p className="font-bold uppercase">{order.paymentMethod}</p>
              <p className="font-bold uppercase text-green-700">STATUS: {order.status}</p>
            </div>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-black">
                <th className="py-2">NAMA PRODUK</th>
                <th className="py-2 text-center">QTY</th>
                <th className="py-2 text-right">HARGA UNIT</th>
                <th className="py-2 text-right">SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-2">{item.name} <span className="text-[10px] text-gray-400">({item.unit})</span></td>
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-right">{formatRupiah(item.price)}</td>
                  <td className="py-2 text-right">{formatRupiah(item.price * item.quantity)}</td>
                </tr>
              ))}
              <tr className="font-bold text-sm">
                <td colSpan={3} className="py-4 text-right">TOTAL AKHIR:</td>
                <td className="py-4 text-right">{formatRupiah(order.totalAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Screen Layout */}
      <div className="max-w-4xl mx-auto px-6 pt-8 print:hidden">
        {/* Back Link */}
        <button 
          onClick={() => router.push('/akun/transaksi')}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#1B4D3E] hover:underline mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>KEMBALI KE RIWAYAT TRANSAKSI</span>
        </button>

        <div className="bg-white border border-[#DDE9DF] rounded-3xl p-8 md:p-10 shadow-xs space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6 border-b border-[#DDE9DF] pb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <ClipboardCheck className="w-6 h-6 text-[#1B4D3E]" />
                <h1 className="text-xl md:text-2xl font-bold font-sans text-[#1B4D3E]">Detail Invoice</h1>
              </div>
              <p className="text-xs text-gray-400 mt-1">ID Transaksi: <span className="font-bold text-gray-600">{order.id}</span></p>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 h-10 px-5 bg-[#FCFCFC] border border-[#DDE9DF] hover:border-[#1B4D3E] text-[#1B4D3E] text-xs font-bold rounded-full cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Invoice</span>
            </button>
          </div>

          {/* Status Tracker */}
          <div className="p-6 bg-green-50/50 border border-green-100 rounded-2xl flex gap-4 items-start">
            <AlertCircle className="w-5 h-5 text-green-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-green-700">Status Pesanan: {order.status}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">Pesanan Anda telah tercatat pada sistem kami. Sayur organik segar dijadwalkan dipetik pada fajar hari dan segera didistribusikan langsung ke meja makan Anda.</p>
            </div>
          </div>

          {/* Shipping Coordinates & Payment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-y border-[#DDE9DF] py-8">
            <div className="space-y-4">
              <h3 className="font-bold font-sans text-[#1B4D3E] text-sm uppercase tracking-wider">Detail Pengiriman</h3>
              <div className="space-y-2.5 text-xs text-gray-600">
                <div className="flex gap-2.5">
                  <User className="w-4 h-4 text-gray-400 shrink-0" />
                  <p className="font-semibold text-gray-800">{order.customerName}</p>
                </div>
                <div className="flex gap-2.5">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <p>{order.phone}</p>
                </div>
                <div className="flex gap-2.5">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <p>{order.address}, {order.subdistrict || ''}, Kabupaten Bangka</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold font-sans text-[#1B4D3E] text-sm uppercase tracking-wider">Informasi Transaksi</h3>
              <div className="space-y-2.5 text-xs text-gray-600">
                <div className="flex gap-2.5">
                  <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                  <p>{new Date(order.createdAt).toLocaleDateString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Metode Pembayaran</p>
                  <p className="font-bold text-[#1B4D3E] uppercase mt-0.5">{order.paymentMethod}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Table Items */}
          <div className="space-y-4">
            <h3 className="font-bold font-sans text-[#1B4D3E] text-sm uppercase tracking-wider">Rincian Belanja</h3>
            <div className="border border-[#DDE9DF] rounded-2xl overflow-hidden">
              <div className="divide-y divide-[#DDE9DF]">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="p-4 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-[#1B4D3E]">{item.name}</p>
                      <p className="text-gray-400 mt-0.5">Jumlah: {item.quantity} x {formatRupiah(item.price)} / {item.unit}</p>
                    </div>
                    <p className="font-bold text-gray-700">{formatRupiah(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="bg-[#FCFCFC] p-5 border-t border-[#DDE9DF] flex justify-between items-center">
                <p className="font-bold text-xs text-[#1B4D3E]">TOTAL KESELURUHAN</p>
                <p className="font-extrabold text-base text-[#1B4D3E]">{formatRupiah(order.totalAmount)}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function DetailTransaksiPage({ params }) {
  return (
    <PageLayoutWrapper>
      <DetailTransaksiContent params={params} />
    </PageLayoutWrapper>
  );
}