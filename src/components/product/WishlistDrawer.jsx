"use client";

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, Trash2, ShoppingCart } from 'lucide-react';
import { formatRupiah } from '@/utils/formatters';

export default function WishlistDrawer({
  isOpen,
  onClose,
  wishlist,
  onToggleWishlist,
  onAddToCart,
  onOpenCartModal
}) {
  const [addingIds, setAddingIds] = React.useState({});

  const handleAddToCart = async (item) => {
    const itemId = item.id || item.productId;
    if (addingIds[itemId]) return;

    setAddingIds((prev) => ({ ...prev, [itemId]: true }));

    try {
      if (onAddToCart) {
        await onAddToCart(item);
      }
    } catch {
      // Ignored - error toasts are handled inside CartContext
    } finally {
      setTimeout(() => {
        setAddingIds((prev) => {
          const next = { ...prev };
          delete next[itemId];
          return next;
        });
      }, 600);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] overflow-hidden font-sans">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-900/30 backdrop-blur-xs cursor-pointer"
          />

          {/* Drawer container */}
          <div className="fixed inset-y-0 right-0 z-[151] max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-screen max-w-[420px] bg-[#FCFCFC] shadow-[0_20px_60px_rgba(22,58,46,0.15)] flex flex-col h-full border-l border-neutral-200/40"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-neutral-200/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-[#174C3C]" strokeWidth={1.5} fill="#174C3C" />
                  <h3 className="font-jost text-base font-bold text-[#174C3C]">Daftar Keinginan</h3>
                  <span className="bg-[#E8F3EC] text-[#174C3C] text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {wishlist.length}
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 transition-colors rounded-full cursor-pointer"
                  aria-label="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Wishlist List */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {wishlist.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                    <div className="w-16 h-16 bg-[#E8F3EC] rounded-full flex items-center justify-center text-[#174C3C]">
                      <Heart className="w-6 h-6" strokeWidth={1.5} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-extrabold text-neutral-800">Belum Ada Produk Favorit</p>
                      <p className="text-xs text-neutral-400 max-w-xs font-medium">
                        Simpan hasil panen pilihan Anda ke wishlist untuk memesannya kembali nanti.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-200/50">
                    {wishlist.map((item, idx) => (
                      <motion.div
                        layout
                        key={`${item.id || item.productId || 'wish'}-${idx}`}
                        className="py-4 flex gap-4 text-left items-center"
                      >
                        <img
                          src={item.image || null}
                          alt={item.name}
                          loading="lazy"
                          decoding="async"
                          className="w-16 h-16 object-cover bg-neutral-100 rounded-xl border border-neutral-100 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              {item.category && (
                                <span className="text-[9px] uppercase tracking-wider text-[#6E9C7C] font-bold">
                                  {item.category}
                                </span>
                              )}
                              <h4 className="text-xs font-extrabold text-neutral-800 truncate leading-snug">
                                {item.name}
                              </h4>
                              <p className="text-xs text-neutral-500 font-medium">
                                {formatRupiah(item.price)}{item.unit ? ` / ${item.unit}` : ''}
                              </p>
                            </div>
                            <button
                              onClick={() => onToggleWishlist(item)}
                              className="text-neutral-300 hover:text-rose-600 p-1 rounded-full hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                              aria-label="Hapus dari wishlist"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Action - Add to Cart */}
                          <button
                            disabled={!!addingIds[item.id || item.productId]}
                            onClick={() => handleAddToCart(item)}
                            className="flex items-center gap-1.5 text-[10px] text-white bg-[#174C3C] hover:bg-[#1f5e4b] disabled:opacity-60 px-3 py-1.5 font-bold uppercase tracking-widest transition-colors rounded-lg cursor-pointer"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            <span>Tambah ke Keranjang</span>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Drawer Footer (Sticky) */}
              {wishlist.length > 0 && (
                <div className="border-t border-neutral-200/60 p-6 bg-[#FCFCFC] space-y-3.5">
                  <div className="grid grid-cols-2 gap-3.5">
                    <button
                      onClick={onClose}
                      className="w-full h-11 border border-[#174C3C] text-[#174C3C] font-jost text-xs uppercase tracking-wider font-extrabold hover:bg-[#174C3C]/5 transition-all rounded-xl cursor-pointer"
                    >
                      Lanjut Belanja
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        if (onOpenCartModal) onOpenCartModal();
                      }}
                      className="w-full h-11 bg-[#174C3C] hover:bg-[#1f5e4b] text-white font-jost text-xs uppercase tracking-wider font-extrabold flex items-center justify-center gap-1.5 shadow-sm rounded-xl transition-all cursor-pointer hover:shadow-md"
                    >
                      <span>Lihat Keranjang</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
