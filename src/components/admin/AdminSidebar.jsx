"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  FolderTree, 
  Warehouse, 
  ClipboardList, 
  Users, 
  Heart, 
  ShoppingCart, 
  Star, 
  ImageIcon, 
  MessageSquare, 
  Inbox, 
  FileText, 
  BarChart3, 
  Settings, 
  User, 
  LogOut,
  X,
  ChevronDown,
  Home
} from 'lucide-react';

export default function AdminSidebar({
  onLogout,
  isOpen,
  setIsOpen
}) {
  const pathname = usePathname();
  const cleanPath = (pathname || '').replace(/^\/admin\/?/, '');
  const activeMenu = cleanPath.split('/')[0] || 'dashboard';

  const menuConfig = {
    dashboard: { url: '/admin/dashboard', matches: ['dashboard'] },
    products: { url: '/admin/products', matches: ['products', 'produk'] },
    categories: { url: '/admin/categories', matches: ['categories', 'kategori'] },
    stock: { url: '/admin/stock', matches: ['stock', 'stok'] },
    orders: { url: '/admin/orders', matches: ['orders', 'pesanan'] },
    cart: { url: '/admin/cart', matches: ['cart', 'keranjang'] },
    wishlist: { url: '/admin/wishlist', matches: ['wishlist'] },
    customers: { url: '/admin/customers', matches: ['customers', 'pelanggan'] },
    reviews: { url: '/admin/reviews', matches: ['reviews', 'ulasan'] },
    articles: { url: '/admin/articles', matches: ['articles', 'artikel'] },
    gallery: { url: '/admin/gallery', matches: ['gallery', 'galeri'] },
    testimonials: { url: '/admin/testimonials', matches: ['testimonials', 'testimoni'] },
    contacts: { url: '/admin/contacts', matches: ['contacts', 'kontak'] },
    homepage: { url: '/admin/homepage', matches: ['homepage', 'beranda'] },
    analytics: { url: '/admin/analytics', matches: ['analytics', 'analitik'] },
    settings: { url: '/admin/settings', matches: ['settings', 'pengaturan'] },
    profile: { url: '/admin/profile', matches: ['profile', 'profil'] },
  };

  // Track open state for dropdown menus
  const [expandedGroups, setExpandedGroups] = useState({
    produk: true,
    penjualan: false,
    konten: false,
    laporan: false,
  });

  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  // Auto-expand group containing the active menu
  useEffect(() => {
    if (['products', 'categories', 'stock', 'produk', 'kategori', 'stok'].includes(activeMenu)) {
      setExpandedGroups(prev => ({ ...prev, produk: true }));
    } else if (['orders', 'customers', 'wishlist', 'cart', 'reviews', 'pesanan', 'pelanggan', 'keranjang', 'ulasan'].includes(activeMenu)) {
      setExpandedGroups(prev => ({ ...prev, penjualan: true }));
    } else if (['gallery', 'articles', 'testimonials', 'contacts', 'homepage', 'galeri', 'artikel', 'testimoni', 'kontak', 'beranda'].includes(activeMenu)) {
      setExpandedGroups(prev => ({ ...prev, konten: true }));
    } else if (['reports', 'analytics', 'analitik'].includes(activeMenu)) {
      setExpandedGroups(prev => ({ ...prev, laporan: true }));
    }
  }, [activeMenu]);

  const handleMenuClick = () => {
    setIsOpen(false); // Close mobile drawer if clicked
  };

  const renderGroupHeader = (label, groupKey, isExpanded) => (
    <button
      onClick={() => toggleGroup(groupKey)}
      className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-white/5 text-white/50 hover:text-[#ECF6ED] transition-colors duration-200 cursor-pointer rounded-lg text-[9px] font-sans uppercase tracking-widest font-bold mt-4 first:mt-0"
    >
      <span>{label}</span>
      <ChevronDown 
        className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
        strokeWidth={2}
      />
    </button>
  );

  const renderItem = (id, label, icon) => {
    const Icon = icon;
    const config = menuConfig[id] || { url: `/admin/${id}`, matches: [id] };
    const isActive = config.matches.includes(activeMenu);
    return (
      <Link
        key={id}
        href={config.url}
        onClick={handleMenuClick}
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-sans uppercase tracking-wider transition-colors duration-200 cursor-pointer relative group ${
          isActive 
            ? 'bg-[#0F3A2E] text-white font-bold' 
            : 'text-[#E8F3EC]/70 hover:text-white hover:bg-[#0F3A2E]/50'
        }`}
      >
        {isActive && (
          <motion.div 
            layoutId="active-indicator"
            className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-md"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#6E9C7C]'}`} strokeWidth={1.5} />
        <span>{label}</span>
      </Link>
    );
  };

  const dropdownContainerVariants = {
    collapsed: { height: 0, opacity: 0, overflow: 'hidden' },
    expanded: { height: 'auto', opacity: 1, overflow: 'visible', transition: { height: { type: 'spring', stiffness: 220, damping: 25 }, opacity: { duration: 0.2 } } }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#174C3C] text-white select-none font-sans">
      {/* Header Brand */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-sans text-lg tracking-widest uppercase font-bold text-white">
            TaniCo
          </span>
          <span className="font-sans text-[7px] tracking-widest uppercase text-[#E8F3EC] opacity-70 -mt-1 block">
            Admin Console
          </span>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-1.5 hover:bg-white/5 text-white transition-colors"
          aria-label="Tutup Menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Menu Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2.5 scrollbar-thin scrollbar-thumb-white/10 text-left">
        {/* Dashboard Direct Menu */}
        {renderItem('dashboard', 'Dashboard', LayoutDashboard)}

        {/* 1. Manajemen Produk Group */}
        <div className="space-y-1">
          {renderGroupHeader('Manajemen Produk', 'produk', expandedGroups.produk)}
          <AnimatePresence initial={false}>
            {expandedGroups.produk && (
              <motion.div 
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                variants={dropdownContainerVariants}
                className="space-y-1 pl-2.5 mt-1 border-l border-white/5"
              >
                {renderItem('products', 'Produk', ShoppingBag)}
                {renderItem('categories', 'Kategori', FolderTree)}
                {renderItem('stock', 'Stok', Warehouse)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 2. Penjualan Group */}
        <div className="space-y-1">
          {renderGroupHeader('Penjualan', 'penjualan', expandedGroups.penjualan)}
          <AnimatePresence initial={false}>
            {expandedGroups.penjualan && (
              <motion.div 
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                variants={dropdownContainerVariants}
                className="space-y-1 pl-2.5 mt-1 border-l border-white/5"
              >
                {renderItem('orders', 'Pesanan', ClipboardList)}
                {renderItem('cart', 'Keranjang', ShoppingCart)}
                {renderItem('wishlist', 'Wishlist', Heart)}
                {renderItem('customers', 'Pelanggan', Users)}
                {renderItem('reviews', 'Review', Star)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. Konten Website Group */}
        <div className="space-y-1">
          {renderGroupHeader('Konten Website', 'konten', expandedGroups.konten)}
          <AnimatePresence initial={false}>
            {expandedGroups.konten && (
              <motion.div 
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                variants={dropdownContainerVariants}
                className="space-y-1 pl-2.5 mt-1 border-l border-white/5"
              >
                {renderItem('articles', 'Artikel', FileText)}
                {renderItem('gallery', 'Galeri', ImageIcon)}
                {renderItem('testimonials', 'Testimoni', MessageSquare)}
                {renderItem('contacts', 'Kontak Masuk', Inbox)}
                {renderItem('homepage', 'Homepage CMS', Home)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 4. Laporan Group */}
        <div className="space-y-1">
          {renderGroupHeader('Laporan', 'laporan', expandedGroups.laporan)}
          <AnimatePresence initial={false}>
            {expandedGroups.laporan && (
              <motion.div 
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                variants={dropdownContainerVariants}
                className="space-y-1 pl-2.5 mt-1 border-l border-white/5"
              >
                {renderItem('analytics', 'Analitik', BarChart3)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Direct Settings & Profile */}
        <div className="pt-4 border-t border-white/5 space-y-1.5">
          {renderItem('settings', 'Pengaturan', Settings)}
          {renderItem('profile', 'Profil Admin', User)}
        </div>
      </nav>

      {/* Logout Row */}
      <div className="p-4 border-t border-white/5 bg-[#123C2F]">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-sans uppercase tracking-wider text-rose-300 hover:text-rose-200 hover:bg-rose-500/5 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.5} />
          <span>Keluar Portal</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 h-screen fixed left-0 top-0 border-r border-white/5 bg-[#174C3C] z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${isOpen ? 'visible' : 'invisible pointer-events-none'}`}>
        <div 
          onClick={() => setIsOpen(false)}
          className={`absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        />
        <div className={`absolute top-0 bottom-0 left-0 w-64 bg-[#174C3C] transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {sidebarContent}
        </div>
      </div>
    </>
  );
}
