"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLayout } from '@/context/LayoutContext';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, ArrowLeft, CreditCard, MapPin, Phone, User, Ticket, Check } from 'lucide-react';
import PageLayoutWrapper from '@/components/layout/PageLayoutWrapper';
import { formatRupiah } from '@/utils/formatters';

function CheckoutContent() {
  const router = useRouter();
  const { currentUser, addToast } = useLayout();
  const { cart, clearCart } = useCart();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [subdistrict, setSubdistrict] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Transfer Bank');
  const [voucherCode, setVoucherCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setPhone(currentUser.phone || '');
      setAddress(currentUser.address || '');
      setSubdistrict(currentUser.subdistrict || '');
    }
  }, [currentUser]);

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shippingCost = subtotal > 50000 ? 0 : 10000;
  const finalTotal = Math.max(0, subtotal + shippingCost - discount);

  const applyVoucher = () => {
    if (voucherCode.trim().toUpperCase() === 'TANICOPERDANA') {
      setDiscount(15000);
      setVoucherApplied(true);
      if (addToast) addToast('Voucher TANICOPERDANA berhasil digunakan! Diskon Rp 15.000.', 'success');
    } else {
      if (addToast) addToast('Kode voucher tidak valid.', 'error');
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      if (addToast) addToast('Keranjang Anda kosong.', 'error');
      return;
    }
    if (!name || !phone || !address || !subdistrict) {
      if (addToast) addToast('Harap lengkapi detail pengiriman Anda.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          phone,
          address,
          subdistrict,
          paymentMethod,
          voucherCode: voucherApplied ? voucherCode : '',
          items: cart.map(item => ({
            productId: item.id || item.productId,
            quantity: item.quantity
          }))
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        if (addToast) addToast(data.error || 'Gagal memproses pesanan. Silakan coba lagi.', 'error');
        return;
      }

      const createdOrder = data.order;

      // ✅ Simpan ke localStorage SEBELUM clearCart dan redirect
      localStorage.setItem('tanico_active_checkout_id', createdOrder.id);
      localStorage.setItem('tanico_active_checkout_total', String(createdOrder.totalAmount));

      // ✅ Debug: cek apakah tersimpan
      console.log('Order saved:', {
        id: localStorage.getItem('tanico_active_checkout_id'),
        total: localStorage.getItem('tanico_active_checkout_total')
      });

      if (addToast) addToast('Pemesanan berhasil dicatat! Menuju halaman pembayaran.', 'success');

      // Redirect ke payment
      router.push('/payment');
    } catch (err) {
      console.error('Checkout error:', err);
      if (addToast) addToast(err.message || 'Gagal memproses pesanan. Silakan coba lagi.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <ShoppingBag className="w-16 h-16 text-gray-300" />
        <h2 className="text-2xl font-bold font-sans text-[#1B4D3E]">Keranjang Belanja Kosong</h2>
        <p className="text-gray-500 text-sm max-w-sm">Anda belum menambahkan sayur organik segar fajar pilihan ke dalam keranjang belanja.</p>
        <button
          onClick={() => router.push('/produk')}
          className="px-6 py-2.5 bg-[#1B4D3E] text-white text-xs font-bold rounded-full cursor-pointer hover:bg-[#143D31]"
        >
          Belanja Sayur Segar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#FCFCFC] text-[#111111] font-jost pb-24 text-left">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-12">
        <div className="flex items-center gap-2 mb-8">
          <button 
            onClick={() => router.push('/produk')}
            className="flex items-center gap-1 text-xs font-bold text-[#1B4D3E] hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>KEMBALI KE KATALOG</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Shipping Form & Payment Column */}
          <div className="lg:col-span-7 bg-white border border-[#DDE9DF] rounded-3xl p-8 shadow-xs space-y-8">
            <h2 className="text-xl font-bold font-sans text-[#1B4D3E] border-b border-[#DDE9DF] pb-4">Detail Pengiriman</h2>
            
            <form onSubmit={handlePlaceOrder} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Penerima Pesanan</label>
                  <div className="relative h-11">
                    <User className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Nama Penerima"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-full bg-gray-50 border border-[#DDE9DF] focus:border-[#1B4D3E] focus:bg-white rounded-xl text-sm pl-11 pr-4 outline-none transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Nomor WhatsApp HP</label>
                  <div className="relative h-11">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="Contoh: 0812XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-full bg-gray-50 border border-[#DDE9DF] focus:border-[#1B4D3E] focus:bg-white rounded-xl text-sm pl-11 pr-4 outline-none transition-all duration-300"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Kecamatan (Kab. Bangka)</label>
                  <div className="relative h-11">
                    <MapPin className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Pemali, Merawang, Sungailiat"
                      value={subdistrict}
                      onChange={(e) => setSubdistrict(e.target.value)}
                      className="w-full h-full bg-gray-50 border border-[#DDE9DF] focus:border-[#1B4D3E] focus:bg-white rounded-xl text-sm pl-11 pr-4 outline-none transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Alamat Rumah Lengkap</label>
                  <div className="relative h-11">
                    <MapPin className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Jl. Raya, Blok, No Rumah..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full h-full bg-gray-50 border border-[#DDE9DF] focus:border-[#1B4D3E] focus:bg-white rounded-xl text-sm pl-11 pr-4 outline-none transition-all duration-300"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-4 pt-4 border-t border-[#DDE9DF]">
                <h3 className="font-bold text-sm uppercase tracking-wider text-[#1B4D3E]">Metode Pembayaran</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'Transfer Bank', desc: 'Virtual Account BCA, Mandiri, BNI' },
                    { id: 'Dompet Digital', desc: 'GoPay, QRIS, ShopeePay' }
                  ].map((p) => (
                    <label
                      key={p.id}
                      onClick={() => setPaymentMethod(p.id)}
                      className={`p-4 border rounded-2xl flex items-start gap-4 cursor-pointer transition-all ${
                        paymentMethod === p.id
                          ? 'border-[#1B4D3E] bg-[#1B4D3E]/5'
                          : 'border-[#DDE9DF] hover:border-[#1B4D3E]/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        checked={paymentMethod === p.id}
                        onChange={() => {}}
                        className="mt-0.5 accent-[#1B4D3E]"
                      />
                      <div>
                        <p className="font-bold text-xs text-[#1B4D3E]">{p.id}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{p.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 flex items-center justify-center gap-2 bg-[#1B4D3E] hover:bg-[#143D31] active:bg-[#0F2D24] text-white font-bold text-xs rounded-full shadow-md cursor-pointer transition-colors"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CreditCard className="w-4.5 h-4.5" />
                    <span>Lanjutkan Pembayaran ({formatRupiah(finalTotal)})</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Cart Bill Details Column */}
          <div className="lg:col-span-5 bg-white border border-[#DDE9DF] rounded-3xl p-8 shadow-xs space-y-6">
            <h2 className="text-xl font-bold font-sans text-[#1B4D3E] border-b border-[#DDE9DF] pb-4">Ringkasan Pesanan</h2>

            <div className="divide-y divide-[#DDE9DF] max-h-60 overflow-y-auto pr-2">
              {cart.map((item) => (
                <div key={item.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-[#1B4D3E]">{item.name}</p>
                    <p className="text-gray-400 mt-0.5">Jumlah: {item.quantity} x {formatRupiah(item.price)}{item.unit ? ` / ${item.unit}` : ''}</p>
                  </div>
                  <p className="font-bold text-gray-700">{formatRupiah(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            {/* Promo Code Input */}
            <div className="pt-4 border-t border-[#DDE9DF] space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Punya Kode Voucher?</p>
              <div className="flex gap-2 h-10">
                <div className="relative flex-grow">
                  <Ticket className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    disabled={voucherApplied}
                    placeholder="Contoh: TANICOPERDANA"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    className="w-full h-full bg-gray-50 border border-[#DDE9DF] rounded-xl pl-9 pr-3 text-xs font-semibold focus:border-[#1B4D3E] outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={applyVoucher}
                  disabled={voucherApplied}
                  className={`px-4 bg-[#1B4D3E] hover:bg-[#143D31] text-white text-[10px] font-bold rounded-xl flex items-center gap-1 shrink-0 ${
                    voucherApplied ? 'bg-green-600 hover:bg-green-600' : ''
                  }`}
                >
                  {voucherApplied ? <Check className="w-3.5 h-3.5" /> : 'Gunakan'}
                </button>
              </div>
              <p className="text-[10px] text-gray-400">Gunakan voucher <span className="font-bold text-[#1B4D3E]">TANICOPERDANA</span> untuk diskon Rp 15.000!</p>
            </div>

            {/* Bill Receipts */}
            <div className="pt-4 border-t border-[#DDE9DF] space-y-2.5 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal Sayur</span>
                <span className="font-semibold">{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Ongkos Kirim Fajar</span>
                <span className="font-semibold">
                  {shippingCost === 0 ? <span className="text-green-600 font-bold uppercase tracking-wider text-[10px]">GRATIS</span> : formatRupiah(shippingCost)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Diskon Voucher</span>
                  <span className="font-bold">- {formatRupiah(discount)}</span>
                </div>
              )}

              <div className="pt-4 border-t border-[#DDE9DF] flex justify-between items-center text-sm">
                <span className="font-bold text-[#1B4D3E]">TOTAL BELANJA</span>
                <span className="font-extrabold text-[#1B4D3E] text-base">{formatRupiah(finalTotal)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <PageLayoutWrapper>
      <CheckoutContent />
    </PageLayoutWrapper>
  );
}