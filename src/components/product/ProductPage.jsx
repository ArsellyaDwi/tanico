"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  ArrowUpDown,
  ChevronRight
} from 'lucide-react';
import { isActiveProduct } from '@/utils/helpers';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useLayout } from '@/context/LayoutContext';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductPageCatalog from '@/components/product/ProductPageCatalog';
const jost = { className: 'font-jost' };

export default function ProductPage({
  products: propProducts,
  initialProducts,
  initialCategories,
  wishlist: propWishlist,
  onToggleWishlist,
  onAddToCart,
  onOpenProductDetail
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cartContext = useCart();
  const wishlistContext = useWishlist();
  const layoutContext = useLayout();

  const [allProducts, setAllProducts] = useState(propProducts || initialProducts || []);
  const [categories, setCategories] = useState(initialCategories || []);
  
  // Filtering & state management
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [sortBy, setSortBy] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);

  // Sidebar Filter state
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(150000);
  const [onlyOrganic, setOnlyOrganic] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [isLoading, setIsLoading] = useState(() => !(
    (propProducts && propProducts.length > 0) || 
    (initialProducts && initialProducts.length > 0)
  ));

  useEffect(() => {
    if ((propProducts && propProducts.length > 0) || (initialProducts && initialProducts.length > 0)) {
      if (initialProducts && initialProducts.length > 0 && (!propProducts || propProducts.length === 0)) {
        setAllProducts(initialProducts);
      }
      if (initialCategories && initialCategories.length > 0) {
        setCategories(initialCategories);
      }
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    async function loadData() {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/products')
        ]);
        if (catRes.ok) {
          const cats = await catRes.json();
          if (isMounted) setCategories(cats || []);
        }
        if (prodRes.ok) {
          const prods = await prodRes.json();
          if (isMounted) {
            setAllProducts(propProducts && propProducts.length > 0 ? propProducts : (prods || []));
          }
        }
      } catch (err) {
        console.error('Error loading ProductPage data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [propProducts, initialProducts, initialCategories]);

  const dynamicCategories = useMemo(() => {
    const activeCats = categories
      .filter(cat => cat && cat.status !== 'Nonaktif')
      .sort((a, b) => {
        const rawA = parseInt(a.sortOrder, 10);
        const rawB = parseInt(b.sortOrder, 10);
        const orderA = !isNaN(rawA) ? rawA : 0;
        const orderB = !isNaN(rawB) ? rawB : 0;
        return orderA - orderB;
      })
      .map(cat => cat.name);
    return ['Semua', ...activeCats];
  }, [categories]);

  // Sync states from global layout search if any
  useEffect(() => {
    if (layoutContext?.searchQuery) {
      setSearchQuery(layoutContext.searchQuery);
    }
  }, [layoutContext?.searchQuery]);

  // Read category search param from URL (supports slug, name, and id; category & kategori params)
  useEffect(() => {
    const catParam = searchParams?.get('category') || 
                     searchParams?.get('kategori') || 
                     (typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('category') || new URLSearchParams(window.location.search).get('kategori')) : null);
    if (catParam) {
      const decodedParam = decodeURIComponent(catParam).trim();
      const normParam = decodedParam.toLowerCase().replace(/[^a-z0-9]/g, '');
      const catObj = categories.find(c =>
        (c.slug && c.slug.toLowerCase() === decodedParam.toLowerCase()) ||
        (c.name && c.name.toLowerCase() === decodedParam.toLowerCase()) ||
        (c.id && c.id.toLowerCase() === decodedParam.toLowerCase()) ||
        (c.slug && c.slug.toLowerCase().replace(/[^a-z0-9]/g, '') === normParam) ||
        (c.name && c.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normParam) ||
        (c.name && c.name.toLowerCase().startsWith(decodedParam.toLowerCase())) ||
        (c.name && decodedParam.toLowerCase().startsWith(c.name.toLowerCase()))
      );
      if (catObj) {
        setActiveCategory(catObj.name);
      } else {
        const matched = dynamicCategories.find(c => 
          c.toLowerCase() === decodedParam.toLowerCase() ||
          c.toLowerCase().replace(/[^a-z0-9]/g, '') === normParam
        );
        if (matched) {
          setActiveCategory(matched);
        } else {
          setActiveCategory(decodedParam);
        }
      }
      setCurrentPage(1);
    }
  }, [searchParams, dynamicCategories, categories]);

  // Handle wishlists resolving from prop or context
  const activeWishlist = useMemo(() => {
    if (propWishlist) return propWishlist;
    return wishlistContext?.wishlist || [];
  }, [propWishlist, wishlistContext]);

  const handleToggleWishlist = (productId, productName) => {
    if (onToggleWishlist) {
      onToggleWishlist(productId, productName);
    } else if (wishlistContext?.toggleWishlist) {
      wishlistContext.toggleWishlist(productId, productName);
    } else if (layoutContext?.addToast) {
      layoutContext.addToast('Favorit diperbarui.', 'success');
    }
  };

  const handleAddToCart = (product, qty = 1) => {
    if (onAddToCart) {
      onAddToCart(product, qty);
    } else if (cartContext?.addToCart) {
      cartContext.addToCart(product, qty);
    } else if (layoutContext?.addToast) {
      layoutContext.addToast(`Berhasil menambahkan ${product.name} ke keranjang.`, 'success');
    }
  };

  const handleCardClick = (product) => {
    if (onOpenProductDetail) {
      onOpenProductDetail(product);
    } else {
      const slug = product.slug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      router.push(`/produk/${slug}`);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveCategory('Semua');
    setSortBy('default');
    setMinPrice(0);
    setMaxPrice(150000);
    setOnlyOrganic(false);
    setOnlyInStock(false);
    setCurrentPage(1);
    if (layoutContext?.setSearchQuery) {
      layoutContext.setSearchQuery('');
    }
  };

  // Filter and sort core logic
  const filteredAndSortedProducts = useMemo(() => {
    let list = [...allProducts];

    // Exclude non-active products
    list = list.filter(p => isActiveProduct(p));

    // Filter by Category
    if (activeCategory !== 'Semua') {
      const targetCat = activeCategory.toLowerCase();
      const catObj = categories.find(c =>
        (c.name && c.name.toLowerCase() === targetCat) ||
        (c.slug && c.slug.toLowerCase() === targetCat) ||
        (c.id && c.id.toLowerCase() === targetCat)
      );
      const targetName = catObj ? catObj.name.toLowerCase() : targetCat;
      const targetSlug = catObj ? (catObj.slug || '').toLowerCase() : targetCat;
      const targetId = catObj ? catObj.id : null;

      list = list.filter(p => {
        const catStr = p.categoryName || (typeof p.category === 'object' ? p.category?.name : p.category) || '';
        const pCat = catStr.toLowerCase();
        const pCatId = p.categoryId || (typeof p.category === 'object' ? p.category?.id : null);
        const pCatSlug = (typeof p.category === 'object' && p.category?.slug) ? p.category.slug.toLowerCase() : '';
        return (
          pCat === targetName ||
          (targetSlug && (pCat === targetSlug || pCatSlug === targetSlug)) ||
          (targetId && pCatId === targetId) ||
          (targetName && pCat.includes(targetName)) ||
          (targetName && targetName.includes(pCat))
        );
      });
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => {
        const catStr = p.categoryName || (typeof p.category === 'object' ? p.category?.name : p.category) || '';
        return (
          (p.name || '').toLowerCase().includes(q) || 
          catStr.toLowerCase().includes(q) ||
          (p.shortDescription || p.description || '').toLowerCase().includes(q)
        );
      });
    }

    // Filter by Organic
    if (onlyOrganic) {
      list = list.filter(p => p.isOrganic === true || (p.name || '').toLowerCase().includes('organik') || (p.description || '').toLowerCase().includes('organik'));
    }

    // Filter by In Stock
    if (onlyInStock) {
      list = list.filter(p => p.stock > 0);
    }

    // Filter by Price Range
    list = list.filter(p => p.price >= minPrice && p.price <= maxPrice);

    // Sort
    if (sortBy === 'price-low') {
      list.sort((a, b) => {
        const pA = a.discountPrice || a.price;
        const pB = b.discountPrice || b.price;
        return pA - pB;
      });
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => {
        const pA = a.discountPrice || a.price;
        const pB = b.discountPrice || b.price;
        return pB - pA;
      });
    } else if (sortBy === 'populer') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'default' || sortBy === 'terbaru') {
      list.sort((a, b) => (b.id || 0) - (a.id || 0));
    }

    return list;
  }, [allProducts, activeCategory, searchQuery, sortBy, minPrice, maxPrice, onlyOrganic, onlyInStock]);

  // Pagination config
  const itemsPerPage = 15;
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  
  // Safe page correction
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedProducts.slice(start, start + itemsPerPage);
  }, [filteredAndSortedProducts, currentPage]);

  return (
    <div className={`${jost.className} min-h-screen bg-[#FCFCFC] text-[#666666] pb-24 antialiased selection:bg-[#174C3C]/10 selection:text-[#174C3C]`}>
      
         {/* Breadcrumb - Title Case (huruf kapital di awal saja) */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 pt-8 pb-2 text-left select-none">
        <nav className="flex items-center gap-1.5 text-xs tracking-[0.12em] text-[#6B7280] font-medium">
          <span 
            onClick={() => router.push('/')} 
            className="hover:text-[#174C3C] transition-colors cursor-pointer"
          >
            Beranda
          </span>
          <span className="text-gray-300">/</span>
          <span className="text-[#174C3C] font-semibold">Produk</span>
        </nav>
      </div>

      {/* 1. HERO KATALOG SECTION */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 pt-20 pb-10 text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#4D8B55] inline-flex items-center">
              KATALOG TANI
            </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-[34px] sm:text-[46px] md:text-[56px] font-semibold tracking-tight leading-[1.08] text-[#174C3C]"
        >
          Jelajahi Hasil Panen <br />
          Pilihan Petani Lokal
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[16px] md:text-[18px] font-normal text-[#666666] max-w-[720px] mx-auto leading-relaxed"
        >
          Temukan berbagai hasil tani segar yang dipanen langsung dari kebun mitra TaniCo di Bangka.
          </motion.p>
      </section>

      {/* 2. PREMIUM SEARCH BAR */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 mb-6">
        <div className="max-w-xl mx-auto relative">
          <span className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-[#666666]/50">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Cari sayuran, buah, atau rempah..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-12 pr-5 py-4 bg-white rounded-full text-sm text-[#174C3C] border border-[#E7E7E7] placeholder-[#666666]/50 shadow-[0_4px_20px_rgba(0,0,0,0.015)] focus:outline-none focus:border-[#174C3C]/20 transition-all font-normal"
          />
        </div>
      </section>

      {/* 4. INFO KATALOG BAR (COUNT & SORT) */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 mb-8 flex items-center justify-between border-b border-[#E7E7E7] pb-4">
        {/* Left Side Count */}
        <div className="text-xs text-[#666666] font-normal">
          Kami menemukan <strong className="text-[#174C3C] font-semibold">{filteredAndSortedProducts.length}</strong> produk
        </div>

        {/* Right Side Sort Selection */}
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
            <ArrowUpDown className="w-3.5 h-3.5" />
          </span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 pr-8 py-2 bg-white border border-[#E7E7E7] rounded-full text-xs font-semibold text-[#174C3C] appearance-none focus:outline-none focus:border-[#174C3C]/20 transition-all cursor-pointer font-sans"
          >
            <option value="default">Terbaru</option>
            <option value="price-low">Harga Terendah</option>
            <option value="price-high">Harga Tertinggi</option>
            <option value="populer">Paling Populer</option>
          </select>
          <span className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-gray-400">
            <ChevronRight className="w-3 h-3 rotate-90" />
          </span>
        </div>
      </section>

      {/* 5. PRODUCT CATALOG MAIN COMPONENT (INCLUDES SIDEBAR, PRODUCT GRID, PAGINATION) */}
      <section className="max-w-7xl mx-auto px-6 md:px-8">
        <ProductPageCatalog
          products={paginatedProducts}
          wishlist={activeWishlist}
          onToggleWishlist={handleToggleWishlist}
          onAddToCart={handleAddToCart}
          onOpenProductDetail={handleCardClick}
          minPrice={minPrice}
          setMinPrice={setMinPrice}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          onlyOrganic={onlyOrganic}
          setOnlyOrganic={setOnlyOrganic}
          onlyInStock={onlyInStock}
          setOnlyInStock={setOnlyInStock}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          onResetFilters={handleResetFilters}
          categoriesList={dynamicCategories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          isLoading={isLoading}
        />
      </section>

    </div>
  );
}