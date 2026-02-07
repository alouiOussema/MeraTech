import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useVoice } from '../context/VoiceContext';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { speak } = useVoice();

  useEffect(() => {
    speak(`مرحبا بيك في بروفايلك سي ${user?.fullName || 'فلان'}.`);
  }, [user]);

  const handleLogout = () => {
    speak("بالسلامة!", () => {
      logout();
      navigate('/');
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600 dark:text-slate-400">
        تحميل...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="bg-blue-600 p-8 text-white text-center">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full mx-auto flex items-center justify-center mb-4">
            <User size={48} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">{user.fullName}</h1>
          <p className="opacity-90">حساب إبصار</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                <Shield size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">معرف المستخدم</p>
                <p className="font-mono text-slate-700 dark:text-slate-300">{user.userId}</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-bold py-4 rounded-xl transition-all"
            >
              <LogOut size={20} />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
