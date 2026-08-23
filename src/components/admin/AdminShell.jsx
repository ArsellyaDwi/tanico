"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  Bell, 
  ChevronDown, 
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { useLayout } from '@/context/LayoutContext';
import Toasts from '@/components/ui/Toasts';
import AdminSidebar from '@/components/admin/AdminSidebar';

const AdminContext = createContext(null);

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminShell / AdminProvider');
  }
  return context;
}

export default function AdminShell({ children }) {
  const { currentUser, loginSuccess: layoutLoginSuccess, logout: layoutLogout } = useLayout() || {};
  const router = useRouter();
  const pathname = usePathname();

  const [isCheckingAuth, setIsCheckingAuth] = useState(pathname !== '/admin/login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAdminLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' }).catch(() => {});
    } catch (e) {}

    if (typeof layoutLogout === 'function') {
      layoutLogout();
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tanico_user');
      sessionStorage.clear();
      document.cookie = 'tanico_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      window.location.replace('/admin/login');
    } else {
      router.replace('/admin/login');
    }
  };

  // Responsive sidebar toggler
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // DATABASE STATES
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [settings, setSettings] = useState({ id: 'default', siteName: 'TaniCo Admin' });
  const [adminProfile, setAdminProfile] = useState({
    name: 'Administrator',
    role: 'ADMIN',
    email: 'admin@tanico.id',
    avatar: '/avatars/admin.jpg'
  });
  const [logs, setLogs] = useState([]);

  // TOAST MESSAGING STATE
  const [toasts, setToasts] = useState([]);
  const settingsLoadedRef = React.useRef(false);

  const getAuthHeaders = React.useCallback(() => {
    const u = currentUser || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('tanico_user') || 'null') : null);
    return u?.sessionToken ? { Authorization: `Bearer ${u.sessionToken}` } : {};
  }, [currentUser]);

  const refreshProducts = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/products', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setProducts(data);
      }
    } catch (e) {}
  }, [getAuthHeaders]);

  const refreshCategories = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/categories', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setCategories(data);
      }
    } catch (e) {}
  }, [getAuthHeaders]);

  const refreshOrders = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/orders', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setOrders(data);
      }
    } catch (e) {}
  }, [getAuthHeaders]);

  const refreshReviews = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/reviews', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setReviews(data);
      }
    } catch (e) {}
  }, [getAuthHeaders]);

  const refreshContacts = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/contacts', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setContacts(data);
      }
    } catch (e) {}
  }, [getAuthHeaders]);

  const refreshSettings = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data && data.id) setSettings(data);
      }
    } catch (e) {}
  }, [getAuthHeaders]);

  // Route-targeted data fetcher
  const fetchAdminData = React.useCallback(async () => {
    const p = pathname || '';
    const promises = [];

    // Always fetch settings once if not loaded
    if (!settingsLoadedRef.current) {
      promises.push(refreshSettings().then(() => { settingsLoadedRef.current = true; }));
    }

    if (p.includes('/produk') || p.includes('/products')) {
      promises.push(refreshProducts(), refreshCategories());
    } else if (p.includes('/kategori') || p.includes('/categories')) {
      promises.push(refreshCategories());
    } else if (p.includes('/pesanan') || p.includes('/orders')) {
      promises.push(refreshOrders());
    } else if (p.includes('/ulasan') || p.includes('/reviews')) {
      promises.push(refreshReviews());
    } else if (p.includes('/kontak') || p.includes('/contacts')) {
      promises.push(refreshContacts());
    } else if (p.includes('/stok') || p.includes('/stock')) {
      promises.push(refreshProducts());
    } else if (p.includes('/analitik') || p.includes('/analytics')) {
      promises.push(refreshOrders(), refreshProducts(), refreshCategories());
    } else if (p.includes('/pengaturan') || p.includes('/settings') || p.includes('/homepage')) {
      promises.push(refreshSettings());
    }

    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  }, [pathname, refreshCategories, refreshContacts, refreshOrders, refreshProducts, refreshReviews, refreshSettings]);

  useEffect(() => {
    let isMounted = true;
    async function loadAdminData() {
      try {
        const u = currentUser || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('tanico_user') || 'null') : null);

        if (u) {
          setAdminProfile({
            name: u?.name || 'Administrator',
            role: (u?.role?.name || u?.role || 'Admin').toUpperCase(),
            email: u?.email || '',
            avatar: u?.image || ''
          });
        }

        // Sync cookie if sessionToken exists
        if (typeof window !== 'undefined' && u?.sessionToken) {
          const isHttps = window.location.protocol === 'https:';
          const sameSiteClause = isHttps ? '; SameSite=None; Secure' : '; SameSite=Lax';
          document.cookie = `tanico_session=${u.sessionToken}; path=/${sameSiteClause}; max-age=${60 * 60 * 24 * 7}`;
        }

        if (isMounted) {
          await fetchAdminData();
        }
      } catch (err) {
        console.error('Error loading admin data:', err);
      }
    }
    loadAdminData();
    return () => { isMounted = false; };
  }, [currentUser, fetchAdminData]);

  const addToast = (message, type = 'success') => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const handleAddActivityLog = (action) => {
    setLogs(prev => [{ id: Date.now(), action, time: 'Baru saja' }, ...prev]);
  };

  // CRUD PRODUCTS
  const handleAddProduct = async (newProduct) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(newProduct)
      });
      if (res.ok) {
        const saved = await res.json();
        setProducts(prev => [saved, ...prev]);
        addToast(`Produk "${newProduct.name}" berhasil diterbitkan!`, 'success');
        handleAddActivityLog(`Menerbitkan produk baru "${newProduct.name}"`);
      } else {
        const errData = await res.json().catch(() => ({}));
        addToast(`Gagal menambahkan produk: ${errData.error || 'Terjadi kesalahan pada server'}`, 'error');
      }
    } catch (err) {
      console.error('Error adding product:', err);
      addToast(`Gagal menambahkan produk: ${err.message}`, 'error');
    }
  };

  const handleEditProduct = async (edited) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(edited)
      });
      if (res.ok) {
        const saved = await res.json().catch(() => null);
        setProducts(prev => prev.map(p => p.id === edited.id ? (saved || edited) : p));
        addToast(`Perubahan produk "${edited.name}" berhasil disimpan!`, 'success');
        handleAddActivityLog(`Memperbarui rincian produk "${edited.name}"`);
      } else {
        const errData = await res.json().catch(() => ({}));
        addToast(`Gagal memperbarui produk: ${errData.error || 'Terjadi kesalahan pada server'}`, 'error');
      }
    } catch (err) {
      console.error('Error updating product:', err);
      addToast(`Gagal memperbarui produk: ${err.message}`, 'error');
    }
  };

  const handleDeleteProduct = async (id, name) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders()
        }
      });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
        addToast(`Produk "${name}" berhasil dihapus.`, 'success');
        handleAddActivityLog(`Menghapus produk "${name}"`);
      } else {
        const errData = await res.json().catch(() => ({}));
        addToast(`Gagal menghapus produk: ${errData.error || 'Terjadi kesalahan pada server'}`, 'error');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      addToast(`Gagal menghapus produk: ${err.message}`, 'error');
    }
  };

  // CRUD CATEGORIES
  const handleSaveCategories = async (updatedCategories) => {
    try {
      await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCategories)
      });
      setCategories(updatedCategories);
    } catch (err) {
      console.error('Error saving categories:', err);
    }
  };

  // CRUD ORDERS (Status Transitions)
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        addToast(`Status Pesanan ${orderId} diubah ke ${newStatus.toUpperCase()}`, 'success');
        handleAddActivityLog(`Mengubah status pesanan ${orderId} menjadi ${newStatus}`);
      }
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  // REVIEWS & CONTACTS
  const handleSaveReviews = async (updatedReviews) => {
    try {
      setReviews(updatedReviews);
      await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedReviews)
      });
    } catch (err) {
      console.error('Error saving reviews:', err);
    }
  };

  const handleSaveContacts = async (updatedContacts) => {
    try {
      setContacts(updatedContacts);
      await fetch('/api/admin/contacts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedContacts)
      });
    } catch (err) {
      console.error('Error saving contacts:', err);
    }
  };

  // CUSTOMIZATION & SETTINGS
  const handleSaveBanners = (updatedBanners) => {
    setBanners(updatedBanners);
  };

  const handleSaveSettings = async (updatedSetting) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(updatedSetting)
      });
      if (res.ok) {
        const saved = await res.json();
        setSettings(saved || updatedSetting);
        return { success: true, data: saved };
      } else {
        const err = await res.json().catch(() => ({}));
        console.error('Failed to save settings:', err);
        return { success: false, error: err.error || 'Gagal menyimpan pengaturan' };
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      return { success: false, error: err.message || 'Koneksi gagal' };
    }
  };

  const handleSaveAdminProfile = (updatedProfile) => {
    setAdminProfile(updatedProfile);
  };

  // QUICK ACTIONS TRIGGERED FROM OVERVIEW
  const handleQuickAction = (action) => {
    if (action === 'add-product') {
      router.push('/admin/products');
      setTimeout(() => {
        const addBtn = document.querySelector('[aria-label="Tambah Produk"]');
        if (addBtn) addBtn.click();
      }, 100);
    } else if (action === 'restock') {
      router.push('/admin/stock');
    } else if (action.startsWith('restock-')) {
      const prodId = action.replace('restock-', '');
      router.push('/admin/stock');
      setTimeout(() => {
        const selectEl = document.querySelector('select');
        if (selectEl) {
          selectEl.value = prodId;
          selectEl.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, 100);
    }
  };

  const handleBackToStorefront = () => {
    router.push('/');
  };

  const getActiveUser = () => {
    if (currentUser) return currentUser;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('tanico_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.role || parsed.isAdmin)) return parsed;
        }
      } catch (e) {}
    }
    return null;
  };

  useEffect(() => {
    if (pathname === '/admin/login') {
      setIsCheckingAuth(false);
      return;
    }

    const u = getActiveUser();
    if (u) {
      const roleStr = (typeof u.role === 'string' ? u.role : (u.role?.name || '')).toUpperCase();
      if (roleStr === 'ADMIN' || roleStr === 'SUPER_ADMIN' || roleStr === 'SUPERADMIN' || u.isAdmin) {
        setAdminProfile({
          name: u?.name || 'Administrator',
          role: roleStr || 'ADMIN',
          email: u?.email || '',
          avatar: u?.image || ''
        });
        setIsAuthenticated(true);
        setIsCheckingAuth(false);
        return;
      }
    }

    // If not authenticated as admin, clear stored admin profile and redirect to login
    setIsAuthenticated(false);
    setIsCheckingAuth(false);
    router.replace('/admin/login');
  }, [currentUser, pathname, router]);

  // If current route is /admin/login, render children directly without admin layout wrapper
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // If checking authentication, show clean minimal loader and don't leak dashboard UI
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#F6F8F6] flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-[#174C3C] mx-auto" />
          <p className="mt-3 text-xs text-gray-500 font-medium">Memverifikasi sesi admin...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, prevent layout rendering while redirect completes
  if (!isAuthenticated) {
    return null;
  }

  const categoryNamesList = categories.map(c => c.name);

  const contextValue = {
    products,
    setProducts,
    categories,
    categoryNamesList,
    orders,
    reviews,
    contacts,
    banners,
    settings,
    adminProfile,
    logs,
    toasts,
    addToast,
    removeToast: (id) => setToasts(prev => prev.filter(t => t.id !== id)),
    refreshAdminData: fetchAdminData,
    refreshProducts,
    refreshCategories,
    refreshOrders,
    refreshReviews,
    refreshContacts,
    refreshSettings,
    handleAddActivityLog,
    handleAddProduct,
    handleEditProduct,
    handleDeleteProduct,
    handleSaveCategories,
    handleUpdateOrderStatus,
    handleSaveReviews,
    handleSaveContacts,
    handleSaveBanners,
    handleSaveSettings,
    handleSaveAdminProfile,
    handleQuickAction,
    onBackToStorefront: handleBackToStorefront
  };

  return (
    <AdminContext.Provider value={contextValue}>
      <div className="min-h-screen bg-[#FCFCFC] text-[#202020] flex relative selection:bg-[#DCEFE0] selection:text-[#174C3C] font-sans">
        
        {/* 1. LEFT SIDEBAR COMPONENT */}
        <AdminSidebar 
          onLogout={handleAdminLogout}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />

        {/* 2. RIGHT WORKSPACE AREA */}
        <div className="flex-1 lg:pl-64 flex flex-col min-h-screen overflow-x-hidden">
          
          {/* Top bar header */}
          <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#DDE9DF] py-3.5 px-6 md:px-8 lg:px-12 flex items-center justify-between">
            
            {/* Mobile Hamburg trigger */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-[#174C3C]"
                aria-label="Buka Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Back to website button */}
              <button
                onClick={handleBackToStorefront}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-sans uppercase tracking-wider text-gray-500 hover:text-[#174C3C] transition-colors cursor-pointer group font-bold"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Kembali Ke Toko</span>
              </button>
            </div>

            {/* Quick status & Admin metadata row */}
            <div className="flex items-center gap-5">
              {/* Notification simulated badge */}
              <button 
                onClick={() => addToast('Pusat Notifikasi: Sistem berjalan normal.', 'info')}
                className="p-2 text-gray-400 hover:text-[#174C3C] transition-colors relative cursor-pointer" 
                aria-label="Notifikasi"
              >
                <Bell className="w-4 h-4" strokeWidth={1.5} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#6E9C7C] rounded-full"></span>
              </button>

              {/* User credentials */}
              <div 
                onClick={() => router.push('/admin/profile')}
                className="flex items-center gap-2.5 pl-4 border-l border-gray-200/60 cursor-pointer group"
              >
                {adminProfile?.avatar ? (
                  <img 
                    src={adminProfile.avatar} 
                    alt="Profil Admin" 
                    className="w-8 h-8 rounded-full object-cover border border-gray-100 group-hover:border-[#174C3C] transition-all"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#174C3C] text-white font-bold text-xs flex items-center justify-center border border-gray-100 group-hover:border-[#174C3C] transition-all">
                    {adminProfile?.name ? adminProfile.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                )}
                <div className="text-left hidden md:block">
                  <span className="font-sans text-xs font-bold text-[#174C3C] block leading-none">{adminProfile.name}</span>
                  <span className="font-sans text-[8px] text-gray-400 uppercase tracking-widest font-semibold mt-0.5 block">{adminProfile.role}</span>
                </div>
                <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors hidden md:block" />
              </div>
            </div>

          </header>

          {/* Dynamic sub-screen viewport */}
          <main className="flex-1 p-3.5 sm:p-6 md:p-8 lg:p-10 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>

        </div>

        {/* 3. ABSOLUTE TOAST NOTIFICATIONS ALERTS CONTAINER */}
        <Toasts toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />

      </div>
    </AdminContext.Provider>
  );
}
