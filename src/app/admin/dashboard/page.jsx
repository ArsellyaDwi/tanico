"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  Users, 
  ClipboardList, 
  TrendingUp, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  RefreshCw,
  DollarSign
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { formatRupiah } from '@/utils/formatters';
import { buildStorageUrl } from '@/utils/buildStorageUrl';
import AdminButton from '@/components/admin/AdminButton';
import { useAdmin } from '@/components/admin/AdminShell';

const SalesTrendChart = dynamic(
  () => import('@/app/admin/dashboard/DashboardCharts').then(mod => mod.SalesTrendChart),
  { ssr: false, loading: () => <div className="w-full h-full bg-gray-50/50 rounded-xl flex items-center justify-center text-xs text-gray-400 font-sans">Memuat grafik...</div> }
);

const CategoryPieChart = dynamic(
  () => import('@/app/admin/dashboard/DashboardCharts').then(mod => mod.CategoryPieChart),
  { ssr: false, loading: () => <div className="w-full h-full bg-gray-50/50 rounded-xl flex items-center justify-center text-xs text-gray-400 font-sans">Memuat grafik...</div> }
);

const OrderStatusBarChart = dynamic(
  () => import('@/app/admin/dashboard/DashboardCharts').then(mod => mod.OrderStatusBarChart),
  { ssr: false, loading: () => <div className="w-full h-full bg-gray-50/50 rounded-xl flex items-center justify-center text-xs text-gray-400 font-sans">Memuat grafik...</div> }
);

