"use client";

import React, { useState } from 'react';
import { Save } from 'lucide-react';
import AdminButton from '@/components/admin/AdminButton';
import { useAdmin } from '@/components/admin/AdminShell';

export default function AdminStockPage() {
  const {
    products,
    handleEditProduct,
    addToast,
    handleAddActivityLog
  } = useAdmin();

  const [selectedStockProduct, setSelectedStockProduct] = useState('');
  const [stockType, setStockType] = useState('Masuk');
  const [stockQty, setStockQty] = useState(10);
  const [stockNotes, setStockNotes] = useState('');
  const [stockHistory, setStockHistory] = useState([]);

  React.useEffect(() => {
    let isMounted = true;
    async function loadStockHistory() {
      try {
        const res = await fetch('/api/admin/stock');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setStockHistory(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error fetching stock history:', err);
      }
    }
    loadStockHistory();
    return () => { isMounted = false; };
  }, []);

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStockProduct) {
      addToast('Harap pilih produk sayuran terlebih dahulu!', 'error');
      return;
    }
    const targetProduct = products.find(p => p.id === selectedStockProduct);
    if (!targetProduct) return;

    const qtyChange = Number(stockQty);
    const newStock = stockType === 'Masuk' ? targetProduct.stock + qtyChange : Math.max(0, targetProduct.stock - qtyChange);

    try {
      const res = await fetch('/api/admin/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedStockProduct,
          productName: targetProduct.name,
          type: stockType,
          quantity: qtyChange,
          notes: stockNotes || 'Logistik Gudang'
        })
      });

      if (res.ok) {
        const savedHistory = await res.json();
        setStockHistory(prev => [savedHistory, ...prev]);
        handleEditProduct({ ...targetProduct, stock: newStock });
        addToast(`Berhasil mencatat stok ${stockType} (${qtyChange} porsi) untuk ${targetProduct.name}`, 'success');
        handleAddActivityLog(`Stok ${stockType} ${targetProduct.name} (+${qtyChange})`);

        // Reset Form
        setStockQty(10);
        setStockNotes('');
      } else {
        addToast('Gagal mencatat mutasi stok.', 'error');
      }
    } catch (err) {
      console.error('Error saving stock mutation:', err);
      addToast('Terjadi kesalahan saat menyimpan stok.', 'error');
    }
  };

  return (
    <div className="space-y-6 text-left font-sans">
      
      <div>
        <span className="font-sans text-[9px] sm:text-[10px] uppercase tracking-wider text-[#6E9C7C] font-bold block">GUDANG LOGISTIK</span>
        <h3 className="font-sans text-xl sm:text-2xl text-[#174C3C] font-bold mt-0.5">Mutasi & Stok Sayuran</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Left Stock Form */}
        <form onSubmit={handleRestockSubmit} className="lg:col-span-5 bg-white border border-[#DDE9DF] p-4 sm:p-5 rounded-2xl shadow-2xs space-y-4 text-left">
          <h4 className="font-sans text-xs sm:text-sm text-[#174C3C] font-bold">Pencatatan Stok Masuk/Keluar</h4>
          
          {/* Product Selection */}
          <div className="space-y-1">
            <label className="font-sans text-[9px] uppercase tracking-wider text-[#6B7280] font-bold block">Pilih Hasil Panen *</label>
            <select
              required
              value={selectedStockProduct}
              onChange={(e) => setSelectedStockProduct(e.target.value)}
              className="w-full text-xs sm:text-sm p-2.5 bg-[#FCFCFC] border border-[#DDE9DF] outline-none rounded-xl text-[#202020]"
            >
              <option value="">-- Pilih Sayuran --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (Sisa: {p.stock} {p.unit})</option>
              ))}
            </select>
          </div>

          {/* Type Allocation */}
          <div className="grid grid-cols-2 gap-2.5 font-sans text-[10px] uppercase tracking-wider font-bold">
            <button
              type="button"
              onClick={() => setStockType('Masuk')}
              className={`h-9 sm:h-10 text-xs sm:text-sm px-3 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer border ${
                stockType === 'Masuk' ? 'bg-[#174C3C] border-[#174C3C] text-white font-semibold' : 'bg-[#FCFCFC] border-[#DDE9DF] text-[#174C3C] hover:bg-[#DCEFE0]'
              }`}
            >
              Masuk (Panen Baru)
            </button>
            <button
              type="button"
              onClick={() => setStockType('Keluar')}
              className={`h-9 sm:h-10 text-xs sm:text-sm px-3 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer border ${
                stockType === 'Keluar' ? 'bg-red-700 border-red-700 text-white font-semibold' : 'bg-[#FCFCFC] border-[#DDE9DF] text-[#174C3C] hover:bg-[#FCFCFC]'
              }`}
            >
              Keluar (Sortir)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Quantity */}
            <div className="space-y-1">
              <label className="font-sans text-[9px] uppercase tracking-wider text-[#6B7280] font-bold block">Kuantitas Porsi *</label>
              <input
                type="number"
                required
                min={1}
                value={stockQty}
                onChange={(e) => setStockQty(Number(e.target.value))}
                className="w-full text-xs sm:text-sm p-2.5 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] focus:outline-none focus:border-[#174C3C] rounded-xl font-sans"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="font-sans text-[9px] uppercase tracking-wider text-[#6B7280] font-bold block">Keterangan Mutasi</label>
              <input
                type="text"
                placeholder="Contoh: Suplai Kebun A..."
                value={stockNotes}
                onChange={(e) => setStockNotes(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] focus:outline-none focus:border-[#174C3C] rounded-xl font-sans"
              />
            </div>
          </div>

          <AdminButton
            type="submit"
            variant="primary"
            size="md"
            icon={Save}
            fullWidth
          >
            Simpan Mutasi Stok
          </AdminButton>
        </form>

        {/* Right Stock History Logs */}
        <div className="lg:col-span-7 bg-white border border-[#DDE9DF] p-4 sm:p-5 rounded-2xl shadow-2xs space-y-3.5">
          <h4 className="font-sans text-xs sm:text-sm text-[#174C3C] font-bold">Riwayat Keluar Masuk Gudang</h4>
          
          <div className="divide-y divide-[#DDE9DF] max-h-80 overflow-y-auto">
            {stockHistory.length === 0 ? (
              <p className="text-xs text-gray-400 py-12 text-center font-sans font-semibold">Belum ada riwayat mutasi tercatat.</p>
            ) : (
              stockHistory.map((sh) => (
                <div key={sh.id} className="py-3 flex justify-between items-center text-xs first:pt-0 last:pb-0 text-left">
                  <div className="space-y-0.5">
                    <span className="font-sans text-[#174C3C] font-bold block">{sh.productName}</span>
                    <span className="font-sans text-[9px] text-[#6B7280] uppercase tracking-wider block font-bold">
                      ID: {sh.id} • Keterangan: "{sh.notes}"
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block font-sans text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      sh.type === 'Masuk' ? 'bg-[#E8F3EC] text-[#174C3C]' : 'bg-red-50 text-red-700'
                    }`}>
                      {sh.type === 'Masuk' ? '+' : '-'}{sh.quantity} Porsi
                    </span>
                    <span className="font-sans text-[8px] text-gray-300 block uppercase tracking-wider font-bold mt-1">
                      {new Date(sh.timestamp).toLocaleTimeString('id-ID')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
