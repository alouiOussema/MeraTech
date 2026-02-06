import React from 'react';

export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:right-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-blue-600 focus:text-white focus:font-bold focus:rounded-lg focus:shadow-xl transition-transform"
    >
      تجاوز إلى المحتوى الرئيسي (Skip to content)
    </a>
  );
}
