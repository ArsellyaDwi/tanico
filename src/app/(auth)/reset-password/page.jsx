"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { useLayout } from '@/context/LayoutContext';
import PageLayoutWrapper from '@/components/layout/PageLayoutWrapper';

function ResetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useLayout();

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (searchParams) {
      const emailParam = searchParams.get('email');
      const tokenParam = searchParams.get('token');
      if (emailParam) setEmail(emailParam);
      if (tokenParam) setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!password) {
      setError('Password baru wajib diisi.');
      return;
    }

    if (password.length < 8) {
      setError('Password minimal 8 karakter.');
      if (addToast) addToast('Password minimal 8 karakter.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password tidak sama.');
      if (addToast) addToast('Password tidak sama.', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          token,
          password,
          confirmPassword
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Gagal mengatur ulang password.');
      }

      setIsSuccess(true);
      if (addToast) addToast('Password berhasil diperbarui. Silakan masuk menggunakan akun Anda.', 'success');
      
      setTimeout(() => {
        router.push('/login');
      }, 2000);

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
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-[#666666]">
            Atur ulang password baru akun TaniCo Anda.
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

        {isSuccess ? (
          <div className="space-y-6 text-center">
            <div className="bg-green-50 text-[#1B4D3E] text-xs p-5 rounded-xl border border-green-100 font-medium leading-relaxed flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-[#1B4D3E]" />
              <div>
                <p className="font-bold text-sm">Password Berhasil Diperbarui!</p>
                <p className="mt-1">
                  Password baru Anda telah aktif. Anda akan otomatis dialihkan ke halaman login.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => router.push('/login')}
              className="w-full h-12 flex items-center justify-center gap-2 bg-[#1B4D3E] hover:bg-[#153D31] text-white font-semibold text-sm rounded-full shadow-md cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]/30"
            >
              <span>Ke Halaman Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Input Password Baru */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                Password Baru
              </label>
              <div className="relative h-11">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#6B7280]">
                  <Lock className="h-4.5 w-4.5" strokeWidth={1.5} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Masukkan password baru (min. 8 karakter)"
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
            </div>

            {/* Input Konfirmasi Password */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                Konfirmasi Password
              </label>
              <div className="relative h-11">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#6B7280]">
                  <Lock className="h-4.5 w-4.5" strokeWidth={1.5} />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Ulangi password baru"
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
              {confirmPassword && confirmPassword !== password && (
                <p className="text-[11px] text-red-500 font-medium pt-0.5">Password tidak sama.</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full h-12 flex items-center justify-center gap-2 bg-[#1B4D3E] hover:bg-[#153D31] active:bg-[#0F2D24] text-white font-semibold text-sm rounded-full shadow-md cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]/30"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Menyimpan...</span>
                </div>
              ) : (
                <>
                  <span>Simpan Password Baru</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <PageLayoutWrapper>
      <Suspense fallback={
        <div className="min-h-[85vh] flex items-center justify-center px-4 font-jost animate-pulse">
          <div className="w-full max-w-md bg-white border border-[#DDE9DF] rounded-3xl p-8 space-y-6 shadow-xs">
            <div className="space-y-2 text-center">
              <div className="h-6 w-48 bg-gray-200 rounded-lg mx-auto" />
              <div className="h-3.5 w-64 bg-gray-100 rounded-md mx-auto" />
            </div>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <div className="h-3.5 w-24 bg-gray-200 rounded-md" />
                <div className="h-11 w-full bg-gray-100 rounded-2xl" />
              </div>
              <div className="space-y-2">
                <div className="h-3.5 w-32 bg-gray-200 rounded-md" />
                <div className="h-11 w-full bg-gray-100 rounded-2xl" />
              </div>
              <div className="h-12 w-full bg-gray-200 rounded-full pt-2" />
            </div>
          </div>
        </div>
      }>
        <ResetContent />
      </Suspense>
    </PageLayoutWrapper>
  );
}
