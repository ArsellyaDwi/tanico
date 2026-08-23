"use client";

import React, { useState, useEffect, useRef } from 'react';
import { logger } from '@/utils/logger';
import { Search, Trash } from 'lucide-react';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { useAdmin } from '@/components/admin/AdminShell';

export default function AdminCustomersPage() {
  const {
    adminProfile,
    addToast,
    handleAddActivityLog
  } = useAdmin();

  const [dbUsers, setDbUsers] = useState([]);
  const [dbUsersSearch, setDbUsersSearch] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const getAuthHeaders = () => {
    const headers = {};
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('tanico_user');
        if (stored) {
          const u = JSON.parse(stored);
          if (u?.sessionToken) {
            headers['Authorization'] = `Bearer ${u.sessionToken}`;
          }
        }
      } catch (e) {}
    }
    return headers;
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/customers', { headers: getAuthHeaders() });
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data) && isMountedRef.current) {
          setDbUsers(data);
        }
      } else {
        logger.warn(`fetchUsers non-OK status: ${res.status}`);
      }
    } catch (err) {
      logger.error('Error loading users:', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingUsers(false);
      }
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateUser = async (uId, payload) => {
    try {
      const res = await fetch(`/api/admin/customers/${uId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        addToast('Informasi akun pengguna berhasil diperbarui!', 'success');
        handleAddActivityLog(`Mengubah profil/status pengguna dengan ID ${uId}`);
        fetchUsers();
      } else {
        addToast('Gagal memperbarui status pengguna.', 'error');
      }
    } catch (err) {
      logger.error(err);
    }
  };

  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteUser = (uId, name) => {
    setUserToDelete({ uId, name });
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    const { uId, name } = userToDelete;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/customers/${uId}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.ok) {
        addToast(`Pelanggan ${name} berhasil dihapus.`, 'success');
        handleAddActivityLog(`Menghapus pengguna "${name}"`);
        setUserToDelete(null);
        fetchUsers();
      } else {
        addToast('Gagal menghapus pelanggan.', 'error');
      }
    } catch (err) {
      logger.error(err);
      addToast('Gagal menghapus pelanggan.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 text-left font-sans">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <span className="font-sans text-[9px] sm:text-[10px] uppercase tracking-wider text-[#6E9C7C] font-bold block">DATABASE</span>
          <h3 className="font-sans text-xl sm:text-2xl text-[#174C3C] font-bold mt-0.5">Manajemen Akun Pengguna</h3>
        </div>

        {/* User Search Bar */}
        <div className="relative w-full max-w-xs">
          <input
            type="text"
            placeholder="Cari nama, email atau HP..."
            value={dbUsersSearch}
            onChange={(e) => setDbUsersSearch(e.target.value)}
            className="w-full bg-[#FCFCFC] text-xs sm:text-sm text-[#202020] placeholder-[#6B7280] py-2 sm:py-2.5 pl-9 pr-3.5 outline-none border border-[#DDE9DF] focus:border-[#174C3C] transition-colors rounded-full"
          />
          <Search className="w-4 h-4 absolute left-3 top-2.5 sm:top-3 text-gray-400" />
        </div>
      </div>

      <div className="bg-white border border-[#DDE9DF] rounded-2xl overflow-hidden shadow-2xs">
        {isLoadingUsers ? (
          <div className="p-6 space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 bg-gray-200 rounded-md" />
                    <div className="h-3 w-24 bg-gray-100 rounded-md" />
                  </div>
                </div>
                <div className="hidden sm:block h-3.5 w-36 bg-gray-100 rounded-md" />
                <div className="hidden md:block h-3.5 w-48 bg-gray-100 rounded-md" />
                <div className="h-6 w-16 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FCFCFC] border-b border-[#DDE9DF] font-sans text-[9px] uppercase tracking-widest text-[#6B7280] font-bold">
                  <th className="p-4">Pengguna</th>
                  <th className="p-4">Kontak / Provider</th>
                  <th className="p-4">Alamat Lengkap</th>
                  <th className="p-4">Bergabung</th>
                  <th className="p-4">Terakhir Login</th>
                  <th className="p-4">Peran</th>
                  <th className="p-4">Status Akun</th>
                  <th className="p-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE9DF] text-xs text-[#202020]">
                {dbUsers
                  .filter(u => {
                    const s = dbUsersSearch.toLowerCase();
                    return u.name.toLowerCase().includes(s) || 
                            u.email.toLowerCase().includes(s) || 
                            (u.phone && u.phone.includes(s));
                  })
                  .map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 text-left">
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            <img 
                              src={u.avatar} 
                              alt={u.name} 
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded-full object-cover border border-[#DDE9DF]"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#174C3C]/10 text-[#174C3C] flex items-center justify-center font-bold text-xs border border-[#DDE9DF]">
                              {(u.name || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <strong className="font-sans text-sm text-[#174C3C] block leading-snug font-bold">{u.name}</strong>
                            <span className="text-[10px] text-gray-400 font-sans block font-semibold mt-0.5">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-left">
                        <div className="space-y-1">
                          {u.phone ? (
                            <a 
                              href={`https://wa.me/${u.phone.replace(/[^0-9]/g, '')}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="font-sans text-[#174C3C] hover:underline block font-bold"
                            >
                              {u.phone}
                            </a>
                          ) : (
                            <span className="text-gray-400 italic block font-semibold">No HP belum diisi</span>
                          )}
                          <span className={`font-sans text-[8px] uppercase inline-block font-bold ${
                            u.provider === 'Google' ? 'text-blue-700' : 'text-gray-500'
                          }`}>
                            {u.provider}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 max-w-[220px] text-left" title={`${u.address || ''} ${u.subdistrict || ''} ${u.regency || ''} ${u.province || ''} ${u.postalCode || ''}`}>
                        <div className="text-xs text-gray-600 font-sans leading-relaxed">
                          {u.address ? (
                            <>
                              <p className="line-clamp-2">{u.address}</p>
                              {(u.subdistrict || u.regency || u.province) && (
                                <p className="text-[10px] text-[#6B7280] font-bold mt-1">
                                  {[u.subdistrict, u.regency, u.province, u.postalCode].filter(Boolean).join(', ')}
                                </p>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400 italic font-semibold">Belum ada alamat</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-sans text-gray-400 font-semibold text-left">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID', { dateStyle: 'short' }) : '-'}
                      </td>
                      <td className="p-4 font-sans text-gray-400 font-semibold text-left">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                      </td>
                      <td className="p-4 text-left">
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateUser(u.id, { role: e.target.value })}
                          className="bg-white border border-[#DDE9DF] text-xs px-3 py-1.5 rounded-xl font-bold font-sans text-[#202020]"
                        >
                          <option value="CUSTOMER">Customer</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td className="p-4 text-left">
                        <button
                          onClick={() => handleUpdateUser(u.id, { status: u.status === 'Aktif' ? 'Nonaktif' : 'Aktif' })}
                          className={`px-3 py-1 text-[10px] font-sans uppercase tracking-wider rounded-full font-bold transition-colors duration-200 cursor-pointer ${
                            u.status === 'Aktif' 
                              ? 'bg-[#174C3C] text-white border border-[#174C3C] hover:bg-[#205E49] active:bg-[#123A2E]' 
                              : 'bg-red-700 text-white border border-red-700 hover:bg-red-800'
                          }`}
                        >
                          {u.status}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          disabled={u.email === 'admin@tanico.id' || (adminProfile && u.email === adminProfile.email)}
                          className="text-gray-400 hover:text-rose-600 p-2 rounded-full hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                          title="Hapus Akun Permanen"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={Boolean(userToDelete)}
        title="Hapus Pelanggan"
        itemName={userToDelete?.name}
        itemType="pelanggan"
        onConfirm={confirmDeleteUser}
        onClose={() => setUserToDelete(null)}
        isLoading={isDeleting}
      />
    </div>
  );
}
