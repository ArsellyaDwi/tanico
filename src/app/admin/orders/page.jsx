"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Printer, 
  Truck, 
  X,
  FileSpreadsheet,
  Trash2
} from 'lucide-react';
import { formatRupiah, formatDate } from '@/utils/formatters';
import AdminButton from '@/components/admin/AdminButton';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { useAdmin } from '@/components/admin/AdminShell';

export default function AdminOrdersPage() {
  const {
    orders,
    handleUpdateOrderStatus,
    addToast
  } = useAdmin();

  // States matching standard admin interactions
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Semua');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const idMatch = (o.id || '').toLowerCase().includes(search.toLowerCase());
      const nameMatch = (o.customerName || '').toLowerCase().includes(search.toLowerCase());
      const phoneMatch = (o.phone || '').includes(search);
      const subdistMatch = (o.subdistrict || '').toLowerCase().includes(search.toLowerCase());
      
      const matchesSearch = idMatch || nameMatch || phoneMatch || subdistMatch;
      const matchesTab = activeTab === 'Semua' || o.status === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [orders, search, activeTab]);

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Menunggu': return 'text-amber-700';
      case 'Diproses': return 'text-blue-700';
      case 'Dikirim': return 'text-indigo-700';
      case 'Selesai': return 'text-[#174C3C]';
      case 'Dibatalkan': return 'text-red-700';
      default: return 'text-gray-700';
    }
  };

  const handleStatusChange = (orderId, status) => {
    handleUpdateOrderStatus(orderId, status);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status } : null);
    }
  };

  const handlePrint = () => {
    window.print();
    addToast('Membuka dialog pencetakan faktur...', 'info');
  };

  const [orderToDelete, setOrderToDelete] = useState(null);

  const handleDeleteOrder = (orderId) => {
    setOrderToDelete(orderId);
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    const orderId = orderToDelete;
    setOrderToDelete(null);
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Dibatalkan' })
      });
      if (typeof handleUpdateOrderStatus === 'function') {
        handleUpdateOrderStatus(orderId, 'Dibatalkan');
      }
    } catch (err) {
      console.error('Error canceling order:', err);
    }
    setSelectedOrder(null);
    addToast(`Pesanan ${orderId} berhasil dibatalkan.`, 'success');
  };

  return (
    <div className="space-y-6 text-left pb-12 font-sans">
      
      {/* Heading */}
      <div>
        <span className="font-sans text-[9px] sm:text-[10px] uppercase tracking-wider text-[#6E9C7C] font-bold block">DAFTAR TRANSAKSI</span>
        <h2 className="font-sans text-xl sm:text-2xl text-[#174C3C] font-bold mt-0.5">
          Kelola <span className="italic font-normal text-[#6E9C7C]">Pesanan Masuk</span>
        </h2>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-[#DDE9DF] pb-px font-sans text-[10px] uppercase tracking-wider font-bold overflow-x-auto">
        {['Semua', 'Menunggu', 'Diproses', 'Dikirim', 'Selesai', 'Dibatalkan'].map((tab) => {
          const count = tab === 'Semua' 
            ? orders.length 
            : orders.filter(o => o.status === tab).length;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 py-2.5 transition-colors cursor-pointer border-b-2 -mb-px flex items-center gap-1.5 whitespace-nowrap ${
                isActive 
                  ? 'border-[#174C3C] text-[#174C3C] font-bold' 
                  : 'border-transparent text-[#6B7280] hover:text-[#202020]'
              }`}
            >
              <span>{tab}</span>
              <span className={`text-[9px] font-bold ${
                isActive ? 'text-[#174C3C]' : 'text-gray-400'
              }`}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Split view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Table List */}
        <div className={`space-y-4 ${selectedOrder ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <input
                type="text"
                placeholder="Cari ID, pelanggan, kecamatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#FCFCFC] text-xs sm:text-sm text-[#202020] placeholder-[#6B7280] py-2 sm:py-2.5 pl-9 pr-3.5 outline-none border border-[#DDE9DF] focus:border-[#174C3C] transition-colors rounded-full"
              />
              <Search className="w-4 h-4 absolute left-3 top-2.5 sm:top-3 text-gray-400" />
            </div>

            <AdminButton
              onClick={() => {
                const header = "No Pesanan,Pelanggan,Total,Metode Pembayaran,Tanggal,Status\n";
                const rows = orders.map(o => `"${o.id}","${o.customerName}",${o.totalAmount},"${o.paymentMethod}","${o.createdAt}","${o.status}"`).join("\n");
                const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `tanico_pesanan_${new Date().toISOString().slice(0,10)}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                addToast("Pesanan berhasil diekspor ke CSV!", "success");
              }}
              variant="outline"
              size="md"
              icon={FileSpreadsheet}
            >
              Ekspor Excel
            </AdminButton>
          </div>

          <div className="bg-white border border-[#DDE9DF] rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FCFCFC] border-b border-[#DDE9DF] font-sans text-[9px] uppercase tracking-widest text-[#6B7280] font-bold">
                    <th className="p-4">No Pesanan</th>
                    <th className="p-4">Pelanggan</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Bayar</th>
                    <th className="p-4">Tanggal</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE9DF] text-xs text-[#202020]">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#6B7280] font-semibold">
                        Tidak ada pesanan sayur yang tercatat pada menu ini.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o) => (
                      <tr 
                        key={o.id} 
                        onClick={() => setSelectedOrder(o)}
                        className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${
                          selectedOrder?.id === o.id ? 'bg-gray-100' : ''
                        }`}
                      >
                        <td className="p-4 font-sans font-bold text-[#174C3C] text-left">
                          {o.id}
                        </td>
                        <td className="p-4 text-left">
                          <div className="font-sans font-bold text-[#202020]">{o.customerName}</div>
                          <div className="font-sans text-[9px] text-[#6B7280] uppercase tracking-wider font-bold mt-0.5">{o.subdistrict}</div>
                        </td>
                        <td className="p-4 font-sans font-bold text-[#202020] text-left">
                          {formatRupiah(o.totalAmount)}
                        </td>
                        <td className="p-4 font-sans text-[10px] uppercase text-left">
                          <span className="font-bold">
                            {o.paymentMethod === 'qris' ? 'QRIS' : o.paymentMethod === 'tf' ? 'Transfer' : 'COD'}
                          </span>
                        </td>
                        <td className="p-4 font-sans text-[#6B7280] text-left font-semibold">
                          {new Date(o.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                        </td>
                        <td className="p-4 text-left">
                          <span className={`inline-block font-sans text-[9px] uppercase tracking-wider font-bold ${getStatusBadgeStyle(o.status)}`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Detail Panel Card */}
        {selectedOrder && (
          <div className="lg:col-span-5 bg-white border border-[#DDE9DF] p-6 rounded-2xl shadow-2xs space-y-5 text-left relative">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
              aria-label="Tutup Detail"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1.5 pt-1 border-b border-[#DDE9DF] pb-4">
              <span className="font-sans text-[10px] uppercase tracking-wider text-[#6E9C7C] font-bold block">RINCIAN TRANSAKSI</span>
              <div className="flex items-center gap-2">
                <h3 className="font-sans text-lg text-[#174C3C] font-bold">{selectedOrder.id}</h3>
                <span className={`font-sans text-[9px] uppercase tracking-wider font-bold ${getStatusBadgeStyle(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>
              <span className="font-sans text-[9px] text-[#6B7280] block uppercase tracking-wider font-bold">
                Dibuat: {formatDate(selectedOrder.createdAt)}
              </span>
            </div>

            {/* Customer info card */}
            <div className="space-y-3 bg-[#FCFCFC] p-4 border border-[#DDE9DF] rounded-xl text-xs text-left">
              <div className="grid grid-cols-3 text-[#6B7280] font-sans text-[10px] uppercase tracking-wider font-bold">
                <span>Pelanggan</span>
                <span className="col-span-2 text-[#202020] font-sans font-bold text-right">{selectedOrder.customerName}</span>
              </div>
              <div className="grid grid-cols-3 text-[#6B7280] font-sans text-[10px] uppercase tracking-wider font-bold">
                <span>No HP / WA</span>
                <span className="col-span-2 text-[#174C3C] font-sans font-bold text-right hover:underline">
                  <a href={`https://wa.me/${selectedOrder.phone.replace(/^0/, '62')}`} target="_blank" rel="noreferrer">
                    {selectedOrder.phone}
                  </a>
                </span>
              </div>
              <div className="grid grid-cols-3 text-[#6B7280] font-sans text-[10px] uppercase tracking-wider text-left font-bold">
                <span>Alamat</span>
                <span className="col-span-2 text-gray-700 text-right leading-relaxed font-sans font-normal">{selectedOrder.address}, Kec. {selectedOrder.subdistrict}</span>
              </div>
              {selectedOrder.notes && (
                <div className="grid grid-cols-3 text-[#6B7280] font-sans text-[10px] uppercase tracking-wider pt-2 border-t border-[#DDE9DF] font-bold">
                  <span>Catatan</span>
                  <span className="col-span-2 text-amber-700 font-sans text-right italic font-semibold">"{selectedOrder.notes}"</span>
                </div>
              )}
            </div>

            {/* Items list */}
            <div className="space-y-2 text-left">
              <span className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">DAFTAR PORSI BELANJA</span>
              <div className="divide-y divide-[#DDE9DF]">
                {selectedOrder.items.map((item) => (
                  <div key={item.productId} className="flex justify-between items-center py-2.5 text-xs">
                    <div className="text-left">
                      <h4 className="font-sans font-bold text-[#202020]">{item.name}</h4>
                      <span className="font-sans text-[9px] text-[#6B7280] uppercase tracking-wider font-bold block mt-0.5">
                        {item.quantity} {item.unit} x {formatRupiah(item.price)}
                      </span>
                    </div>
                    <span className="font-sans text-[#202020] font-bold">
                      {formatRupiah(item.quantity * item.price)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-[#DDE9DF] flex justify-between items-center">
                <span className="font-sans font-bold text-sm text-[#174C3C]">Jumlah Total</span>
                <span className="font-sans font-bold text-base text-[#174C3C]">
                  {formatRupiah(selectedOrder.totalAmount)}
                </span>
              </div>
            </div>

            {/* Action buttons (h-11) */}
            <div className="space-y-2 pt-2 text-left">
              <span className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">AKSI STATUS PESANAN</span>
              <div className="grid grid-cols-2 gap-2 text-center font-sans text-[10px] uppercase tracking-wider font-bold">
                {selectedOrder.status === 'Menunggu' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(selectedOrder.id, 'Diproses')}
                      className="h-11 bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded-full cursor-pointer flex items-center justify-center gap-1.5 font-bold"
                    >
                      Proses Pesanan
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedOrder.id, 'Dibatalkan')}
                      className="h-11 bg-red-50 text-red-700 hover:bg-red-100 transition-colors rounded-full cursor-pointer flex items-center justify-center gap-1.5 font-bold"
                    >
                      Batalkan
                    </button>
                  </>
                )}

                {selectedOrder.status === 'Diproses' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(selectedOrder.id, 'Dikirim')}
                      className="h-11 bg-[#174C3C] text-white hover:bg-[#205E49] active:bg-[#123A2E] transition-colors duration-200 rounded-full cursor-pointer flex items-center justify-center gap-1.5 font-bold"
                    >
                      <Truck className="w-4 h-4" />
                      <span>Atur Pengiriman</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedOrder.id, 'Dibatalkan')}
                      className="h-11 bg-red-50 text-red-700 hover:bg-red-100 transition-colors duration-200 rounded-full cursor-pointer flex items-center justify-center gap-1.5 font-bold"
                    >
                      Batalkan
                    </button>
                  </>
                )}

                {selectedOrder.status === 'Dikirim' && (
                  <button
                    onClick={() => handleStatusChange(selectedOrder.id, 'Selesai')}
                    className="h-11 bg-[#174C3C] text-white hover:bg-[#205E49] active:bg-[#123A2E] transition-colors duration-200 rounded-full cursor-pointer col-span-2 flex items-center justify-center gap-1.5 font-bold"
                  >
                    Tandai Selesai
                  </button>
                )}

                {selectedOrder.status === 'Selesai' && (
                  <p className="col-span-2 py-3 text-center text-green-700 font-sans text-xs font-bold">
                    Transaksi ini telah selesai diproses sepenuhnya.
                  </p>
                )}

                {selectedOrder.status === 'Dibatalkan' && (
                  <p className="col-span-2 py-3 text-center text-red-700 font-sans text-xs font-bold">
                    Transaksi ini telah dibatalkan oleh pihak kurator.
                  </p>
                )}
              </div>
            </div>

            {/* High fidelity invoice & delete triggers */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => setIsInvoiceOpen(true)}
                className="w-full h-11 border border-[#174C3C] bg-white hover:bg-gray-100 text-[#174C3C] font-sans text-xs uppercase tracking-wider transition-colors duration-200 rounded-full cursor-pointer text-center flex items-center justify-center gap-2 font-bold"
              >
                <Printer className="w-4 h-4 text-[#174C3C]" />
                <span>Cetak Faktur Premium</span>
              </button>

              <button
                onClick={() => handleDeleteOrder(selectedOrder.id)}
                className="w-full h-10 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-sans text-[11px] uppercase tracking-wider transition-colors duration-200 rounded-full cursor-pointer text-center flex items-center justify-center gap-2 font-bold"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Hapus Record Pesanan</span>
              </button>
            </div>

          </div>
        )}

      </div>

      {/* POPUP INVOICE PRINT WINDOW */}
      <AnimatePresence>
        {isInvoiceOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInvoiceOpen(false)}
              className="absolute inset-0"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white text-gray-800 shadow-2xl p-8 rounded-2xl flex flex-col z-10 print:p-0 print:shadow-none print:w-full print:max-w-none max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsInvoiceOpen(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-rose-600 transition-colors print:hidden cursor-pointer"
                aria-label="Tutup Faktur"
              >
                <X className="w-4 h-4" />
              </button>

              <div id="printable-invoice" className="space-y-6 text-left p-2 print:p-0">
                
                <div className="flex justify-between items-start pb-6 border-b border-[#DDE9DF] text-left">
                  <div className="flex flex-col text-left">
                    <span className="font-sans text-2xl tracking-widest uppercase font-bold text-[#174C3C] text-left">
                      TaniCo
                    </span>
                    <span className="font-sans text-[10px] tracking-wider uppercase text-[#6E9C7C] font-bold block text-left">
                      PURE ORGANIC
                    </span>
                    <p className="text-[10px] text-gray-500 font-sans mt-2 leading-relaxed max-w-xs text-left">
                      Jl. Jenderal Sudirman No. 42, Pangkalpinang, Bangka Belitung 33111
                    </p>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <span className="font-sans text-[10px] uppercase tracking-wider text-[#6E9C7C] font-bold block">FAKTUR BELANJA</span>
                    <h4 className="font-sans text-lg font-bold text-[#174C3C]">{selectedOrder.id}</h4>
                    <span className="font-sans text-[10px] text-gray-400 block font-bold">Tanggal: {new Date(selectedOrder.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 text-xs py-2 text-left">
                  <div className="space-y-2 text-left">
                    <span className="font-sans text-[9px] uppercase tracking-wider text-gray-400 block text-left font-bold">Tujuan Pengiriman</span>
                    <div className="font-sans font-bold text-[#202020] text-left">{selectedOrder.customerName}</div>
                    <p className="text-gray-600 leading-relaxed font-sans text-left">{selectedOrder.address}, Kec. {selectedOrder.subdistrict}, Bangka</p>
                    <div className="font-sans text-[10px] text-[#174C3C] text-left font-bold">{selectedOrder.phone}</div>
                  </div>

                  <div className="space-y-2 text-right">
                    <span className="font-sans text-[9px] uppercase tracking-wider text-gray-400 block font-bold">Metode Pembayaran</span>
                    <div className="font-sans uppercase font-bold text-[#174C3C]">
                      {selectedOrder.paymentMethod === 'qris' ? 'QRIS Digital Payment' : 
                       selectedOrder.paymentMethod === 'tf' ? 'Transfer Bank' : 
                       'Bayar via WhatsApp COD'}
                    </div>
                    {selectedOrder.notes && (
                      <div className="pt-2">
                        <span className="font-sans text-[8px] uppercase tracking-wider text-amber-600 block font-bold">Catatan Kurir</span>
                        <p className="text-gray-500 italic">"{selectedOrder.notes}"</p>
                      </div>
                    )}
                  </div>
                </div>

                <table className="w-full text-left border-collapse border-b border-[#DDE9DF]">
                  <thead>
                    <tr className="bg-[#FCFCFC] border-b border-[#DDE9DF] font-sans text-[9px] uppercase tracking-widest text-[#6B7280] font-bold">
                      <th className="p-3 text-left">Keterangan Barang</th>
                      <th className="p-3 text-center">Jumlah</th>
                      <th className="p-3 text-right">Harga Satuan</th>
                      <th className="p-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDE9DF] text-xs font-sans text-gray-700">
                    {selectedOrder.items.map((item) => (
                      <tr key={item.productId} className="align-middle">
                        <td className="p-3 text-left">
                          <span className="font-sans font-bold text-[#202020]">{item.name}</span>
                        </td>
                        <td className="p-3 text-center font-sans font-semibold">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="p-3 text-right font-sans font-semibold">
                          {formatRupiah(item.price)}
                        </td>
                        <td className="p-3 text-right font-sans font-bold text-[#174C3C]">
                          {formatRupiah(item.quantity * item.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end pt-4">
                  <div className="w-64 space-y-2 text-xs">
                    <div className="flex justify-between font-sans text-gray-400 font-bold">
                      <span>Subtotal Belanja</span>
                      <span className="font-bold text-[#202020]">{formatRupiah(selectedOrder.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between font-sans text-gray-400 font-bold">
                      <span>Biaya Pengiriman</span>
                      <span className="text-[#174C3C] font-bold">GRATIS</span>
                    </div>
                    <div className="flex justify-between font-sans text-sm font-bold border-t border-[#DDE9DF] pt-2 text-[#202020]">
                      <span>Total Tagihan</span>
                      <span className="text-[#174C3C] font-bold">{formatRupiah(selectedOrder.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-8 text-center space-y-1">
                  <p className="font-sans text-xs italic text-[#174C3C] font-semibold">"Terima kasih telah mendukung jerih payah pangan murni para petani lokal Bangka."</p>
                  <p className="font-sans text-[8px] text-gray-300 uppercase tracking-widest font-bold">Dokumen ini sah dicetak otomatis oleh sistem TaniCo.</p>
                </div>

              </div>

              {/* Action buttons (h-11) */}
              <div className="mt-8 border-t border-[#DDE9DF] pt-6 flex justify-end gap-3 print:hidden">
                <button
                  type="button"
                  onClick={() => setIsInvoiceOpen(false)}
                  className="px-6 h-11 border border-[#174C3C] bg-white text-[#174C3C] font-sans text-xs uppercase tracking-wider rounded-full cursor-pointer hover:bg-gray-100 font-bold transition-colors duration-200"
                >
                  Tutup
                </button>
                <button
                  onClick={handlePrint}
                  className="px-6 h-11 bg-[#174C3C] hover:bg-[#205E49] active:bg-[#123A2E] text-white font-sans text-xs uppercase tracking-wider rounded-full cursor-pointer flex items-center gap-2 font-bold transition-colors duration-200 shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / PDF</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DeleteConfirmModal
        isOpen={Boolean(orderToDelete)}
        title="Hapus Pesanan"
        itemName={orderToDelete}
        itemType="pesanan"
        onConfirm={confirmDeleteOrder}
        onClose={() => setOrderToDelete(null)}
      />
    </div>
  );
}