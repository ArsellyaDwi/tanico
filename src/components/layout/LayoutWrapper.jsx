"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutProvider, useLayout } from '@/context/LayoutContext';
import { WishlistProvider, useWishlist } from '@/context/WishlistContext';
import { CartProvider, useCart } from '@/context/CartContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Toasts from '@/components/ui/Toasts';

const CartDrawer = dynamic(() => import('@/components/product/CartDrawer'), { ssr: false });
const WishlistDrawer = dynamic(() => import('@/components/product/WishlistDrawer'), { ssr: false });
const AuthModal = dynamic(() => import('@/components/auth/AuthModal'), { ssr: false });

function InnerProviders({ children }) {
  const { currentUser, addToast } = useLayout();
  return (
    <WishlistProvider currentUser={currentUser} onAddToast={addToast}>
      <CartProvider currentUser={currentUser} onAddToast={addToast}>
        {children}
      </CartProvider>
    </WishlistProvider>
  );
}

function PageNavigationTransition() {
  return null;
}

function GlobalLayoutContent({ children, settings = {} }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const {
    currentUser,
    loginSuccess,
    logout,
    toasts,
    addToast,
    removeToast,
    isAuthOpen,
    setIsAuthOpen,
    isCheckoutOpen,
    setIsCheckoutOpen,
    isCartOpen,
    setIsCartOpen,
    isWishlistOpen,
    setIsWishlistOpen,
    searchQuery,
    setSearchQuery
  } = useLayout();

  const { cart, cartCount, updateCartQty, removeFromCart, addToCart } = useCart();
  const { wishlist, wishlistCount, toggleWishlist } = useWishlist();

  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleOpenCart = React.useCallback(() => setIsCartOpen(true), [setIsCartOpen]);
  const handleOpenWishlist = React.useCallback(() => setIsWishlistOpen(true), [setIsWishlistOpen]);
  const handleResetFilters = React.useCallback(() => setSearchQuery(''), [setSearchQuery]);
  const handleNavigateToHome = React.useCallback(() => router.push('/'), [router]);
  const handleNavigateToProducts = React.useCallback(() => router.push('/produk'), [router]);
  const handleNavigateToCategories = React.useCallback(() => router.push('/kategori'), [router]);
  const handleOpenAuth = React.useCallback(() => router.push('/login'), [router]);
  const handleNavigateToProfile = React.useCallback((tab) => {
    if (tab === 'orders') {
      router.push('/akun/transaksi');
    } else {
      router.push('/akun');
    }
  }, [router]);

  const handleNavigateToContact = React.useCallback(() => {
    router.push('/hubungi-kami');
  }, [router]);

  const handleNavigateToAdmin = React.useCallback(() => {
    const role = (currentUser?.role?.name || currentUser?.role || '').toUpperCase();
    if (currentUser && (role === 'ADMIN' || role === 'SUPER_ADMIN')) {
      router.push('/admin/dashboard');
    } else {
      router.push('/admin/login');
    }
  }, [currentUser, router]);

  const handleCloseCart = React.useCallback(() => setIsCartOpen(false), [setIsCartOpen]);
  const handleCloseWishlist = React.useCallback(() => setIsWishlistOpen(false), [setIsWishlistOpen]);
  const handleCloseAuth = React.useCallback(() => setIsAuthOpen(false), [setIsAuthOpen]);

  const handleCartOpenCheckout = React.useCallback(() => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  }, [setIsCartOpen, setIsCheckoutOpen]);

  const handleWishlistOpenCheckout = React.useCallback(() => {
    setIsWishlistOpen(false);
    setIsCheckoutOpen(true);
  }, [setIsWishlistOpen, setIsCheckoutOpen]);

  const handleWishlistAddToCart = React.useCallback((product) => {
    return addToCart(product, 1);
  }, [addToCart]);

  const handleWishlistOpenCartModal = React.useCallback(() => {
    setIsWishlistOpen(false);
    setIsCartOpen(true);
  }, [setIsWishlistOpen, setIsCartOpen]);

  const isNoLayoutPage = pathname?.startsWith('/admin');

  return (
    <div className="min-h-screen bg-[#FCFCFC] flex flex-col text-neutral-800 selection:bg-emerald-800/10 selection:text-emerald-800 font-sans antialiased">
      <PageNavigationTransition />

      {/* Navigation Header */}
      {!isNoLayoutPage && (
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          onOpenCart={handleOpenCart}
          onOpenWishlist={handleOpenWishlist}
          onResetFilters={handleResetFilters}
          onNavigateToHome={handleNavigateToHome}
          onNavigateToProducts={handleNavigateToProducts}
          onNavigateToCategories={handleNavigateToCategories}
          onNavigateToContact={handleNavigateToContact}
          activePath={pathname}
          currentUser={currentUser}
          onOpenAuth={handleOpenAuth}
          onLogout={logout}
          onNavigateToProfile={handleNavigateToProfile}
        />
      )}

      {/* Main Core View Area */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Universal Footer */}
      {!isNoLayoutPage && (
        <Footer
          settings={settings}
          onNavigateToAdmin={handleNavigateToAdmin}
        />
      )}

      {/* Slide-out Drawers - Lazy Mounted (unmount when closed) */}
      {isMounted && isCartOpen && (
        <CartDrawer
          isOpen={isCartOpen}
          onClose={handleCloseCart}
          cart={cart}
          onUpdateQty={updateCartQty}
          onRemoveItem={removeFromCart}
          onOpenCheckout={handleCartOpenCheckout}
          onOpenCartModal={handleCartOpenCheckout}
        />
      )}

      {isMounted && isWishlistOpen && (
        <WishlistDrawer
          isOpen={isWishlistOpen}
          onClose={handleCloseWishlist}
          wishlist={wishlist}
          onToggleWishlist={toggleWishlist}
          onOpenCheckout={handleWishlistOpenCheckout}
          onAddToCart={handleWishlistAddToCart}
          onOpenCartModal={handleWishlistOpenCartModal}
        />
      )}

      {/* Portals & Overlays */}
      {isMounted && isAuthOpen && (
        <AuthModal
          onClose={handleCloseAuth}
          onLoginSuccess={loginSuccess}
          onAddToast={addToast}
        />
      )}

      {/* Toasts */}
      {isMounted && <Toasts toasts={toasts} onRemove={removeToast} />}
    </div>
  );
}

export default function LayoutWrapper({ children, settings = {} }) {
  return (
    <LayoutProvider>
      <InnerProviders>
        <GlobalLayoutContent settings={settings}>
          {children}
        </GlobalLayoutContent>
      </InnerProviders>
    </LayoutProvider>
  );
}
