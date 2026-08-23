"use client";

import React, { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { Plus, Edit, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { uploadFileToSupabase } from '@/utils/uploadHelper';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { useAdmin } from '@/components/admin/AdminShell';

export default function AdminGalleryPage() {
  const { addToast } = useAdmin();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  const [galleryItems, setGalleryItems] = useState([]);
  const [galleryForm, setGalleryForm] = useState({ id: '', image: '', title: '', span: 'col-span-1' });

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const res = await fetch('/api/admin/gallery');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setGalleryItems(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error fetching gallery data:', err);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const handleGalleryFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      addToast('Mengunggah gambar galeri ke Supabase Storage...', 'info');
      const res = await uploadFileToSupabase(file, 'gallery');
      if (res.success && res.url) {
        setGalleryForm(prev => ({ ...prev, image: res.url }));
        addToast('Gambar galeri berhasil diunggah ke Supabase!', 'success');
      } else {
        addToast(res.error || 'Gagal mengunggah gambar galeri', 'error');
      }
    }
  };

  const handleGallerySubmit = async (e) => {
    e.preventDefault();
    if (!galleryForm.image || !galleryForm.title) return;
    try {
      const updatedForm = { ...galleryForm };

      let res;
      if (editingIndex !== null && galleryForm.id) {
        res = await fetch(`/api/admin/gallery/${galleryForm.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedForm)
        });
      } else {
        res = await fetch('/api/admin/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedForm)
        });
      }

      if (res.ok) {
        const saved = await res.json();
        const items = [...galleryItems];
        if (editingIndex !== null) {
          items[editingIndex] = saved;
          addToast('Galeri berhasil diperbarui!', 'success');
        } else {
          items.push(saved);
          addToast('Foto baru berhasil masuk galeri!', 'success');
        }
        setGalleryItems(items);
        setIsModalOpen(false);
      } else {
        addToast('Gagal menyimpan galeri ke server.', 'error');
      }
    } catch (err) {
      logger.error(err);
      addToast('Gagal memproses gambar: ' + err.message, 'error');
    }
  };

  const [galleryToDelete, setGalleryToDelete] = useState(null);

  const handleDeleteGallery = (index) => {
    const item = galleryItems[index];
    setGalleryToDelete({ index, item });
  };

  const confirmDeleteGallery = async () => {
    if (!galleryToDelete) return;
    const { index, item } = galleryToDelete;
    setGalleryToDelete(null);
    try {
      const res = await fetch(`/api/admin/gallery/${item.id}`, { method: 'DELETE' });
      if (res.ok) {
        const items = galleryItems.filter((_, i) => i !== index);
        setGalleryItems(items);
        addToast('Gambar galeri berhasil dihapus.', 'success');
      } else {
        addToast('Gagal menghapus foto galeri.', 'error');
      }
    } catch (err) {
      logger.error(err);
      addToast('Gagal menghapus foto galeri.', 'error');
    }
  };

  return (
    <div className="space-y-6 text-left font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-sans text-[10px] uppercase tracking-wider text-[#6E9C7C] font-bold block">MEDIA</span>
          <h3 className="font-sans text-2xl text-[#174C3C] font-bold mt-1">Galeri Panen Kebun</h3>
        </div>
        
        <button
          onClick={() => { setEditingIndex(null); setGalleryForm({ id: '', image: '', title: '', span: 'col-span-1' }); setIsModalOpen(true); }}
          className="h-11 px-6 bg-[#174C3C] hover:bg-[#205E49] active:bg-[#123A2E] text-white font-sans text-xs uppercase tracking-wider rounded-full cursor-pointer font-bold inline-flex items-center gap-2 transition-colors duration-200 shadow-xs"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Unggah Foto</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {galleryItems.map((item, idx) => (
          <div key={item.id} className="bg-white border border-[#DDE9DF] rounded-2xl overflow-hidden shadow-2xs relative group">
            <div className="h-44 relative overflow-hidden bg-gray-50">
              {item.image ? (
                <img src={item.image} alt={item.title || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 origin-center" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#ECF6ED] text-[#174C3C]">
                  <ImageIcon className="w-8 h-8 opacity-40" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button 
                  onClick={() => { setEditingIndex(idx); setGalleryForm(item); setIsModalOpen(true); }} 
                  className="p-2.5 bg-white rounded-full text-[#174C3C] hover:bg-[#ECF6ED] transition-colors cursor-pointer" 
                  aria-label="Edit Foto"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteGallery(idx)} 
                  className="p-2.5 bg-white rounded-full text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer" 
                  aria-label="Hapus Foto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 text-xs font-sans text-[#174C3C] font-bold text-center uppercase tracking-wider border-t border-[#DDE9DF] bg-[#FCFCFC]">{item.title}</div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
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
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              
              <form onSubmit={handleGallerySubmit} className="space-y-4 text-left">
                <h4 className="font-sans text-base text-[#174C3C] font-bold">Unggah Foto Galeri</h4>

                <div className="space-y-1.5">
                  <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Judul Foto *</label>
                  <input type="text" required value={galleryForm.title} onChange={(e) => setGalleryForm(prev => ({ ...prev, title: e.target.value }))} className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C] font-sans" />
                </div>

                <div className="space-y-1.5">
                  <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Gambar Galeri *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={galleryForm.image}
                      onChange={(e) => setGalleryForm(prev => ({ ...prev, image: e.target.value }))}
                      placeholder="Salin tautan gambar..."
                      className="flex-1 text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C]"
                    />
                    <label className="px-4 py-3 bg-[#174C3C] hover:bg-[#205E49] active:bg-[#123A2E] text-white font-sans text-[10px] uppercase tracking-wider cursor-pointer flex items-center shrink-0 rounded-xl font-bold transition-colors duration-200">
                      FILE
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleGalleryFileChange}
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#DDE9DF] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 h-11 border border-[#174C3C] bg-white text-[#174C3C] font-sans text-xs uppercase tracking-wider rounded-full cursor-pointer hover:bg-[#ECF6ED] font-bold transition-colors duration-200"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="px-8 h-11 bg-[#174C3C] hover:bg-[#205E49] active:bg-[#123A2E] text-white font-sans text-xs uppercase tracking-wider rounded-full cursor-pointer font-bold transition-colors duration-200 shadow-xs"
                  >
                    Simpan Foto
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DeleteConfirmModal
        isOpen={Boolean(galleryToDelete)}
        title="Hapus Galeri"
        itemName={galleryToDelete?.item?.title || 'Gambar Galeri'}
        itemType="gambar galeri"
        onConfirm={confirmDeleteGallery}
        onClose={() => setGalleryToDelete(null)}
      />
    </div>
  );
}
