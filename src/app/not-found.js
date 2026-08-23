import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#ECF6ED] text-[#174C3C] px-6 py-20 text-center">
      <h1 className="text-6xl font-bold font-jost mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Halaman Tidak Ditemukan</h2>
      <p className="text-gray-500 max-w-md mb-8">
        Maaf, halaman yang Anda cari tidak dapat ditemukan atau telah dipindahkan.
      </p>
      <Link 
        href="/"
        className="px-6 py-3 bg-[#174C3C] text-white font-semibold rounded-full hover:bg-[#4D8B55] transition-all duration-300"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
