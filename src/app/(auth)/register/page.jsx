"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLayout } from '@/context/LayoutContext';
import { Mail, Lock, User, Phone, MapPin, Eye, EyeOff, ArrowRight, AlertTriangle, Check } from 'lucide-react';
import { motion } from 'motion/react';
import PageLayoutWrapper from '@/components/layout/PageLayoutWrapper';

function RegisterContent() {
  const router = useRouter();
  const { currentUser, addToast } = useLayout();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isEmailExistError, setIsEmailExistError] = useState(false);

  // Realtime password requirements
  const isMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = isMinLength && hasLetter && hasNumber;
  const isConfirmMatch = password === confirmPassword;

  // Realtime email format check
  const validateEmailFormat = (val) => {
    setEmail(val);
    setIsEmailExistError(false);
    if (!val) {
      setEmailError('');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setEmailError('Format email tidak valid.');
    } else {
      setEmailError('');
    }
  };

  useEffect(() => {
    if (currentUser) {
      router.push('/');
    }
  }, [currentUser, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsEmailExistError(false);

    if (emailError) {
      setError(emailError);
      return;
    }

    if (!isPasswordValid) {
      setError('Password harus minimal 8 karakter dan mengandung huruf serta angka.');
      return;
    }

    if (!isConfirmMatch) {
      setError('Password tidak sama.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone, address })
      });

      const result = await response.json();
      if (!response.ok) {
        if (response.status === 409 || result.error === 'Email already exists.') {
          setIsEmailExistError(true);
          const duplicateMsg = 'Email sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.';
          setError(duplicateMsg);
          if (addToast) addToast(duplicateMsg, 'error');
          return;
        }

        throw new Error(result.error || 'Pendaftaran gagal. Silakan coba lagi.');
      }

      // Requirement 10: Show "Pendaftaran berhasil. Silakan masuk menggunakan akun Anda." and redirect to /login
      if (addToast) addToast('Pendaftaran berhasil. Silakan masuk menggunakan akun Anda.', 'success');
      router.push('/login');

    } catch (err) {
      setError(err.message);
      if (addToast) addToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#FCFCFC] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-jost text-left">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl border border-[#DDE9DF] shadow-[0_12px_40px_rgba(0,0,0,0.03)]">
        
        {/* Brand Greetings */}
        <div className="text-center">
          <span className="text-[28px] font-semibold text-[#1B4D3E] tracking-wide block leading-none font-sans">
            TaniCo
          </span>
          <span className="text-[9px] tracking-[0.25em] text-[#6B7280] uppercase font-semibold mt-1.5 block">
            PURE HARVEST
          </span>
          <h2 className="mt-6 text-2xl font-bold text-[#111111] tracking-tight">
            Daftar Akun Baru
          </h2>
          <p className="mt-2 text-sm text-[#666666]">
            Mulai perjalanan belanja sayur segar organik terbaik sekarang.
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }}
            transition={{ duration: 0.3 }}
            className="bg-red-50 text-red-600 text-xs p-3.5 rounded-xl border border-red-100 font-medium leading-relaxed flex items-center gap-2.5"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">Nama Lengkap</label>
            <div className="relative h-11">
              <User className="h-4.5 w-4.5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Masukkan nama lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-full bg-gray-50 border border-[#DDE9DF] focus:border-[#1B4D3E] focus:ring-2 focus:ring-[#1B4D3E]/20 focus:bg-white rounded-xl text-sm pl-11 pr-4 outline-none transition-all duration-300"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">Alamat Email</label>
            <div className="relative h-11">
              <Mail className="h-4.5 w-4.5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@email.com"
                value={email}
                onChange={(e) => validateEmailFormat(e.target.value)}
                className={`w-full h-full bg-gray-50 border ${
                  isEmailExistError
                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-[#DDE9DF] focus:border-[#1B4D3E] focus:ring-2 focus:ring-[#1B4D3E]/20'
                } focus:bg-white rounded-xl text-sm pl-11 pr-4 outline-none transition-all duration-300`}
              />
            </div>
            {emailError && (
              <p className="text-[11px] text-red-500 font-medium pt-0.5">{emailError}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">Nomor WhatsApp HP</label>
            <div className="relative h-11">
              <Phone className="h-4.5 w-4.5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                placeholder="Contoh: 0812XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-full bg-gray-50 border border-[#DDE9DF] focus:border-[#1B4D3E] focus:ring-2 focus:ring-[#1B4D3E]/20 focus:bg-white rounded-xl text-sm pl-11 pr-4 outline-none transition-all duration-300"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">Alamat Rumah Lengkap</label>
            <div className="relative h-11">
              <MapPin className="h-4.5 w-4.5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Jl. Raya, Blok, No Rumah..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full h-full bg-gray-50 border border-[#DDE9DF] focus:border-[#1B4D3E] focus:ring-2 focus:ring-[#1B4D3E]/20 focus:bg-white rounded-xl text-sm pl-11 pr-4 outline-none transition-all duration-300"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">Kata Sandi</label>
            <div className="relative h-11">
              <Lock className="h-4.5 w-4.5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Masukkan kata sandi baru"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-full bg-gray-50 border border-[#DDE9DF] focus:border-[#1B4D3E] focus:ring-2 focus:ring-[#1B4D3E]/20 focus:bg-white rounded-xl text-sm pl-11 pr-12 outline-none transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-4 flex items-center text-[#6B7280] hover:text-[#111111]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password Realtime Checklist */}
            {password.length > 0 && (
              <div className="pt-2 space-y-1 text-xs">
                <div className={`flex items-center gap-1.5 ${isMinLength ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Minimal 8 karakter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLetter ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Mengandung huruf</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Mengandung angka</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">Konfirmasi Password</label>
            <div className="relative h-11">
              <Lock className="h-4.5 w-4.5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                placeholder="Ulangi kata sandi"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-full bg-gray-50 border border-[#DDE9DF] focus:border-[#1B4D3E] focus:ring-2 focus:ring-[#1B4D3E]/20 focus:bg-white rounded-xl text-sm pl-11 pr-12 outline-none transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-4 flex items-center text-[#6B7280] hover:text-[#111111]"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && !isConfirmMatch && (
              <p className="text-[11px] text-red-500 font-medium pt-0.5">Password tidak sama.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full h-12 flex items-center justify-center gap-2 bg-[#1B4D3E] hover:bg-[#153D31] active:bg-[#0F2D24] text-white font-semibold text-sm rounded-full shadow-md cursor-pointer transition-all duration-300 mt-4 focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]/30"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Mendaftarkan akun...</span>
              </div>
            ) : (
              <>
                <span>Daftar Akun</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => router.push('/login')}
            className="text-xs font-semibold text-[#1B4D3E] hover:underline cursor-pointer"
          >
            Sudah punya akun? Masuk disini
          </button>
        </div>

      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <PageLayoutWrapper>
      <RegisterContent />
    </PageLayoutWrapper>
  );
}
