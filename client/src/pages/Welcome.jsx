import React from 'react';
import { Link } from 'react-router-dom';
import { User, UserPlus } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

export default function Welcome() {
  const { theme } = useAccessibility();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 animate-fade-in">
      
      <div className="text-center space-y-4 max-w-2xl">
        <h1 className="text-4xl md:text-6xl font-extrabold text-blue-900 dark:text-blue-300 tracking-tight">
          مرحبا بيك في إبصار
        </h1>
        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 leading-relaxed">
          اختار باش تدخل لحسابك ولا تعمل حساب جديد.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mt-8">
        <Link 
          to="/login"
          className="flex flex-col items-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-xl border-2 border-transparent hover:border-blue-500 transition-all group"
        >
          <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
            <User size={40} className="text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-2xl font-bold text-slate-800 dark:text-white">دخول</span>
          <span className="text-slate-500 dark:text-slate-400 mt-2">عندي حساب</span>
        </Link>

        <Link 
          to="/register"
          className="flex flex-col items-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-xl border-2 border-transparent hover:border-green-500 transition-all group"
        >
          <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
            <UserPlus size={40} className="text-green-600 dark:text-green-400" />
          </div>
          <span className="text-2xl font-bold text-slate-800 dark:text-white">تسجيل جديد</span>
          <span className="text-slate-500 dark:text-slate-400 mt-2">نحب نعمل حساب</span>
        </Link>
      </div>

    </div>
  );
}
