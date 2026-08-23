"use client";

import React, { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { Plus, Edit, Trash2, X, ArrowUp, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { buildStorageUrl } from '@/utils/buildStorageUrl';
import { uploadFileToSupabase } from '@/utils/uploadHelper';
import { formatDate } from '@/utils/formatters';
import AdminButton from '@/components/admin/AdminButton';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { useAdmin } from '@/components/admin/AdminShell';

export default function AdminCategoriesPage() {
  const {
    categories: propCategories,
    handleSaveCategories,
    products,
    addToast,
    handleAddActivityLog
  } = useAdmin();

  const [categories, setCategories] = useState(propCategories || []);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ 
    id: '',
    name: '', 
    slug: '',
    image: '', 
    banner: '',
    heroImage: '',
    description: '', 
    itemCount: 0,
    status: 'Aktif',
    cropPosition: 'center center',
    cropZoom: '100',
    metaTitle: '',
    metaDescription: '',
    ogImage: '',
    sortOrder: 0,
    badgeColor: 'Green',
    ctaLink: '',
    ctaText: '',
    showOnHomepage: true,
    createdAt: '',
    updatedAt: ''
  });

  const fetchCategories = async () => {
    setIsApiLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      if (!res.ok) throw new Error('Gagal memuat kategori dari database');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      logger.warn('Silent Fallback: Gagal memuat kategori dari database, menggunakan cache lokal:', err.message);
      if (propCategories && propCategories.length > 0) {
        setCategories(propCategories);
      } else {
        addToast('Error: ' + err.message, 'error');
      }
    } finally {
      setIsApiLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (propCategories && propCategories.length > 0) {
      setCategories(propCategories);
    }
  }, [propCategories]);

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

  const saveCategoryToSupabase = async (categoryData) => {
    setIsApiLoading(true);
    try {
      const isEdit = editingIndex !== null;
      const url = isEdit ? `/api/admin/categories/${categoryData.id}` : '/api/admin/categories';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(categoryData)
      });

      let resData = {};
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          resData = await response.json();
        } catch (e) {
          resData = { error: 'Format JSON dari server tidak valid.' };
        }
      } else {
        const textData = await response.text();
        logger.warn('Non-JSON response from /api/categories:', textData);
        resData = { error: `Respons server (${response.status}): ${textData.slice(0, 100)}` };
      }

      if (!response.ok) {
        throw new Error(resData.error || `Gagal menyimpan kategori (${response.status})`);
      }

      let updatedList = [...categories];
      if (isEdit) {
        updatedList = categories.map((cat, idx) => idx === editingIndex ? { ...cat, ...resData } : cat);
      } else {
        updatedList.push(resData);
      }
      setCategories(updatedList);
      if (typeof handleSaveCategories === 'function') {
        handleSaveCategories(updatedList);
      }

      const successMessage = isEdit ? 'Kategori berhasil diperbarui!' : 'Kategori baru berhasil ditambahkan!';
      if (typeof addToast === 'function') {
        addToast(successMessage, 'success');
      }
      
      const activityLogMsg = isEdit ? `Mengedit kategori ${categoryData.name}` : `Menambahkan kategori baru ${categoryData.name}`;
      if (typeof handleAddActivityLog === 'function') {
        handleAddActivityLog(activityLogMsg);
      }

      setIsModalOpen(false);

      // Refresh local state
      await fetchCategories();
    } catch (err) {
      logger.error('[CategoriesMenu] Error saving category to API:', err);
      if (typeof addToast === 'function') {
        addToast('Gagal menyimpan kategori: ' + err.message, 'error');
      } else {
        alert('Gagal menyimpan kategori: ' + err.message);
      }
    } finally {
      setIsApiLoading(false);
    }
  };

  const deleteCategoryFromSupabase = async (catId, name) => {
    setIsApiLoading(true);
    try {
      if (catId) {
        const response = await fetch(`/api/admin/categories/${catId}`, {
          method: 'DELETE',
          headers: { ...getAuthHeaders() }
        });
        if (!response.ok) {
          let resData = {};
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            try { resData = await response.json(); } catch (e) {}
          }
          throw new Error(resData.error || `Gagal menghapus kategori (${response.status})`);
        }
      }

      addToast('Kategori berhasil dihapus.', 'success');
      handleAddActivityLog(`Menghapus kategori ${name}`);
      
      await fetchCategories();
    } catch (err) {
      logger.error(err);
      addToast('Gagal menghapus kategori: ' + err.message, 'error');
    } finally {
      setIsApiLoading(false);
    }
  };

  const getBadgeStyles = (color) => {
    switch (color) {
      case 'Gray':
        return 'text-gray-700';
      case 'Orange':
        return 'text-amber-800';
      case 'Blue':
        return 'text-blue-800';
      case 'Green':
      default:
        return 'text-[#174C3C]';
    }
  };

  const handleCategoryFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase();
      const customFilename = `category_${Date.now()}_${cleanFileName}`;
      addToast('Mengunggah gambar kategori ke Supabase Storage...', 'info');
      try {
        const res = await uploadFileToSupabase(file, 'categories', customFilename);
        if (res.success && (res.url || res.publicUrl)) {
          const uploadedUrl = res.url || res.publicUrl;
          setCategoryForm(prev => ({ ...prev, image: uploadedUrl }));
          addToast('Gambar kategori berhasil diunggah ke Supabase!', 'success');
        } else {
          addToast(res.error || 'Gagal mengunggah gambar kategori', 'error');
        }
      } catch (err) {
        logger.error('Upload category image error:', err);
        addToast('Terjadi kesalahan saat mengunggah gambar kategori', 'error');
      } finally {
        e.target.value = '';
      }
    }
  };

  const handleFileChangeForField = async (e, field) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase();
      const customFilename = `cat_${field}_${Date.now()}_${cleanFileName}`;
      addToast(`Mengunggah gambar ${field} ke Supabase Storage...`, 'info');
      try {
        const res = await uploadFileToSupabase(file, 'categories', customFilename);
        if (res.success && (res.url || res.publicUrl)) {
          const uploadedUrl = res.url || res.publicUrl;
          setCategoryForm(prev => ({ ...prev, [field]: uploadedUrl }));
          addToast(`Gambar untuk ${field} berhasil diunggah ke Supabase!`, 'success');
        } else {
          addToast(res.error || `Gagal mengunggah gambar ${field}`, 'error');
        }
      } catch (err) {
        logger.error(`Upload ${field} error:`, err);
        addToast(`Terjadi kesalahan saat mengunggah gambar ${field}`, 'error');
      } finally {
        e.target.value = '';
      }
    }
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setCategoryForm(prev => {
      const updates = { name: val };
      if (editingIndex === null) {
        updates.slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }
      return { ...prev, ...updates };
    });
  };

  const handleOpenAddCategory = () => {
    setEditingIndex(null);
    setCategoryForm({ 
      id: '',
      name: '', 
      slug: '',
      image: '', 
      banner: '',
      heroImage: '',
      description: '', 
      itemCount: 0,
      status: 'Aktif',
      cropPosition: 'center center',
      cropZoom: '100',
      metaTitle: '',
      metaDescription: '',
      ogImage: '',
      sortOrder: categories.length,
      badgeColor: 'Green',
      ctaLink: '',
      ctaText: '',
      showOnHomepage: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setIsModalOpen(true);
  };

  const handleOpenEditCategory = (index, cat) => {
    setEditingIndex(index);
    setCategoryForm({
      id: cat.id || cat.name?.toLowerCase().replace(/[^a-z0-9]/g, '-') || '',
      name: cat.name || '',
      slug: cat.slug || cat.id || cat.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || '',
      image: cat.image || '',
      banner: cat.banner || '',
      heroImage: cat.heroImage || '',
      description: cat.description || '',
      itemCount: cat.itemCount || 0,
      status: cat.status || 'Aktif',
      cropPosition: cat.cropPosition || 'center center',
      cropZoom: cat.cropZoom || '100',
      metaTitle: cat.metaTitle || '',
      metaDescription: cat.metaDescription || '',
      ogImage: cat.ogImage || '',
      sortOrder: cat.sortOrder !== undefined ? cat.sortOrder : index,
      badgeColor: cat.badgeColor || 'Green',
      ctaLink: cat.ctaLink || '',
      ctaText: cat.ctaText || '',
      showOnHomepage: cat.showOnHomepage !== false,
      createdAt: cat.createdAt || new Date().toISOString(),
      updatedAt: cat.updatedAt || new Date().toISOString()
    });
    setIsModalOpen(true);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    
    try {
      const showToast = (message, type = 'error') => {
        logger.warn(`[CategoriesMenu Validation] ${type.toUpperCase()}: ${message}`);
        if (typeof addToast === 'function') {
          addToast(message, type);
        } else {
          alert(`${type.toUpperCase()}: ${message}`);
        }
      };

      const nameVal = String(categoryForm.name || '').trim();
      const slugVal = String(categoryForm.slug || '').trim();
      const imageVal = String(categoryForm.image || '').trim();
      const metaTitleVal = String(categoryForm.metaTitle || '').trim();

      if (!nameVal) {
        showToast('Nama kategori wajib diisi!', 'error');
        return;
      }

      if (nameVal.length < 3) {
        showToast('Nama kategori minimal harus 3 karakter!', 'error');
        return;
      }

      if (!slugVal) {
        showToast('Slug kategori wajib diisi!', 'error');
        return;
      }

      const isSlugTaken = Array.isArray(categories) && categories.some((cat, idx) => {
        if (!cat) return false;
        if (editingIndex !== null && idx === editingIndex) return false;
        return cat.slug === slugVal;
      });
      if (isSlugTaken) {
        showToast('Slug kategori sudah digunakan! Slug harus unik.', 'error');
        return;
      }

      if (!imageVal) {
        showToast('Gambar cover kategori wajib diisi!', 'error');
        return;
      }

      const zoomVal = parseInt(categoryForm.cropZoom || '100', 10);
      if (isNaN(zoomVal) || zoomVal < 100 || zoomVal > 180) {
        showToast('Crop zoom harus bernilai antara 100 dan 180!', 'error');
        return;
      }

      if (metaTitleVal && metaTitleVal.length > 30) {
        showToast('Badge kategori maksimal harus 30 karakter!', 'error');
        return;
      }

      setIsApiLoading(true);

      const id = categoryForm.id || slugVal || nameVal.toLowerCase().replace(/[^a-z0-9]/g, '-');

      const updatedForm = { 
        ...categoryForm, 
        id,
        name: nameVal,
        slug: slugVal,
        image: imageVal,
        banner: categoryForm.banner || '',
        heroImage: categoryForm.heroImage || '',
        ogImage: categoryForm.ogImage || '',
        createdAt: categoryForm.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveCategoryToSupabase(updatedForm);

    } catch (err) {
      logger.error('[CategoriesMenu] Exception in handleCategorySubmit:', err);
      if (typeof addToast === 'function') {
        addToast('Terjadi kesalahan: ' + err.message, 'error');
      } else {
        alert('Terjadi kesalahan: ' + err.message);
      }
    } finally {
      setIsApiLoading(false);
    }
  };

  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const handleDeleteCategory = (index, name) => {
    const cat = categories[index];
    const catId = cat?.id;
    const count = products.filter(p => p.category === name || (catId && p.categoryId === catId)).length;
    if (count > 0) {
      addToast(`Gagal: Kategori masih digunakan oleh ${count} produk.`, 'error');
      return;
    }
    setCategoryToDelete({ index, catId, name });
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    const { catId, name } = categoryToDelete;
    setCategoryToDelete(null);
    await deleteCategoryFromSupabase(catId, name);
  };

  const handleMoveCategory = async (index, direction) => {
    const items = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    
    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;
    
    setCategories(items);
    if (typeof handleSaveCategories === 'function') {
      handleSaveCategories(items);
    }

    setIsApiLoading(true);
    try {
      const cat1 = items[index];
      const cat2 = items[targetIndex];

      if (cat1?.id && cat2?.id) {
        await Promise.all([
          fetch(`/api/admin/categories/${cat1.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ ...cat1, sortOrder: index })
          }),
          fetch(`/api/admin/categories/${cat2.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ ...cat2, sortOrder: targetIndex })
          })
        ]);
      }

      addToast('Urutan kategori berhasil diubah!', 'success');
      handleAddActivityLog(`Mengubah urutan kategori ${temp.name}`);
      
      await fetchCategories();
    } catch (err) {
      logger.error(err);
      addToast('Gagal mengubah urutan kategori di server: ' + err.message, 'warning');
    } finally {
      setIsApiLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left font-sans">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <span className="font-sans text-[9px] sm:text-[10px] uppercase tracking-wider text-[#6E9C7C] font-bold block">SEKTOR KEBUN</span>
          <h3 className="font-sans text-xl sm:text-2xl text-[#174C3C] font-bold mt-0.5">Kategori Hasil Panen</h3>
        </div>
        
        <AdminButton
          onClick={handleOpenAddCategory}
          variant="primary"
          size="md"
          icon={Plus}
        >
          Kategori Baru
        </AdminButton>
      </div>

      {/* Main Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {categories.map((cat, i) => {
          const isFirst = i === 0;
          const isLast = i === categories.length - 1;
          const isInactive = cat.status === 'Nonaktif';
          const imageUrl = buildStorageUrl(cat.image) || null;

          return (
            <div key={cat.name || i} className="flex flex-col gap-3">
              <div className={`group relative bg-white border border-[#EAEAEA] rounded-lg overflow-hidden flex flex-col justify-between h-[260px] w-full shadow-xs hover:shadow-md transition-all duration-300 ${
                isInactive ? 'opacity-70 saturate-50' : ''
              }`}>
                <div className="h-[155px] w-full overflow-hidden relative bg-gray-50 rounded-t-lg shrink-0">
                  <div className="w-full h-full overflow-hidden rounded-t-lg">
                    <img
                      src={imageUrl || null}
                      alt={cat.name}
                      style={{
                        objectPosition: cat.cropPosition || 'center center',
                        transform: `scale(${parseFloat(cat.cropZoom || '100') / 100})`
                      }}
                      className="w-full h-full object-cover select-none pointer-events-none origin-center transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent transition-opacity duration-300 group-hover:from-black/90 z-10 pointer-events-none" />

                  <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 text-[9px] font-sans uppercase tracking-wider text-white font-bold drop-shadow-sm">
                    {isInactive ? (
                      <span className="text-red-300">Nonaktif</span>
                    ) : (
                      <span className="text-green-300">Aktif</span>
                    )}
                  </div>
                </div>

                <div className="flex-1 px-4 py-3 flex flex-col justify-between bg-white border-t border-[#FAFAF9] rounded-b-lg text-left overflow-hidden">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start gap-1.5">
                      <h3 className="text-[13px] md:text-[14px] font-semibold text-[#174C3C] tracking-tight leading-tight transition-colors duration-300 group-hover:text-[#4D8B55]">
                        {cat.name}
                      </h3>
                    </div>
                    {cat.description && (
                      <p className="text-[11px] text-gray-500 font-normal leading-normal line-clamp-2">
                        {cat.description}
                      </p>
                    )}
                  </div>

                  {cat.ctaText && (
                    <div className="flex items-center text-[#174C3C] font-semibold text-[11px] sm:text-[12px] tracking-wide transition-colors duration-300 group-hover:text-[#4D8B55] mt-1">
                      <span>{cat.ctaText}</span>
                      <span className="inline-block ml-1 transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center bg-[#FCFCFC] border border-[#DDE9DF] rounded-xl p-2 px-3 text-[10px] font-bold text-[#6B7280]">
                <div className="flex items-center gap-1 bg-white border border-[#DDE9DF] rounded-lg p-0.5">
                  <button
                    disabled={isFirst}
                    onClick={() => handleMoveCategory(i, 'up')}
                    className={`p-1 rounded-md text-gray-500 hover:bg-[#FCFCFC] hover:text-[#174C3C] transition-all ${isFirst ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                    title="Pindahkan Ke Atas"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={isLast}
                    onClick={() => handleMoveCategory(i, 'down')}
                    className={`p-1 rounded-md text-gray-500 hover:bg-[#FCFCFC] hover:text-[#174C3C] transition-all ${isLast ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                    title="Pindahkan Ke Bawah"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => handleOpenEditCategory(i, cat)} 
                    className="p-1.5 bg-white border border-[#DDE9DF] hover:bg-gray-50 text-gray-500 hover:text-[#174C3C] transition-colors rounded-lg cursor-pointer flex items-center gap-1 px-2" 
                    aria-label="Edit Kategori"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Ubah</span>
                  </button>
                  <button 
                    onClick={() => handleDeleteCategory(i, cat.name)} 
                    className="p-1.5 bg-white border border-[#DDE9DF] hover:bg-rose-50 text-gray-500 hover:text-rose-600 transition-colors rounded-lg cursor-pointer flex items-center gap-1 px-2" 
                    aria-label="Hapus Kategori"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CATEGORY DIALOG FORM & LIVE PREVIEW SYSTEM */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
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
              className="relative w-full max-w-4xl bg-white p-6 md:p-8 rounded-2xl z-10 text-left border border-[#DDE9DF] max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
            >
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="absolute top-5 right-5 p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-rose-600 transition-colors cursor-pointer z-20"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-6">
                <h4 className="font-sans text-lg text-[#174C3C] font-bold">
                  {editingIndex !== null ? 'Ubah Kategori' : 'Kategori Baru'}
                </h4>
              </div>
              
              <form onSubmit={handleCategorySubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  <div className="lg:col-span-7 space-y-5">
                    
                    <div className="space-y-4">
                      <span className="font-sans text-[11px] uppercase tracking-wider text-[#174C3C] font-extrabold block border-b border-gray-100 pb-1.5">
                        Informasi Utama
                      </span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Nama Kategori *</label>
                          <input 
                            type="text" 
                            required 
                            value={categoryForm.name} 
                            onChange={handleNameChange} 
                            placeholder="misal: Sayuran Daun"
                            className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C] font-sans font-medium" 
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Slug Kategori *</label>
                          <input 
                            type="text" 
                            required 
                            value={categoryForm.slug} 
                            onChange={(e) => setCategoryForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') }))} 
                            className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C] font-sans font-medium" 
                            placeholder="misal: sayuran-daun" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Badge Kategori (metaTitle)</label>
                          <input 
                            type="text" 
                            value={categoryForm.metaTitle} 
                            onChange={(e) => setCategoryForm(prev => ({ ...prev, metaTitle: e.target.value }))} 
                            className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C] font-sans font-medium" 
                            placeholder="misal: Populer (Maks 30 Karakter)" 
                            maxLength={30}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Status Tampil *</label>
                          <select
                            value={categoryForm.status}
                            onChange={(e) => setCategoryForm(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full text-xs p-3 bg-[#FCFCFC] border border-[#DDE9DF] outline-none rounded-xl font-sans font-medium"
                          >
                            <option value="Aktif">Aktif (Ditampilkan)</option>
                            <option value="Nonaktif">Nonaktif (Disembunyikan)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Keterangan / Deskripsi Kategori</label>
                        <textarea 
                          rows={2.5} 
                          value={categoryForm.description} 
                          onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))} 
                          placeholder="Tulis penjelasan singkat mengenai kategori hasil bumi ini..."
                          className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C] font-sans font-medium leading-relaxed" 
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <span className="font-sans text-[11px] uppercase tracking-wider text-[#174C3C] font-extrabold block border-b border-gray-100 pb-1.5">
                        Media & Tampilan Gambar
                      </span>

                      <div className="space-y-3.5">
                        <div className="space-y-1.5">
                          <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Cover Kategori Image *</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              required
                              value={categoryForm.image}
                              onChange={(e) => setCategoryForm(prev => ({ ...prev, image: e.target.value }))}
                              placeholder="Masukkan tautan gambar cover..."
                              className="flex-1 text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C] font-sans font-medium"
                            />
                            <label className="px-4 py-3 bg-[#174C3C] hover:bg-[#205E49] active:bg-[#123A2E] text-white font-sans text-[10px] uppercase tracking-wider cursor-pointer flex items-center shrink-0 rounded-xl font-bold transition-colors duration-200">
                              FILE
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleCategoryFileChange}
                              />
                            </label>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Banner Kategori (Detail Page)</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={categoryForm.banner}
                              onChange={(e) => setCategoryForm(prev => ({ ...prev, banner: e.target.value }))}
                              placeholder="Masukkan tautan gambar banner..."
                              className="flex-1 text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C] font-sans font-medium"
                            />
                            <label className="px-4 py-3 bg-[#174C3C] hover:bg-[#205E49] active:bg-[#123A2E] text-white font-sans text-[10px] uppercase tracking-wider cursor-pointer flex items-center shrink-0 rounded-xl font-bold transition-colors duration-200">
                              FILE
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileChangeForField(e, 'banner')}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <span className="font-sans text-[11px] uppercase tracking-wider text-[#174C3C] font-extrabold block border-b border-gray-100 pb-1.5">
                        Optimasi SEO & Metadata Toko
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Meta Description</label>
                          <textarea 
                            rows={2.5}
                            value={categoryForm.metaDescription} 
                            onChange={(e) => setCategoryForm(prev => ({ ...prev, metaDescription: e.target.value }))} 
                            placeholder="Deskripsi pencarian Google..."
                            className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C] font-sans font-medium" 
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">OG Image (SEO Social Share)</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={categoryForm.ogImage}
                              onChange={(e) => setCategoryForm(prev => ({ ...prev, ogImage: e.target.value }))}
                              placeholder="Tautan gambar OG share..."
                              className="flex-1 text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C] font-sans font-medium"
                            />
                            <label className="px-4 py-3 bg-[#174C3C] hover:bg-[#205E49] active:bg-[#123A2E] text-white font-sans text-[10px] uppercase tracking-wider cursor-pointer flex items-center shrink-0 rounded-xl font-bold transition-colors duration-200">
                              FILE
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileChangeForField(e, 'ogImage')}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <span className="font-sans text-[11px] uppercase tracking-wider text-[#174C3C] font-extrabold block border-b border-gray-100 pb-1.5">
                        Pengaturan Tambahan & CTA
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Teks Tombol CTA</label>
                          <input 
                            type="text" 
                            value={categoryForm.ctaText || ''} 
                            onChange={(e) => setCategoryForm(prev => ({ ...prev, ctaText: e.target.value }))} 
                            className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C] font-sans font-medium" 
                            placeholder="misal: Lihat Kategori" 
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Link Tombol CTA</label>
                          <input 
                            type="text" 
                            value={categoryForm.ctaLink || ''} 
                            onChange={(e) => setCategoryForm(prev => ({ ...prev, ctaLink: e.target.value }))} 
                            className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C] font-sans font-medium" 
                            placeholder="misal: /produk?category=sayuran" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Warna Badge</label>
                          <select
                            value={categoryForm.badgeColor || 'Green'}
                            onChange={(e) => setCategoryForm(prev => ({ ...prev, badgeColor: e.target.value }))}
                            className="w-full text-xs p-3 bg-[#FCFCFC] border border-[#DDE9DF] outline-none rounded-xl font-sans font-medium"
                          >
                            <option value="Green">Hijau (Default)</option>
                            <option value="Gray">Abu-abu</option>
                            <option value="Orange">Oranye</option>
                            <option value="Blue">Biru</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Urutan Tampil (Sort Order)</label>
                          <input 
                            type="number" 
                            value={categoryForm.sortOrder || 0} 
                            onChange={(e) => setCategoryForm(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))} 
                            className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C] font-sans font-medium" 
                            placeholder="0" 
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Tampil di Homepage?</label>
                          <select
                            value={categoryForm.showOnHomepage === false ? 'Tidak' : 'Ya'}
                            onChange={(e) => setCategoryForm(prev => ({ ...prev, showOnHomepage: e.target.value === 'Ya' }))}
                            className="w-full text-xs p-3 bg-[#FCFCFC] border border-[#DDE9DF] outline-none rounded-xl font-sans font-medium"
                          >
                            <option value="Ya">Ya (Tampilkan)</option>
                            <option value="Tidak">Tidak (Sembunyikan)</option>
                          </select>
                        </div>
                      </div>

                      {categoryForm.createdAt && (
                        <div className="text-[10px] text-[#888888] space-y-1 pt-2 border-t border-gray-100">
                          <p>Dibuat: {formatDate(categoryForm.createdAt)}</p>
                          {categoryForm.updatedAt && (
                            <p>Diperbarui: {formatDate(categoryForm.updatedAt)}</p>
                          )}
                        </div>
                      )}
                    </div>

                  </div>

                  <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-gray-100 pt-6 lg:pt-0 lg:pl-8 space-y-6 lg:sticky lg:top-0">
                    <div>
                      <span className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-extrabold block mb-3">
                        PRATINJAU VISUAL (REALTIME)
                      </span>
                      
                      <div className="group relative bg-white border border-[#EAEAEA] rounded-lg overflow-hidden flex flex-col justify-between h-[260px] w-full max-w-[220px] mx-auto shadow-md transition-all duration-300">
                        <div className="h-[155px] w-full overflow-hidden relative bg-gray-50 rounded-t-lg shrink-0">
                          <div className="w-full h-full overflow-hidden rounded-t-lg">
                            <img
                              src={buildStorageUrl(categoryForm.image) || null}
                              alt={categoryForm.name || 'Pratinjau Kategori'}
                              style={{
                                objectPosition: categoryForm.cropPosition || 'center center',
                                transform: `scale(${parseFloat(categoryForm.cropZoom || '100') / 100})`
                              }}
                              className="w-full h-full object-cover select-none pointer-events-none origin-center"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent transition-opacity duration-300 z-10 pointer-events-none" />

                          <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 text-[9px] font-sans uppercase tracking-wider text-white font-bold drop-shadow-sm">
                            {categoryForm.status === 'Nonaktif' ? (
                              <span className="text-red-300">Nonaktif</span>
                            ) : (
                              <span className="text-green-300">Aktif</span>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 px-4 py-3 flex flex-col justify-between bg-white border-t border-[#FAFAF9] rounded-b-lg text-left overflow-hidden">
                          <div className="space-y-1">
                            {categoryForm.name && (
                              <div className="flex justify-between items-start gap-1.5">
                                <h3 className="text-[13px] font-semibold text-[#174C3C] tracking-tight leading-tight">
                                  {categoryForm.name}
                                </h3>
                              </div>
                            )}
                            {categoryForm.description && (
                              <p className="text-[11px] text-gray-500 font-normal leading-normal line-clamp-2">
                                {categoryForm.description}
                              </p>
                            )}
                          </div>

                          {categoryForm.ctaText && (
                            <div className="flex items-center text-[#174C3C] font-semibold text-[11px] tracking-wide mt-1">
                              <span>{categoryForm.ctaText}</span>
                              <span className="inline-block ml-1">→</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <AdminButton
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    variant="outline"
                    size="md"
                  >
                    Batal
                  </AdminButton>

                  <AdminButton
                    type="submit"
                    disabled={isApiLoading}
                    variant="primary"
                    size="md"
                  >
                    {isApiLoading ? 'Menyimpan...' : 'Simpan Kategori'}
                  </AdminButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DeleteConfirmModal
        isOpen={Boolean(categoryToDelete)}
        title="Hapus Kategori"
        itemName={categoryToDelete?.name}
        itemType="kategori"
        onConfirm={confirmDeleteCategory}
        onClose={() => setCategoryToDelete(null)}
      />
    </div>
  );
}
