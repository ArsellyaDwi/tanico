"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, Phone, MapPin, Loader2, ArrowRight } from 'lucide-react';

export default function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  onAddToast
}) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      onAddToast('Harap masukkan email dan kata sandi Anda.', 'error');
      return;
    }

    if (!isLoginMode && !name) {
      onAddToast('Harap masukkan nama lengkap Anda.', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
      const body = isLoginMode 
        ? { email, password }
        : { name, email, password, phone, address };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Terjadi kesalahan autentikasi');
      }

      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess(result);
      }
      onAddToast(
        isLoginMode 
          ? `Selamat datang kembali, ${result.name || result.email}!` 
          : 'Pendaftaran berhasil! Akun Anda siap digunakan.',
        'success'
      );
      onClose();
    } catch (err) {
      onAddToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Login via Pop-up Window (OAuth 2.0 Accounts Picker)
  const handleGoogleLogin = () => {
    setIsLoading(true);
    
    const width = 500;
    const height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      '/auth/google/init',
      'Masuk dengan Google',
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
    );

    if (!popup) {
      onAddToast('Gagal membuka popup Google. Harap nonaktifkan pemblokir popup (popup blocker) Anda.', 'error');
      setIsLoading(false);
      return;
    }

    const messageListener = (event) => {
      if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        const loggedUser = event.data.user;
        if (typeof onLoginSuccess === 'function') {
          onLoginSuccess(loggedUser);
        }
        onAddToast(`Berhasil masuk dengan Google sebagai ${loggedUser.name}!`, 'success');
        onClose();
        setIsLoading(false);
        window.removeEventListener('message', messageListener);
      }
    };

    window.addEventListener('message', messageListener);

    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        setIsLoading(false);
        window.removeEventListener('message', messageListener);
      }
    }, 1000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#12372A]/20 backdrop-blur-md"
        />

        {/* Modal Sheet */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 15 }}
          className="relative w-full max-w-md bg-[#ECF6ED] shadow-[0_24px_80px_rgba(22,58,46,0.15)] z-10 border border-[#E7E7E2] flex flex-col max-h-[90vh] overflow-hidden rounded-[24px]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#E7E7E2] flex items-center justify-between bg-[#ECF6ED]">
            <div className="flex items-baseline gap-2">
              <span className="font-jost text-lg text-[#163A2E] font-medium">
                {isLoginMode ? 'Selamat Datang' : 'Gabung TaniCo'}
              </span>
              <span className="font-jost text-[9px] uppercase tracking-widest text-[#6E9C7C] font-semibold">
                {isLoginMode ? '/ Masuk' : '/ Register'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:text-[#163A2E] text-gray-500 transition-colors rounded-full border border-transparent hover:border-[#E7E7E2] hover:bg-white cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Scroll Body */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 scrollbar-thin">
            {/* Social Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 border border-[#E7E7E2] bg-white hover:bg-[#ECF6ED] hover:border-[#D7E8DA] transition-colors duration-200 font-jost text-[10px] uppercase tracking-widest rounded-[16px] relative group disabled:opacity-50 cursor-pointer font-bold text-[#1C1C1C] shadow-xs"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Masuk dengan Google</span>
            </button>

            <div className="flex items-center justify-center gap-4 text-gray-300">
              <span className="h-px bg-[#E7E7E2] flex-1"></span>
              <span className="font-jost text-[9px] uppercase tracking-widest text-[#6B7280]">atau email</span>
              <span className="h-px bg-[#E7E7E2] flex-1"></span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Registration specific fields */}
              {!isLoginMode && (
                <div className="space-y-1.5">
                  <label className="font-jost text-[9px] uppercase tracking-widest text-[#163A2E] block font-bold">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Contoh: Dwi Anggara"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white border border-[#E7E7E2] focus:border-[#163A2E] pl-10 pr-4 py-3 text-xs outline-none rounded-[12px] transition-colors font-jost"
                      required={!isLoginMode}
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label className="font-jost text-[9px] uppercase tracking-widest text-[#163A2E] block font-bold">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Contoh: dwi@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-[#E7E7E2] focus:border-[#163A2E] pl-10 pr-4 py-3 text-xs outline-none rounded-[12px] transition-colors font-jost"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="font-jost text-[9px] uppercase tracking-widest text-[#163A2E] block font-bold">Kata Sandi</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-[#E7E7E2] focus:border-[#163A2E] pl-10 pr-4 py-3 text-xs outline-none rounded-[12px] transition-colors font-jost"
                    required
                  />
                </div>
              </div>

              {/* Registration specific fields - Phone & Address */}
              {!isLoginMode && (
                <>
                  <div className="space-y-1.5">
                    <label className="font-jost text-[9px] uppercase tracking-widest text-[#163A2E] block font-bold">Nomor HP (opsional)</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        placeholder="Contoh: +62812345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-white border border-[#E7E7E2] focus:border-[#163A2E] pl-10 pr-4 py-3 text-xs outline-none rounded-[12px] transition-colors font-jost"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-jost text-[9px] uppercase tracking-widest text-[#163A2E] block font-bold">Alamat Rumah (opsional)</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Nama jalan, RT/RW, Kecamatan"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-white border border-[#E7E7E2] focus:border-[#163A2E] pl-10 pr-4 py-3 text-xs outline-none rounded-[12px] transition-colors font-jost"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Main Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#174C3C] hover:bg-[#205E49] active:bg-[#123A2E] text-white py-4 px-6 font-jost text-[11px] uppercase tracking-widest transition-colors duration-200 relative flex items-center justify-center gap-2 overflow-hidden shadow-md cursor-pointer disabled:opacity-50 mt-6 rounded-[16px] font-bold"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{isLoginMode ? 'Masuk ke Akun' : 'Daftar Sekarang'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Toggle Mode Footer */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsLoginMode(!isLoginMode)}
                className="font-jost text-[10px] uppercase tracking-widest text-gray-500 hover:text-[#163A2E] transition-colors underline cursor-pointer"
              >
                {isLoginMode 
                  ? 'Belum punya akun? Daftar disini' 
                  : 'Sudah punya akun? Masuk disini'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
