"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLayout } from '@/context/LayoutContext';
import { useWishlist } from '@/context/WishlistContext';
import { User, Phone, Mail, Calendar, Lock, Save, Trash2, Shield, ShoppingBag, ShieldCheck, Heart, Package } from 'lucide-react';
import PageLayoutWrapper from '@/components/layout/PageLayoutWrapper';

function AkunContent() {
  const router = useRouter();
  const { currentUser, logout, addToast, setCurrentUser } = useLayout();
  const wishlistContext = useWishlist();
  const wishlistCount = wishlistContext?.wishlistCount ?? wishlistContext?.wishlist?.length ?? 0;
  const [orderCount, setOrderCount] = useState(0);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setBirthday(currentUser.birthday || '');

      fetch('/api/orders')
        .then((res) => res.ok ? res.json() : [])
        .then((orders) => {
          const userOrders = (orders || []).filter(o => 
            o.customerName?.toLowerCase() === currentUser.name?.toLowerCase() || 
            (o.phone && currentUser.phone && o.phone === currentUser.phone)
          );
          setOrderCount(userOrders.length);
        })
        .catch(() => setOrderCount(0));
    } else {
      const timer = setTimeout(() => {
        if (!currentUser) {
          router.push('/login');
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return (
      <div className="bg-[#FCFCFC] text-[#111111] font-jost pb-24 text-left animate-pulse">
        <div className="max-w-7xl mx-auto px-6 md:px-8 pt-8 space-y-8">
          {/* Header Skeleton */}
          <div className="bg-white border border-[#DDE9DF] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gray-200 shrink-0" />
            <div className="space-y-3 w-full max-w-md">
              <div className="h-6 w-48 bg-gray-200 rounded-lg" />
              <div className="h-4 w-64 bg-gray-100 rounded-md" />
              <div className="h-3 w-32 bg-gray-100 rounded-md" />
            </div>
          </div>

          {/* Stats Bar Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-[#DDE9DF] rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-200" />
                <div className="space-y-2">
                  <div className="h-3 w-20 bg-gray-100 rounded-md" />
                  <div className="h-5 w-12 bg-gray-200 rounded-md" />
                </div>
              </div>
            ))}
          </div>

          {/* Form Skeleton */}
          <div className="bg-white border border-[#DDE9DF] rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="h-5 w-40 bg-gray-200 rounded-md" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3.5 w-24 bg-gray-200 rounded-md" />
                  <div className="h-11 w-full bg-gray-100 rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      addToast('Harap isi semua kolom wajib (Nama, Email, dan WhatsApp).', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentUser.id,
          name,
          email,
          phone,
          birthday,
          password: password || undefined
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Gagal memperbarui profil');
      }

      localStorage.setItem('tanico_user', JSON.stringify(result));
      if (setCurrentUser) {
        setCurrentUser(result);
      }
      addToast('Profil Anda berhasil diperbarui!', 'success');
      setPassword('');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    if (confirm('Apakah Anda yakin ingin menghapus akun Anda secara permanen? Seluruh riwayat transaksi Anda akan ikut terhapus secara permanen.')) {
      addToast('Permintaan penghapusan akun Anda sedang diproses. Silakan hubungi CS kami.', 'info');
    }
  };

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
                  <p className="text-lg font-bold text-[#1B4D3E]">{orderCount}</p>
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
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold bg-[#1B4D3E] text-white text-left cursor-pointer transition-colors duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E]"
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
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold text-gray-600 hover:bg-[#1B4D3E]/5 hover:text-[#1B4D3E] text-left cursor-pointer transition-colors duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E]"
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

          {/* Right Form panel */}
          <div className="lg:col-span-8 bg-white border border-[#DDE9DF] rounded-3xl p-8 md:p-10 shadow-xs space-y-8">
            <div className="border-b border-[#DDE9DF] pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold font-sans text-[#1B4D3E]">Profil Saya</h2>
                <p className="text-gray-500 text-xs mt-1">Kelola data dasar profil Anda, email, dan verifikasi keamanan akun.</p>
              </div>
              <Shield className="w-8 h-8 text-[#1B4D3E]/10" />
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Nama Lengkap</label>
                  <div className="relative h-11">
                    <User className="w-4.5 h-4.5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Nama lengkap Anda"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-full bg-gray-50 border border-[#DDE9DF] focus:border-[#1B4D3E] focus:bg-white rounded-xl text-sm pl-11 pr-4 outline-none transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Nomor WhatsApp (HP)</label>
                  <div className="relative h-11">
                    <Phone className="w-4.5 h-4.5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="Contoh: 0812XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-full bg-gray-50 border border-[#DDE9DF] focus:border-[#1B4D3E] focus:bg-white rounded-xl text-sm pl-11 pr-4 outline-none transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Alamat Email</label>
                  <div className="relative h-11">
                    <Mail className="w-4.5 h-4.5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="email@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-full bg-gray-50 border border-[#DDE9DF] focus:border-[#1B4D3E] focus:bg-white rounded-xl text-sm pl-11 pr-4 outline-none transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Tanggal Lahir</label>
                  <div className="relative h-11">
                    <Calendar className="w-4.5 h-4.5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="w-full h-full bg-gray-50 border border-[#DDE9DF] focus:border-[#1B4D3E] focus:bg-white rounded-xl text-sm pl-11 pr-4 outline-none transition-all duration-300"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-[#DDE9DF] pt-6 space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Ubah Password Baru (Opsional)</label>
                <div className="relative h-11">
                  <Lock className="w-4.5 h-4.5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="Kosongkan jika tidak ingin mengubah password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-full bg-gray-50 border border-[#DDE9DF] focus:border-[#1B4D3E] focus:bg-white rounded-xl text-sm pl-11 pr-4 outline-none transition-all duration-300"
                  />
                </div>
              </div>

              <div className="border-t border-[#DDE9DF] pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Akun Saya Permanen</span>
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto h-11 px-6 flex items-center justify-center gap-2 bg-[#1B4D3E] hover:bg-[#143D31] active:bg-[#0F2D24] text-white font-bold text-xs rounded-full shadow-xs cursor-pointer transition-colors"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function AkunPage() {
  return (
    <PageLayoutWrapper>
      <AkunContent />
    </PageLayoutWrapper>
  );
}