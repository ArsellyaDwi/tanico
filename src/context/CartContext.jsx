"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '@/utils/logger';

const CartContext = createContext(null);

export function CartProvider({ children, currentUser, onAddToast }) {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  const isFetchingCartRef = React.useRef(false);
  const fetchedUserIdRef = React.useRef(null);

  // Helper to normalize cart items
  const normalizeCartItems = useCallback((items) => {
    return items.map((item) => {
      const productObj = item.product || {
        id: item.productId,
        name: item.name || '',
        price: Number(item.price || 0),
        unit: item.unit || '',
        image: item.image || ''
      };
      return {
        ...productObj,
        product: productObj,
        productId: item.productId,
        quantity: item.quantity,
        weightGrams: item.weightGrams || null,
        cartItemId: item.id
      };
    });
  }, []);

  // Restore cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tanico_cart_cache');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCart(normalizeCartItems(parsed));
          }
        }
      } catch (_) {}
    }
  }, [normalizeCartItems]);

  // Sync cart state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (cart && cart.length > 0) {
          localStorage.setItem('tanico_cart_cache', JSON.stringify(cart));
        } else if (!currentUser) {
          localStorage.removeItem('tanico_cart_cache');
        }
      } catch (_) {}
    }
  }, [cart, currentUser]);

  // Get auth headers for API calls
  const getAuthHeaders = useCallback(() => {
    if (!currentUser || !currentUser.id) return {};
    const token = currentUser?.sessionToken;
    return {
      'x-user-id': currentUser.id,
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }, [currentUser]);

  // Load cart from server, but DO NOT override local cart if server returns empty
  const loadCart = useCallback(async (force = false) => {
    if (!currentUser || !currentUser.id) {
      setCart([]);
      fetchedUserIdRef.current = null;
      if (typeof window !== 'undefined') {
        try { localStorage.removeItem('tanico_cart_cache'); } catch (_) {}
      }
      return;
    }

    if (!force && fetchedUserIdRef.current === currentUser.id) return;
    if (isFetchingCartRef.current) return;

    isFetchingCartRef.current = true;

    try {
      setLoading(true);
      const res = await fetch('/api/cart', {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });
      if (res.ok) {
        const data = await res.json();
        const normalized = normalizeCartItems(data);

        // ✅ Only update cart if server returns items, otherwise keep local cart
        if (normalized.length > 0) {
          setCart(normalized);
        } else {
          // Server cart is empty – keep local cart if it has items
          if (cart.length > 0) {
            console.log('ℹ️ Server cart empty, keeping local cart (', cart.length, 'items)');
            // Do not setCart([]) — keep local cart
          } else {
            // Both local and server are empty, ensure cart is empty
            setCart([]);
          }
        }
        fetchedUserIdRef.current = currentUser.id;
      }
    } catch (err) {
      logger.error('Failed to load cart:', err);
    } finally {
      setLoading(false);
      isFetchingCartRef.current = false;
    }
  }, [currentUser, getAuthHeaders, normalizeCartItems, cart.length]);

  // Trigger load on user change
  useEffect(() => {
    if (currentUser?.id) {
      loadCart();
    } else {
      setCart([]);
      fetchedUserIdRef.current = null;
    }
  }, [currentUser?.id, loadCart]);

  // Add item to cart
  const addToCart = useCallback(async (product, qty = 1, weightGrams = null, customPrice = null, options = {}) => {
    if (!currentUser) {
      if (onAddToast) onAddToast("Silakan masuk terlebih dahulu.", "error");
      return false;
    }

    const productId = product?.id || product?.productId;
    if (!productId) {
      if (onAddToast) onAddToast("ID produk tidak valid.", "error");
      return false;
    }

    let previousCart = [];

    setCart(prevCart => {
      previousCart = prevCart;
      const existing = prevCart.find(item => item.id === productId || item.productId === productId);
      if (existing) {
        return prevCart.map(item =>
          (item.id === productId || item.productId === productId)
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      } else {
        const normalizedNewItem = {
          ...product,
          id: productId,
          product,
          productId,
          quantity: qty,
          weightGrams: weightGrams || product.weightGrams || null,
          price: customPrice || product.price
        };
        return [...prevCart, normalizedNewItem];
      }
    });

    if (!options.silentToast && onAddToast) {
      onAddToast(`Berhasil menambahkan ${product.name || 'Produk'} ke keranjang.`, 'success');
    }

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ productId, quantity: qty })
      });
      if (!res.ok) throw new Error('Failed to add item to cart on server');
      return true;
    } catch (err) {
      logger.error('Cart sync error, reverting:', err);
      setCart(previousCart);
      if (onAddToast) onAddToast("Gagal menyelaraskan Keranjang dengan server.", "error");
      return false;
    }
  }, [currentUser, getAuthHeaders, onAddToast]);

  // Update quantity (if qty <= 0, remove item)
  const updateCartQty = useCallback(async (productId, qty) => {
    if (!currentUser) return;

    let previousCart = [];
    let isFound = false;

    setCart(prevCart => {
      previousCart = prevCart;
      const existing = prevCart.find(item => item.id === productId || item.productId === productId);
      if (!existing) return prevCart;
      isFound = true;

      if (qty <= 0) {
        return prevCart.filter(item => item.id !== productId && item.productId !== productId);
      } else {
        return prevCart.map(item =>
          (item.id === productId || item.productId === productId)
            ? { ...item, quantity: qty }
            : item
        );
      }
    });

    if (!isFound) return;

    if (qty <= 0) {
      if (onAddToast) onAddToast('Produk dihapus dari keranjang.', 'info');
      try {
        const res = await fetch(`/api/cart/${productId}`, {
          method: 'DELETE',
          headers: {
            ...getAuthHeaders()
          }
        });
        if (!res.ok) throw new Error('Failed to delete cart item');
      } catch (err) {
        logger.error('Error deleting cart item:', err);
        setCart(previousCart);
      }
    } else {
      try {
        const res = await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({ productId, setQuantity: qty })
        });
        if (!res.ok) throw new Error('Failed to update cart quantity');
      } catch (err) {
        logger.error('Error updating cart item qty:', err);
        setCart(previousCart);
      }
    }
  }, [currentUser, getAuthHeaders, onAddToast]);

  const removeFromCart = useCallback(async (productId) => {
    if (!currentUser) return;
    await updateCartQty(productId, 0);
  }, [currentUser, updateCartQty]);

  // Clear cart (only after successful payment)
  const clearCart = useCallback(async () => {
    console.trace('🧹 clearCart dipanggil!');
    if (!currentUser) {
      setCart([]);
      return;
    }
    let previousCart = [];
    setCart(prevCart => {
      previousCart = prevCart;
      return [];
    });

    try {
      await Promise.all(
        previousCart.map(item => {
          const pId = item.id || item.productId;
          return fetch(`/api/cart/${pId}`, {
            method: 'DELETE',
            headers: {
              ...getAuthHeaders()
            }
          });
        })
      );
    } catch (err) {
      logger.error('Failed to clear cart on server:', err);
    }
  }, [currentUser, getAuthHeaders]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const value = useMemo(() => ({
    cart,
    cartCount,
    loading,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    loadCart
  }), [cart, cartCount, loading, addToCart, updateCartQty, removeFromCart, clearCart, loadCart]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}