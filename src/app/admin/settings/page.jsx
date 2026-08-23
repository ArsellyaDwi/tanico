"use client";

import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import AdminButton from '@/components/admin/AdminButton';
import { useAdmin } from '@/components/admin/AdminShell';

export default function AdminSettingsPage() {
  const {
    settings,
    handleSaveSettings,
    addToast,
    handleAddActivityLog
  } = useAdmin();

  const [settingsForm, setSettingsForm] = useState(settings || {});

  useEffect(() => {
    setSettingsForm(settings || {});
  }, [settings]);

  const handleSettingsSave = (e) => {
    e.preventDefault();
    handleSaveSettings(settingsForm);
    addToast('Konfigurasi Pengaturan Website berhasil diperbarui!', 'success');
    handleAddActivityLog('Mengubah pengaturan umum website');
  };

  return (
    <div className="space-y-6 text-left">
      <form onSubmit={handleSettingsSave} className="bg-white border border-[#DDE9DF] p-5 sm:p-6 rounded-2xl shadow-2xs space-y-4 text-left max-w-2xl font-sans">
        <h3 className="font-sans text-base sm:text-lg text-[#174C3C] font-bold">Pengaturan Profil & Metadata Website</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="font-sans text-[9px] uppercase tracking-wider text-gray-500 font-bold block">Nama Platform</label>
            <input
              type="text"
              value={settingsForm.logoText || ''}
              onChange={(e) => setSettingsForm(prev => ({ ...prev, logoText: e.target.value }))}
              className="w-full text-xs sm:text-sm p-2.5 bg-[#FCFCFC] border border-[#DDE9DF] rounded-xl outline-none focus:border-[#174C3C]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-sans text-[9px] uppercase tracking-wider text-gray-500 font-bold block">Tagline Kampanye</label>
            <input
              type="text"
              value={settingsForm.tagline || ''}
              onChange={(e) => setSettingsForm(prev => ({ ...prev, tagline: e.target.value }))}
              className="w-full text-xs sm:text-sm p-2.5 bg-[#FCFCFC] border border-[#DDE9DF] rounded-xl outline-none focus:border-[#174C3C]"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-sans text-[9px] uppercase tracking-wider text-gray-500 font-bold block">Alamat Kebun Fisik & Toko</label>
          <input
            type="text"
            value={settingsForm.address || ''}
            onChange={(e) => setSettingsForm(prev => ({ ...prev, address: e.target.value }))}
            className="w-full text-xs sm:text-sm p-2.5 bg-[#FCFCFC] border border-[#DDE9DF] rounded-xl outline-none focus:border-[#174C3C]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="font-sans text-[9px] uppercase tracking-wider text-gray-500 font-bold block">Nomor WhatsApp Admin</label>
            <input
              type="text"
              value={settingsForm.whatsappNumber || ''}
              onChange={(e) => setSettingsForm(prev => ({ ...prev, whatsappNumber: e.target.value }))}
              className="w-full text-xs sm:text-sm p-2.5 bg-[#FCFCFC] border border-[#DDE9DF] rounded-xl outline-none focus:border-[#174C3C]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-sans text-[9px] uppercase tracking-wider text-gray-500 font-bold block">Email Kontak Resmi</label>
            <input
              type="email"
              value={settingsForm.emailAddress || ''}
              onChange={(e) => setSettingsForm(prev => ({ ...prev, emailAddress: e.target.value }))}
              className="w-full text-xs sm:text-sm p-2.5 bg-[#FCFCFC] border border-[#DDE9DF] rounded-xl outline-none focus:border-[#174C3C]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="font-sans text-[9px] uppercase tracking-wider text-gray-500 font-bold block">Instagram Link</label>
            <input
              type="text"
              value={settingsForm.instagramUrl || ''}
              onChange={(e) => setSettingsForm(prev => ({ ...prev, instagramUrl: e.target.value }))}
              className="w-full text-xs sm:text-sm p-2.5 bg-[#FCFCFC] border border-[#DDE9DF] rounded-xl outline-none focus:border-[#174C3C]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-sans text-[9px] uppercase tracking-wider text-gray-500 font-bold block">Google Maps Kebun Link</label>
            <input
              type="url"
              value={settingsForm.googleMapsUrl || ''}
              onChange={(e) => setSettingsForm(prev => ({ ...prev, googleMapsUrl: e.target.value }))}
              className="w-full text-xs sm:text-sm p-2.5 bg-[#FCFCFC] border border-[#DDE9DF] rounded-xl outline-none focus:border-[#174C3C]"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-sans text-[9px] uppercase tracking-wider text-gray-500 font-bold block">Kata Kunci SEO</label>
          <input
            type="text"
            value={settingsForm.seoKeywords || ''}
            onChange={(e) => setSettingsForm(prev => ({ ...prev, seoKeywords: e.target.value }))}
            className="w-full text-xs sm:text-sm p-2.5 bg-[#FCFCFC] border border-[#DDE9DF] rounded-xl outline-none focus:border-[#174C3C]"
          />
        </div>

        <AdminButton
          type="submit"
          variant="primary"
          size="md"
          icon={Save}
        >
          Simpan Konfigurasi Umum
        </AdminButton>
      </form>
    </div>
  );
}
