import React from 'react';
import { Moon, Sun, Type, Volume2, VolumeX, Move, Ban } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

function SettingToggle({ label, isActive, onClick, icon: Icon, activeIcon: ActiveIcon }) {
  const DisplayIcon = isActive ? (ActiveIcon || Icon) : Icon;
  
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all
        ${isActive 
          ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/30 dark:border-blue-400' 
          : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'}
      `}
      aria-pressed={isActive}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-full ${isActive ? 'bg-blue-200 dark:bg-blue-800' : 'bg-slate-100 dark:bg-slate-700'}`}>
          <DisplayIcon size={24} className={isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400'} />
        </div>
        <span className="text-lg font-bold text-slate-800 dark:text-white text-right">{label}</span>
      </div>
      <div className={`
        w-14 h-8 rounded-full relative transition-colors
        ${isActive ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}
      `}>
        <div className={`
          absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-200
          ${isActive ? 'left-1 translate-x-0' : 'right-1 translate-x-0'} 
          /* RTL flip might confuse translate, so using left/right explicitly or translate with rtl logic. 
             In RTL, left is left. So if active (ON), we want it on the left? No, usually toggle switches:
             OFF (Gray): Circle on the "start" side.
             ON (Color): Circle on the "end" side.
             In LTR: OFF=Left, ON=Right.
             In RTL: OFF=Right, ON=Left.
          */
           ${isActive ? 'left-1' : 'right-1'}
        `} />
      </div>
    </button>
  );
}

export default function Settings() {
  const { 
    theme, toggleTheme,
    fontSize, cycleFontSize,
    voiceFeedback, toggleVoiceFeedback,
    reduceMotion, toggleReduceMotion
  } = useAccessibility();

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">الإعدادات</h1>
        <p className="text-slate-600 dark:text-slate-400">تحكّم في التطبيق كيما تحب</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">المظهر والصوت</h2>
        
        <SettingToggle 
          label={theme === 'dark' ? 'الوضع المظلم (Dark Mode)' : 'الوضع المضيء'}
          isActive={theme === 'dark'}
          onClick={toggleTheme}
          icon={Sun}
          activeIcon={Moon}
        />

        <button
          onClick={cycleFontSize}
          className="w-full flex items-center justify-between p-4 rounded-xl border-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-700">
              <Type size={24} className="text-slate-600 dark:text-slate-400" />
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-slate-800 dark:text-white block">حجم الكتيبه</span>
              <span className="text-sm text-slate-500">
                {fontSize === 'normal' && 'عادي'}
                {fontSize === 'large' && 'كبير'}
                {fontSize === 'extra-large' && 'كبير برشا'}
              </span>
            </div>
          </div>
        </button>

        <SettingToggle 
          label="التعليق الصوتي (Voice Feedback)"
          isActive={voiceFeedback}
          onClick={toggleVoiceFeedback}
          icon={VolumeX}
          activeIcon={Volume2}
        />

        <SettingToggle 
          label="تقليل الحركة (Reduce Motion)"
          isActive={reduceMotion}
          onClick={toggleReduceMotion}
          icon={Move}
          activeIcon={Ban}
        />
      </section>

      <section className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">كيفاش تستعمل التطبيق؟</h2>
        <ul className="space-y-3 text-slate-700 dark:text-slate-300 list-disc list-inside">
          <li>اضغط على زر <strong>الميكروفون</strong> باش تتكلم وتأمر التطبيق.</li>
          <li>استعمل زر <strong>Tab</strong> في الكلافيي (Keyboard) باش تتنقل بين العناصر.</li>
          <li>تنجّم تكبّر الكتيبه من هوني كان ماكش ترا مليح.</li>
        </ul>
      </section>
    </div>
  );
}
