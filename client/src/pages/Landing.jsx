import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, ShoppingCart, Mic } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

export default function Landing() {
  const navigate = useNavigate();
  const { theme } = useAccessibility();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 animate-fade-in">
      
      <div className="text-center space-y-4 max-w-2xl">
        <h1 className="text-4xl md:text-6xl font-extrabold text-blue-900 dark:text-blue-300 tracking-tight">
          منصّة إبصار
        </h1>
        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 leading-relaxed">
          استقلاليتك تبدا بصوتك. تحكّم في فلوسك وقضيتك بكل سهولة.
        </p>
      </div>

      {/* Voice Start Button */}
      <button 
        className="group relative flex flex-col items-center justify-center w-64 h-64 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl hover:scale-105 transition-all focus:ring-8 focus:ring-blue-300 dark:focus:ring-blue-800"
        aria-label="بَدّى بالصّوت (ابدا التحكم الصوتي)"
        onClick={() => {
            // In a real app, this might open a global voice assistant or navigate to a main voice interface
            alert("المساعد الصوتي باش يخدم توة (Simulation)");
        }}
      >
        <Mic size={64} className="mb-4 group-hover:animate-bounce" />
        <span className="text-3xl font-bold">بَدّى بالصّوت</span>
      </button>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mt-8">
        <Link 
          to="/banque"
          className="flex flex-col items-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-xl border-2 border-transparent hover:border-blue-500 transition-all group"
        >
          <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
            <CreditCard size={40} className="text-green-600 dark:text-green-400" />
          </div>
          <span className="text-2xl font-bold text-slate-800 dark:text-white">البنك</span>
          <span className="text-slate-500 dark:text-slate-400 mt-2">تصرف في رصيدك وحوّل فلوس</span>
        </Link>

        <Link 
          to="/courses"
          className="flex flex-col items-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-xl border-2 border-transparent hover:border-orange-500 transition-all group"
        >
          <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
            <ShoppingCart size={40} className="text-orange-600 dark:text-orange-400" />
          </div>
          <span className="text-2xl font-bold text-slate-800 dark:text-white">القْضْيَة</span>
          <span className="text-slate-500 dark:text-slate-400 mt-2">نظّم قائمة مشترياتك</span>
        </Link>
      </div>

    </div>
  );
}
