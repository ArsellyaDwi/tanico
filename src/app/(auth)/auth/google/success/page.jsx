"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

function SuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams?.get('token');
    const userParam = searchParams?.get('user');

    if (!token || !userParam) {
      setStatus('error');
      setError('Data tidak lengkap dari Google.');
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userParam));

      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_SUCCESS',
          user: {
            ...user,
            sessionToken: token,
          },
        }, '*');
        setStatus('success');
        setTimeout(() => window.close(), 1000);
      } else {
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Error parsing user data:', err);
      setStatus('error');
      setError('Data pengguna tidak valid.');
    }
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#F0F2F5]">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Memproses login...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#F0F2F5]">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
          <div className="text-red-600 text-4xl mb-4">✗</div>
          <p className="text-red-600 text-sm font-medium">{error}</p>
          <button
            onClick={() => window.close()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
        <div className="text-green-600 text-4xl mb-4">✓</div>
        <p className="text-gray-700 font-semibold">Login Berhasil!</p>
        <p className="text-gray-500 text-sm mt-1">Tutup jendela ini dan kembali ke aplikasi.</p>
      </div>
    </div>
  );
}

export default function GoogleSuccessPage() {
  return <SuccessContent />;
}