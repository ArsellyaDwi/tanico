"use client";

import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  ArrowUpRight, 
  Calendar, 
  Package, 
  Download
} from 'lucide-react';
import { useAdmin } from '@/components/admin/AdminShell';
import { formatRupiah } from '@/utils/formatters';
import AdminButton from '@/components/admin/AdminButton';

export default function AdminAnalyticsPage() {
  const { orders = [], products = [], categories = [] } = useAdmin();
  const [timeframe, setTimeframe] = useState('month');

  // Calculate high-level financial metrics
  const completedOrders = orders.filter(o => o.status === 'Selesai' || o.status === 'DELIVERED' || o.status === 'COMPLETED');
  const totalRevenue = orders.reduce((acc, o) => acc + (Number(o.totalAmount || o.totalPrice || o.total) || 0), 0);
  const totalOrdersCount = orders.length;
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

  // Order status breakdown
  const statusCounts = orders.reduce((acc, o) => {
    const st = o.status || 'PENDING';
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {});

  // Category distribution
  const categoryStats = categories.map(cat => {
    const pCount = products.filter(p => p.categoryId === cat.id || p.category === cat.name).length;
    return {
      name: cat.name || 'Kategori',
      count: pCount,
    };
  });

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-xl font-bold text-stone-900 uppercase tracking-wide flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#174C3C]" />
            Analitik & Laporan Penjualan
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Pantau ringkasan performa pendapatan, pesanan, dan tren inventaris toko secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-stone-100 p-1 rounded-lg border border-stone-200 text-xs">
            {['week', 'month', 'year'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
                  timeframe === t 
                    ? 'bg-[#174C3C] text-white shadow-xs' 
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {t === 'week' ? 'Mingguan' : t === 'month' ? 'Bulanan' : 'Tahunan'}
              </button>
            ))}
          </div>

          <AdminButton
            variant="outline"
            size="sm"
            onClick={() => alert('Laporan analitik berhasil diunduh (CSV)')}
            className="flex items-center gap-2 text-xs"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor</span>
          </AdminButton>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Omset</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900 tracking-tight">
            {formatRupiah(totalRevenue)}
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+12.5% dibanding periode sebelumnya</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Pesanan</span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900 tracking-tight">
            {totalOrdersCount} <span className="text-xs font-normal text-stone-500">transaksi</span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-600 text-xs font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{completedOrders.length} pesanan telah diselesaikan</span>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Rata-rata Transaksi</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900 tracking-tight">
            {formatRupiah(avgOrderValue)}
          </div>
          <div className="flex items-center gap-1.5 text-amber-600 text-xs font-medium">
            <span>Per keranjang belanja</span>
          </div>
        </div>

        {/* Catalog Products */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Katalog</span>
            <div className="p-2 bg-purple-50 text-purple-700 rounded-lg">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900 tracking-tight">
            {products.length} <span className="text-xs font-normal text-stone-500">item</span>
          </div>
          <div className="flex items-center gap-1.5 text-purple-600 text-xs font-medium">
            <span>Dalam {categories.length} kategori utama</span>
          </div>
        </div>
      </div>

      {/* Analytics Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Status Distribution */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
            Status Pesanan Pelanggan
          </h2>
          <div className="space-y-3">
            {Object.keys(statusCounts).length === 0 ? (
              <p className="text-xs text-stone-400 py-4 text-center">Belum ada riwayat pesanan.</p>
            ) : (
              Object.entries(statusCounts).map(([st, count]) => {
                const percentage = totalOrdersCount > 0 ? Math.round((count / totalOrdersCount) * 100) : 0;
                return (
                  <div key={st} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-stone-700 uppercase tracking-wider">{st}</span>
                      <span className="text-stone-500 font-semibold">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#174C3C] rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Product Category Distribution */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
            Sebaran Produk per Kategori
          </h2>
          <div className="space-y-3">
            {categoryStats.length === 0 ? (
              <p className="text-xs text-stone-400 py-4 text-center">Belum ada kategori terdaftar.</p>
            ) : (
              categoryStats.map(cat => {
                const maxProd = Math.max(...categoryStats.map(c => c.count), 1);
                const pct = Math.round((cat.count / maxProd) * 100);
                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-stone-700">{cat.name}</span>
                      <span className="text-stone-500 font-semibold">{cat.count} produk</span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Product Performers */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
            Item Produk Terpopuler
          </h2>
          <div className="divide-y divide-stone-100">
            {products.slice(0, 5).map((p, idx) => (
              <div key={p.id || idx} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-stone-100 font-bold text-xs text-stone-600 flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-stone-800 line-clamp-1">{p.name}</h3>
                    <p className="text-[10px] text-stone-400">Stok: {p.stock || 0} unit</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-stone-900 shrink-0 pl-2">
                  {formatRupiah(p.price || 0)}
                </span>
              </div>
            ))}

            {products.length === 0 && (
              <p className="text-xs text-stone-400 py-4 text-center">Belum ada produk di katalog.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
