"use client";

import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';

export default function GoogleInitPage() {
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const redirectUri = `${window.location.origin}/api/auth/google/callback`;
      const scope = 'email profile';

      if (!clientId) {
        setError('Google Client ID tidak ditemukan. Tambahkan NEXT_PUBLIC_GOOGLE_CLIENT_ID di .env.local');
        return;
      }

      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(scope)}` +
        `&access_type=online` +
        `&prompt=select_account`;

      window.location.href = authUrl;

    } catch (err) {
      console.error('Error initiating Google login:', err);
      setError(err.message || 'Terjadi kesalahan.');
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#F0F2F5]">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
          <div className="text-red-600 text-sm mb-4">{error}</div>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F0F2F5]">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Mengarahkan ke Google...</p>
      </div>
    </div>
  );
}