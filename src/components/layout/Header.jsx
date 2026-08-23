"use client";

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  Heart, 
  Search, 
  X, 
  User, 
  Menu,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
const jost = { className: 'font-jost' };

function Header({
  searchQuery,
  setSearchQuery,
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onNavigateToHome,
  onNavigateToProducts,
  onNavigateToCategories,
  onNavigateToContact,
  activePath = '/',
  currentUser,
  onOpenAuth,
  onLogout,
  onNavigateToProfile
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const timeoutRef = useRef(null);
  const [localSearch, setLocalSearch] = useState(searchQuery || '');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    setLocalSearch(searchQuery || '');
  }, [searchQuery]);

  const triggerSearch = () => {
    if (typeof setSearchQuery === 'function') {
      setSearchQuery(localSearch);
    }
    if (onNavigateToProducts) {
      onNavigateToProducts();
    } else {
      router.push('/produk');
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <header 
      id="main-navigation-bar" 
      style={{ backgroundColor: '#FCFCFC' }}
      className={`${jost.className} font-jost sticky top-0 z-[100] w-full bg-[#FCFCFC] backdrop-blur-xl border-b transition-all duration-300 ${
        scrolled 
          ? 'py-2.5 sm:py-3 border-[#DDE9DF] shadow-[0_10px_30px_rgba(0,0,0,0.015)]' 
          : 'py-3.5 sm:py-5 border-[#DDE9DF]/10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="flex items-center justify-between gap-6">
          
          {/* KIRI: Logo + Navigasi Desktop */}
          <div className="flex items-center gap-8 xl:gap-10 flex-1 min-w-0">
            <Link 
              href="/"
              className="flex flex-col cursor-pointer select-none group shrink-0 text-left"
            >
              <span className="text-[21px] sm:text-[25px] font-semibold text-[#1B4D3E] tracking-[0.03em] leading-none group-hover:opacity-90 transition-opacity">
                TaniCo
              </span>
              <span className="text-[7px] sm:text-[9px] tracking-[0.2em] text-[#6B7280] uppercase font-medium mt-1 group-hover:text-[#1B4D3E] transition-colors duration-300">
                PURE HARVEST
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-8 xl:gap-10 font-jost text-[16px] font-medium text-[#666666]">
              {[
                { label: 'Beranda', href: '/', active: activePath === '/' },
                { label: 'Produk', href: '/produk', active: activePath === '/produk' || activePath.startsWith('/produk/') },
                { label: 'Kategori', href: '/kategori', active: activePath === '/kategori' || activePath.startsWith('/kategori/') },
                { label: 'Kisah Mitra Tani', href: '/kisah-mitra-tani', active: activePath === '/kisah-mitra-tani' || activePath.startsWith('/kisah-mitra-tani/') },
                { label: 'Kontak', href: '/hubungi-kami', active: activePath === '/hubungi-kami' || activePath.startsWith('/hubungi-kami/') }
              ].map((item, idx) => (
                <Link 
                  key={idx}
                  href={item.href}
                  className={`group relative py-2 tracking-wide transition-colors duration-300 ${
                    item.active ? 'text-[#1B4D3E] font-semibold' : 'hover:text-[#1B4D3E]'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.active ? (
                    <span 
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1B4D3E] rounded-full"
                    />
                  ) : (
                    <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#1B4D3E] group-hover:w-full transition-all duration-300" />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* KANAN: Search + Actions (Desktop) */}
          <div className="hidden lg:flex items-center gap-6 shrink-0">
            <div className="relative w-56 xl:w-72 h-[46px] group shrink">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666666]">
                <Search className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </div>
              <input
                type="text"
                placeholder="Cari hasil bumi segar..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    triggerSearch();
                  }
                }}
                className="w-full h-full bg-white text-sm text-[#111111] placeholder-[#666666]/50 pl-11 pr-10 border border-[#DDE9DF] focus:border-[#1B4D3E] hover:border-[#1B4D3E]/40 rounded-full transition-all duration-300 outline-none font-jost"
              />
              {localSearch && (
                <button 
                  onClick={() => setLocalSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  aria-label="Clear Search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onOpenWishlist}
                className="relative p-2.5 text-[#111111] hover:text-[#1B4D3E] hover:bg-[#1B4D3E]/5 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer"
                aria-label="Daftar Keinginan"
              >
                <Heart className={`w-5 h-5 ${wishlistCount > 0 ? 'text-red-500 fill-red-500' : ''}`} strokeWidth={1.5} />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
                )}
              </button>

              <button
                onClick={onOpenCart}
                className="relative p-2.5 text-[#111111] hover:text-[#1B4D3E] hover:bg-[#1B4D3E]/5 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer"
                aria-label="Keranjang Belanja"
              >
                <ShoppingCart className="w-5 h-5" strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#1B4D3E] text-[10px] font-semibold text-white ring-2 ring-white">
                    {cartCount}
                  </span>
                )}
              </button>

              {mounted && currentUser ? (
                <div 
                  className="relative"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(!isOpen);
                    }}
                    className="flex items-center cursor-pointer p-0.5 rounded-full ring-2 ring-transparent hover:ring-[#1B4D3E]/30 transition-all duration-300"
                    aria-label="Menu Akun"
                  >
                    {currentUser.avatar && currentUser.avatar.trim() !== '' ? (
                      <img 
                        src={currentUser.avatar || null} 
                        alt={currentUser.name} 
                        loading="lazy"
                        decoding="async"
                        className="w-8 h-8 rounded-full object-cover border border-gray-100"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#1B4D3E]/5 flex items-center justify-center text-[#1B4D3E] font-semibold text-xs border border-[#DDE9DF] font-jost">
                        {(() => {
                          const name = currentUser.name || currentUser.email || '';
                          const parts = name.trim().split(/\s+/);
                          if (parts.length === 0) return 'U';
                          if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
                          return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                        })()}
                      </div>
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        className="absolute right-0 top-full pt-2 w-56 z-50 font-jost"
                      >
                        <div className="bg-white/95 backdrop-blur-md border border-[#DDE9DF] shadow-[0_10px_30px_rgba(0,0,0,0.08)] p-2 rounded-xl overflow-hidden text-left">
                          <div className="px-3 py-2 border-b border-[#DDE9DF] mb-1">
                            <p className="text-sm font-semibold text-[#111111] truncate">{currentUser.name || currentUser.username || currentUser.email || ''}</p>
                            <p className="text-xs text-[#666666] truncate mt-0.5">{currentUser.email}</p>
                          </div>
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              if (onNavigateToProfile) onNavigateToProfile('edit');
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-[#111111] hover:bg-[#1B4D3E]/5 rounded-lg cursor-pointer font-medium transition-colors"
                          >
                            Akun Saya
                          </button>
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              if (onNavigateToProfile) onNavigateToProfile('orders');
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-[#111111] hover:bg-[#1B4D3E]/5 rounded-lg cursor-pointer font-medium transition-colors"
                          >
                            Riwayat Pesanan
                          </button>
                          {(
                            (currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role?.name === 'ADMIN' || currentUser?.role?.name === 'SUPER_ADMIN')
                          ) && (
                            <button
                              onClick={() => {
                                setIsOpen(false);
                                router.push('/admin/dashboard');
                              }}
                              className="w-full text-left px-3 py-2 text-xs text-[#174C3C] hover:bg-[#1B4D3E]/10 rounded-lg cursor-pointer font-bold transition-colors flex items-center gap-1.5"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Konsol Admin</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              if (onLogout) onLogout();
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg cursor-pointer font-semibold mt-1 pt-2 border-t border-[#DDE9DF] transition-colors"
                          >
                            Keluar
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="p-2.5 text-[#111111] hover:text-[#1B4D3E] hover:bg-[#1B4D3E]/5 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer"
                  aria-label="Masuk"
                >
                  <User className="w-5 h-5" strokeWidth={1.5} />
                </button>
              )}
            </div>
          </div>

          {/* MOBILE BAR: Wishlist + Cart + Profile/User + Hamburger */}
          <div className="flex lg:hidden items-center gap-2 shrink-0">
            {/* Wishlist */}
            <button
              onClick={onOpenWishlist}
              className="relative p-2 text-[#111111] hover:text-[#1B4D3E] hover:bg-[#1B4D3E]/5 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer"
              aria-label="Daftar Keinginan"
            >
              <Heart className={`w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] ${wishlistCount > 0 ? 'text-red-500 fill-red-500' : ''}`} strokeWidth={1.5} />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* Cart */}
            <button
              onClick={onOpenCart}
              className="relative p-2 text-[#111111] hover:text-[#1B4D3E] hover:bg-[#1B4D3E]/5 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer"
              aria-label="Keranjang Belanja"
            >
              <ShoppingCart className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]" strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-[#1B4D3E] text-[8px] sm:text-[9px] font-semibold text-white ring-1 ring-white">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Profile / User */}
            {mounted && currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center cursor-pointer p-0.5 rounded-full ring-2 ring-transparent hover:ring-[#1B4D3E]/30 transition-all duration-300"
                  aria-label="Menu Akun"
                >
                  {currentUser.avatar && currentUser.avatar.trim() !== '' ? (
                    <img 
                      src={currentUser.avatar || null} 
                      alt={currentUser.name} 
                      loading="lazy"
                      decoding="async"
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-gray-100"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1B4D3E]/5 flex items-center justify-center text-[#1B4D3E] font-semibold text-[10px] sm:text-xs border border-[#DDE9DF] font-jost">
                      {(() => {
                        const name = currentUser.name || currentUser.email || '';
                        const parts = name.trim().split(/\s+/);
                        if (parts.length === 0) return 'U';
                        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
                        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                      })()}
                    </div>
                  )}
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute right-0 top-full pt-2 w-56 z-50 font-jost"
                    >
                      <div className="bg-white/95 backdrop-blur-md border border-[#DDE9DF] shadow-[0_10px_30px_rgba(0,0,0,0.08)] p-2 rounded-xl overflow-hidden text-left">
                        <div className="px-3 py-2 border-b border-[#DDE9DF] mb-1">
                          <p className="text-sm font-semibold text-[#111111] truncate">{currentUser.name || currentUser.username || currentUser.email || ''}</p>
                          <p className="text-xs text-[#666666] truncate mt-0.5">{currentUser.email}</p>
                        </div>
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            if (onNavigateToProfile) onNavigateToProfile('edit');
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-[#111111] hover:bg-[#1B4D3E]/5 rounded-lg cursor-pointer font-medium transition-colors"
                        >
                          Akun Saya
                        </button>
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            if (onNavigateToProfile) onNavigateToProfile('orders');
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-[#111111] hover:bg-[#1B4D3E]/5 rounded-lg cursor-pointer font-medium transition-colors"
                        >
                          Riwayat Pesanan
                        </button>
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            if (onLogout) onLogout();
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg cursor-pointer font-semibold mt-1 pt-2 border-t border-[#DDE9DF] transition-colors"
                        >
                          Keluar
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="p-2 text-[#111111] hover:text-[#1B4D3E] hover:bg-[#1B4D3E]/5 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer"
                aria-label="Masuk"
              >
                <User className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]" strokeWidth={1.5} />
              </button>
            )}

            {/* Hamburger Button (garis tiga) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-[#111111] hover:text-[#1B4D3E] hover:bg-[#1B4D3E]/5 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer"
              aria-label="Menu"
            >
              <Menu className="w-[20px] h-[20px] sm:w-[24px] sm:h-[24px]" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* SEARCH BAR MOBILE */}
        <div className="mt-3 md:hidden px-1">
          <div className="relative h-[42px]">
            <input
              type="text"
              placeholder="Cari hasil bumi segar..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  triggerSearch();
                }
              }}
              className="w-full h-full bg-white text-xs text-[#111111] placeholder-[#666666]/50 pl-10 pr-9 border border-[#DDE9DF] rounded-full transition-all duration-300 outline-none focus:border-[#1B4D3E] font-jost"
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]">
              <Search className="w-4 h-4" strokeWidth={1.5} />
            </div>
            {localSearch && (
              <button 
                onClick={() => setLocalSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER PORTAL */}
      {mounted && typeof document !== 'undefined' && document.body && createPortal(
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                key="mobile-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black z-[998] backdrop-blur-xs"
              />

              <motion.div
                key="mobile-drawer"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                className="fixed top-0 right-0 h-full w-[85%] max-w-[360px] bg-white z-[999] shadow-2xl flex flex-col p-6 sm:p-8 font-jost text-left"
              >
                <div className="flex items-center justify-between border-b border-[#DDE9DF] pb-5 mb-6">
                  <div className="flex flex-col">
                    <span className="text-[22px] font-semibold text-[#1B4D3E] tracking-wide leading-none">
                      TaniCo
                    </span>
                    <span className="text-[8px] tracking-[0.2em] text-[#6B7280] uppercase font-medium mt-1">
                      PURE HARVEST
                    </span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-[#111111] hover:text-[#1B4D3E] hover:bg-[#1B4D3E]/5 rounded-full transition-all duration-300"
                  >
                    <X className="w-5 h-5" strokeWidth={1.5} />
                  </button>
                </div>

                {currentUser && (
                  <div className="border-b border-[#DDE9DF] pb-6 mb-6">
                    <div className="flex items-center gap-4">
                      {currentUser.avatar && currentUser.avatar.trim() !== '' ? (
                        <img 
                          src={currentUser.avatar || null} 
                          alt={currentUser.name} 
                          loading="lazy"
                          decoding="async"
                          className="w-11 h-11 rounded-full object-cover border border-[#DDE9DF]"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-[#1B4D3E]/5 flex items-center justify-center text-[#1B4D3E] font-semibold text-sm border border-[#DDE9DF]">
                          {(() => {
                            const name = currentUser.name || currentUser.email || '';
                            const parts = name.trim().split(/\s+/);
                            if (parts.length === 0) return 'U';
                            if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
                            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                          })()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#111111] truncate">{currentUser.name || currentUser.username || currentUser.email || ''}</p>
                        <p className="text-xs text-[#666666] truncate mt-0.5">{currentUser.email}</p>
                        <div className="flex gap-4 mt-2">
                          <button
                            onClick={() => {
                              setMobileMenuOpen(false);
                              if (onNavigateToProfile) onNavigateToProfile('edit');
                            }}
                            className="text-[11px] font-semibold text-[#1B4D3E] hover:underline"
                          >
                            Profil
                          </button>
                          <button
                            onClick={() => {
                              setMobileMenuOpen(false);
                              if (onNavigateToProfile) onNavigateToProfile('orders');
                            }}
                            className="text-[11px] font-semibold text-[#1B4D3E] hover:underline"
                          >
                            Pesanan
                          </button>
                          <button
                            onClick={() => {
                              setMobileMenuOpen(false);
                              if (onLogout) onLogout();
                            }}
                            className="text-[11px] font-semibold text-red-600 hover:underline"
                          >
                            Keluar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <nav className="flex flex-col gap-1 flex-1">
                  {[
                    { label: 'Beranda', href: '/', active: activePath === '/' },
                    { label: 'Produk', href: '/produk', active: activePath === '/produk' || activePath.startsWith('/produk/') },
                    { label: 'Kategori', href: '/kategori', active: activePath === '/kategori' || activePath.startsWith('/kategori/') },
                    { label: 'Kisah Mitra Tani', href: '/kisah-mitra-tani', active: activePath === '/kisah-mitra-tani' || activePath.startsWith('/kisah-mitra-tani/') },
                    { label: 'Kontak', href: '/hubungi-kami', active: activePath === '/hubungi-kami' || activePath.startsWith('/hubungi-kami/') }
                  ].map((item, idx) => (
                    <Link
                      key={idx}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center cursor-pointer py-2 px-1 text-[12px] leading-normal transition-colors duration-200 ${
                        item.active 
                          ? 'text-[#1B4D3E] font-semibold' 
                          : 'text-[#666666] hover:text-[#1B4D3E] font-medium'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </header>
  );
}

export default React.memo(Header);