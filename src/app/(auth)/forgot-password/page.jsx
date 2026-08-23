"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { useLayout } from '@/context/LayoutContext';
import PageLayoutWrapper from '@/components/layout/PageLayoutWrapper';

function ForgotContent() {
  const router = useRouter();
  const { addToast } = useLayout();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Alamat email wajib diisi.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const result = await response.json();
      if (!response.ok) {
        if (response.status === 404 || result.error === 'Email tidak ditemukan.') {
          throw new Error('Email tidak ditemukan.');
        }
        throw new Error(result.error || 'Gagal mengirim instruksi reset password.');
      }

      setIsSent(true);
      setResetToken(result.resetToken || '');
      if (addToast) addToast('Link reset password berhasil dikirim. Silakan cek email Anda.', 'success');
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
            Lupa Kata Sandi
          </h2>
          <p className="mt-2 text-sm text-[#666666] leading-relaxed">
            Masukkan email yang terdaftar.<br />
            Kami akan mengirimkan link untuk membuat password baru.
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

        {isSent ? (
          <div className="space-y-6 text-center">
            <div className="bg-green-50 text-[#1B4D3E] text-xs p-4 rounded-xl border border-green-100 font-medium leading-relaxed text-left space-y-1">
              <p className="font-bold text-sm">Link reset password berhasil dikirim.</p>
              <p>Silakan cek email Anda (<span className="font-semibold">{email}</span>) untuk melanjutkan.</p>
            </div>
            
            <button
              onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(resetToken)}`)}
              className="w-full h-12 flex items-center justify-center gap-2 bg-[#1B4D3E] hover:bg-[#153D31] text-white font-semibold text-sm rounded-full shadow-md cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]/30"
            >
              <span>Atur Ulang Password</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">Email</label>
              <div className="relative h-11">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#6B7280]">
                  <Mail className="h-4.5 w-4.5" strokeWidth={1.5} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="Masukkan email terdaftar"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-full bg-gray-50 border border-[#DDE9DF] focus:border-[#1B4D3E] focus:ring-2 focus:ring-[#1B4D3E]/20 focus:bg-white rounded-xl text-sm pl-11 pr-4 outline-none transition-all duration-300"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full h-12 flex items-center justify-center gap-2 bg-[#1B4D3E] hover:bg-[#153D31] active:bg-[#0F2D24] text-white font-semibold text-sm rounded-full shadow-md cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]/30"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Mengirim...</span>
                </div>
              ) : (
                <>
                  <span>Kirim Link Reset</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <button
            onClick={() => router.push('/login')}
            className="text-xs font-semibold text-[#1B4D3E] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Login</span>
          </button>
        </div>

      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <PageLayoutWrapper>
      <ForgotContent />
    </PageLayoutWrapper>
  );
}
