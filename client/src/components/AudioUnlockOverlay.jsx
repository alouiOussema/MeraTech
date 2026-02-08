import React, { useEffect, useState } from 'react';
import { useVoice } from '../context/VoiceContext';
import { playBeep } from '../lib/audio';
import { Volume2 } from 'lucide-react';

export default function AudioUnlockOverlay() {
  const { autoStartBlocked, requestPermissionManual } = useVoice();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(autoStartBlocked);
  }, [autoStartBlocked]);

  const handleUnlock = () => {
    // Play a beep to unlock AudioContext
    playBeep();
    // Request permission/start flow
    requestPermissionManual();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-6 mx-4 border border-white/20">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Volume2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-pulse" />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          تفعيل الصوت
        </h2>
        
        <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
          المتصفح يحتاج إذن باش يخدم الصوت والميكروفون.
        </p>

        <button
          onClick={handleUnlock}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xl font-bold shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-blue-500/30"
        >
          اضغط هنا للبدء
        </button>
      </div>
    </div>
  );
}
