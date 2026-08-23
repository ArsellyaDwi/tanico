"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { logger } from '@/utils/logger';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart,
  Star,
  MapPin,
  Minus,
  Plus,
  ShoppingCart,
  Check,
  Info,
  MessageSquare,
  CornerDownRight,
  Send,
  BookOpen,
  ArrowLeft,
  ChevronRight,
  Award
} from 'lucide-react';
import { formatRupiah } from '@/utils/formatters';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useLayout } from '@/context/LayoutContext';

const jost = { className: 'font-jost' };

export default function ProductDetailPage({ idOrSlug, initialProduct = null, initialRelatedProducts = [] }) {
  const router = useRouter();
  const cartContext = useCart();
  const wishlistContext = useWishlist();
  const layoutContext = useLayout();

  const [product, setProduct] = useState(initialProduct);
  const [allProductsList, setAllProductsList] = useState(initialRelatedProducts || []);
  const [loading, setLoading] = useState(!initialProduct);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedWeight, setSelectedWeight] = useState(1000); 
  const [manualWeightInput, setManualWeightInput] = useState('');
  const [isManualWeight, setIsManualWeight] = useState(false);
  const [purchaseQty, setPurchaseQty] = useState(1);

  const [reviews, setReviews] = useState([]);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');

  // 1. Load product data directly from API if not provided via server props
  useEffect(() => {
    if (initialProduct && (!initialRelatedProducts || initialRelatedProducts.length > 0)) {
      setProduct(initialProduct);
      if (initialRelatedProducts && initialRelatedProducts.length > 0) {
        setAllProductsList(initialRelatedProducts);
      }
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function fetchProduct() {
      if (!product) setLoading(true);
      try {
        const [directRes, listRes] = await Promise.all([
          fetch(`/api/products/${encodeURIComponent(idOrSlug)}`).catch(() => null),
          fetch('/api/products?limit=12').catch(() => null)
        ]);

        let loadedProd = null;
        if (directRes && directRes.ok) {
          loadedProd = await directRes.json();
        }

        let loadedList = [];
        if (listRes && listRes.ok) {
          loadedList = await listRes.json();
        }

        if (isMounted) {
          if (loadedList && loadedList.length > 0) setAllProductsList(loadedList);
          if (loadedProd) {
            setProduct(loadedProd);
          } else if (loadedList && loadedList.length > 0) {
            const slugify = (name) => (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            const found = loadedList.find(
              p => p.id === idOrSlug || slugify(p.name || '') === idOrSlug
            );
            if (found) setProduct(found);
          }
        }
      } catch (err) {
        console.error('Error loading product detail:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchProduct();
    return () => { isMounted = false; };
  }, [idOrSlug, initialProduct, initialRelatedProducts]);

  // 2. Setup reviews once product is loaded
  useEffect(() => {
    if (!product) return;
    async function loadReviews() {
      try {
        const res = await fetch(`/api/reviews?productId=${product.id}`);
        if (res.ok) {
          const allDbReviews = await res.json();
          const productReviews = (allDbReviews || [])
            .map((r) => ({
              id: r.id,
              author: r.customerName || '',
              rating: r.rating || 5,
              date: r.date || '',
              comment: r.comment || '',
              adminReply: r.adminReply || null
            }));
          setReviews(productReviews);
        }
      } catch (err) {
        console.error('Error loading reviews:', err);
      }
    }
    loadReviews();
  }, [product]);

  // Handle Review Submission
  const handleAddReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newReviewName.trim() || !newReviewComment.trim()) return;

    const newId = 'review-' + Math.random().toString(36).substring(2, 9);
    const saveObj = {
      id: newId,
      productId: product.id,
      productName: product.name,
      customerName: newReviewName,
      rating: newReviewRating,
      comment: newReviewComment,
      reply: '',
      hidden: false,
      status: 'Approved',
      createdAt: new Date().toISOString()
    };

    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveObj)
      });
      setReviews(prev => [{
        id: newId,
        author: newReviewName,
        rating: newReviewRating,
        comment: newReviewComment,
        date: 'Hari Ini'
      }, ...prev]);
      setNewReviewName('');
      setNewReviewComment('');
      setNewReviewRating(5);
      
      if (layoutContext?.addToast) {
        layoutContext.addToast('Ulasan Anda berhasil dikirim!', 'success');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
    }
  };

  // Get active Wishlist and check status
  const activeWishlist = useMemo(() => {
    return wishlistContext?.wishlist || [];
  }, [wishlistContext]);

  const isWishlisted = useMemo(() => {
    if (!product) return false;
    return activeWishlist.includes(product.id);
  }, [product, activeWishlist]);

  const handleToggleWishlist = () => {
    if (!product) return;
    if (wishlistContext?.toggleWishlist) {
      wishlistContext.toggleWishlist(product.id, product.name);
    } else if (layoutContext?.addToast) {
      layoutContext.addToast('Favorit diperbarui.', 'success');
    }
  };

  // Weight options calculation
  const isSoldByKg = product?.unit === 'kg';
  const finalWeightGrams = isSoldByKg 
    ? (isManualWeight ? (parseInt(manualWeightInput) || 1000) : selectedWeight) 
    : undefined;

  const itemPriceForWeightSelection = isSoldByKg && finalWeightGrams
    ? (product.price * finalWeightGrams) / 1000
    : product?.price || 0;

  const dynamicSubtotal = itemPriceForWeightSelection * purchaseQty;

  // Curated Related Products
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return allProductsList
      .filter(p => p.category === product.category && p.id !== product.id && p.status !== 'Draft')
      .slice(0, 3);
  }, [product, allProductsList]);

  // Gallery images array resolver
  const productImagesList = useMemo(() => {
    if (!product) return [];
    const list = [];
    if (product.image) list.push(product.image);
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach((img) => {
        const url = typeof img === 'string' ? img : img?.url;
        if (url && url !== product.image && !list.includes(url)) {
          list.push(url);
        }
      });
    }
    return list.map(img => {
      if (!img) return '';
      if (img.startsWith('http') || img.startsWith('data:') || img.startsWith('/')) return img;
      return `/${img}`;
    }).filter(Boolean);
  }, [product]);

  const getProductLabels = (p) => {
    const list = [];
    if (p.isOrganic) list.push({ name: 'Organik', bg: 'bg-white text-zinc-600 border-zinc-200' });
    if (p.isHydroponic) list.push({ name: 'Hidroponik', bg: 'bg-white text-zinc-600 border-zinc-200' });
    if (p.isSeasonal) list.push({ name: 'Musiman', bg: 'bg-white text-zinc-600 border-zinc-200' });
    if (p.isBestSeller) list.push({ name: 'Best Seller', bg: 'bg-white text-zinc-600 border-zinc-200' });
    if (p.isNew) list.push({ name: 'Terbaru', bg: 'bg-white text-zinc-600 border-zinc-200' });
    return list;
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (cartContext?.addToCart) {
      cartContext.addToCart(product, purchaseQty, finalWeightGrams, itemPriceForWeightSelection);
    } else if (layoutContext?.addToast) {
      layoutContext.addToast(`Berhasil menambahkan ${product.name} ke keranjang.`, 'success');
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (cartContext?.addToCart) {
      cartContext.addToCart(product, purchaseQty, finalWeightGrams, itemPriceForWeightSelection);
    }
    if (layoutContext?.setIsCheckoutOpen) {
      layoutContext.setIsCheckoutOpen(true);
    }
  };

  if (loading) {
    return (
      <div className={`${jost.className} min-h-screen bg-[#FCFCFC] text-slate-600 pb-16 antialiased animate-pulse`}>
        <div className="max-w-7xl mx-auto px-6 md:px-8 pt-6">
          {/* Breadcrumb Skeleton */}
          <div className="h-3.5 w-64 bg-gray-200 rounded-md mb-8" />

          {/* Product Detail Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Gallery Left Skeleton */}
            <div className="lg:col-span-6 space-y-4">
              <div className="aspect-square w-full bg-gray-200 rounded-2xl" />
              <div className="flex gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-16 h-16 rounded-xl bg-gray-200 shrink-0" />
                ))}
              </div>
            </div>

            {/* Product Meta Right Skeleton */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-3">
                <div className="h-3.5 w-28 bg-gray-200 rounded-full" />
                <div className="h-8 w-3/4 bg-gray-200 rounded-lg" />
                <div className="h-4 w-32 bg-gray-100 rounded-md" />
              </div>

              <div className="h-10 w-44 bg-gray-200 rounded-xl" />

              <div className="space-y-2 border-t border-b border-gray-100 py-6">
                <div className="h-4 w-full bg-gray-100 rounded-md" />
                <div className="h-4 w-5/6 bg-gray-100 rounded-md" />
                <div className="h-4 w-2/3 bg-gray-100 rounded-md" />
              </div>

              <div className="flex items-center gap-4">
                <div className="h-12 w-32 bg-gray-200 rounded-xl" />
                <div className="h-12 flex-1 bg-gray-200 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FCFCFC] p-6 text-center">
        <h2 className="text-2xl font-bold text-[#174C3C] mb-2">Produk Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500 mb-6">Maaf, produk yang Anda cari tidak tersedia atau telah dihapus.</p>
        <button 
          onClick={() => router.push('/produk')}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#174C3C] text-white text-xs font-semibold rounded-lg hover:bg-[#1B4D3E] transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Katalog</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`${jost.className} min-h-screen bg-[#FCFCFC] text-slate-600 pb-16 antialiased`}>
      <div className="max-w-7xl mx-auto px-6 md:px-8 pt-6">
        
        {/* Breadcrumbs - Spacing 8px system */}
        <div className="text-[11px] uppercase tracking-wider text-slate-400 flex flex-wrap items-center gap-2 mb-6">
          <span className="hover:text-[#174C3C] cursor-pointer transition-colors" onClick={() => router.push('/')}>Home</span>
          <span>/</span>
          <span className="hover:text-[#174C3C] cursor-pointer transition-colors" onClick={() => router.push('/produk')}>Katalog</span>
          {(product.categoryName || (typeof product.category === 'object' ? product.category?.name : product.category)) ? (
            <>
              <span>/</span>
              <span className="hover:text-[#174C3C] cursor-pointer transition-colors" onClick={() => router.push(`/produk?category=${encodeURIComponent(product.categoryName || (typeof product.category === 'object' ? product.category?.name : product.category) || '')}`)}>
                {product.categoryName || (typeof product.category === 'object' ? product.category?.name : product.category)}
              </span>
            </>
          ) : null}
          <span>/</span>
          <span className="text-[#174C3C] font-semibold">{product.name}</span>
        </div>

        {/* Dynamic Entry Animation */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start mb-12"
        >
          
          {/* LEFT COLUMN: Premium Vertical Gallery (6 cols) */}
          <div className="md:col-span-6 flex flex-col sm:flex-row gap-4 items-start">
            
            {/* Vertical thumbnails list (desktop) / horizontal (mobile) */}
            {productImagesList.length > 1 && (
              <div className="flex flex-row sm:flex-col gap-2 order-2 sm:order-1 w-full sm:w-16 shrink-0 overflow-x-auto sm:overflow-y-auto no-scrollbar py-1 sm:py-0">
                {productImagesList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 shrink-0 overflow-hidden border transition-all rounded-lg cursor-pointer ${
                      activeImageIndex === idx 
                        ? 'border-[#174C3C] ring-2 ring-[#174C3C]/5' 
                        : 'border-slate-200/60 hover:border-slate-400 bg-white'
                    }`}
                  >
                    <img src={img || null} alt="thumbnail" loading="lazy" decoding="async" className="w-full h-full object-cover select-none pointer-events-none" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image Container with hover scale effect */}
            <div className="order-1 sm:order-2 flex-1 w-full relative aspect-square overflow-hidden bg-white border border-zinc-200 rounded-xl shadow-sm group">
              <div className="w-full h-full overflow-hidden">
                <motion.img 
                  key={activeImageIndex}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  src={productImagesList[activeImageIndex] || null} 
                  alt={product.name} 
                  className="w-full h-full object-cover select-none pointer-events-none"
                />
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Sticky Information and Action Panel (6 cols) */}
          <div className="md:col-span-6 md:sticky md:top-28 space-y-6">
            
            {/* Header / Meta information */}
            <div className="space-y-3 pb-4 border-b border-slate-200/50">
              <div className="flex items-center justify-between gap-2">
                {(product.categoryName || (typeof product.category === 'object' ? product.category?.name : product.category)) ? (
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">
                    {product.categoryName || (typeof product.category === 'object' ? product.category?.name : product.category)}
                  </span>
                ) : <span />}
                
                <span className="inline-flex items-center gap-1 text-[11px] text-zinc-600 font-medium bg-white border border-zinc-200 px-2.5 py-0.5 rounded-full">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span>{product.rating} / 5.0</span>
                </span>
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                {product.name}
              </h1>

              {/* Product labels */}
              <div className="flex flex-wrap gap-1.5">
                {getProductLabels(product).map((lbl, idx) => (
                  <span 
                    key={idx} 
                    className={`text-[9px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-md border ${lbl.bg}`}
                  >
                    {lbl.name}
                  </span>
                ))}
              </div>

              {/* Origin & stock block */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                {product.origin ? (
                  <>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#6E9C7C]" />
                      <span>Mitra: {product.origin}</span>
                    </span>
                    <span className="text-slate-200">|</span>
                  </>
                ) : null}
                <span>Stok: {product.stock}{product.unit ? ` ${product.unit}` : ''}</span>
              </div>
            </div>

            {/* Base unit price block */}
            <div className="p-4 bg-white border border-zinc-200 rounded-lg flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold mb-0.5">Harga Satuan</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[#174C3C]">
                    {formatRupiah(product.price)}
                  </span>
                  {product.unit ? (
                    <span className="text-xs text-slate-400">/ {product.unit}</span>
                  ) : null}
                </div>
              </div>
              
              {product.stock > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-zinc-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Tersedia</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-zinc-400">
                  <span>Stok Habis</span>
                </span>
              )}
            </div>

            {/* Short Description */}
            {product.description ? (
              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold">Keterangan Singkat</span>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  {product.description}
                </p>
              </div>
            ) : null}

            {/* Weight selector for KG */}
            {isSoldByKg ? (
              <div className="space-y-3 bg-slate-50 p-4 border border-slate-100 rounded-lg">
                <div className="flex justify-between items-baseline text-[9px] uppercase tracking-wider text-slate-700 font-bold">
                  <span>Jumlah / Berat</span>
                  <span className="text-xs text-[#174C3C] font-bold">
                    {formatRupiah(itemPriceForWeightSelection)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {[250, 500, 750, 1000, 1500, 2000].map((weight) => {
                    const label = weight >= 1000 ? `${weight / 1000} kg` : `${weight}g`;
                    return (
                      <button
                        key={weight}
                        type="button"
                        onClick={() => {
                          setSelectedWeight(weight);
                          setIsManualWeight(false);
                        }}
                        className={`py-2 px-1 border text-center text-[10px] font-bold select-none transition-all duration-200 cursor-pointer rounded-lg ${
                          !isManualWeight && selectedWeight === weight
                            ? 'bg-[#174C3C] text-white border-[#174C3C] shadow-sm'
                            : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Manual Gram toggle */}
                <div className="pt-2.5 border-t border-dashed border-slate-200 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-500 select-none">
                    <input
                      type="checkbox"
                      checked={isManualWeight}
                      onChange={(e) => setIsManualWeight(e.target.checked)}
                      className="accent-[#174C3C] w-4 h-4 rounded border-slate-200"
                    />
                    <span>Input gram manual</span>
                  </label>

                  {isManualWeight && (
                    <div className="flex items-center gap-1.5 max-w-[140px]">
                      <input
                        type="number"
                        min={10}
                        max={50000}
                        placeholder="Contoh: 350"
                        value={manualWeightInput}
                        onChange={(e) => setManualWeightInput(e.target.value)}
                        className="bg-white border border-slate-200 focus:border-[#174C3C] outline-none text-xs px-2.5 py-1.5 font-bold w-full text-right rounded-lg"
                      />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">g</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-100 text-[11px] text-slate-500 leading-relaxed rounded-lg flex gap-2">
                <Info className="w-4 h-4 text-[#6E9C7C] shrink-0 mt-0.5" />
                <span>{product.unit ? `Dipasarkan per ${product.unit}. ` : ''}Estimasi berat berkisar 250 - 350g per bungkus.</span>
              </div>
            )}

            {/* Quantity Portion Adjustment */}
            <div className="flex items-center justify-between py-3 border-y border-slate-200/50">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Porsi Pembelian</span>
              
              <div className="flex items-center gap-3 bg-slate-100/80 border border-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setPurchaseQty(prev => Math.max(1, prev - 1))}
                  disabled={purchaseQty <= 1}
                  className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-[#174C3C] border border-slate-100 hover:bg-slate-50 disabled:opacity-30 cursor-pointer font-bold text-xs shadow-2xs"
                >
                  <Minus className="w-3 h-3" strokeWidth={3} />
                </button>
                <span className="text-xs text-slate-800 w-6 text-center font-bold">{purchaseQty}</span>
                <button
                  onClick={() => setPurchaseQty(prev => Math.min(product.stock, prev + 1))}
                  disabled={purchaseQty >= product.stock}
                  className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-[#174C3C] border border-slate-100 hover:bg-slate-50 disabled:opacity-30 cursor-pointer font-bold text-xs shadow-2xs"
                >
                  <Plus className="w-3 h-3" strokeWidth={3} />
                </button>
              </div>
            </div>

            {/* Subtotal & Call To Actions */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Subtotal Estimasi</span>
                <span className="text-xl font-bold text-[#174C3C]">
                  {formatRupiah(dynamicSubtotal)}
                </span>
              </div>

              <div className="flex gap-3">
                {/* Wishlist Heart */}
                <button
                  onClick={handleToggleWishlist}
                  className="w-12 h-12 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors rounded-lg flex items-center justify-center shrink-0 cursor-pointer"
                  aria-label="Wishlist"
                >
                  <Heart className={`w-5 h-5 transition-colors ${isWishlisted ? 'fill-[#6E9C7C] text-[#6E9C7C]' : 'text-slate-400'}`} strokeWidth={1.8} />
                </button>

                {/* Tambah Keranjang */}
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className="flex-1 h-12 bg-white hover:bg-slate-50 border border-[#174C3C] text-[#174C3C] disabled:border-slate-200 disabled:text-slate-400 text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer rounded-lg font-semibold"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Keranjang</span>
                </button>

                {/* Beli Sekarang */}
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock <= 0}
                  className="flex-1 h-12 bg-[#174C3C] hover:bg-[#1B4D3E] text-white disabled:bg-slate-200 disabled:text-slate-400 text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer rounded-lg font-semibold shadow-xs"
                >
                  <span>Beli Sekarang</span>
                </button>
              </div>
            </div>

          </div>

        </motion.div>

        {/* LOWER ROW: Product details, benefits, specifications and related products */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-slate-200/50 pt-10 mb-16">
          
          {/* Main Info Columns (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Tab/Section 1: Deskripsi Lengkap */}
            {product.description ? (
              <div className="bg-white p-6 border border-slate-100 rounded-lg text-left space-y-4">
                <h2 className="text-lg font-semibold text-[#174C3C] tracking-tight flex items-center gap-2 border-b border-slate-50 pb-3">
                  <BookOpen className="w-4 h-4" />
                  <span>Deskripsi Lengkap</span>
                </h2>
                <div className="text-xs text-slate-500 leading-relaxed space-y-3 font-normal">
                  <p>{product.description}</p>
                </div>
              </div>
            ) : null}

            {/* Tab/Section 2: Spesifikasi Produk */}
            <div className="bg-white p-6 border border-slate-100 rounded-lg text-left space-y-4">
              <h2 className="text-lg font-semibold text-[#174C3C] tracking-tight flex items-center gap-2 border-b border-slate-50 pb-3">
                <Award className="w-4 h-4" />
                <span>Spesifikasi Produk</span>
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-normal text-slate-500">
                {product.weight ? (
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-400">Berat Estimasi</span>
                    <span className="font-semibold text-slate-800">{product.weight}g</span>
                  </div>
                ) : null}
                {product.origin ? (
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-400">Asal Pertanian</span>
                    <span className="font-semibold text-slate-800">{product.origin}</span>
                  </div>
                ) : null}
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400">Metode Tanam</span>
                  <span className="font-semibold text-slate-800">{product.isHydroponic ? 'Hydroponic' : 'Tanah Organik'}</span>
                </div>
                {product.certification ? (
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-400">Sertifikasi</span>
                    <span className="font-semibold text-slate-800">{product.certification}</span>
                  </div>
                ) : null}
                {(product.categoryName || (typeof product.category === 'object' ? product.category?.name : product.category)) ? (
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-400">Kategori Tani</span>
                    <span className="font-semibold text-slate-800">{product.categoryName || (typeof product.category === 'object' ? product.category?.name : product.category)}</span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Tab/Section 3: Manfaat */}
            {product.benefits ? (
              <div className="bg-white p-6 border border-slate-100 rounded-lg text-left space-y-4">
                <h2 className="text-lg font-semibold text-[#174C3C] tracking-tight flex items-center gap-2 border-b border-slate-50 pb-3">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Manfaat Utama</span>
                </h2>
                <div className="space-y-4 text-xs text-slate-500 leading-relaxed font-normal">
                  <p>{product.benefits}</p>
                </div>
              </div>
            ) : null}

          </div>

          {/* Interactive User Review Corner (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-white p-6 border border-slate-100 rounded-lg text-left space-y-4">
              <h2 className="text-base font-semibold text-[#174C3C] tracking-tight flex items-center gap-2 border-b border-slate-50 pb-3">
                <MessageSquare className="w-4 h-4" />
                <span>Ulasan ({reviews.length})</span>
              </h2>

              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 no-scrollbar">
                {reviews.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">Belum ada ulasan. Tulis ulasan pertama Anda!</p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="bg-slate-50/50 p-3.5 border border-slate-100 text-left space-y-2 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-slate-800 text-xs block">{rev.author}</span>
                          <span className="text-[9px] text-slate-400">{rev.date}</span>
                        </div>
                        <div className="flex text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3 h-3 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-100'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      
                      <p className="text-xs text-slate-500 leading-relaxed font-normal">
                        {rev.comment}
                      </p>

                      {rev.reply && (
                        <div className="mt-2 bg-white p-2.5 border-l-2 border-[#174C3C] flex gap-2 rounded-r-md">
                          <CornerDownRight className="w-3.5 h-3.5 text-[#174C3C] shrink-0 mt-0.5" />
                          <div className="text-[10px] leading-relaxed">
                            <span className="font-bold text-[#174C3C] block uppercase tracking-wider text-[8px]">Balasan TaniCo</span>
                            <p className="text-slate-500 font-normal">{rev.reply}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Add Review Form */}
              <form onSubmit={handleAddReviewSubmit} className="space-y-3 pt-3 border-t border-slate-100 text-left">
                <span className="text-xs font-bold text-slate-700 block mb-2">Bagikan Ulasan Anda</span>
                
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest text-slate-400 block font-bold">Nama</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Nama Anda, Kota"
                    value={newReviewName}
                    onChange={(e) => setNewReviewName(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-100 focus:border-[#174C3C] focus:bg-white outline-none p-2 rounded-lg font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest text-slate-400 block font-bold">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReviewRating(star)}
                        className="p-1 cursor-pointer transition-opacity hover:opacity-80"
                      >
                        <Star className={`w-4 h-4 ${star <= newReviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest text-slate-400 block font-bold">Pesan Ulasan</label>
                  <textarea 
                    rows={2}
                    required
                    placeholder="Ulasan Anda tentang kesegaran produk..."
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-100 focus:border-[#174C3C] focus:bg-white outline-none p-2 rounded-lg"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-[#174C3C] hover:bg-[#1F5C49] text-white text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors cursor-pointer rounded-lg font-bold shadow-xs"
                >
                  <Send className="w-3 h-3" />
                  <span>Kirim Ulasan</span>
                </button>
              </form>
            </div>

          </div>

        </div>

        {/* Similar Products Recommendation Slider / Grid */}
        {relatedProducts.length > 0 && (
          <div className="border-t border-slate-200/50 pt-10">
            <div className="mb-6 text-left">
              <span className="text-[9px] uppercase tracking-widest text-[#6E9C7C] font-bold block mb-0.5">Rekomendasi Kebun</span>
              <h3 className="text-xl font-semibold text-[#174C3C] tracking-tight">Produk Serupa</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {relatedProducts.map((p) => {
                const slug = p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                const priceFormatted = formatRupiah(p.price);

                return (
                  <div 
                    key={p.id}
                    onClick={() => {
                      router.push(`/produk/${slug}`);
                    }}
                    className="group flex flex-col text-left cursor-pointer select-none"
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-2xl mb-4 bg-gray-50">
                      <img 
                        src={p.image ? (p.image.startsWith('http') || p.image.startsWith('data:') || p.image.startsWith('/') ? p.image : `/${p.image}`) : null} 
                        alt={p.name || ''} 
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover pointer-events-none transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                      />
                    </div>
                    
                    <div className="flex flex-col">
                      <h4 className="text-[13.5px] md:text-[14.5px] font-semibold text-[#174C3C] tracking-tight leading-tight line-clamp-1">
                        {p.name}
                      </h4>
                      {(p.categoryName || (typeof p.category === 'object' ? p.category?.name : p.category)) ? (
                        <span className="text-[11.5px] md:text-[12.5px] font-normal text-[#666666] mt-1 block leading-tight">
                          {p.categoryName || (typeof p.category === 'object' ? p.category?.name : p.category)}
                        </span>
                      ) : null}
                      <div className="mt-1.5">
                        <span className="text-[#174C3C] font-semibold text-[13px] md:text-[14px] leading-none">
                          {priceFormatted}
                        </span>
                      </div>
                      <span className="text-gray-400 text-[11px] font-normal mt-1 block leading-none">
                        (ex. PPN{p.unit ? `/${p.unit}` : ''})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