export default function AdminDashboardPage() {
  const router = useRouter();
  const {
    products,
    categories,
    orders,
    reviews,
    logs: contextLogs,
    handleQuickAction
  } = useAdmin();

  const [dashData, setDashData] = React.useState(null);
  const [loadingDash, setLoadingDash] = React.useState(true);
  const [isClientMounted, setIsClientMounted] = React.useState(false);

  React.useEffect(() => {
    setIsClientMounted(true);
    let isMounted = true;
    async function loadDash() {
      try {
        const u = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('tanico_user') || 'null') : null;
        const headers = u?.sessionToken ? { Authorization: `Bearer ${u.sessionToken}` } : {};
        const res = await fetch('/api/admin/dashboard', { headers });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setDashData(data);
        }
      } catch (err) {
        console.error('Error fetching dashboard endpoint:', err);
      } finally {
        if (isMounted) setLoadingDash(false);
      }
    }
    loadDash();
    return () => { isMounted = false; };
  }, []);

  const categoriesCount = categories.length;
  const customersCount = new Set(orders.map(o => o.customerEmail || o.customerName).filter(Boolean)).size || 0;

  const menuUrlMap = {
    products: '/admin/products',
    categories: '/admin/categories',
    orders: '/admin/orders',
    customers: '/admin/customers',
    analytics: '/admin/analytics',
    reviews: '/admin/reviews',
    stock: '/admin/stock',
    gallery: '/admin/gallery',
    articles: '/admin/articles',
    settings: '/admin/settings',
    testimonials: '/admin/testimonials',
    contacts: '/admin/contacts',
    homepage: '/admin/homepage',
    profile: '/admin/profile',
    wishlist: '/admin/wishlist',
    cart: '/admin/cart',
  };
  const onNavigateToMenu = (menu) => {
    const targetUrl = menuUrlMap[menu] || `/admin/${menu}`;
    router.push(targetUrl);
  };
  const onQuickAction = handleQuickAction;

  // 1. METRICS DERIVED FROM DASHBOARD API (WITH FALLBACK TO CONTEXT)
  const totalProducts = dashData ? dashData.totalProducts : products.length;
  const totalCategories = dashData ? dashData.totalCategories : categoriesCount;
  const totalCustomers = dashData ? dashData.totalCustomers : (customersCount || new Set(orders.map(o => o.customerName || o.customerEmail || o.id)).size);
  const totalOrdersCount = dashData ? dashData.totalOrdersCount : orders.length;
  
  const totalRevenue = dashData ? dashData.totalRevenue : orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const completedRevenue = dashData ? dashData.completedRevenue : orders.filter(o => o.status === 'Selesai').reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const averageOrderValue = dashData ? dashData.averageOrderValue : (totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0);

  const totalProductsSold = dashData ? dashData.totalProductsSold : orders.reduce((sum, o) => {
    const itemsQty = o.items ? o.items.reduce((s, item) => s + (item.quantity || 0), 0) : 0;
    return sum + itemsQty;
  }, 0);

  const lowStockProducts = dashData ? dashData.lowStockProducts : products.filter(p => p.stock < 10);

  const recentReviews = dashData ? dashData.recentReviews : reviews.slice(0, 3);

  const logs = (dashData && dashData.logs && dashData.logs.length > 0) ? dashData.logs : (contextLogs || []);

  // 2. CHART DATA GENERATION FROM DASHBOARD API (WITH FALLBACK)
  const salesTrendData = useMemo(() => {
    if (dashData && dashData.salesTrendData && dashData.salesTrendData.length > 0) {
      return dashData.salesTrendData;
    }
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dayMap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const label = d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
      dayMap[label] = 0;
    }

    orders.forEach(o => {
      const date = new Date(o.createdAt);
      if (date >= sevenDaysAgo) {
        const label = date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
        if (dayMap[label] !== undefined) {
          dayMap[label] += (o.totalAmount || 0);
        }
      }
    });

    return Object.keys(dayMap).map(label => ({
      name: label,
      Pendapatan: dayMap[label]
    }));
  }, [dashData, orders]);

  const categoryChartData = useMemo(() => {
    if (dashData && dashData.categoryChartData && dashData.categoryChartData.length > 0) {
      return dashData.categoryChartData;
    }
    const catRevenue = {};
    orders.forEach(o => {
      o.items?.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const cat = prod?.categoryName || prod?.category || item.categoryName || 'Sayuran';
        catRevenue[cat] = (catRevenue[cat] || 0) + ((item.price || 0) * (item.quantity || 1));
      });
    });

    const categoriesList = Object.keys(catRevenue);
    if (categoriesList.length === 0) {
      return [];
    }

    return categoriesList.map(k => ({
      name: k,
      value: catRevenue[k]
    }));
  }, [dashData, orders, products]);

  const orderStatusData = useMemo(() => {
    if (dashData && dashData.orderStatusData && dashData.orderStatusData.length > 0) {
      return dashData.orderStatusData;
    }
    const statuses = ['Menunggu', 'Diproses', 'Dikirim', 'Selesai', 'Dibatalkan'];
    const counts = {};
    statuses.forEach(s => counts[s] = 0);
    orders.forEach(o => {
      if (counts[o.status] !== undefined) {
        counts[o.status] += 1;
      } else {
        counts[o.status] = 1;
      }
    });

    return Object.keys(counts).map(s => ({
      status: s,
      Jumlah: counts[s]
    }));
  }, [dashData, orders]);

  const bestSellers = useMemo(() => {
    if (dashData && dashData.bestSellers && dashData.bestSellers.length > 0) {
      return dashData.bestSellers;
    }
    const productSales = {};
    orders.forEach(o => {
      o.items?.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          if (!productSales[item.productId]) {
            productSales[item.productId] = { quantity: 0, revenue: 0, p: prod };
          }
          productSales[item.productId].quantity += (item.quantity || 1);
          productSales[item.productId].revenue += ((item.price || 0) * (item.quantity || 1));
        }
      });
    });

    const list = Object.values(productSales);
    if (list.length === 0) {
      return [];
    }

    return list
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 4);
  }, [dashData, orders, products]);

  const COLORS = ['#174C3C', '#6E9C7C', '#AD8B3A', '#8D6E63', '#A1887F', '#BCAAA4'];

  const MetricCard = ({ title, value, subText, trend, trendType, icon: Icon, onClickMenu, isLoading }) => (
    <div
      className="bg-white border border-[#DDE9DF] p-4 sm:p-5 rounded-2xl shadow-2xs flex flex-col justify-between relative overflow-hidden cursor-pointer text-left"
      onClick={onClickMenu}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-0.5 w-full">
          <span className="font-sans text-[9px] sm:text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">{title}</span>
          {isLoading ? (
            <div className="h-7 w-28 bg-gray-200/80 rounded-lg animate-pulse my-1" />
          ) : (
            <span className="font-sans text-xl sm:text-2xl font-bold text-[#202020] block pt-0.5">{value}</span>
          )}
        </div>
        <div className="text-[#174C3C] shrink-0 ml-2">
          <Icon className="w-4 h-4" strokeWidth={2} />
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-3 border-t border-[#DDE9DF] pt-2.5">
        {isLoading ? (
          <div className="h-3 w-32 bg-gray-100 rounded-md animate-pulse" />
        ) : (
          <>
            {trend && (
              <span className={`inline-flex items-center text-[9px] sm:text-[10px] font-sans font-bold ${trendType === 'up' ? 'text-green-700' : 'text-red-700'}`}>
                {trendType === 'up' ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {trend}
              </span>
            )}
            <span className="font-sans text-[10px] sm:text-xs text-[#6B7280] font-semibold">{subText}</span>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 text-left font-sans">
      
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-0.5">
          <span className="font-sans text-[9px] sm:text-[10px] uppercase tracking-wider text-[#6E9C7C] font-bold block">CONSOLE / RINGKASAN DATA</span>
          <h2 className="font-sans text-2xl sm:text-3xl font-bold text-[#174C3C] tracking-tight">
            Selamat Datang Kembali, <span className="italic font-normal text-[#6E9C7C]">Kurator Kebun</span>
          </h2>
        </div>
        
        {/* Quick action triggers */}
        <div className="flex flex-wrap items-center gap-2">
          <AdminButton 
            onClick={() => onQuickAction('add-product')}
            variant="primary"
            size="md"
            icon={Plus}
          >
            Produk Baru
          </AdminButton>
          
          <AdminButton 
            onClick={() => onQuickAction('restock')}
            variant="outline"
            size="md"
            icon={RefreshCw}
          >
            Restok Cepat
          </AdminButton>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard 
          title="Total Pendapatan" 
          value={formatRupiah(totalRevenue)} 
          subText={`Selesai: ${formatRupiah(completedRevenue)}`}
          trend="+22.5%"
          trendType="up"
          icon={DollarSign}
          onClickMenu={() => onNavigateToMenu('analytics')}
          isLoading={loadingDash && !dashData}
        />
        <MetricCard 
          title="Jumlah Pesanan" 
          value={`${totalOrdersCount} Transaksi`} 
          subText="Perputaran pesanan masuk"
          trend="+12.4%"
          trendType="up"
          icon={ClipboardList}
          onClickMenu={() => onNavigateToMenu('orders')}
          isLoading={loadingDash && !dashData}
        />
        <MetricCard 
          title="Rata-rata Nilai Pesanan" 
          value={formatRupiah(Math.round(averageOrderValue))} 
          subText="Nilai belanja (AOV)"
          icon={TrendingUp}
          onClickMenu={() => onNavigateToMenu('analytics')}
          isLoading={loadingDash && !dashData}
        />
        <MetricCard 
          title="Produk Terjual" 
          value={`${totalProductsSold} Sayur`} 
          subText="Total porsi dipindahkan"
          trend="+15.8%"
          trendType="up"
          icon={ShoppingBag}
          onClickMenu={() => onNavigateToMenu('products')}
          isLoading={loadingDash && !dashData}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <MetricCard 
          title="Kategori Produk" 
          value={totalCategories} 
          subText="Rantai pasok lokal aktif"
          icon={Users}
          onClickMenu={() => onNavigateToMenu('categories')}
          isLoading={loadingDash && !dashData}
        />
        <MetricCard 
          title="Total Produk Aktif" 
          value={totalProducts} 
          subText="Varian sayur segar kami"
          icon={ShoppingBag}
          onClickMenu={() => onNavigateToMenu('products')}
          isLoading={loadingDash && !dashData}
        />
        <MetricCard 
          title="Pelanggan Terdaftar" 
          value={totalCustomers} 
          subText="Mitra pembeli Bangka"
          trend="+4.2%"
          trendType="up"
          icon={Users}
          onClickMenu={() => onNavigateToMenu('customers')}
          isLoading={loadingDash && !dashData}
        />
      </div>

      {/* CHARTS CONTAINER SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales & Revenue Trend Area Chart */}
        <div className="lg:col-span-2 bg-white border border-[#DDE9DF] p-6 rounded-2xl shadow-2xs space-y-4 text-left">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-sans text-sm text-[#174C3C] font-bold">Tren Penjualan Harian</h3>
              <span className="font-sans text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold block pt-1">Volume dan Nilai Pendapatan Realtime</span>
            </div>
            <div className="flex items-center gap-4 font-sans text-[10px] text-[#6B7280] font-bold">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#174C3C] rounded-sm inline-block"></span>Pendapatan</span>
            </div>
          </div>
          
          <div className="h-64 w-full">
            {isClientMounted ? (
              <SalesTrendChart salesTrendData={salesTrendData} />
            ) : (
              <div className="w-full h-full bg-gray-50/50 rounded-xl flex items-center justify-center text-xs text-gray-400 font-sans">Memuat grafik...</div>
            )}
          </div>
        </div>

        {/* Category Performance Share Pie Chart */}
        <div className="bg-white border border-[#DDE9DF] p-6 rounded-2xl shadow-2xs space-y-4 text-left flex flex-col justify-between">
          <div>
            <h3 className="font-sans text-sm text-[#174C3C] font-bold">Kategori Terlaris</h3>
            <span className="font-sans text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold block pt-1">Kontribusi Pendapatan Per Kategori</span>
          </div>

          <div className="h-52 w-full flex items-center justify-center relative">
            {isClientMounted ? (
              <CategoryPieChart categoryChartData={categoryChartData} COLORS={COLORS} />
            ) : (
              <div className="w-full h-full bg-gray-50/50 rounded-xl flex items-center justify-center text-xs text-gray-400 font-sans">Memuat grafik...</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[9px] font-sans text-[#6B7280] uppercase tracking-wider text-left font-bold">
            {categoryChartData.slice(0, 4).map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span className="truncate">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Order Status Distribution Bar Chart */}
        <div className="bg-white border border-[#DDE9DF] p-6 rounded-2xl shadow-2xs space-y-4 text-left">
          <div>
            <h3 className="font-sans text-sm text-[#174C3C] font-bold">Status Pesanan</h3>
            <span className="font-sans text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold block pt-1">Sebaran Status Transaksi Aktif</span>
          </div>

          <div className="h-60 w-full">
            {isClientMounted ? (
              <OrderStatusBarChart orderStatusData={orderStatusData} />
            ) : (
              <div className="w-full h-full bg-gray-50/50 rounded-xl flex items-center justify-center text-xs text-gray-400 font-sans">Memuat grafik...</div>
            )}
          </div>
        </div>

        {/* Real best sellers block */}
        <div className="bg-white border border-[#DDE9DF] p-6 rounded-2xl shadow-2xs space-y-5 text-left flex flex-col justify-between">
          <div>
            <h3 className="font-sans text-sm text-[#174C3C] font-bold">Buku Kurasi Terlaris</h3>
            <span className="font-sans text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold block pt-1">Pangan Terbanyak Dibeli Pelanggan</span>
          </div>

          <div className="space-y-4 flex-1">
            {bestSellers.length === 0 ? (
              <p className="text-xs text-gray-400 py-12 text-center font-sans font-semibold">Belum ada penjualan.</p>
            ) : (
              bestSellers.map(({ p, quantity, revenue }) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FCFCFC] overflow-hidden border border-[#DDE9DF] shrink-0">
                    {p.image ? (
                      <img src={buildStorageUrl(p.image)} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#ECF6ED] flex items-center justify-center text-[#174C3C]">
                        <ShoppingBag className="w-3.5 h-3.5 opacity-40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5 text-left">
                    <h4 className="font-sans text-xs text-[#202020] truncate font-bold">{p.name}</h4>
                    <span className="font-sans text-[8px] text-[#6E9C7C] block uppercase tracking-wider font-bold">
                      {typeof p.category === 'object' ? (p.category?.name || p.categoryName || 'Hasil Panen') : (p.category || p.categoryName || 'Hasil Panen')}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-sans text-[10px] font-bold text-[#174C3C] block">{quantity} Sold</span>
                    <span className="font-sans text-[8px] text-[#6B7280] block uppercase tracking-wider">{formatRupiah(revenue)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <button 
            onClick={() => onNavigateToMenu('products')}
            className="w-full h-11 bg-[#FCFCFC] hover:bg-[#FCFCFC] text-[#174C3C] font-sans text-xs uppercase tracking-wider transition-colors duration-200 text-center rounded-full cursor-pointer block font-bold"
          >
            Semua Produk Terkurasi
          </button>
        </div>

        {/* Low Stock alert block */}
        <div className="bg-white border border-[#DDE9DF] p-6 rounded-2xl shadow-2xs space-y-4 text-left flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <h3 className="font-sans text-sm text-[#174C3C] font-bold">Stok Menipis (&lt; 10)</h3>
            </div>
            <span className="font-sans text-[9px] text-amber-600 uppercase tracking-wider font-bold">
              {lowStockProducts.length} Peringatan
            </span>
          </div>

          <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto flex-1 text-left">
            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-gray-400 py-12 font-sans text-center">Seluruh porsi sayur memiliki stok yang melimpah.</p>
            ) : (
              lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    {p.image ? (
                      <img src={buildStorageUrl(p.image)} alt={p.name} className="w-8 h-10 object-cover border border-[#DDE9DF] rounded-sm shrink-0" />
                    ) : (
                      <div className="w-8 h-10 bg-[#ECF6ED] border border-[#DDE9DF] rounded-sm flex items-center justify-center text-[#174C3C] shrink-0">
                        <ShoppingBag className="w-3.5 h-3.5 opacity-40" />
                      </div>
                    )}
                    <div className="text-left">
                      <h4 className="font-sans text-xs text-[#202020] font-bold">{p.name}</h4>
                      <span className="font-sans text-[9px] text-[#6B7280] uppercase tracking-wider font-bold block">Sisa {p.stock} {p.unit}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => onQuickAction(`restock-${p.id}`)}
                    className="px-2.5 py-1 bg-[#FCFCFC] text-[#174C3C] border border-[#DCEFE0] hover:bg-gray-100 font-sans text-[8px] uppercase tracking-wider transition-colors duration-200 cursor-pointer rounded-full font-bold"
                  >
                    + Restok
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Logs Activities list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Logs list (8 Columns) */}
        <div className="lg:col-span-8 bg-white border border-[#DDE9DF] p-6 rounded-2xl shadow-2xs text-left space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sans text-sm text-[#174C3C] font-bold">Log Aktivitas Tim</h3>
            <span className="font-sans text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold">Tindakan Super Admin Terakhir</span>
          </div>
          <div className="space-y-3 max-h-48 overflow-y-auto text-left">
            {logs.slice(0, 6).map((log) => (
              <div key={log.id} className="flex items-start justify-between text-xs py-2 border-b border-[#DDE9DF] last:border-0">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#6E9C7C] rounded-full inline-block mt-1.5"></span>
                  <p className="font-sans text-[#6B7280]">
                    <span className="font-bold text-[#174C3C]">{log.adminName}</span>: {log.action}
                  </p>
                </div>
                <span className="font-sans text-[9px] text-gray-400 shrink-0 font-bold">
                  {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-xs text-gray-400 py-8 text-center">Belum ada aktivitas admin tercatat.</p>
            )}
          </div>
        </div>

        {/* Small reviews teaser (4 Columns) */}
        <div className="lg:col-span-4 bg-white border border-[#DDE9DF] p-6 rounded-2xl shadow-2xs text-left space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sans text-sm text-[#174C3C] font-bold">Ulasan Terbaru</h3>
            <button onClick={() => onNavigateToMenu('reviews')} className="font-sans text-[10px] text-[#6E9C7C] uppercase tracking-wider font-bold hover:underline">Moderasi</button>
          </div>
          <div className="space-y-3 text-left">
            {recentReviews.map((r) => (
              <div key={r.id} className="space-y-1 text-xs border-b border-[#DDE9DF] pb-2 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="font-sans font-bold text-[#202020]">{r.customerName}</span>
                  <span className="text-amber-500 font-sans text-[10px]">{'★'.repeat(r.rating)}</span>
                </div>
                <p className="text-[#6B7280] italic text-[11px] truncate">"{r.comment}"</p>
              </div>
            ))}
            {recentReviews.length === 0 && (
              <p className="text-xs text-gray-400 py-8 text-center font-sans">Belum ada ulasan pembeli.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
