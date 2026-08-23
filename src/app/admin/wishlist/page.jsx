"use client";

import React, { useState, useEffect, useRef } from 'react';
import { logger } from '@/utils/logger';

export default function AdminWishlistPage() {
  const [wishlistData, setWishlistData] = useState(null);
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);
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

  const fetchWishlistAnalytics = async () => {
    setIsLoadingWishlist(true);
    try {
      const res = await fetch('/api/admin/wishlist', { headers: getAuthHeaders() });
      if (res.ok) {
        const wishlists = await res.json();
        if (Array.isArray(wishlists) && isMountedRef.current) {
          const productMap = {};
          let totalItems = 0;
          let usersSaving = 0;

          wishlists.forEach(wl => {
            if (wl.items && wl.items.length > 0) {
              usersSaving += 1;
              wl.items.forEach(item => {
                const pId = item.productId;
                const pName = item.product?.name || 'Produk';
                totalItems += 1;

                if (!productMap[pId]) {
                  productMap[pId] = {
                    id: pId,
                    name: pName,
                    count: 0
                  };
                }
                productMap[pId].count += 1;
              });
            }
          });

          const sortedList = Object.values(productMap).sort((a, b) => b.count - a.count);
          setWishlistData({
            totalWishlist: totalItems,
            usersSavingCount: usersSaving,
            mostWishlisted: sortedList
          });
        }
      } else {
        logger.warn(`fetchWishlistAnalytics non-OK status: ${res.status}`);
      }
    } catch (err) {
      logger.error('Error loading wishlist analytics:', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingWishlist(false);
      }
    }
  };

  useEffect(() => {
    fetchWishlistAnalytics();
  }, []);

  return (
    <div className="space-y-6 text-left font-sans">
      <div>
        <span className="font-sans text-[10px] uppercase tracking-wider text-[#6E9C7C] font-bold block">ANALYTICS</span>
        <h3 className="font-sans text-2xl text-[#174C3C] font-bold mt-1">Suka / Favorit Produk</h3>
      </div>

      <div className="bg-white border border-[#DDE9DF] p-6 rounded-2xl shadow-2xs space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-sans text-sm text-[#174C3C] font-bold">Daftar Sayur Paling Sering Disimpan</h4>
          {wishlistData && (
            <span className="text-[10px] text-[#174C3C] px-2.5 py-1 rounded-full font-bold">
              Pertumbuhan: +{wishlistData.wishlistGrowth}%
            </span>
          )}
        </div>

        {isLoadingWishlist ? (
          <div className="space-y-4 py-2 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="h-3 w-32 bg-gray-200 rounded-md" />
                  <div className="h-3 w-20 bg-gray-200 rounded-md" />
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : wishlistData && wishlistData.mostWishlisted && wishlistData.mostWishlisted.length > 0 ? (
          <div className="space-y-4">
            {wishlistData.mostWishlisted.map((item) => {
              const maxCount = wishlistData.mostWishlisted[0]?.count || 1;
              return (
                <div key={item.id} className="space-y-1.5 text-xs text-left">
                  <div className="flex justify-between items-center font-sans text-[10px] uppercase tracking-wider font-bold">
                    <span className="text-gray-700">{item.name}</span>
                    <span className="text-[#174C3C]">{item.count} Pelanggan</span>
                  </div>
                  <div className="h-2 w-full bg-[#FCFCFC] rounded-full overflow-hidden border border-[#DDE9DF]">
                    <div className="h-full bg-[#174C3C]" style={{ width: `${(item.count / maxCount) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-8 text-center text-gray-400 text-xs font-semibold">Belum ada sayuran premium yang disimpan di Wishlist.</p>
        )}

        {wishlistData && (
          <div className="pt-4 border-t border-[#DDE9DF] flex items-center justify-between text-xs text-gray-500 font-semibold">
            <span>Total Item Disimpan: {wishlistData.totalWishlist} pcs</span>
            <span>Pelanggan Menyimpan: {wishlistData.usersSavingCount} orang</span>
          </div>
        )}
      </div>
    </div>
  );
}
