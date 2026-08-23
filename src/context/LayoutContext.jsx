'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '@/utils/logger';

const AuthContext = createContext(null);
const ToastContext = createContext(null);
const UIContext = createContext(null);

function AuthProviderInternal({ children }) {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('tanico_user');
        if (stored) {
          setCurrentUser(JSON.parse(stored));
        }
      } catch (err) {
        logger.error('Failed to parse user from localStorage', err);
      }
    }
  }, []);

  const login = useCallback((userObj) => {
    setCurrentUser(userObj);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tanico_user', JSON.stringify(userObj));
      if (userObj?.sessionToken) {
        const isHttps = window.location.protocol === 'https:';
        const sameSiteClause = isHttps ? '; SameSite=None; Secure' : '; SameSite=Lax';
        document.cookie = `tanico_session=${userObj.sessionToken}; path=/${sameSiteClause}; max-age=${60 * 60 * 24 * 7}`;
      }
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tanico_user');
      document.cookie = 'tanico_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }, []);

  const updateProfile = useCallback((updatedFields) => {
    setCurrentUser((prev) => {
      const newUser = { ...prev, ...updatedFields };
      if (typeof window !== 'undefined') {
        localStorage.setItem('tanico_user', JSON.stringify(newUser));
        if (newUser?.sessionToken) {
          document.cookie = `tanico_session=${newUser.sessionToken}; path=/; max-age=${60 * 60 * 24 * 7}; sameSite=lax`;
        }
      }
      return newUser;
    });
  }, []);

  const value = useMemo(() => ({
    currentUser,
    login,
    loginSuccess: login,
    loginAdmin: login,
    logout,
    updateProfile,
    isAdmin: currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN',
  }), [currentUser, login, logout, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function ToastProviderInternal({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({ toasts, addToast, removeToast }), [toasts, addToast, removeToast]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

function UIProviderInternal({ children }) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const value = useMemo(() => ({
    isAuthOpen,
    setIsAuthOpen,
    isCheckoutOpen,
    setIsCheckoutOpen,
    isCartOpen,
    setIsCartOpen,
    isWishlistOpen,
    setIsWishlistOpen,
    searchQuery,
    setSearchQuery,
  }), [isAuthOpen, isCheckoutOpen, isCartOpen, isWishlistOpen, searchQuery]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useToast() {
  return useContext(ToastContext);
}

export function useUI() {
  return useContext(UIContext);
}

export function useLayout() {
  const auth = useContext(AuthContext);
  const toast = useContext(ToastContext);
  const ui = useContext(UIContext);

  return useMemo(() => ({
    ...(auth || {}),
    ...(toast || {}),
    ...(ui || {}),
  }), [auth, toast, ui]);
}

export function LayoutProvider({ children }) {
  return (
    <ToastProviderInternal>
      <AuthProviderInternal>
        <UIProviderInternal>
          {children}
        </UIProviderInternal>
      </AuthProviderInternal>
    </ToastProviderInternal>
  );
}
