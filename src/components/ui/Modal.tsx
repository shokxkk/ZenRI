'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      document.addEventListener('keydown', handler);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className={`bg-white dark:bg-[#131C2E] rounded-t-3xl sm:rounded-3xl w-full ${maxWidth} border-t sm:border border-zen-200 dark:border-zen-800 shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] my-auto`}
        style={{ animation: 'modalIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Drag Handle on mobile */}
        <div className="w-12 h-1 bg-zen-300 dark:bg-zen-700 rounded-full mx-auto mt-2.5 sm:hidden flex-shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 sm:p-5 border-b border-zen-100 dark:border-zen-800/80 flex-shrink-0">
          <h2 className="text-base sm:text-lg font-extrabold text-zen-900 dark:text-zen-100 pr-2 truncate">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zen-400 hover:text-zen-700 dark:hover:text-zen-200 hover:bg-zen-100 dark:hover:bg-zen-800 transition-colors flex-shrink-0"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6 space-y-4">
          {children}
        </div>
      </div>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};
