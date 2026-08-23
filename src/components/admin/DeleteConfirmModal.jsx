"use client";

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import AdminButton from '@/components/admin/AdminButton';

export default function DeleteConfirmModal({
  isOpen,
  title,
  itemName,
  itemType = 'data',
  message,
  onConfirm,
  onClose,
  isLoading = false
}) {
  if (!isOpen) return null;

  const displayTitle = title || `Hapus ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`;
  const displayMessage = message || (itemName 
    ? `Apakah Anda yakin ingin menghapus "${itemName}"?`
    : `Apakah Anda yakin ingin menghapus ${itemType} ini?`);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden p-6 select-none"
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                  {displayTitle}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            {displayMessage}
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <AdminButton
              type="button"
              onClick={onClose}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              Batal
            </AdminButton>
            <AdminButton
              type="button"
              onClick={onConfirm}
              variant="danger"
              size="sm"
              icon={Trash2}
              disabled={isLoading}
            >
              {isLoading ? 'Menghapus...' : 'Hapus'}
            </AdminButton>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
