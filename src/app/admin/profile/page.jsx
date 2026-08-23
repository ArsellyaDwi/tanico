"use client";

import React, { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { ShieldCheck } from 'lucide-react';
import { uploadFileToSupabase } from '@/utils/uploadHelper';
import { useAdmin } from '@/components/admin/AdminShell';

export default function AdminProfilePage() {
  const {
    adminProfile,
    handleSaveAdminProfile,
    addToast,
    handleAddActivityLog
  } = useAdmin();

  const [profileForm, setProfileForm] = useState(adminProfile || {});

  useEffect(() => {
    setProfileForm(adminProfile || {});
  }, [adminProfile]);

  const handleProfileFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      addToast('Mengunggah avatar admin ke Supabase Storage...', 'info');
      const res = await uploadFileToSupabase(file, 'tanico-public');
      if (res.success && res.url) {
        setProfileForm(prev => ({ ...prev, avatar: res.url }));
        addToast('Avatar admin berhasil diunggah ke Supabase!', 'success');
      } else {
        addToast(res.error || 'Gagal mengunggah avatar admin', 'error');
      }
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      const updatedForm = { ...profileForm, avatar: profileForm.avatar || '' };
      handleSaveAdminProfile(updatedForm);
      addToast('Profil Administrator berhasil disimpan!', 'success');
      handleAddActivityLog('Mengubah data profil admin');
    } catch (err) {
      logger.error(err);
      addToast('Gagal memproses profil: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 text-left">
      <form onSubmit={handleProfileSave} className="bg-white border border-[#DDE9DF] p-5 sm:p-6 rounded-2xl shadow-2xs space-y-4 text-left max-w-xl font-sans">
        <div className="flex items-center gap-3.5 border-b border-[#DDE9DF] pb-4">
          {profileForm.avatar ? (
            <img src={profileForm.avatar} alt="Avatar Admin" className="w-14 h-14 rounded-full object-cover border border-[#DDE9DF]" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#174C3C] text-white font-bold text-xl flex items-center justify-center border border-[#DDE9DF]">
              {profileForm?.name ? profileForm.name.charAt(0).toUpperCase() : 'A'}
            </div>
          )}
          <div>
            <h3 className="font-sans text-base sm:text-lg font-bold text-[#174C3C]">{profileForm.name}</h3>
            <p className="font-sans text-[9px] uppercase tracking-widest text-[#174C3C] flex items-center gap-1 font-bold mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#174C3C] inline shrink-0" />
              <span>Super Admin Account</span>
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-sans text-[9px] uppercase tracking-wider text-gray-500 font-bold block">Nama Lengkap Kurator</label>
          <input
            type="text"
            required
            value={profileForm.name || ''}
            onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
            className="w-full text-xs sm:text-sm p-2.5 bg-[#FCFCFC] border border-[#DDE9DF] rounded-xl outline-none focus:border-[#174C3C]"
          />
        </div>

        <div className="space-y-1">
          <label className="font-sans text-[9px] uppercase tracking-wider text-gray-500 font-bold block">Alamat Email Administrasi</label>
          <input
            type="email"
            required
            value={profileForm.email || ''}
            onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
            className="w-full text-xs sm:text-sm p-2.5 bg-[#FCFCFC] border border-[#DDE9DF] rounded-xl outline-none focus:border-[#174C3C]"
          />
        </div>

        <div className="space-y-1">
          <label className="font-sans text-[9px] uppercase tracking-wider text-gray-500 font-bold block">Avatar Image *</label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={profileForm.avatar || ''}
              onChange={(e) => setProfileForm(prev => ({ ...prev, avatar: e.target.value }))}
              placeholder="Salin tautan gambar atau pilih file..."
              className="flex-1 text-xs sm:text-sm p-2.5 bg-[#FCFCFC] border border-[#DDE9DF] rounded-xl outline-none focus:border-[#174C3C]"
            />
            <label className="px-4 py-2.5 bg-[#174C3C] hover:bg-[#205E49] text-white font-sans text-[10px] uppercase tracking-wider cursor-pointer flex items-center shrink-0 rounded-xl font-bold transition-colors duration-200">
              PILIH FILE
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfileFileChange}
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-3 bg-[#174C3C] hover:bg-[#205E49] active:bg-[#123A2E] text-white font-sans text-xs uppercase tracking-wider rounded-full cursor-pointer font-bold transition-colors duration-200"
        >
          Simpan Profil Saya
        </button>
      </form>
    </div>
  );
}
