"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '@/utils/logger';

const WishlistContext = createContext(null);

export function WishlistProvider({ children, currentUser, onAddToast }) {
  // Helper to normalize wishlist array to support both .includes(id) and array of objects
  const createCompatibleArray = useCallback((items) => {
    const arr = [...items];
    arr.includes = function (id) {
      return this.some(
        (item) =>
          item === id ||
          (item && item.id === id) ||
          (item && item.productId === id)
      );
    };
    return arr;
  }, []);

  const [wishlist, setWishlist] = useState(() => createCompatibleArray([]));
  const [loading, setLoading] = useState(false);

  const isFetchingWishlistRef = React.useRef(false);
  const fetchedWishlistUserIdRef = React.useRef(null);

  // Restore wishlist from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tanico_wishlist_cache');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setWishlist(createCompatibleArray(parsed));
          }
        }
      } catch (_) {}
    }
  }, [createCompatibleArray]);

  // Sync wishlist to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (wishlist && wishlist.length > 0) {
          localStorage.setItem('tanico_wishlist_cache', JSON.stringify(wishlist));
        } else if (!currentUser) {
          localStorage.removeItem('tanico_wishlist_cache');
        }
      } catch (_) {}
    }
  }, [wishlist, currentUser]);

  const loadWishlist = useCallback(async (force = false) => {
    if (!currentUser || !currentUser.id) {
      setWishlist(createCompatibleArray([]));
      fetchedWishlistUserIdRef.current = null;
      if (typeof window !== 'undefined') {
        try { localStorage.removeItem('tanico_wishlist_cache'); } catch (_) {}
      }
      return;
    }

    if (!force && fetchedWishlistUserIdRef.current === currentUser.id) return;
    if (isFetchingWishlistRef.current) return;

    isFetchingWishlistRef.current = true;

    try {
      setLoading(true);
      const res = await fetch('/api/wishlist', {
        headers: {
          'x-user-id': currentUser.id,
          'Authorization': `Bearer ${currentUser.id}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        const normalized = data.map((item) => ({
          ...(item.product || {}),
          wishlistItemId: item.id,
          productId: item.productId
        }));
        setWishlist(createCompatibleArray(normalized));
        fetchedWishlistUserIdRef.current = currentUser.id;
      }
    } catch (err) {
      logger.error('Failed to load wishlist:', err);
    } finally {
      setLoading(false);
      isFetchingWishlistRef.current = false;
    }
  }, [currentUser?.id, createCompatibleArray]);

  // Load wishlist when user changes
  useEffect(() => {
    if (currentUser?.id) {
      loadWishlist();
    } else {
      setWishlist(createCompatibleArray([]));
      fetchedWishlistUserIdRef.current = null;
    }
  }, [currentUser?.id, loadWishlist]);

  const toggleWishlist = useCallback(async (product) => {
    if (!currentUser) {
      if (onAddToast) {
        onAddToast("Silakan masuk terlebih dahulu untuk menambahkan produk ke Wishlist.", "error");
      }
      return;
    }

    const productId = typeof product === 'string' ? product : product.id;
    let isAlreadyWishlisted = false;
    let previousWishlist = [];

    setWishlist(prevList => {
      previousWishlist = prevList;
      isAlreadyWishlisted = prevList.some(item => item.id === productId || item.productId === productId);

      if (isAlreadyWishlisted) {
        const updated = prevList.filter(item => item.id !== productId && item.productId !== productId);
        return createCompatibleArray(updated);
      } else {
        const fullProduct = typeof product === 'object' ? product : { id: productId, name: 'Produk Segar', price: 15000, unit: 'ikat' };
        const updated = [...prevList, { ...fullProduct, productId }];
        return createCompatibleArray(updated);
      }
    });

    if (onAddToast) {
      if (isAlreadyWishlisted) {
        const pName = typeof product === 'object' ? product.name : 'Produk';
        onAddToast(`${pName} dihapus dari daftar keinginan.`, 'info');
      } else {
        const pName = typeof product === 'object' ? product.name : 'Produk';
        onAddToast(`${pName} disimpan ke daftar keinginan.`, 'success');
      }
    }

    // Sync with server
    try {
      if (isAlreadyWishlisted) {
        const res = await fetch(`/api/wishlist/${productId}`, {
          method: 'DELETE',
          headers: {
            'x-user-id': currentUser.id,
            'Authorization': `Bearer ${currentUser.id}`
          }
        });
        if (!res.ok) {
          throw new Error('Failed to delete wishlist item on server');
        }
      } else {
        const res = await fetch('/api/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser.id,
            'Authorization': `Bearer ${currentUser.id}`
          },
          body: JSON.stringify({ productId })
        });
        if (!res.ok) {
          throw new Error('Failed to add wishlist item on server');
        }
      }
    } catch (err) {
      logger.error('Wishlist sync error, reverting state:', err);
      setWishlist(createCompatibleArray(previousWishlist));
      if (onAddToast) {
        onAddToast("Gagal menyelaraskan Wishlist dengan server.", "error");
      }
    }
  }, [currentUser, createCompatibleArray, onAddToast]);

  const wishlistCount = useMemo(() => wishlist.length, [wishlist]);

  const value = useMemo(() => ({
    wishlist,
    wishlistCount,
    loading,
    toggleWishlist,
    loadWishlist
  }), [wishlist, wishlistCount, loading, toggleWishlist, loadWishlist]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
