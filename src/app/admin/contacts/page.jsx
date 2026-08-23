"use client";

import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import AdminButton from '@/components/admin/AdminButton';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { useAdmin } from '@/components/admin/AdminShell';

export default function AdminContactsPage() {
  const {
    contacts,
    handleSaveContacts,
    addToast,
    handleAddActivityLog
  } = useAdmin();

  const [selectedContactId, setSelectedContactId] = useState('');
  const [contactReplyText, setContactReplyText] = useState('');
  const [contactToDelete, setContactToDelete] = useState(null);

  const handleDeleteContact = (c) => {
    setContactToDelete(c);
  };

  const confirmDeleteContact = () => {
    if (!contactToDelete) return;
    const updated = contacts.filter(item => item.id !== contactToDelete.id);
    handleSaveContacts(updated);
    setContactToDelete(null);
    addToast('Pesan kontak berhasil dihapus.', 'success');
    handleAddActivityLog?.(`Menghapus pesan kontak dari "${contactToDelete.name}"`);
  };

  const handleContactRead = (id, isRead) => {
    const updated = contacts.map(c => c.id === id ? { ...c, isRead } : c);
    handleSaveContacts(updated);
    addToast(isRead ? 'Pesan ditandai sudah dibaca.' : 'Pesan ditandai belum dibaca.', 'info');
  };

  const handleContactReplySubmit = (id) => {
    if (!contactReplyText.trim()) return;
    const updated = contacts.map(c => c.id === id ? { ...c, reply: contactReplyText, isRead: true } : c);
    handleSaveContacts(updated);
    setContactReplyText('');
    setSelectedContactId('');
    addToast('Balasan pesan kontak berhasil disimpan!', 'success');
    handleAddActivityLog(`Membalas pesan dari kontak ID ${id}`);
  };

  return (
    <div className="space-y-6 text-left font-sans">
      
      <div>
        <span className="font-sans text-[9px] sm:text-[10px] uppercase tracking-wider text-[#6E9C7C] font-bold block">KOTAK SURAT</span>
        <h3 className="font-sans text-xl sm:text-2xl text-[#174C3C] font-bold mt-0.5">Pesan Kontak Masuk</h3>
      </div>

      <div className="space-y-3.5 text-left">
        {contacts.length === 0 ? (
          <div className="py-16 text-center text-[#6B7280] font-sans text-xs border border-dashed border-[#DDE9DF] rounded-2xl font-bold">
            Belum ada pesan masuk terekam.
          </div>
        ) : (
          contacts.map((c) => (
            <div key={c.id} className={`bg-white border border-[#DDE9DF] p-4 sm:p-5 rounded-2xl shadow-2xs space-y-3.5 text-xs relative text-left ${!c.isRead ? 'border-l-4 border-l-[#174C3C]' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="space-y-0.5 text-left">
                  <div className="flex items-center gap-2">
                    <h4 className="font-sans font-bold text-[#174C3C] text-xs sm:text-sm">{c.name}</h4>
                    {!c.isRead && (
                      <span className="text-amber-800 font-sans text-[9px] font-bold uppercase tracking-wider">Baru</span>
                    )}
                  </div>
                  <span className="font-sans text-[9px] text-[#6B7280] uppercase tracking-wider font-bold block">Subjek: {c.subject}</span>
                </div>
                <span className="font-sans text-[10px] sm:text-xs text-gray-400 font-semibold">{new Date(c.createdAt).toLocaleDateString('id-ID')}</span>
              </div>

              <p className="text-gray-600 leading-relaxed font-sans text-left text-xs sm:text-sm">"{c.message}"</p>

              {c.reply && (
                <div className="bg-[#FCFCFC] p-3.5 border-l-2 border-[#174C3C] text-gray-700 rounded-r-xl">
                  <span className="font-sans text-[9px] uppercase tracking-wider text-[#174C3C] font-bold block">Tanggapan Kantor</span>
                  <p className="mt-0.5 font-sans text-xs sm:text-sm">"{c.reply}"</p>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#DDE9DF] font-sans">
                <div className="flex items-center gap-2">
                  <AdminButton
                    onClick={() => handleContactRead(c.id, !c.isRead)}
                    variant="outline"
                    size="sm"
                  >
                    {c.isRead ? 'Tandai Belum Dibaca' : 'Tandai Sudah Dibaca'}
                  </AdminButton>

                  {selectedContactId !== c.id ? (
                    <AdminButton
                      onClick={() => setSelectedContactId(c.id)}
                      variant="primary"
                      size="sm"
                    >
                      {c.reply ? 'Edit Tanggapan' : 'Tulis Tanggapan'}
                    </AdminButton>
                  ) : (
                    <div className="flex-1 flex gap-2 pt-1 items-center">
                      <input
                        type="text"
                        placeholder="Balas secara profesional..."
                        value={contactReplyText}
                        onChange={(e) => setContactReplyText(e.target.value)}
                        className="flex-1 bg-[#FCFCFC] text-[#202020] border border-[#DDE9DF] p-2 outline-none text-xs rounded-xl focus:border-[#174C3C] font-sans"
                      />
                      <AdminButton
                        onClick={() => handleContactReplySubmit(c.id)}
                        variant="primary"
                        size="sm"
                      >
                        Kirim
                      </AdminButton>
                      <button
                        onClick={() => setSelectedContactId('')}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-full cursor-pointer transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <AdminButton
                  onClick={() => handleDeleteContact(c)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                  icon={Trash2}
                  title="Hapus Pesan Kontak"
                />
              </div>
            </div>
          ))
        )}
      </div>

      <DeleteConfirmModal
        isOpen={Boolean(contactToDelete)}
        title="Hapus Pesan Kontak"
        itemName={contactToDelete?.name ? `dari ${contactToDelete.name}` : ''}
        itemType="pesan kontak"
        onConfirm={confirmDeleteContact}
        onClose={() => setContactToDelete(null)}
      />
    </div>
  );
}