"use client";

import React, { useState, useEffect, useRef } from 'react';
import { logger } from '@/utils/logger';
import { ShoppingCart } from 'lucide-react';

export default function AdminCartPage() {
  const [cartItemsData, setCartItemsData] = useState([]);
  const [totalCartCount, setTotalCartCount] = useState(0);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [isLoadingCart, setIsLoadingCart] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const getAuthHeaders = () => {
    const headers = {};
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('tanico_user');
        if (stored) {
          const u = JSON.parse(stored);
          if (u?.sessionToken) {
            headers['Authorization'] = `Bearer ${u.sessionToken}`;
          }
        }
      } catch (e) {}
    }
    return headers;
  };

  const fetchCartData = async () => {
    setIsLoadingCart(true);
    try {
      const res = await fetch('/api/admin/cart', { headers: getAuthHeaders() });
      if (res.ok) {
        const carts = await res.json();
        if (Array.isArray(carts) && isMountedRef.current) {
          // Aggregate items per product
          const productMap = {};
          let totalQty = 0;
          let userCount = 0;

          carts.forEach(cart => {
            if (cart.items && cart.items.length > 0) {
              userCount += 1;
              cart.items.forEach(item => {
                const pId = item.productId;
                const pName = item.product?.name || 'Produk';
                const qty = Number(item.quantity) || 1;
                totalQty += qty;

                if (!productMap[pId]) {
                  productMap[pId] = {
                    id: pId,
                    name: pName,
                    count: 0,
                    userCount: 0
                  };
                }
                productMap[pId].count += qty;
                productMap[pId].userCount += 1;
              });
            }
          });

          const sortedList = Object.values(productMap).sort((a, b) => b.count - a.count);
          setCartItemsData(sortedList);
          setTotalCartCount(totalQty);
          setTotalUsersCount(userCount);
        }
      } else {
        logger.warn(`fetchCartData non-OK status: ${res.status}`);
      }
    } catch (err) {
      logger.error('Error loading cart data:', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingCart(false);
      }
    }
  };

  useEffect(() => {
    fetchCartData();
  }, []);

  const maxPortion = cartItemsData.length > 0 ? Math.max(...cartItemsData.map(c => c.count)) : 1;

  return (
    <div className="space-y-6 text-left font-sans">
      <div>
        <span className="font-sans text-[10px] uppercase tracking-wider text-[#6E9C7C] font-bold block">ANALYTICS</span>
        <h3 className="font-sans text-2xl text-[#174C3C] font-bold mt-1">Minat Keranjang Belanja</h3>
      </div>

      <div className="bg-white border border-[#DDE9DF] p-6 rounded-2xl shadow-2xs space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-sans text-sm text-[#174C3C] font-bold">Estimasi Jumlah Porsi di Tas Belanja</h4>
          {cartItemsData.length > 0 && (
            <span className="text-[10px] text-[#174C3C] bg-[#ECF6ED] px-2.5 py-1 rounded-full font-bold">
              {totalCartCount} Porsi Aktif
            </span>
          )}
        </div>
        
        {isLoadingCart ? (
          <div className="space-y-4 py-2 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="h-3 w-32 bg-gray-200 rounded-md" />
                  <div className="h-3 w-16 bg-gray-200 rounded-md" />
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : cartItemsData && cartItemsData.length > 0 ? (
          <div className="space-y-4">
            {cartItemsData.map((p) => {
              const percentage = Math.round((p.count / maxPortion) * 100);
              return (
                <div key={p.id} className="space-y-1.5 text-xs text-left">
                  <div className="flex justify-between items-center font-sans text-[10px] uppercase tracking-wider font-bold">
                    <span className="text-gray-700">{p.name} ({p.userCount} Pelanggan)</span>
                    <span className="text-[#174C3C]">{p.count} Porsi</span>
                  </div>
                  <div className="h-2 w-full bg-[#FCFCFC] rounded-full overflow-hidden border border-[#DDE9DF]">
                    <div className="h-full bg-[#6E9C7C] transition-all duration-500" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400 space-y-2">
            <ShoppingCart className="w-8 h-8 mx-auto text-gray-300" />
            <p className="text-xs font-semibold">Belum ada item di keranjang belanja pengguna saat ini.</p>
          </div>
        )}

        {cartItemsData.length > 0 && (
          <div className="pt-4 border-t border-[#DDE9DF] flex items-center justify-between text-xs text-gray-500 font-semibold">
            <span>Total Porsi di Keranjang: {totalCartCount} porsi</span>
            <span>Pelanggan Aktif: {totalUsersCount} orang</span>
          </div>
        )}
      </div>
    </div>
  );
}
