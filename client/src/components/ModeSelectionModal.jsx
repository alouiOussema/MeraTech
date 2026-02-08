import React, { useEffect, useRef } from 'react';
import { Keyboard, Mic, X } from 'lucide-react';

export default function ModeSelectionModal({ isOpen, onClose, onSelect }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        ref={modalRef}
        className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 max-w-2xl w-full mx-4 relative transform transition-all scale-100"
        tabIndex="-1"
        role="dialog"
        aria-labelledby="mode-selection-title"
      >
        <h2 id="mode-selection-title" className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-8">
          اختار طريقة الاستعمال
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Keyboard Mode */}
          <button 
            onClick={() => onSelect('keyboard')}
            className="flex flex-col items-center justify-center p-8 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border-2 border-transparent hover:border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all group"
          >
            <div className="bg-blue-200 dark:bg-blue-800 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <Keyboard size={48} className="text-blue-700 dark:text-blue-300" />
            </div>
            <span className="text-xl font-bold text-slate-800 dark:text-white">1. مود كلافيي</span>
          </button>

          {/* Voice Mode */}
          <button 
            onClick={() => onSelect('voice')}
            className="flex flex-col items-center justify-center p-8 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border-2 border-transparent hover:border-purple-500 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all group"
          >
            <div className="bg-purple-200 dark:bg-purple-800 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <Mic size={48} className="text-purple-700 dark:text-purple-300" />
            </div>
            <span className="text-xl font-bold text-slate-800 dark:text-white">2. مود صوت</span>
          </button>
        </div>

        <p className="text-center text-slate-500 dark:text-slate-400 mt-6">
          تنجم تبدل المود مبعد من الإعدادات.
        </p>
      </div>
    </div>
  );
}
