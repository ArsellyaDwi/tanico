"use client";

import React, { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { Plus, Edit, Trash2, X, Loader2, Upload, User, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { uploadFileToSupabase } from '@/utils/uploadHelper';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { useAdmin } from '@/components/admin/AdminShell';

export default function AdminTestimonialsPage() {
  const { addToast } = useAdmin();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [testimonials, setTestimonials] = useState([]);
  const [testiForm, setTestiForm] = useState({ id: '', name: '', role: '', location: '', comment: '', rating: 5, avatar: '', active: true, sortOrder: 0 });

  const getAuthHeaders = () => {
    try {
      const u = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('tanico_user') || 'null') : null;
      return u?.sessionToken ? { Authorization: `Bearer ${u.sessionToken}` } : {};
    } catch (e) {
      return {};
    }
  };

  const loadData = async () => {
    try {
      const res = await fetch('/api/admin/testimonials', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setTestimonials(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching testimonials data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTestiFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const cleanFileName = `testi_${(testiForm.name || 'avatar').toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.jpg`;
      
      setIsUploadingAvatar(true);
      addToast('Mengunggah avatar testimoni ke Supabase Storage...', 'info');

      try {
        const authHeaders = getAuthHeaders();
        const res = await uploadFileToSupabase(file, 'testimonials', cleanFileName, authHeaders);
        
        const avatarUrl = res.url || res.publicUrl || res.data?.url || res.data?.publicUrl;

        if (res.success && avatarUrl) {
          setTestiForm(prev => ({ ...prev, avatar: avatarUrl }));
          addToast('Avatar testimoni berhasil diunggah ke Supabase!', 'success');
        } else {
          addToast(res.error || 'Gagal mengunggah avatar testimoni', 'error');
        }
      } catch (err) {
        logger.error('[AdminTestimonials] Upload error:', err);
        addToast('Terjadi kesalahan saat mengunggah avatar: ' + (err.message || ''), 'error');
      } finally {
        setIsUploadingAvatar(false);
        e.target.value = '';
      }
    }
  };

  const handleTestiSubmit = async (e) => {
    e.preventDefault();
    if (!testiForm.name?.trim() || !testiForm.comment?.trim()) {
      addToast('Nama lengkap dan ulasan komentar wajib diisi', 'warning');
      return;
    }

    if (isUploadingAvatar) {
      addToast('Sedang mengunggah avatar, mohon tunggu sebentar...', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const finalAvatar = (testiForm.avatar || '').trim();
      const authHeaders = getAuthHeaders();

      const updatedForm = { 
        name: testiForm.name.trim(),
        role: (testiForm.role || '').trim(),
        location: (testiForm.location || '').trim(),
        comment: (testiForm.comment || '').trim(),
        rating: Number(testiForm.rating) || 5,
        avatar: finalAvatar,
        active: testiForm.active !== false,
        sortOrder: Number(testiForm.sortOrder) || 0
      };

      if (editingIndex !== null && testiForm.id) {
        updatedForm.id = testiForm.id;
      }

      let res;
      if (editingIndex !== null && testiForm.id) {
        res = await fetch(`/api/admin/testimonials/${testiForm.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify(updatedForm)
        });
      } else {
        res = await fetch('/api/admin/testimonials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify(updatedForm)
        });
      }

      if (res.ok) {
        await loadData();
        addToast('Testimoni berhasil disimpan ke database!', 'success');
        setIsModalOpen(false);
      } else {
        const errData = await res.json().catch(() => ({}));
        addToast(errData.error || 'Gagal menyimpan testimoni ke server.', 'error');
      }
    } catch (err) {
      logger.error(err);
      addToast('Gagal memproses testimoni: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [testiToDelete, setTestiToDelete] = useState(null);

  const handleDeleteTesti = (index) => {
    const item = testimonials[index];
    setTestiToDelete({ index, item });
  };

  const confirmDeleteTesti = async () => {
    if (!testiToDelete) return;
    const { item } = testiToDelete;
    setTestiToDelete(null);
    try {
      const res = await fetch(`/api/admin/testimonials/${item.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        await loadData();
        addToast('Testimoni berhasil dihapus.', 'success');
      } else {
        addToast('Gagal menghapus testimoni.', 'error');
      }
    } catch (err) {
      logger.error(err);
      addToast('Gagal menghapus testimoni.', 'error');
    }
  };

  return (
    <div className="space-y-6 text-left font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-sans text-[10px] uppercase tracking-wider text-[#6E9C7C] font-bold block">MEDIA SOSIAL</span>
          <h3 className="font-sans text-2xl text-[#174C3C] font-bold mt-1">Testimoni Pelanggan</h3>
        </div>
        
        <button
          onClick={() => { setEditingIndex(null); setTestiForm({ id: '', name: '', role: '', location: '', comment: '', rating: 5, avatar: '', active: true, sortOrder: 0 }); setIsModalOpen(true); }}
          className="h-11 px-6 bg-[#174C3C] hover:bg-[#205E49] active:bg-[#123A2E] text-white font-sans text-xs uppercase tracking-wider rounded-full cursor-pointer font-bold inline-flex items-center gap-2 transition-colors duration-200 shadow-xs"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Testimoni Baru</span>
        </button>
      </div>

      {testimonials.length === 0 ? (
        <div className="bg-white border border-[#DDE9DF] rounded-2xl p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#ECF6ED] text-[#174C3C] flex items-center justify-center mx-auto">
            <User className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-sans font-bold text-base text-[#174C3C]">Belum Ada Testimoni</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Belum ada data ulasan atau testimoni pelanggan di database. Klik tombol di bawah untuk menambahkan testimoni pertama.
            </p>
          </div>
          <button
            onClick={() => { setEditingIndex(null); setTestiForm({ id: '', name: '', role: '', location: '', comment: '', rating: 5, avatar: '', active: true, sortOrder: 0 }); setIsModalOpen(true); }}
            className="h-10 px-5 bg-[#174C3C] hover:bg-[#205E49] text-white font-sans text-xs uppercase tracking-wider rounded-full cursor-pointer font-bold inline-flex items-center gap-2 transition-colors duration-200"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Tambah Testimoni</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((testi, idx) => (
            <div key={testi.id || idx} className="bg-white border border-[#DDE9DF] p-6 rounded-2xl shadow-2xs text-xs flex flex-col justify-between text-left">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {testi.avatar ? (
                      <img src={testi.avatar} alt={testi.name || ''} referrerPolicy="no-referrer" className="w-10 h-10 rounded-full object-cover border border-[#DDE9DF]" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#174C3C] text-white font-bold text-sm flex items-center justify-center border border-[#DDE9DF]">
                        {testi.name ? testi.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <div>
                      <h4 className="font-sans font-bold text-[#174C3C]">{testi.name}</h4>
                      <p className="font-sans text-[9px] text-[#6B7280] uppercase tracking-wider font-bold block mt-0.5">
                        {[testi.role, testi.location].filter(Boolean).join(' • ')}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${testi.active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
                    {testi.active !== false ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <p className="text-gray-600 italic leading-relaxed font-sans">"{testi.comment || testi.review || ''}"</p>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t border-[#DDE9DF] font-sans text-[10px] text-gray-400 mt-4 font-bold">
                <span>Rating: {'★'.repeat(testi.rating || 5)}</span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => { 
                      setEditingIndex(idx); 
                      setTestiForm({
                        id: testi.id || '',
                        name: testi.name || '',
                        role: testi.role || '',
                        location: testi.location || '',
                        comment: testi.comment || testi.review || '',
                        rating: testi.rating ?? 5,
                        avatar: testi.avatar || '',
                        active: testi.active !== false,
                        sortOrder: testi.sortOrder ?? 0
                      }); 
                      setIsModalOpen(true); 
                    }} 
                    className="p-2 hover:bg-[#ECF6ED] text-gray-500 hover:text-[#174C3C] transition-colors rounded-full cursor-pointer" 
                    aria-label="Edit"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteTesti(idx)} 
                    className="p-2 hover:bg-rose-50 text-gray-500 hover:text-rose-600 transition-colors rounded-full cursor-pointer" 
                    aria-label="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isSubmitting && !isUploadingAvatar) setIsModalOpen(false);
              }}
              className="absolute inset-0"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white p-6 rounded-2xl z-10 text-left border border-[#DDE9DF] max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <button 
                onClick={() => setIsModalOpen(false)} 
                disabled={isSubmitting || isUploadingAvatar}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-rose-600 transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
              
              <form onSubmit={handleTestiSubmit} className="space-y-4 text-left">
                <h4 className="font-sans text-base text-[#174C3C] font-bold">
                  {editingIndex !== null ? 'Edit Ulasan Testimoni' : 'Testimoni Baru'}
                </h4>

                <div className="space-y-1.5">
                  <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Nama Lengkap *</label>
                  <input type="text" required value={testiForm.name} onChange={(e) => setTestiForm(prev => ({ ...prev, name: e.target.value }))} className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C]" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Profesi / Peran</label>
                    <input type="text" value={testiForm.role || ''} placeholder="Chef Resto, Ibu RS, dll" onChange={(e) => setTestiForm(prev => ({ ...prev, role: e.target.value }))} className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C]" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Asal / Wilayah</label>
                    <input type="text" value={testiForm.location || ''} placeholder="Pangkalpinang, Bangka" onChange={(e) => setTestiForm(prev => ({ ...prev, location: e.target.value }))} className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C]" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Penilaian (Rating)</label>
                  <select
                    value={testiForm.rating || 5}
                    onChange={(e) => setTestiForm(prev => ({ ...prev, rating: parseInt(e.target.value, 10) }))}
                    className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C] cursor-pointer font-bold"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 Bintang)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 Bintang)</option>
                    <option value={3}>⭐⭐⭐ (3 Bintang)</option>
                    <option value={2}>⭐⭐ (2 Bintang)</option>
                    <option value={1}>⭐ (1 Bintang)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Ulasan Komentar *</label>
                  <textarea rows={3} required value={testiForm.comment || ''} onChange={(e) => setTestiForm(prev => ({ ...prev, comment: e.target.value }))} className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C]" />
                </div>

                <div className="space-y-1.5">
                  <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Avatar Foto Pelanggan</label>
                  
                  {/* Avatar Preview Card */}
                  <div className="flex items-center gap-3 p-3 bg-[#FCFCFC] border border-[#DDE9DF] rounded-xl mb-2">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[#DDE9DF] bg-gray-100 flex items-center justify-center shrink-0">
                      {isUploadingAvatar ? (
                        <Loader2 className="w-5 h-5 text-[#174C3C] animate-spin" />
                      ) : testiForm.avatar ? (
                        <img 
                          src={testiForm.avatar} 
                          alt="Preview Avatar" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <User className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {isUploadingAvatar ? (
                        <span className="text-[11px] text-[#174C3C] font-semibold flex items-center gap-1.5">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Mengunggah foto ke Supabase Storage...
                        </span>
                      ) : testiForm.avatar ? (
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate">
                            <span className="text-[10px] text-emerald-700 font-bold block">Foto Terunggah</span>
                            <span className="text-[10px] text-gray-500 font-mono truncate block max-w-[200px]">
                              {testiForm.avatar.split('/').pop()}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setTestiForm(prev => ({ ...prev, avatar: '' }))}
                            className="text-[10px] text-rose-600 hover:text-rose-700 font-bold underline cursor-pointer shrink-0"
                          >
                            Hapus
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400">Pilih file foto atau masukkan tautan</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={testiForm.avatar || ''}
                      onChange={(e) => setTestiForm(prev => ({ ...prev, avatar: e.target.value }))}
                      placeholder="https://...supabase.co/... atau tautan gambar"
                      className="flex-1 text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C]"
                    />
                    <label className={`px-4 py-3 bg-[#174C3C] hover:bg-[#205E49] active:bg-[#123A2E] text-white font-sans text-[10px] uppercase tracking-wider cursor-pointer flex items-center shrink-0 rounded-xl font-bold transition-colors duration-200 ${isUploadingAvatar ? 'opacity-60 pointer-events-none' : ''}`}>
                      {isUploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
                      {isUploadingAvatar ? 'UPLOADING...' : 'FILE'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                        disabled={isUploadingAvatar}
                        onChange={handleTestiFileChange}
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer font-sans text-xs text-gray-700 h-10 px-3 bg-[#FCFCFC] border border-[#DDE9DF] rounded-xl select-none">
                    <input
                      type="checkbox"
                      checked={testiForm.active !== false}
                      onChange={(e) => setTestiForm(prev => ({ ...prev, active: e.target.checked }))}
                      className="rounded border-gray-300 text-[#174C3C] focus:ring-[#174C3C] w-4 h-4 cursor-pointer"
                    />
                    Testimoni Aktif (Tampilkan di Beranda)
                  </label>
                </div>

                <div className="pt-4 border-t border-[#DDE9DF] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    disabled={isSubmitting || isUploadingAvatar}
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 h-11 border border-[#174C3C] bg-white text-[#174C3C] font-sans text-xs uppercase tracking-wider rounded-full cursor-pointer hover:bg-[#ECF6ED] font-bold transition-colors duration-200 disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting || isUploadingAvatar}
                    className="px-8 h-11 bg-[#174C3C] hover:bg-[#205E49] active:bg-[#123A2E] text-white font-sans text-xs uppercase tracking-wider rounded-full cursor-pointer font-bold transition-colors duration-200 shadow-xs disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <span>Simpan Ulasan</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DeleteConfirmModal
        isOpen={Boolean(testiToDelete)}
        title="Hapus Testimoni"
        itemName={testiToDelete?.item?.name ? `dari ${testiToDelete.item.name}` : ''}
        itemType="testimoni"
        onConfirm={confirmDeleteTesti}
        onClose={() => setTestiToDelete(null)}
      />
    </div>
  );
}

