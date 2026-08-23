"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { logger } from '@/utils/logger';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Download, 
  Upload, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ImageIcon,
  Loader2
} from 'lucide-react';
import { uploadFileToSupabase } from '@/utils/uploadHelper';
import { formatRupiah } from '@/utils/formatters';
import AdminButton from '@/components/admin/AdminButton';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { useAdmin } from '@/components/admin/AdminShell';

export default function AdminProductsPage() {
  const {
    products,
    categories,
    categoryNamesList,
    handleAddProduct,
    handleEditProduct,
    handleDeleteProduct,
    addToast
  } = useAdmin();

  const allCategoriesList = categoryNamesList || categories.map(c => typeof c === 'string' ? c : c.name);

  // State variables matching old controller logic
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('Semua');
  const [selectedStock, setSelectedStock] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Form Drawer Modal states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Form Fields State matching standard default fields
  const defaultForm = {
    id: '',
    name: '',
    category: allCategoriesList[0] || 'Sayuran Daun',
    price: 0,
    discountPrice: '',
    unit: 'kg',
    image: '',
    stock: 20,
    description: '',
    origin: 'Pemali, Bangka',
    certification: 'Sertifikasi Organik TaniCo',
    weight: 1000,
    benefits: '',
    isFeatured: false,
    isNew: false,
    isPopular: false,
    isSeasonal: false,
    isOrganic: false,
    isHydroponic: false,
    isBestSeller: false,
    status: 'Aktif',
    images: [],
    slug: '',
    shortDescription: '',
    benefitsList: '',
    nutritionFacts: { energy: '', protein: '', carbs: '', fiber: '', vitA: '', vitC: '' },
    badges: 'Dipanen Hari Ini, Organik, Petani Lokal',
    bannerCtaTitle: 'Siap Menikmati Sayuran Segar Hari Ini?',
    bannerCtaText: 'Belanja langsung dari petani lokal Bangka dan nikmati kualitas terbaik setiap hari.',
    relatedProductIds: ''
  };
  const [formData, setFormData] = useState(defaultForm);
  const [dragActive, setDragActive] = useState(false);

  // Filter products locally for instantaneous administrative query results
  const filtered = useMemo(() => {
    return products.filter(p => {
      const nameMatch = (p.name || '').toLowerCase().includes(search.toLowerCase());
      const descMatch = (p.description || '').toLowerCase().includes(search.toLowerCase());
      const originMatch = (p.origin || '').toLowerCase().includes(search.toLowerCase());
      const matchesSearch = nameMatch || descMatch || originMatch;

      const matchesCat = selectedCat === 'Semua' || (p.category || p.categoryName) === selectedCat;
      const matchesStock = selectedStock === 'Semua' || 
                           (selectedStock === 'Menipis' && p.stock < 10 && p.stock > 0) ||
                           (selectedStock === 'Habis' && p.stock === 0);
      return matchesSearch && matchesCat && matchesStock;
    });
  }, [products, search, selectedCat, selectedStock]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCat, selectedStock]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      ...defaultForm,
      id: 'sayur-' + Math.random().toString(36).substring(2, 9),
      category: allCategoriesList[0] || 'Sayuran Daun'
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingItem(p);
    const existingImages = Array.isArray(p.images) && p.images.length > 0
      ? p.images.map(img => typeof img === 'string' ? img : img?.url).filter(Boolean)
      : (p.image ? [p.image] : []);

    setFormData({
      id: p.id,
      name: p.name,
      category: p.category || p.categoryName || allCategoriesList[0] || 'Sayuran Daun',
      price: p.price,
      discountPrice: p.discountPrice !== null && p.discountPrice !== undefined ? p.discountPrice : '',
      unit: p.unit,
      image: p.image,
      stock: p.stock,
      description: p.description,
      origin: p.origin || 'Pemali, Bangka',
      certification: p.certification || 'Sertifikasi Organik TaniCo',
      weight: p.weight || 1000,
      benefits: p.benefits || '',
      isFeatured: p.isFeatured || false,
      isNew: p.isNew || false,
      isPopular: p.isPopular || false,
      isSeasonal: p.isSeasonal || false,
      isOrganic: p.isOrganic || false,
      isHydroponic: p.isHydroponic || false,
      isBestSeller: p.isBestSeller || false,
      status: p.status || 'Aktif',
      images: existingImages,
      slug: p.slug || p.id || '',
      shortDescription: p.shortDescription || '',
      benefitsList: p.benefitsList || '',
      nutritionFacts: p.nutritionFacts || { energy: '', protein: '', carbs: '', fiber: '', vitA: '', vitC: '' },
      badges: p.badges || '',
      bannerCtaTitle: p.bannerCtaTitle || '',
      bannerCtaText: p.bannerCtaText || '',
      relatedProductIds: p.relatedProductIds || ''
    });
    setIsDrawerOpen(true);
  };

  const handleMainImageFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase();
      const customFilename = `product_${Date.now()}_${cleanFileName}`;
      setIsUploading(true);
      addToast('Mengunggah gambar ke Supabase Storage...', 'info');
      try {
        const res = await uploadFileToSupabase(file, 'products', customFilename);
        if (res.success && (res.url || res.publicUrl)) {
          const uploadedUrl = res.url || res.publicUrl;
          setFormData(prev => ({
            ...prev,
            image: uploadedUrl
          }));
          addToast('Gambar utama berhasil diunggah ke Supabase!', 'success');
        } else {
          addToast(res.error || 'Gagal mengunggah gambar utama', 'error');
        }
      } catch (err) {
        logger.error('Upload product main image error:', err);
        addToast('Terjadi kesalahan saat mengunggah gambar produk', 'error');
      } finally {
        setIsUploading(false);
        e.target.value = '';
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.name.trim()) {
      addToast('Nama produk wajib diisi!', 'error');
      return;
    }
    if (!formData.category) {
      addToast('Kategori produk wajib dipilih!', 'error');
      return;
    }
    if (!formData.image || !formData.image.trim()) {
      addToast('Gambar utama produk wajib diisi!', 'error');
      return;
    }
    if (formData.price === undefined || formData.price === null || formData.price < 0 || isNaN(Number(formData.price))) {
      addToast('Harga produk harus diisi dengan nilai positif!', 'error');
      return;
    }
    if (formData.stock === undefined || formData.stock === null || formData.stock < 0 || isNaN(Number(formData.stock))) {
      addToast('Stok produk harus diisi dengan nilai positif!', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const mainImageUrl = formData.image || '';
      const processedImagesList = Array.isArray(formData.images) && formData.images.length > 0
        ? formData.images
        : (mainImageUrl ? [mainImageUrl] : []);

      let matchedCategoryId = null;
      if (Array.isArray(categories) && categories.length > 0) {
        const found = categories.find(c => c.name === formData.category);
        if (found) matchedCategoryId = found.id;
      }
      if (!matchedCategoryId) {
        const catMap = {
          'Sayuran Daun': 'cat-daun',
          'Sayuran Buah': 'cat-buah',
          'Sayuran Umbi': 'cat-umbi',
          'Jamur & Rempah': 'cat-rempah'
        };
        matchedCategoryId = catMap[formData.category] || 'cat-' + formData.category.toLowerCase().replace(/[^a-z0-9]/g, '-');
      }

      const payload = {
        id: formData.id,
        name: formData.name,
        category: formData.category,
        categoryName: formData.category,
        categoryId: matchedCategoryId,
        price: Number(formData.price),
        discountPrice: formData.discountPrice !== '' ? Number(formData.discountPrice) : null,
        unit: formData.unit,
        image: mainImageUrl,
        stock: Number(formData.stock),
        rating: editingItem ? editingItem.rating : 5.0,
        description: formData.description,
        origin: formData.origin,
        certification: formData.certification,
        weight: Number(formData.weight),
        benefits: formData.benefits,
        isFeatured: formData.isFeatured,
        isNew: formData.isNew,
        isPopular: formData.isPopular,
        isSeasonal: formData.isSeasonal,
        isOrganic: formData.isOrganic,
        isHydroponic: formData.isHydroponic,
        isBestSeller: formData.isBestSeller,
        status: formData.status,
        images: processedImagesList,
        slug: formData.slug || formData.id,
        shortDescription: formData.shortDescription,
        benefitsList: formData.benefitsList,
        nutritionFacts: formData.nutritionFacts,
        badges: formData.badges,
        bannerCtaTitle: formData.bannerCtaTitle,
        bannerCtaText: formData.bannerCtaText,
        relatedProductIds: formData.relatedProductIds
      };

      if (editingItem) {
        handleEditProduct(payload);
      } else {
        handleAddProduct(payload);
      }
      setIsDrawerOpen(false);
    } catch (err) {
      logger.error(err);
      addToast('Gagal memproses gambar: ' + err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      setIsUploading(true);
      addToast('Mengunggah file ke Supabase Storage...', 'info');
      try {
        for (const file of files) {
          const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase();
          const customFilename = `product_${Date.now()}_${cleanFileName}`;
          const res = await uploadFileToSupabase(file, 'products', customFilename);
          if (res.success && (res.url || res.publicUrl)) {
            const uploadedUrl = res.url || res.publicUrl;
            setFormData(prev => ({
              ...prev,
              image: prev.image || uploadedUrl,
              images: [...(Array.isArray(prev.images) ? prev.images : []), uploadedUrl]
            }));
          }
        }
        addToast('Berhasil mengunggah file gambar ke Supabase!', 'success');
      } catch (err) {
        logger.error('Upload drop gallery image error:', err);
        addToast('Terjadi kesalahan saat mengunggah gambar produk', 'error');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleExportExcel = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["ID,Nama,Kategori,Harga,Diskon,Stok,Satuan,Asal"].join("\n") + "\n"
      + products.map(p => `"${p.id}","${p.name}","${p.category}",${p.price},${p.discountPrice || ''},${p.stock},"${p.unit}","${p.origin}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tanico_produk_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Ekspor CSV (Excel) berhasil diunduh.', 'success');
  };

  const fileInputRef = useRef(null);

  const handleImportExcelClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleCsvFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length <= 1) {
        addToast('File CSV tidak memiliki baris data produk.', 'error');
        setIsImporting(false);
        return;
      }
      const dataLines = lines.slice(1);
      let importedCount = 0;
      for (const line of dataLines) {
        const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
        const matches = [];
        let match;
        while ((match = regex.exec(line)) !== null && matches.length < 15) {
          let val = match[1] || '';
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.slice(1, -1).replace(/""/g, '"');
          }
          matches.push(val.trim());
          if (regex.lastIndex === 0 || regex.lastIndex >= line.length) break;
        }
        
        const [id, name, category, price, discountPrice, stock, unit, origin, description] = matches;
        if (name && name.length >= 2) {
          const newProduct = {
            name: name,
            category: category || '',
            price: Number(price) || 0,
            discountPrice: discountPrice ? Number(discountPrice) : null,
            stock: Number(stock) || 0,
            unit: unit || 'kg',
            origin: origin || '',
            description: description || '',
            status: 'Aktif',
            images: [],
            image: ''
          };
          await handleAddProduct(newProduct);
          importedCount += 1;
        }
      }
      if (importedCount > 0) {
        addToast(`Berhasil mengimpor ${importedCount} produk dari file CSV!`, 'success');
      } else {
        addToast('Tidak ada produk valid yang ditemukan dalam file CSV.', 'warning');
      }
    } catch (err) {
      logger.error('Error importing CSV:', err);
      addToast('Gagal memproses file CSV: ' + err.message, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 text-left pb-12 font-sans">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="font-sans text-[9px] sm:text-[10px] uppercase tracking-wider text-[#6E9C7C] font-bold block">SISTEM KATALOG</span>
          <h2 className="font-sans text-xl sm:text-2xl text-[#174C3C] font-bold mt-0.5">
            Kelola <span className="italic font-normal text-[#6E9C7C]">Katalog Sayur</span>
          </h2>
        </div>

        {/* Action controllers */}
        <div className="flex flex-wrap items-center gap-2">
          <AdminButton
            onClick={handleExportExcel}
            variant="outline"
            size="md"
            icon={Download}
          >
            Ekspor Excel
          </AdminButton>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleCsvFileSelected}
            accept=".csv,text/csv"
            className="hidden"
          />

          <AdminButton
            onClick={handleImportExcelClick}
            disabled={isImporting}
            variant="outline"
            size="md"
            icon={isImporting ? Loader2 : Upload}
          >
            {isImporting ? 'Mengimpor...' : 'Impor Excel (CSV)'}
          </AdminButton>

          <AdminButton
            onClick={handleOpenCreate}
            variant="primary"
            size="md"
            icon={Plus}
            aria-label="Tambah Produk"
          >
            Tambah Produk
          </AdminButton>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white border border-[#DDE9DF] p-3.5 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col md:flex-row gap-3 sm:gap-4 items-center justify-between shadow-2xs">
        
        {/* Left: Search input */}
        <div className="relative w-full md:max-w-xs">
          <input
            type="text"
            placeholder="Cari produk sayur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#FCFCFC] text-xs sm:text-sm text-[#202020] placeholder-[#6B7280] py-2 sm:py-2.5 pl-9 pr-3.5 outline-none border border-[#DDE9DF] focus:border-[#174C3C] transition-colors rounded-full"
          />
          <Search className="w-4 h-4 absolute left-3 top-2.5 sm:top-3 text-gray-400" />
        </div>

        {/* Right: Select filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="space-y-1 text-left flex-1 sm:flex-none">
            <label className="font-sans text-[9px] uppercase tracking-wider text-[#6B7280] font-bold block">Kategori</label>
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="w-full sm:w-auto bg-white border border-[#DDE9DF] text-xs sm:text-sm py-1.5 px-3 outline-none font-sans tracking-wide rounded-full text-[#202020]"
            >
              <option value="Semua">Semua Kategori</option>
              {allCategoriesList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1 text-left flex-1 sm:flex-none">
            <label className="font-sans text-[9px] uppercase tracking-wider text-[#6B7280] font-bold block">Kondisi Stok</label>
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              className="w-full sm:w-auto bg-white border border-[#DDE9DF] text-xs sm:text-sm py-1.5 px-3 outline-none font-sans tracking-wide rounded-full text-[#202020]"
            >
              <option value="Semua">Semua Stok</option>
              <option value="Menipis">Menipis (&lt; 10)</option>
              <option value="Habis">Habis (Kosong)</option>
            </select>
          </div>
        </div>

      </div>

      {/* Grid Table Layout */}
      <div className="bg-white border border-[#DDE9DF] rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FCFCFC] border-b border-[#DDE9DF] font-sans text-[9px] uppercase tracking-widest text-[#6B7280] font-bold">
                <th className="p-4">Info Produk</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">Harga Pokok</th>
                <th className="p-4">Harga Diskon</th>
                <th className="p-4">Stok</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE9DF] text-xs font-sans text-[#202020]">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#6B7280] font-semibold">
                    Tidak ditemukan data produk sayuran yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                paginated.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    
                    <td className="p-4 flex items-center gap-3">
                      <img 
                        src={p.image || null} 
                        alt={p.name} 
                        className="w-10 h-12 object-cover border border-gray-100 rounded-lg"
                      />
                      <div className="space-y-0.5 text-left">
                        <span className="font-sans text-sm text-[#202020] font-bold block">{p.name}</span>
                        <span className="font-sans text-[9px] text-[#6B7280] uppercase tracking-wider block font-bold">
                          Asal: {p.origin} • {p.weight}g
                        </span>
                      </div>
                    </td>

                    <td className="p-4 font-sans text-[10px] uppercase text-[#6E9C7C] tracking-wider font-bold">
                      {typeof p.category === 'object' ? (p.category?.name || p.categoryName || '') : (p.category || p.categoryName || '')}
                    </td>

                    <td className="p-4 font-sans font-bold text-[#174C3C]">
                      {formatRupiah(p.price)} / {p.unit}
                    </td>

                    <td className="p-4 font-sans font-semibold">
                      {p.discountPrice !== null && p.discountPrice !== undefined && p.discountPrice !== '' ? (
                        <span className="text-red-700 text-[10px] font-bold inline-block">
                          {formatRupiah(p.discountPrice)}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>

                    <td className="p-4 font-sans">
                      <span className={`inline-block font-bold text-[10px] ${
                        p.stock === 0 ? 'text-red-700' : 
                        p.stock < 10 ? 'text-amber-700 animate-pulse' :
                        'text-[#174C3C]'
                      }`}>
                        {p.stock} {p.unit}
                      </span>
                    </td>

                    <td className="p-4 font-sans">
                      <span className={`inline-block text-[9px] uppercase tracking-wider font-bold ${
                        p.status === 'Draft' ? 'text-gray-500' : 'text-[#174C3C]'
                      }`}>
                        {p.status || 'Aktif'}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-2 hover:bg-gray-100 text-gray-500 hover:text-[#174C3C] transition-colors rounded-full cursor-pointer"
                          aria-label="Edit Produk"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setProductToDelete(p)}
                          className="p-2 hover:bg-rose-50 text-gray-500 hover:text-rose-600 transition-colors rounded-full cursor-pointer"
                          aria-label="Hapus Produk"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#DDE9DF] flex items-center justify-between font-sans text-[10px] uppercase tracking-wider text-gray-400 font-bold bg-[#FCFCFC]">
            <span>Menampilkan halaman {currentPage} dari {totalPages}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 hover:bg-white border border-[#DDE9DF] disabled:opacity-20 transition-colors rounded-full cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 hover:bg-white border border-[#DDE9DF] disabled:opacity-20 transition-colors rounded-full cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-xs"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
              className="relative w-full max-w-xl bg-white shadow-2xl h-full flex flex-col z-10 border-l border-[#DDE9DF]"
            >
              <div className="px-6 py-5 border-b border-[#DDE9DF] flex items-center justify-between">
                <div>
                  <h3 className="font-sans text-base text-[#174C3C] font-bold">
                    {editingItem ? 'Edit Produk Terkurasi' : 'Tambah Produk Baru'}
                  </h3>
                  <span className="font-sans text-[9px] text-[#6B7280] uppercase tracking-wider block font-bold mt-1">ID: {formData.id}</span>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-left">
                
                <div className="space-y-1.5">
                  <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Nama Sayuran *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Contoh: Bayam Merah Organik"
                    className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] focus:outline-none focus:border-[#174C3C] rounded-xl transition-colors font-sans"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Kategori *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] outline-none rounded-xl"
                    >
                      {allCategoriesList.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Satuan Takaran *</label>
                    <input
                      type="text"
                      required
                      value={formData.unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                      placeholder="Contoh: kg, ikat, 500g"
                      className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] focus:outline-none focus:border-[#174C3C] rounded-xl font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Harga (Rp) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formData.price || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                      className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] focus:outline-none focus:border-[#174C3C] rounded-xl font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Harga Diskon (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.discountPrice || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountPrice: e.target.value }))}
                      placeholder="Kosongkan jika tidak ada"
                      className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] focus:outline-none focus:border-[#174C3C] rounded-xl font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Stok *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formData.stock || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock: Number(e.target.value) }))}
                      className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] focus:outline-none focus:border-[#174C3C] rounded-xl font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Berat (gram) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.weight || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, weight: Number(e.target.value) }))}
                      className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] focus:outline-none focus:border-[#174C3C] rounded-xl font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Asal Panen *</label>
                    <input
                      type="text"
                      required
                      value={formData.origin}
                      onChange={(e) => setFormData(prev => ({ ...prev, origin: e.target.value }))}
                      className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] focus:outline-none focus:border-[#174C3C] rounded-xl font-sans"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Gambar Utama *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={formData.image}
                      onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                      placeholder="Salin tautan gambar atau pilih file..."
                      className="flex-1 text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] focus:outline-none focus:border-[#174C3C] rounded-xl font-sans"
                    />
                    <label className="px-5 py-3 bg-[#174C3C] hover:bg-[#205E49] active:bg-[#123A2E] text-white font-sans text-[10px] uppercase tracking-wider cursor-pointer flex items-center shrink-0 rounded-xl font-bold transition-colors duration-200">
                      PILIH FILE
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleMainImageFileChange}
                      />
                    </label>
                  </div>
                </div>

                {/* Drag and drop gallery images */}
                <div className="space-y-2">
                  <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">
                    Galeri Foto Tambahan (Drag & Drop / Klik)
                  </label>
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => {
                      const el = document.getElementById('multiple-product-images-picker');
                      if (el) el.click();
                    }}
                    className={`border-2 border-dashed p-6 text-center cursor-pointer transition-colors rounded-xl ${
                      dragActive ? 'border-[#174C3C] bg-[#FCFCFC]' : 'border-[#DDE9DF] hover:border-[#174C3C]'
                    }`}
                  >
                    <input
                      id="multiple-product-images-picker"
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          const files = Array.from(e.target.files);
                          setIsUploading(true);
                          addToast('Mengunggah file ke Supabase Storage...', 'info');
                          try {
                            for (const file of files) {
                              const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase();
                              const customFilename = `product_${Date.now()}_${cleanFileName}`;
                              const res = await uploadFileToSupabase(file, 'products', customFilename);
                              if (res.success && (res.url || res.publicUrl)) {
                                const uploadedUrl = res.url || res.publicUrl;
                                setFormData(prev => ({
                                  ...prev,
                                  image: prev.image || uploadedUrl,
                                  images: [...(Array.isArray(prev.images) ? prev.images : []), uploadedUrl]
                                }));
                              }
                            }
                            addToast('Berhasil mengunggah file galeri ke Supabase!', 'success');
                          } catch (err) {
                            logger.error('Upload gallery image error:', err);
                            addToast('Terjadi kesalahan saat mengunggah galeri foto', 'error');
                          } finally {
                            setIsUploading(false);
                            e.target.value = '';
                          }
                        }
                      }}
                    />
                    <div className="space-y-2 flex flex-col items-center">
                      <ImageIcon className="w-8 h-8 text-gray-300 animate-pulse" />
                      <div className="space-y-0.5">
                        <p className="text-xs text-gray-500 font-sans font-semibold">Seret & letakkan foto, atau klik untuk memilih.</p>
                        <p className="text-[9px] text-[#6B7280] font-bold uppercase tracking-wider">Format: JPEG, PNG, WEBP</p>
                      </div>
                    </div>
                  </div>

                  {Array.isArray(formData.images) && formData.images.length > 0 && (
                    <div className="flex flex-wrap gap-2.5 pt-2">
                      {formData.images.map((img, i) => {
                        const imgUrl = typeof img === 'string' ? img : img?.url;
                        return (
                          <div key={i} className="relative w-12 h-16 border border-[#DDE9DF] overflow-hidden group rounded-lg">
                            {imgUrl ? (
                              <img src={imgUrl} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                              className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Sertifikasi *</label>
                  <input
                    type="text"
                    required
                    value={formData.certification}
                    onChange={(e) => setFormData(prev => ({ ...prev, certification: e.target.value }))}
                    className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] focus:outline-none focus:border-[#174C3C] rounded-xl font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Deskripsi Sayur *</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Uraikan keistimewaan sayuran ini..."
                    className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] focus:outline-none focus:border-[#174C3C] rounded-xl font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Khasiat Kesehatan</label>
                  <textarea
                    rows={2}
                    value={formData.benefits}
                    onChange={(e) => setFormData(prev => ({ ...prev, benefits: e.target.value }))}
                    placeholder="Contoh: Mengandung klorofil tinggi, memperlancar pencernaan..."
                    className="w-full text-xs p-3 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] focus:outline-none focus:border-[#174C3C] rounded-xl font-sans"
                  />
                </div>

                {/* PREMIUM SYSTEM PARAMETERS */}
                <div className="border-t border-[#DDE9DF] pt-4 space-y-4">
                  <div className="bg-[#FCFCFC] p-4 rounded-xl border border-[#DDE9DF]">
                    <h4 className="font-sans text-xs text-[#174C3C] font-bold">Parameter Flag Editorial</h4>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      {[
                        { key: 'isFeatured', label: 'Tampilkan di Carousel' },
                        { key: 'isNew', label: 'Produk Baru' },
                        { key: 'isPopular', label: 'Sayur Terpopuler' },
                        { key: 'isOrganic', label: 'Organik Bersertifikat' },
                        { key: 'isHydroponic', label: 'Hidroponik' },
                        { key: 'isBestSeller', label: 'Bestseller' }
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 text-xs font-sans text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData[key]}
                            onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.checked }))}
                            className="w-4 h-4 rounded-md border-[#DDE9DF] text-[#174C3C] focus:ring-[#174C3C]"
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-sans text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Status Penerbitan</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full text-xs p-3 bg-[#FCFCFC] border border-[#DDE9DF] rounded-xl outline-none"
                    >
                      <option value="Aktif">Aktif (Tampil di Toko)</option>
                      <option value="Draft">Draft (Arsip Internal)</option>
                    </select>
                  </div>
                </div>

                {/* Submit row */}
                <div className="pt-4 border-t border-[#DDE9DF] flex items-center justify-end gap-2.5 pb-8">
                  <AdminButton
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    variant="outline"
                    size="md"
                  >
                    Batal
                  </AdminButton>

                  <AdminButton
                    type="submit"
                    disabled={isUploading}
                    variant="primary"
                    size="md"
                    icon={isUploading ? Loader2 : null}
                  >
                    {isUploading ? 'Menyimpan...' : 'Simpan Sayur'}
                  </AdminButton>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DeleteConfirmModal
        isOpen={Boolean(productToDelete)}
        title="Hapus Produk"
        itemName={productToDelete?.name}
        itemType="produk"
        onConfirm={() => {
          if (!productToDelete) return;
          const { id, name } = productToDelete;
          setProductToDelete(null);
          handleDeleteProduct(id, name);
        }}
        onClose={() => setProductToDelete(null)}
      />
    </div>
  );
}
