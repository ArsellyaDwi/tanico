"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Plus, Trash2, ShoppingCart, Truck, ArrowRight } from 'lucide-react';
import { formatRupiah } from '@/utils/formatters';
import { LIMITS } from '@/utils/constants';

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onRemoveItem
}) {
  const router = useRouter();
  const subtotal = cart.reduce((acc, item) => {
    return acc + (item.price * item.quantity);
  }, 0);

  // Free shipping over 50k, otherwise estimation 10k
  const shippingEstimation = subtotal >= LIMITS.FREE_SHIPPING_THRESHOLD ? 0 : 10000;
  const total = subtotal + shippingEstimation;

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
                  <ShoppingCart className="w-5 h-5 text-[#174C3C]" strokeWidth={1.5} />
                  <h3 className="font-jost text-base font-bold text-[#174C3C]">Keranjang Belanja</h3>
                  <span className="bg-[#E8F3EC] text-[#174C3C] text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
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

              {/* Cart List */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                    <div className="w-16 h-16 bg-[#E8F3EC] rounded-full flex items-center justify-center text-[#174C3C]">
                      <ShoppingCart className="w-6 h-6" strokeWidth={1.5} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-extrabold text-neutral-800">Keranjang Masih Kosong</p>
                      <p className="text-xs text-neutral-400 max-w-xs font-medium">
                        Belum ada sayur premium yang ditambahkan. Mari jelajahi produk segar kami.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-200/50">
                    {cart.map((item, idx) => (
                      <motion.div
                        layout
                        key={`${item.cartItemId || item.id || item.productId || 'cart'}-${idx}`}
                        className="py-4 flex gap-4 text-left items-start"
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
                            </div>
                            <button
                              onClick={() => onRemoveItem(item.id || item.productId, item.name)}
                              className="text-neutral-300 hover:text-rose-600 p-1 rounded-full hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                              aria-label="Hapus item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            {/* Quantity controller */}
                            <div className="flex items-center border border-neutral-200 bg-white rounded-lg p-0.5 shadow-3xs">
                              <button
                                onClick={() => onUpdateQty(item.id || item.productId, -1)}
                                className="w-6 h-6 hover:bg-neutral-50 text-neutral-600 flex items-center justify-center font-bold text-xs rounded transition-colors cursor-pointer"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="w-6 text-center text-xs font-bold text-[#174C3C]">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => onUpdateQty(item.id || item.productId, 1)}
                                className="w-6 h-6 hover:bg-neutral-50 text-neutral-600 flex items-center justify-center font-bold text-xs rounded transition-colors cursor-pointer"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              <span className="text-xs font-extrabold text-[#174C3C]">
                                {formatRupiah(item.price * item.quantity)}
                              </span>
                              <span className="text-[10px] text-neutral-400 block">
                                @ {formatRupiah(item.price)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Drawer Footer (Sticky) */}
              {cart.length > 0 && (
                <div className="border-t border-neutral-200/60 p-6 bg-[#FCFCFC] space-y-4">
                  {/* Shipping info */}
                  <div className="bg-[#E8F3EC] px-4 py-3 rounded-xl flex items-start gap-3 text-left">
                    <Truck className="w-4 h-4 text-[#174C3C] shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-[10px] uppercase tracking-wider text-[#174C3C] font-extrabold">Estimasi Pengiriman</p>
                      <p className="text-xs text-[#174C3C] font-medium leading-normal">
                        {subtotal >= LIMITS.FREE_SHIPPING_THRESHOLD 
                          ? 'Selamat! Anda berhak mendapatkan gratis ongkir se-Kabupaten Bangka.' 
                          : `Belanja ${formatRupiah(LIMITS.FREE_SHIPPING_THRESHOLD - subtotal)} lagi untuk Gratis Ongkir.`}
                      </p>
                    </div>
                  </div>

                  {/* Calculations */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-xs text-neutral-500 font-medium">
                      <span>Subtotal Pangan</span>
                      <span>{formatRupiah(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-neutral-500 font-medium">
                      <span>Estimasi Ongkir</span>
                      <span>
                        {shippingEstimation === 0 ? (
                          <span className="text-[#6E9C7C] font-bold">Gratis</span>
                        ) : (
                          formatRupiah(shippingEstimation)
                        )}
                      </span>
                    </div>
                    <div className="h-[1px] bg-neutral-200/50" />
                    <div className="flex justify-between text-sm text-[#174C3C] font-extrabold pt-1">
                      <span>Total Tagihan</span>
                      <span>{formatRupiah(total)}</span>
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="grid grid-cols-2 gap-3.5 pt-2">
                    <button
                      onClick={onClose}
                      className="w-full h-11 border border-[#174C3C] text-[#174C3C] font-jost text-xs uppercase tracking-wider font-extrabold hover:bg-[#174C3C]/5 transition-all rounded-xl cursor-pointer"
                    >
                      Lanjut Belanja
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        router.push('/checkout');
                      }}
                      className="w-full h-11 bg-[#174C3C] hover:bg-[#1f5e4b] text-white font-jost text-xs uppercase tracking-wider font-extrabold flex items-center justify-center gap-1.5 shadow-sm rounded-xl transition-all cursor-pointer hover:shadow-md"
                    >
                      <span>Checkout</span>
                      <ArrowRight className="w-3.5 h-3.5" />
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
