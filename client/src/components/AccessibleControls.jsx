import React from 'react';
import { Sun, Moon, Type, Volume2, VolumeX, Zap, ZapOff } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

export default function AccessibleControls() {
  const { 
    theme, toggleTheme,
    fontSize, cycleFontSize,
    voiceFeedback, toggleVoiceFeedback,
    reduceMotion, toggleReduceMotion
  } = useAccessibility();

  return (
    <div 
      className="fixed top-4 left-4 z-50 flex flex-col gap-2 p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg"
      role="group"
      aria-label="إعدادات سهولة الاستخدام (Accessibility Settings)"
    >
      <button
        onClick={toggleTheme}
        className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-200"
        title={theme === 'light' ? "الوضع المظلم" : "الوضع المضيء"}
        aria-label={theme === 'light' ? "بدّل للوضع المظلم" : "بدّل للوضع المضيء"}
      >
        {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
      </button>

      <button
        onClick={cycleFontSize}
        className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-200 relative"
        title="كبّر الكتيبه (Change Font Size)"
        aria-label={`حجم الكتيبه: ${fontSize === 'normal' ? 'عادي' : fontSize === 'large' ? 'كبير' : 'كبير برشا'}`}
      >
        <Type size={24} />
        <span className="absolute -top-1 -right-1 text-xs font-bold bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full w-5 h-5 flex items-center justify-center">
          {fontSize === 'normal' ? '1x' : fontSize === 'large' ? '2x' : '3x'}
        </span>
      </button>

      <button
        onClick={toggleVoiceFeedback}
        className={`p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${voiceFeedback ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
        title={voiceFeedback ? "إقرا بصوت: يخدم" : "إقرا بصوت: مسكّر"}
        aria-label={voiceFeedback ? "سكّر القراءة الصوتية" : "حل القراءة الصوتية"}
      >
        {voiceFeedback ? <Volume2 size={24} /> : <VolumeX size={24} />}
      </button>

      <button
        onClick={toggleReduceMotion}
        className={`p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${reduceMotion ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
        title={reduceMotion ? "الحركة: قليلة" : "الحركة: عادية"}
        aria-label={reduceMotion ? "رجّع الحركة العادية" : "نقص من الحركة"}
      >
        {reduceMotion ? <ZapOff size={24} /> : <Zap size={24} />}
      </button>
    </div>
  );
}
