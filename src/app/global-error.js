'use client';

import React, { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="id">
      <body className="bg-[#FCFCFC] text-[#174C3C] min-h-screen flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md bg-white p-8 rounded-2xl shadow-sm border border-emerald-100 space-y-4">
          <h1 className="text-2xl font-bold text-emerald-950">
            Terjadi Kesalahan Sistem
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            Sistem mengalami kendala tak terduga. Silakan coba muat ulang atau segarkan halaman.
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-2.5 bg-[#174C3C] text-white font-medium rounded-full hover:bg-[#123b2e] transition-all text-sm cursor-pointer"
          >
            Muat Ulang Komponen
          </button>
        </div>
      </body>
    </html>
  );
}
