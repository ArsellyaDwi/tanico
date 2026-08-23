"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  SlidersHorizontal, 
  Check, 
  RotateCcw,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import ProductGrid from '@/components/product/ProductGrid';
import { formatRupiah } from '@/utils/formatters';
const jost = { className: 'font-jost' };

export default function ProductPageCatalog({
  products,
  wishlist = [],
  onToggleWishlist,
  onAddToCart,
  onOpenProductDetail,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  onlyOrganic,
  setOnlyOrganic,
  onlyInStock,
  setOnlyInStock,
  currentPage,
  setCurrentPage,
  totalPages,
  onResetFilters,
  categoriesList = ['Semua'],
  activeCategory,
  setActiveCategory,
  isLoading = false
}) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Sidebar controls layout (reusable for drawer & desktop)
  const FilterControls = () => (
    <div className="space-y-6">
      {/* Kategori */}
      <div>
        <h4 className="text-[11px] uppercase tracking-[0.15em] font-semibold text-[#174C3C] mb-3">
          Kategori Utama
        </h4>
        <div className="flex flex-col gap-1.5">
          {categoriesList.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setCurrentPage(1);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer ${
                  isActive 
                    ? 'bg-[#174C3C]/10 text-[#174C3C] font-semibold' 
                    : 'text-[#666666] hover:bg-black/5 hover:text-[#174C3C] font-normal'
                }`}
              >
                <span>{cat}</span>
                {isActive && <Check className="w-3.5 h-3.5 text-[#174C3C]" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-[#E7E7E7]" />

      {/* Rentang Harga */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[11px] uppercase tracking-[0.15em] font-semibold text-[#174C3C]">
            Rentang Harga
          </h4>
          <span className="text-[11px] text-[#666666] font-semibold">
            {formatRupiah(maxPrice)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="150000"
          step="5000"
          value={maxPrice}
          onChange={(e) => {
            setMaxPrice(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="w-full accent-[#174C3C] h-1 bg-[#E7E7E7] rounded-lg cursor-pointer"
        />
        <div className="flex flex-col gap-1.5 mt-3">
          <button
            onClick={() => { setMinPrice(0); setMaxPrice(30000); setCurrentPage(1); }}
            className="w-full py-2 bg-white border border-[#E7E7E7] rounded-lg text-[10px] uppercase tracking-wider font-semibold hover:bg-[#F3F4F6] text-[#666666] transition-colors cursor-pointer"
          >
            Di bawah Rp 30.000
          </button>
          <button
            onClick={() => { setMinPrice(30000); setMaxPrice(70000); setCurrentPage(1); }}
            className="w-full py-2 bg-white border border-[#E7E7E7] rounded-lg text-[10px] uppercase tracking-wider font-semibold hover:bg-[#F3F4F6] text-[#666666] transition-colors cursor-pointer"
          >
            Rp 30.000 - Rp 70.000
          </button>
          <button
            onClick={() => { setMinPrice(70000); setMaxPrice(150000); setCurrentPage(1); }}
            className="w-full py-2 bg-white border border-[#E7E7E7] rounded-lg text-[10px] uppercase tracking-wider font-semibold hover:bg-[#F3F4F6] text-[#666666] transition-colors cursor-pointer"
          >
            Di atas Rp 70.000
          </button>
        </div>
      </div>

      <div className="h-px bg-[#E7E7E7]" />

      {/* Toggles */}
      <div className="space-y-4">
        {/* Organic Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#666666] font-normal">Hanya Hasil Organik</span>
          <button
            onClick={() => {
              setOnlyOrganic(!onlyOrganic);
              setCurrentPage(1);
            }}
            className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors duration-300 cursor-pointer ${onlyOrganic ? 'bg-[#174C3C]' : 'bg-[#E7E7E7]'}`}
          >
            <div className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-300 ${onlyOrganic ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Stock Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#666666] font-normal">Stok Tersedia</span>
          <button
            onClick={() => {
              setOnlyInStock(!onlyInStock);
              setCurrentPage(1);
            }}
            className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors duration-300 cursor-pointer ${onlyInStock ? 'bg-[#174C3C]' : 'bg-[#E7E7E7]'}`}
          >
            <div className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-300 ${onlyInStock ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Reset */}
      {(activeCategory !== 'Semua' || minPrice > 0 || maxPrice < 150000 || onlyOrganic || onlyInStock) && (
        <button
          onClick={() => {
            onResetFilters();
            setCurrentPage(1);
          }}
          className="w-full py-3 mt-4 border border-rose-100 hover:bg-rose-50/50 rounded-lg text-[10px] uppercase tracking-widest text-rose-600 font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Atur Ulang</span>
        </button>
      )}
    </div>
  );

  return (
    <div className={`${jost.className} w-full`}>
      
      {/* Mobile Filter floating bar trigger */}
      <div className="lg:hidden flex justify-end mb-6">
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-white border border-[#E7E7E7] rounded-full text-xs font-semibold text-[#174C3C] shadow-xs hover:bg-[#174C3C]/5 hover:border-[#D7E8DA] transition-colors duration-200 cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Saringan</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* 1. Sidebar Filter (Desktop) */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="hidden lg:block lg:col-span-3 bg-white border border-zinc-200 rounded-lg p-6 shadow-xs"
        >
          <FilterControls />
        </motion.div>

        {/* 2. ProductGrid list (Right panel) */}
        <div className="col-span-1 lg:col-span-9 space-y-12">
          
          <AnimatePresence mode="wait">
            {isLoading || products.length > 0 ? (
              <motion.div
                key={`${activeCategory}-${products.length}-${currentPage}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <ProductGrid
                  isCatalog={true}
                  products={products}
                  wishlist={wishlist}
                  onToggleWishlist={onToggleWishlist}
                  onAddToCart={onAddToCart}
                  onOpenProductDetail={onOpenProductDetail}
                  isLoading={isLoading}
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 bg-white rounded-lg border border-zinc-200 shadow-xs"
              >
                <div className="max-w-sm mx-auto space-y-4">
                  <span className="w-12 h-12 rounded-full bg-[#174C3C]/5 flex items-center justify-center text-[#174C3C] mx-auto">
                    <X className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-semibold text-[#174C3C]">Produk Tidak Ditemukan</h3>
                  <p className="text-xs text-[#666666]">
                    Tidak ada hasil tani yang cocok dengan kriteria saringan Anda saat ini.
                  </p>
                  <button
                    onClick={onResetFilters}
                    className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[#174C3C] text-white hover:bg-[#205E49] active:bg-[#123A2E] transition-colors duration-200 cursor-pointer"
                  >
                    Atur Ulang Saringan
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 3. Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              {/* Previous Button */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold border border-[#E7E7E7] transition-colors duration-200 cursor-pointer bg-white ${
                  currentPage === 1 
                    ? 'opacity-30 cursor-not-allowed text-gray-400 border-[#E7E7E7]' 
                    : 'text-[#666666] hover:bg-[#ECF6ED] hover:border-[#D7E8DA] hover:text-[#174C3C]'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>

              {/* Number Buttons */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1;
                  const isCurrent = currentPage === pageNum;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-9 h-9 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer flex items-center justify-center ${
                        isCurrent 
                          ? 'bg-[#174C3C] text-white font-semibold' 
                          : 'bg-white text-[#666666] border border-[#E7E7E7] hover:bg-[#ECF6ED] hover:border-[#D7E8DA] hover:text-[#174C3C]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold border border-[#E7E7E7] transition-colors duration-200 cursor-pointer bg-white ${
                  currentPage === totalPages 
                    ? 'opacity-30 cursor-not-allowed text-gray-400 border-[#E7E7E7]' 
                    : 'text-[#666666] hover:bg-[#ECF6ED] hover:border-[#D7E8DA] hover:text-[#174C3C]'
                }`}
              >
                <span>Selanjutnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Mobile Drawer (Saringan Panel on Bottom) */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDrawerOpen(false)}
              className="fixed inset-0 bg-black z-40 lg:hidden"
            />

            {/* Slide-Up Panel */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto bg-white rounded-t-xl p-6 z-50 lg:hidden text-left shadow-md border-t border-zinc-200"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-semibold text-[#174C3C]">Saring Hasil Panen</h3>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#F7F7F5] flex items-center justify-center text-[#666666] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <FilterControls />
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
