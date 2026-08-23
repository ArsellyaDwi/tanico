"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit, Trash2, X, FileText, Search, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { logger } from '@/utils/logger';
import { buildStorageUrl } from '@/utils/buildStorageUrl';
import { uploadFileToSupabase } from '@/utils/uploadHelper';
import AdminButton from '@/components/admin/AdminButton';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { useAdmin } from '@/components/admin/AdminShell';

export default function AdminArticlesPage() {
  const {
    addToast,
    handleAddActivityLog
  } = useAdmin();

  const [articles, setArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [form, setForm] = useState({
    id: '',
    title: '',
    subtitle: '',
    slug: '',
    category: 'Edukasi',
    author: 'Tim TaniCo',
    image: '',
    excerpt: '',
    content: '',
    readTime: '5 min baca',
    date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    status: 'Published',
    showOnHomepage: true,
    showOnKisahMitra: false
  });

  useEffect(() => {
    let isMounted = true;
    async function loadArticles() {
      try {
        const res = await fetch('/api/admin/articles');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setArticles(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error fetching articles:', err);
      }
    }
    loadArticles();
    return () => { isMounted = false; };
  }, []);

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase();
      const customFilename = `article_${Date.now()}_${cleanFileName}`;

      setIsUploading(true);
      addToast?.('Mengunggah gambar artikel ke Supabase Storage...', 'info');

      try {
        const res = await uploadFileToSupabase(file, 'articles', customFilename);
        if (res.success && (res.url || res.publicUrl)) {
          const uploadedUrl = res.url || res.publicUrl;
          setForm(prev => ({ ...prev, image: uploadedUrl }));
          addToast?.('Gambar artikel berhasil diunggah ke Supabase!', 'success');
        } else {
          addToast?.(res.error || 'Gagal mengunggah gambar artikel', 'error');
        }
      } catch (err) {
        console.error('Upload article image error:', err);
        addToast?.('Terjadi kesalahan saat mengunggah gambar artikel', 'error');
      } finally {
        setIsUploading(false);
        e.target.value = '';
      }
    }
  };

  const openAddModal = () => {
    setEditingIndex(null);
    setForm({
      id: '',
      title: '',
      subtitle: '',
      slug: '',
      category: 'Edukasi',
      author: 'Tim TaniCo',
      image: '',
      excerpt: '',
      content: '',
      readTime: '5 min baca',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      status: 'Published',
      showOnHomepage: true,
      showOnKisahMitra: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (article, idx) => {
    setEditingIndex(idx);
    setForm({
      ...article,
      subtitle: article.subtitle || '',
      image: article.image || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || (!form.content && !form.excerpt)) {
      addToast?.('Judul dan ringkasan/konten artikel wajib diisi!', 'error');
      return;
    }

    try {
      const generatedSlug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const processedImage = form.image || '';

      const articlePayload = {
        ...form,
        slug: generatedSlug,
        image: processedImage,
        content: form.content || form.excerpt || form.title
      };

      let res;
      if (editingIndex !== null && form.id) {
        res = await fetch(`/api/admin/articles/${form.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(articlePayload)
        });
      } else {
        res = await fetch('/api/admin/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(articlePayload)
        });
      }

      if (res.ok) {
        const saved = await res.json();
        const updatedItems = [...articles];
        if (editingIndex !== null) {
          updatedItems[editingIndex] = saved;
        } else {
          updatedItems.unshift(saved);
        }
        setArticles(updatedItems);
        addToast?.(`Artikel "${form.title}" berhasil disimpan!`, 'success');
        handleAddActivityLog?.(`Pengelolaan Artikel: Menyimpan "${form.title}"`);
        setIsModalOpen(false);
      } else {
        const errData = await res.json().catch(() => ({}));
        addToast?.('Gagal menyimpan artikel: ' + (errData.error || 'Terjadi kesalahan'), 'error');
      }
    } catch (err) {
      logger.error(err);
      addToast?.('Gagal menyimpan artikel: ' + err.message, 'error');
    }
  };

  const [articleToDelete, setArticleToDelete] = useState(null);

  const handleDelete = (idx) => {
    const item = articles[idx];
    setArticleToDelete({ idx, item });
  };

  const confirmDeleteArticle = async () => {
    if (!articleToDelete) return;
    const { idx, item } = articleToDelete;
    setArticleToDelete(null);
    try {
      const res = await fetch(`/api/admin/articles/${item.id}`, { method: 'DELETE' });
      if (res.ok) {
        const updatedItems = articles.filter((_, i) => i !== idx);
        setArticles(updatedItems);
        addToast?.('Artikel berhasil dihapus.', 'success');
        handleAddActivityLog?.(`Pengelolaan Artikel: Menghapus "${item.title}"`);
      } else {
        addToast?.('Gagal menghapus artikel.', 'error');
      }
    } catch (err) {
      logger.error(err);
      addToast?.('Gagal menghapus artikel.', 'error');
    }
  };

  const toggleHomepage = async (idx) => {
    const target = articles[idx];
    const newStatus = !target.showOnHomepage;
    try {
      const res = await fetch(`/api/admin/articles/${target.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showOnHomepage: newStatus })
      });
      if (res.ok) {
        const updatedItems = [...articles];
        updatedItems[idx] = { ...updatedItems[idx], showOnHomepage: newStatus };
        setArticles(updatedItems);
        addToast?.(`Status homepage "${target.title}" diperbarui.`, 'success');
      }
    } catch (err) {
      logger.error(err);
    }
  };

  const toggleKisahMitra = async (idx) => {
    const target = articles[idx];
    const newStatus = !target.showOnKisahMitra;
    try {
      const res = await fetch(`/api/admin/articles/${target.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showOnKisahMitra: newStatus })
      });
      if (res.ok) {
        const updatedItems = [...articles];
        updatedItems[idx] = { ...updatedItems[idx], showOnKisahMitra: newStatus };
        setArticles(updatedItems);
        addToast?.(`Status Kisah Mitra "${target.title}" diperbarui.`, 'success');
      }
    } catch (err) {
      logger.error(err);
    }
  };

  const categoriesList = ['Semua', ...new Set(articles.map(a => a.category || 'Lainnya'))];

  const filteredArticles = articles.filter(art => {
    const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          art.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          art.author?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || art.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 text-left font-sans">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <span className="font-sans text-[9px] sm:text-[10px] uppercase tracking-wider text-[#6E9C7C] font-bold block">KONTEN MANAJEMEN</span>
          <h3 className="font-sans text-xl sm:text-2xl text-[#174C3C] font-bold mt-0.5">Manajemen Artikel & Kisah Mitra</h3>
          <p className="text-xs text-gray-500 font-sans mt-0.5">Kelola seluruh berita, edukasi, dan kisah mitra TaniCo di satu tempat terpusat.</p>
        </div>

        <AdminButton
          onClick={openAddModal}
          variant="primary"
          size="md"
          icon={Plus}
        >
          Tulis Artikel Baru
        </AdminButton>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white border border-[#DDE9DF] p-3.5 sm:p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 sm:top-3 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari artikel..."
            className="w-full text-xs sm:text-sm pl-9 pr-3.5 py-2 sm:py-2.5 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] rounded-full outline-none focus:border-[#174C3C]"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-[10px] uppercase font-bold text-gray-400 shrink-0">Kategori:</span>
          {categoriesList.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#174C3C] text-white hover:bg-[#205E49]'
                  : 'bg-[#FCFCFC] text-[#174C3C] border border-[#DDE9DF] hover:bg-[#DCEFE0]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ARTICLES LIST GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((art, idx) => {
          const originalIdx = articles.findIndex(a => a.id === art.id);
          return (
            <div key={art.id || idx} className="bg-white border border-[#DDE9DF] rounded-2xl overflow-hidden shadow-2xs flex flex-col justify-between group">
              <div>
                <div className="h-44 relative overflow-hidden bg-gray-100 flex items-center justify-center">
                  {art.image ? (
                    <img
                      src={buildStorageUrl(art.image)}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <FileText className="w-10 h-10 text-gray-300" />
                  )}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {art.category && (
                      <span className="text-white text-[9px] uppercase font-bold tracking-wider drop-shadow-sm bg-black/40 px-2 py-0.5 rounded">
                        {art.category}
                      </span>
                    )}
                    <span className={`text-[9px] uppercase font-bold tracking-wider drop-shadow-sm bg-black/40 px-2 py-0.5 rounded ${
                      art.status === 'Published' || art.status === 'published' ? 'text-emerald-300' : 'text-amber-300'
                    }`}>
                      • {art.status || 'Published'}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <span>{art.author || ''}</span>
                    <span>{art.date}</span>
                  </div>

                  <h4 className="font-sans text-base text-[#174C3C] font-bold line-clamp-2 leading-snug">
                    {art.title}
                  </h4>

                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {art.excerpt}
                  </p>
                </div>
              </div>

              {/* CONTROLS & TOGGLES */}
              <div className="p-4 bg-[#FCFCFC] border-t border-[#DDE9DF] space-y-3">
                <div className="flex items-center justify-between text-[11px] text-gray-600 font-medium">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Tampilkan Di:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleHomepage(originalIdx)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer border ${
                        art.showOnHomepage
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-gray-100 text-gray-400 border-gray-200'
                      }`}
                      title="Tampilkan di Carousel Homepage"
                    >
                      {art.showOnHomepage ? '✓ Homepage' : '+ Homepage'}
                    </button>

                    <button
                      onClick={() => toggleKisahMitra(originalIdx)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer border ${
                        art.showOnKisahMitra
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : 'bg-gray-100 text-gray-400 border-gray-200'
                      }`}
                      title="Tampilkan di Halaman Kisah Mitra"
                    >
                      {art.showOnKisahMitra ? '✓ Kisah Mitra' : '+ Kisah Mitra'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200/60">
                  <button
                    onClick={() => openEditModal(art, originalIdx)}
                    className="p-2 bg-white text-[#174C3C] border border-[#DDE9DF] hover:bg-[#174C3C] hover:text-white rounded-full transition-colors cursor-pointer"
                    aria-label="Edit Artikel"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(originalIdx)}
                    className="p-2 bg-white text-rose-600 border border-[#DDE9DF] hover:bg-rose-600 hover:text-white rounded-full transition-colors cursor-pointer"
                    aria-label="Hapus Artikel"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredArticles.length === 0 && (
        <div className="bg-white border border-[#DDE9DF] p-12 rounded-2xl text-center space-y-3">
          <FileText className="w-12 h-12 mx-auto text-gray-300" />
          <p className="text-sm font-bold text-[#174C3C]">Belum ada artikel yang cocok.</p>
          <p className="text-xs text-gray-500">Silakan tambahkan artikel baru atau ganti kata kunci pencarian.</p>
        </div>
      )}

      {/* FORM MODAL */}
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
              className="relative w-full max-w-2xl bg-white p-6 rounded-2xl z-10 text-left border border-[#DDE9DF] max-h-[90vh] overflow-y-auto shadow-2xl space-y-4"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h4 className="font-sans text-lg text-[#174C3C] font-bold">
                {editingIndex !== null ? 'Edit Artikel' : 'Tulis Artikel Baru'}
              </h4>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Judul Artikel *</label>
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Masukkan judul artikel..."
                      className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C] font-sans"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Subjudul (Subtitle / Kutipan Singkat)</label>
                    <input
                      type="text"
                      value={form.subtitle || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, subtitle: e.target.value }))}
                      placeholder="Subjudul opsional atau kutipan pengantar..."
                      className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C] font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Kategori *</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C] font-sans"
                    >
                      <option value="Edukasi">Edukasi & Tips</option>
                      <option value="Inovasi">Inovasi Pertanian</option>
                      <option value="Kisah Mitra">Kisah Mitra Tani</option>
                      <option value="Teknologi">Teknologi Kebun</option>
                      <option value="Resep & Nutrisi">Resep & Nutrisi</option>
                      <option value="Kesehatan">Kesehatan</option>
                      <option value="Tips & Trik">Tips & Trik</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Penulis *</label>
                    <input
                      type="text"
                      required
                      value={form.author}
                      onChange={(e) => setForm(prev => ({ ...prev, author: e.target.value }))}
                      className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C] font-sans"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Gambar Utama Artikel</label>
                    
                    {/* Preview Box if image exists */}
                    {form.image && (
                      <div className="relative w-full h-44 bg-gray-100 rounded-xl overflow-hidden border border-[#DDE9DF] mb-2 group flex items-center justify-center">
                        <img
                          src={buildStorageUrl(form.image)}
                          alt="Preview Artikel"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, image: '' }))}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Hapus Gambar
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={form.image || ''}
                        onChange={(e) => setForm(prev => ({ ...prev, image: e.target.value }))}
                        placeholder="URL gambar Supabase atau https://..."
                        className="flex-1 text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C]"
                      />
                      <label className={`px-4 py-3 ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#174C3C] hover:bg-[#205E49] cursor-pointer'} text-white font-sans text-[10px] uppercase tracking-wider flex items-center gap-1.5 shrink-0 rounded-xl font-bold transition-colors duration-200`}>
                        <UploadCloud className="w-3.5 h-3.5" />
                        {isUploading ? 'UPLOADING...' : 'UPLOAD'}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploading}
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-gray-500 font-sans">Pilih file gambar untuk diunggah langsung ke Supabase Storage (bucket: articles).</p>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Ringkasan Singkat (Excerpt) *</label>
                    <textarea
                      rows={2}
                      required
                      value={form.excerpt}
                      onChange={(e) => setForm(prev => ({ ...prev, excerpt: e.target.value }))}
                      placeholder="Ringkasan singkat 1-2 kalimat untuk kartu artikel..."
                      className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C] font-sans"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Isi Konten Lengkap</label>
                    <textarea
                      rows={6}
                      value={form.content}
                      onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Tulis narasi lengkap artikel di sini..."
                      className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C] font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Estimasi Baca</label>
                    <input
                      type="text"
                      value={form.readTime}
                      onChange={(e) => setForm(prev => ({ ...prev, readTime: e.target.value }))}
                      className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C] font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Status *</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl focus:border-[#174C3C] font-sans"
                    >
                      <option value="Published">Published</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                </div>

                {/* VISIBILITY TOGGLES */}
                <div className="p-4 bg-[#FCFCFC] border border-[#DDE9DF] rounded-xl space-y-2">
                  <span className="font-sans text-[10px] uppercase tracking-wider text-[#174C3C] font-bold block">Pengaturan Tampilan Konten</span>
                  
                  <div className="flex flex-col sm:flex-row gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                      <input
                        type="checkbox"
                        checked={form.showOnHomepage}
                        onChange={(e) => setForm(prev => ({ ...prev, showOnHomepage: e.target.checked }))}
                        className="w-4 h-4 accent-[#174C3C] rounded"
                      />
                      <span>Tampilkan di Carousel UmkmStory Homepage</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                      <input
                        type="checkbox"
                        checked={form.showOnKisahMitra}
                        onChange={(e) => setForm(prev => ({ ...prev, showOnKisahMitra: e.target.checked }))}
                        className="w-4 h-4 accent-[#174C3C] rounded"
                      />
                      <span>Tampilkan di Halaman Kisah Mitra Tani</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#DDE9DF] flex items-center justify-end gap-2.5">
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
                    variant="primary"
                    size="md"
                  >
                    Simpan Artikel
                  </AdminButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DeleteConfirmModal
        isOpen={Boolean(articleToDelete)}
        title="Hapus Artikel"
        itemName={articleToDelete?.item?.title}
        itemType="artikel"
        onConfirm={confirmDeleteArticle}
        onClose={() => setArticleToDelete(null)}
      />
    </div>
  );
}
