'use client';

import React, { useEffect } from 'react';

export default function AdminError({ error, reset }) {
  useEffect(() => {
    console.error('Admin page error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
          !
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Terjadi Kesalahan</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Gagal memuat halaman admin. Silakan coba lagi.
        </p>
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 bg-[#174C3C] text-white text-sm font-semibold rounded-xl hover:bg-[#123b2e] transition"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
}
