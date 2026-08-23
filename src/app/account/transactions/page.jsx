"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLayout } from '@/context/LayoutContext';
import { useWishlist } from '@/context/WishlistContext';
import { User, Phone, ShoppingBag, Trash2, ArrowRight, Printer, AlertCircle, ShieldCheck, Heart, Package } from 'lucide-react';
import PageLayoutWrapper from '@/components/layout/PageLayoutWrapper';
import { formatRupiah } from '@/utils/formatters';

function TransaksiContent() {
  const router = useRouter();
  const { currentUser, logout, addToast } = useLayout();
  const wishlistContext = useWishlist();
  const wishlistCount = wishlistContext?.wishlistCount ?? wishlistContext?.wishlist?.length ?? 0;
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('Semua');

  const statusTabs = ['Semua', 'Menunggu Pembayaran', 'Diproses', 'Dikirim', 'Selesai', 'Dibatalkan'];

  useEffect(() => {
    if (!currentUser) {
      const timer = setTimeout(() => {
        if (!currentUser) router.push('/login');
      }, 800);
      return () => clearTimeout(timer);
    }

    // Filter orders by customer name or phone
    fetch('/api/orders')
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        const userOrders = (data || []).filter(o => 
          o.customerName?.toLowerCase() === currentUser.name?.toLowerCase() || 
          o.phone === currentUser.phone
        );
        userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(userOrders);
      })
      .catch(() => setOrders([]));
  }, [currentUser, router]);

  if (!currentUser) {
    return (
      <div className="bg-[#FCFCFC] text-[#111111] font-jost pb-24 text-left animate-pulse">
        <div className="max-w-7xl mx-auto px-6 md:px-8 pt-8 space-y-6">
          {/* Page Title Skeleton */}
          <div className="space-y-2">
            <div className="h-7 w-48 bg-gray-200 rounded-lg" />
            <div className="h-4 w-72 bg-gray-100 rounded-md" />
          </div>

          {/* Status Tabs Skeleton */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-9 w-28 bg-gray-200 rounded-full shrink-0" />
            ))}
          </div>

          {/* Transaction Cards Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-[#DDE9DF] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="h-4 w-32 bg-gray-200 rounded-md" />
                  <div className="h-5 w-24 bg-gray-200 rounded-full" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-5 w-48 bg-gray-200 rounded-md" />
                    <div className="h-3.5 w-36 bg-gray-100 rounded-md" />
                  </div>
                  <div className="h-8 w-24 bg-gray-200 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Selesai':
        return <span className="font-jost text-[9px] uppercase tracking-wider text-green-700 font-bold">Selesai</span>;
      case 'Dibatalkan':
        return <span className="font-jost text-[9px] uppercase tracking-wider text-red-700 font-bold">Dibatalkan</span>;
      case 'Dikirim':
        return <span className="font-jost text-[9px] uppercase tracking-wider text-blue-700 font-bold">Dikirim</span>;
      case 'Diproses':
      case 'Dikemas':
        return <span className="font-jost text-[9px] uppercase tracking-wider text-amber-700 font-bold">Diproses</span>;
      default:
        return <span className="font-jost text-[9px] uppercase tracking-wider text-gray-700 font-bold">Menunggu Pembayaran</span>;
    }
  };

  const filteredOrders = activeTab === 'Semua'
    ? orders
    : orders.filter(o => {
        if (activeTab === 'Diproses') return o.status === 'Diproses' || o.status === 'Dikemas';
        return o.status === activeTab;
      });

  return (
    <div className="bg-[#FCFCFC] text-[#111111] font-jost pb-24 text-left">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Navigation Menu */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-[#DDE9DF] rounded-3xl p-6 text-center space-y-4 shadow-xs hover:shadow-md transition-shadow duration-200">
              {/* Avatar */}
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-[#1B4D3E]/10 border-4 border-white shadow-md mx-auto flex items-center justify-center text-3xl text-[#1B4D3E] font-extrabold">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : <User className="w-10 h-10 text-[#1B4D3E]" />}
              </div>

              {/* User Info */}
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-[#1B4D3E] leading-snug">{currentUser.name}</h3>
                <p className="text-xs text-gray-500">{currentUser.email}</p>
                <div className="pt-1.5 flex justify-center">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1B4D3E]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#1B4D3E]" />
                    <span>Pelanggan Sehat</span>
                  </span>
                </div>
              </div>

              {/* Thin Divider */}
              <div className="border-t border-[#DDE9DF] pt-1" />

              {/* Profile Statistics */}
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="bg-[#FCFCFC] border border-[#DDE9DF] rounded-2xl p-3 flex flex-col justify-between hover:bg-emerald-50/50 hover:border-[#1B4D3E]/20 hover:shadow-xs transition-colors transition-shadow duration-200">
                  <div className="flex items-center justify-between text-gray-500 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Wishlist</span>
                    <Heart className="w-4 h-4 text-[#1B4D3E]" />
                  </div>
                  <p className="text-lg font-bold text-[#1B4D3E]">{wishlistCount}</p>
                </div>

                <div className="bg-[#FCFCFC] border border-[#DDE9DF] rounded-2xl p-3 flex flex-col justify-between hover:bg-emerald-50/50 hover:border-[#1B4D3E]/20 hover:shadow-xs transition-colors transition-shadow duration-200">
                  <div className="flex items-center justify-between text-gray-500 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Transaksi</span>
                    <Package className="w-4 h-4 text-[#1B4D3E]" />
                  </div>
                  <p className="text-lg font-bold text-[#1B4D3E]">{orders.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#DDE9DF] rounded-2xl p-2.5 space-y-1">
              <div
                role="button"
                tabIndex={0}
                onClick={() => router.push('/akun')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push('/akun');
                  }
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold text-gray-600 hover:bg-[#1B4D3E]/5 hover:text-[#1B4D3E] text-left cursor-pointer transition-colors duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E]"
              >
                <User className="w-4.5 h-4.5 shrink-0" />
                <span>PROFIL SAYA</span>
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => router.push('/akun/transaksi')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push('/akun/transaksi');
                  }
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold bg-[#1B4D3E] text-white text-left cursor-pointer transition-colors duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E]"
              >
                <ShoppingBag className="w-4.5 h-4.5 shrink-0" />
                <span>TRANSAKSI SAYA</span>
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={logout}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    logout();
                  }
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 text-left cursor-pointer transition-colors duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <Trash2 className="w-4.5 h-4.5 shrink-0" />
                <span>KELUAR AKUN</span>
              </div>
            </div>
          </div>

          {/* Right Orders List Panel */}
          <div className="lg:col-span-8 bg-white border border-[#DDE9DF] rounded-3xl p-8 md:p-10 shadow-xs space-y-8">
            <div className="border-b border-[#DDE9DF] pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold font-sans text-[#1B4D3E]">Transaksi Saya</h2>
                <p className="text-gray-500 text-xs mt-1 font-light">Tinjau, lacak, dan unduh invoice belanja sayur segar pilihan Anda.</p>
              </div>
              <ShoppingBag className="w-8 h-8 text-[#1B4D3E]/10" />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-50 scrollbar-none">
              {statusTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    activeTab === tab
                      ? 'bg-[#1B4D3E] text-white'
                      : 'bg-[#ECF6ED] text-gray-500 border border-[#DDE9DF] hover:border-[#1B4D3E]/40'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Orders Feed */}
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <AlertCircle className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="text-gray-500 text-xs">Belum ada transaksi dengan status "{activeTab}".</p>
                <button
                  onClick={() => router.push('/produk')}
                  className="px-5 py-2 bg-[#1B4D3E] hover:bg-[#143D31] text-white text-[11px] font-bold rounded-full cursor-pointer"
                >
                  Belanja Sayur Sekarang
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredOrders.map((ord) => (
                  <div key={ord.id} className="p-6 border border-[#DDE9DF] rounded-2xl space-y-4 hover:border-[#1B4D3E]/30 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-gray-50 pb-4">
                      <div>
                        <p className="text-xs font-bold text-[#1B4D3E]">{ord.id}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{new Date(ord.createdAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(ord.status)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {ord.items?.map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-xs">
                          <div className="text-gray-600 font-medium">
                            {item.name} <span className="text-gray-400">({item.unit})</span> <span className="font-bold text-[#1B4D3E]">x{item.quantity}</span>
                          </div>
                          <p className="font-semibold text-gray-700">{formatRupiah(item.price * item.quantity)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-50 pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="text-left w-full sm:w-auto">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Tagihan</p>
                        <p className="text-base font-bold text-[#1B4D3E]">{formatRupiah(ord.totalAmount)}</p>
                      </div>

                      <button
                        onClick={() => router.push(`/akun/transaksi/${ord.id}`)}
                        className="w-full sm:w-auto px-5 h-9.5 flex items-center justify-center gap-2 bg-[#ECF6ED] border border-[#DDE9DF] text-[#1B4D3E] hover:border-[#1B4D3E] font-bold text-xs rounded-full cursor-pointer transition-colors"
                      >
                        <span>Lihat Detail</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function TransaksiPage() {
  return (
    <PageLayoutWrapper>
      <TransaksiContent />
    </PageLayoutWrapper>
  );
}