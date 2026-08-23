"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, Loader2, X } from 'lucide-react';

export default function Toasts({ toasts = [], onRemove }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 sm:top-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none w-full px-4 max-w-full">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast, idx) => (
          <ToastCard 
            key={`${toast.id || 'toast'}-${idx}`} 
            toast={toast} 
            onClose={() => onRemove && onRemove(toast.id)} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastCard({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const type = toast?.type || 'success';

  const icons = {
    success: <CheckCircle2 className="w-[18px] h-[18px] md:w-5 md:h-5 text-[#174C3C] shrink-0 stroke-[2.25]" />,
    error: <AlertCircle className="w-[18px] h-[18px] md:w-5 md:h-5 text-rose-600 shrink-0 stroke-[2.25]" />,
    info: <Info className="w-[18px] h-[18px] md:w-5 md:h-5 text-sky-600 shrink-0 stroke-[2.25]" />,
    warning: <AlertTriangle className="w-[18px] h-[18px] md:w-5 md:h-5 text-amber-600 shrink-0 stroke-[2.25]" />,
    loading: <Loader2 className="w-[18px] h-[18px] md:w-5 md:h-5 text-emerald-600 shrink-0 animate-spin stroke-[2.25]" />
  };

  const cardStyles = {
    success: 'bg-[#F4F9F5]/98 border-[#174C3C]/20 text-[#174C3C]',
    error: 'bg-[#FFF5F5]/98 border-rose-200 text-rose-950',
    info: 'bg-[#F0F7FF]/98 border-sky-200 text-sky-950',
    warning: 'bg-[#FFFBEB]/98 border-amber-200 text-amber-950',
    loading: 'bg-[#F4F9F5]/98 border-emerald-200 text-emerald-950'
  };

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96, transition: { duration: 0.2, ease: 'easeOut' } }}
      whileHover={{ scale: 1.02, transition: { duration: 0.15, ease: 'easeOut' } }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{ willChange: 'transform, opacity' }}
      className={`w-[90vw] max-w-[320px] md:w-auto md:min-w-[380px] md:max-w-[580px] p-[12px_14px] md:px-6 md:py-3.5 rounded-[12px] border shadow-md md:shadow-lg shadow-black/5 flex items-center gap-2.5 md:gap-3.5 backdrop-blur-md pointer-events-auto font-sans ${cardStyles[type] || cardStyles.success}`}
    >
      {icons[type] || icons.success}

      <div className="flex-1 text-left min-w-0 pr-0.5">
        <p className="text-[12px] md:text-[16px] font-semibold leading-snug break-words text-gray-800">
          {toast.message}
        </p>
      </div>

      <button 
        type="button"
        onClick={onClose}
        className="p-1 -mr-1 rounded-lg hover:bg-black/5 text-gray-400 hover:text-gray-700 transition-colors shrink-0 cursor-pointer"
        aria-label="Tutup"
      >
        <X className="w-3.5 h-3.5 md:w-4.5 md:h-4.5" />
      </button>
    </motion.div>
  );
}

