import React from 'react';
import SkipLink from '../components/SkipLink';
import { TopNavbar, BottomNavbar } from '../components/Navigation';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <SkipLink />
      
      <header>
        <TopNavbar />
      </header>
      
      <main id="main-content" className="container mx-auto px-4 py-6 md:py-8 mb-20 md:mb-0 min-h-[80vh]">
        {children}
      </main>
      
      <BottomNavbar />
    </div>
  );
}
