"use client";

import React, { useState } from 'react';
import { Send, X, Trash2 } from 'lucide-react';
import AdminButton from '@/components/admin/AdminButton';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { useAdmin } from '@/components/admin/AdminShell';

export default function AdminReviewsPage() {
  const {
    reviews,
    handleSaveReviews,
    addToast,
    handleAddActivityLog
  } = useAdmin();

  const [reviewFilter, setReviewFilter] = useState('Semua');
  const [selectedReviewId, setSelectedReviewId] = useState('');
  const [reviewReplyText, setReviewReplyText] = useState('');
  const [reviewToDelete, setReviewToDelete] = useState(null);

  const handleDeleteReview = (r) => {
    setReviewToDelete(r);
  };

  const confirmDeleteReview = () => {
    if (!reviewToDelete) return;
    const updated = reviews.filter(rev => rev.id !== reviewToDelete.id);
    handleSaveReviews(updated);
    setReviewToDelete(null);
    addToast('Ulasan berhasil dihapus.', 'success');
    handleAddActivityLog(`Menghapus review ID ${reviewToDelete.id}`);
  };

  const handleReviewStatus = (id, status) => {
    const updated = reviews.map(r => r.id === id ? { ...r, status } : r);
    handleSaveReviews(updated);
    addToast(`Review diubah statusnya menjadi ${status}.`, 'success');
    handleAddActivityLog(`Mengubah status review (${id}) menjadi ${status}`);
  };

  const handleReviewReplySubmit = (id) => {
    if (!reviewReplyText.trim()) return;
    const updated = reviews.map(r => r.id === id ? { ...r, reply: reviewReplyText, status: 'Approved' } : r);
    handleSaveReviews(updated);
    setReviewReplyText('');
    setSelectedReviewId('');
    addToast('Balasan review berhasil dikirim & disetujui!', 'success');
    handleAddActivityLog(`Membalas review ID ${id}`);
  };

  return (
    <div className="space-y-6 text-left font-sans">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <span className="font-sans text-[9px] sm:text-[10px] uppercase tracking-wider text-[#6E9C7C] font-bold block">KURASI</span>
          <h3 className="font-sans text-xl sm:text-2xl text-[#174C3C] font-bold mt-0.5">Moderasi Review Produk</h3>
        </div>
        
        {/* Filter Buttons with live counts */}
        <div className="flex flex-wrap gap-1.5 font-sans text-[10px] uppercase tracking-wider font-bold">
          {['Semua', 'Belum Dibalas', 'Sudah Dibalas'].map(f => {
            const isSelected = reviewFilter === f;
            const count = f === 'Semua' ? reviews.length :
                          f === 'Belum Dibalas' ? reviews.filter(r => !r.reply).length :
                          reviews.filter(r => !!r.reply).length;
            return (
              <AdminButton
                key={f}
                onClick={() => setReviewFilter(f)}
                variant={isSelected ? "primary" : "outline"}
                size="sm"
              >
                {f} ({count})
              </AdminButton>
            );
          })}
        </div>
      </div>

      <div className="space-y-3.5 text-left">
        {reviews
          .filter(r => {
            if (reviewFilter === 'Belum Dibalas') return !r.reply;
            if (reviewFilter === 'Sudah Dibalas') return !!r.reply;
            return true;
          })
          .map((r) => (
            <div key={r.id} className="bg-white border border-[#DDE9DF] p-4 sm:p-5 rounded-2xl shadow-2xs space-y-3.5 text-xs relative text-left">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-sans font-bold text-[#174C3C] text-xs sm:text-sm">{r.customerName}</h4>
                    <span className={`font-sans text-[9px] uppercase tracking-wider font-bold ${
                      r.reply ? 'text-[#174C3C]' : 'text-amber-700'
                    }`}>
                      {r.reply ? 'Sudah Dibalas' : 'Belum Dibalas'}
                    </span>
                    <span className={`font-sans text-[9px] uppercase tracking-wider font-bold ${
                      r.status === 'Approved' ? 'text-[#174C3C]' : 'text-amber-600'
                    }`}>• {r.status}</span>
                  </div>
                  <span className="font-sans text-[9px] text-[#6B7280] uppercase tracking-wider font-bold block">Produk: {r.productName}</span>
                </div>
                <span className="font-sans font-bold text-amber-500 text-xs sm:text-sm shrink-0">{'★'.repeat(r.rating)}</span>
              </div>

              <p className="text-gray-600 leading-relaxed italic text-left text-xs sm:text-sm">"{r.comment}"</p>

              {r.reply && (
                <div className="bg-[#FCFCFC] p-3.5 border-l-2 border-[#174C3C] font-sans text-gray-700 rounded-r-xl">
                  <span className="font-sans text-[9px] uppercase tracking-wider text-[#174C3C] font-bold block">Balasan Kurator</span>
                  <p className="mt-0.5 font-sans text-xs sm:text-sm">"{r.reply}"</p>
                </div>
              )}

              {/* Response actions triggers */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#DDE9DF] font-sans">
                <div className="flex items-center gap-2">
                  {r.status === 'Pending' && (
                    <AdminButton
                      onClick={() => handleReviewStatus(r.id, 'Approved')}
                      variant="primary"
                      size="sm"
                    >
                      Setujui Review
                    </AdminButton>
                  )}
                  {selectedReviewId !== r.id ? (
                    <AdminButton
                      onClick={() => setSelectedReviewId(r.id)}
                      variant="outline"
                      size="sm"
                    >
                      {r.reply ? 'Edit Balasan' : 'Balas Review'}
                    </AdminButton>
                  ) : (
                    <div className="flex-1 flex gap-2 pt-1 items-center">
                      <input
                        type="text"
                        placeholder="Ketik balasan ramah..."
                        value={reviewReplyText}
                        onChange={(e) => setReviewReplyText(e.target.value)}
                        className="flex-1 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] p-2 text-xs rounded-xl focus:border-[#174C3C] outline-none"
                      />
                      <AdminButton
                        onClick={() => handleReviewReplySubmit(r.id)}
                        variant="primary"
                        size="sm"
                        icon={Send}
                      >
                        Kirim
                      </AdminButton>
                      <button
                        onClick={() => setSelectedReviewId('')}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-full cursor-pointer transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <AdminButton
                  onClick={() => handleDeleteReview(r)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                  icon={Trash2}
                  title="Hapus Review"
                />
              </div>
            </div>
          ))}
        {reviews.filter(r => {
          if (reviewFilter === 'Belum Dibalas') return !r.reply;
          if (reviewFilter === 'Sudah Dibalas') return !!r.reply;
          return true;
        }).length === 0 && (
          <div className="py-16 text-center text-[#6B7280] font-sans text-xs border border-dashed border-[#DDE9DF] rounded-2xl font-bold">
            Tidak ada ulasan dalam kategori ini.
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={Boolean(reviewToDelete)}
        title="Hapus Ulasan"
        itemName={reviewToDelete?.customerName ? `dari ${reviewToDelete.customerName}` : ''}
        itemType="ulasan"
        onConfirm={confirmDeleteReview}
        onClose={() => setReviewToDelete(null)}
      />
    </div>
  );
}
