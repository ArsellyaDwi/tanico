"use client";

import React, { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { useRouter } from 'next/navigation';
import { useLayout } from '@/context/LayoutContext';
import { Mail, Lock, User, Phone, MapPin, Eye, EyeOff, ArrowRight, AlertTriangle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PageLayoutWrapper from '@/components/layout/PageLayoutWrapper';

function LoginPageContent() {
  const router = useRouter();
  const { currentUser, loginSuccess, addToast } = useLayout();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isEmailExistError, setIsEmailExistError] = useState(false);

  // Realtime password checks
  const isMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = isMinLength && hasLetter && hasNumber;
  const isConfirmMatch = password === confirmPassword;

  // Realtime Email format check
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

  // Redirect if logged in
  useEffect(() => {
    if (currentUser) {
      router.push('/');
    }
  }, [currentUser, router]);

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsEmailExistError(false);

    // Registration validations
    if (!isLogin) {
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
    }

    setIsLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { email, password }
      : { name, email, password, phone, address };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        // Registration email duplication check (409 or "Email already exists.")
        if (!isLogin && (response.status === 409 || result.error === 'Email already exists.')) {
          setIsEmailExistError(true);
          const duplicateMsg = 'Email sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.';
          setError(duplicateMsg);
          if (addToast) addToast(duplicateMsg, 'error');
          return;
        }

        throw new Error(result.message || result.error || 'Gagal memproses permintaan.');
      }

      if (isLogin) {
        // Ensure no Google admin constraint if applicable
        const roleName = (result.role?.name || result.role || '').toUpperCase();
        if (roleName === 'ADMIN' && result.provider === 'Google') {
          throw new Error('Admin hanya diperbolehkan masuk menggunakan Email dan Password.');
        }

        if (addToast) addToast(`Selamat datang kembali, ${result.name}!`, 'success');
        loginSuccess(result);
        router.push('/');
      } else {
        // Requirement 10: After registration, do NOT auto login.
        // Show "Pendaftaran berhasil. Silakan masuk menggunakan akun Anda." and switch to login mode.
        const successMsg = 'Pendaftaran berhasil. Silakan masuk menggunakan akun Anda.';
        if (addToast) addToast(successMsg, 'success');
        setIsLogin(true);
        setPassword('');
        setConfirmPassword('');
        setError('');
      }
    } catch (err) {
      logger.error('Credentials login/register failed:', err);
      setError(err.message);
      if (addToast) addToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setError('');
    
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
      setIsLoading(false);
      setError('Popup terblokir. Harap aktifkan popup untuk browser ini.');
      if (addToast) addToast('Harap aktifkan popup browser untuk masuk dengan Google.', 'error');
      return;
    }

    const messageListener = async (event) => {
      if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        const loggedUser = event.data.user;
        
        const roleName = (loggedUser.role?.name || loggedUser.role || '').toUpperCase();
        if (roleName === 'ADMIN') {
          setError('Admin hanya diperbolehkan masuk menggunakan Email dan Password.');
          if (addToast) addToast('Akses ditolak. Admin wajib login menggunakan email biasa.', 'error');
          setIsLoading(false);
          return;
        }

        if (addToast) addToast(`Selamat datang, ${loggedUser.name}! Masuk berhasil dengan Google.`, 'success');
        loginSuccess(loggedUser);
        router.push('/');
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
    <div className="min-h-[85vh] bg-[#FCFCFC] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-jost text-left">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl border border-[#DDE9DF] shadow-[0_12px_40px_rgba(0,0,0,0.03)]">
        
        {/* Brand & Greetings */}
        <div className="text-center">
          <span className="text-[28px] font-semibold text-[#1B4D3E] tracking-wide block leading-none font-sans">
            TaniCo
          </span>
          <span className="text-[9px] tracking-[0.25em] text-[#6B7280] uppercase font-semibold mt-1.5 block">
            PURE HARVEST
          </span>
          <h2 className="mt-6 text-2xl font-bold text-[#111111] tracking-tight">
            {isLogin ? 'Masuk ke TaniCo' : 'Daftar Akun Baru'}
          </h2>
          <p className="mt-2 text-sm text-[#666666]">
            {isLogin ? 'Masuk untuk mengelola hasil bumi segar pilihan Anda.' : 'Mulai perjalanan belanja sayur segar organik terbaik.'}
          </p>
        </div>

        {/* Error UI with Warning Icon and Gentle Shake */}
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

        {/* Google Authentication Section */}
        {isLogin && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full h-12 flex items-center justify-center gap-3 bg-white border border-[#DDE9DF] hover:bg-neutral-50 active:bg-neutral-100 text-[#111111] font-semibold text-sm rounded-full cursor-pointer shadow-xs transition-all duration-300 focus:outline-none focus:border-[#1B4D3E] focus:ring-2 focus:ring-[#1B4D3E]/20"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-[#DDE9DF]"></div>
              <span className="flex-shrink mx-4 text-xs uppercase font-bold text-[#6B7280] tracking-widest">Atau masuk dengan email</span>
              <div className="flex-grow border-t border-[#DDE9DF]"></div>
            </div>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleCredentialsSubmit} className="space-y-4">
          <div className="space-y-4 rounded-md">
            
            {/* Input Name for Registration */}
            <AnimatePresence initial={false}>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1"
                >
                  <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                    Nama Lengkap
                  </label>
                  <div className="relative h-11">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#6B7280]">
                      <User className="h-4.5 w-4.5" strokeWidth={1.5} />
                    </div>
                    <input
                      type="text"
                      required={!isLogin}
                      placeholder="Masukkan nama lengkap"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-full bg-gray-50 border border-[#DDE9DF] focus:border-[#1B4D3E] focus:ring-2 focus:ring-[#1B4D3E]/20 focus:bg-white rounded-xl text-sm pl-11 pr-4 outline-none transition-all duration-300"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Email */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                Alamat Email
              </label>
              <div className="relative h-11">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#6B7280]">
                  <Mail className="h-4.5 w-4.5" strokeWidth={1.5} />
                </div>
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
              {!isLogin && emailError && (
                <p className="text-[11px] text-red-500 font-medium pt-0.5">{emailError}</p>
              )}
            </div>

            {/* Input Phone & Address for Registration */}
            <AnimatePresence initial={false}>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                      Nomor WhatsApp
                    </label>
                    <div className="relative h-11">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#6B7280]">
                        <Phone className="h-4.5 w-4.5" strokeWidth={1.5} />
                      </div>
                      <input
                        type="tel"
                        required={!isLogin}
                        placeholder="Contoh: 0812XXXXXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-full bg-gray-50 border border-[#DDE9DF] focus:border-[#1B4D3E] focus:ring-2 focus:ring-[#1B4D3E]/20 focus:bg-white rounded-xl text-sm pl-11 pr-4 outline-none transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                      Alamat Pengiriman
                    </label>
                    <div className="relative h-11">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#6B7280]">
                        <MapPin className="h-4.5 w-4.5" strokeWidth={1.5} />
                      </div>
                      <input
                        type="text"
                        required={!isLogin}
                        placeholder="Jl. Raya No. X, Desa, Kecamatan..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full h-full bg-gray-50 border border-[#DDE9DF] focus:border-[#1B4D3E] focus:ring-2 focus:ring-[#1B4D3E]/20 focus:bg-white rounded-xl text-sm pl-11 pr-4 outline-none transition-all duration-300"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Password */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                Kata Sandi
              </label>
              <div className="relative h-11">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#6B7280]">
                  <Lock className="h-4.5 w-4.5" strokeWidth={1.5} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Masukkan kata sandi"
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

              {/* Requirement 1: Link Lupa Password */}
              {isLogin && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => router.push('/forgot-password')}
                    className="text-xs font-semibold text-[#1B4D3E] hover:underline"
                  >
                    Lupa Password?
                  </button>
                </div>
              )}

              {/* Requirement 7: Password Realtime Checklist on Register */}
              {!isLogin && password.length > 0 && (
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

            {/* Requirement 8: Confirm Password for Register */}
            {!isLogin && (
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
                    required={!isLogin}
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
            )}

          </div>

          {/* Requirement 13: Loading text + Spinner */}
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full h-12 flex items-center justify-center gap-2 bg-[#1B4D3E] hover:bg-[#153D31] active:bg-[#0F2D24] text-white font-semibold text-sm rounded-full shadow-md cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]/30"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{isLogin ? 'Masuk...' : 'Mendaftarkan akun...'}</span>
              </div>
            ) : (
              <>
                <span>{isLogin ? 'Masuk' : 'Daftar Akun'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center pt-2">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setEmailError('');
              setIsEmailExistError(false);
            }}
            className="text-xs font-semibold text-[#1B4D3E] hover:underline"
          >
            {isLogin ? 'Belum punya akun? Daftar disini' : 'Sudah punya akun? Masuk disini'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <PageLayoutWrapper>
      <LoginPageContent />
    </PageLayoutWrapper>
  );
}
