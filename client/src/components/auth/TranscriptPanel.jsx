import React from 'react';

export default function TranscriptPanel({ text }) {
  if (!text) return null;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 animate-fade-in mt-4">
      <p className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-1">سمعتك قلت:</p>
      <p className="text-lg font-medium text-slate-800 dark:text-slate-100 dir-rtl">
        "{text}"
      </p>
    </div>
  );
}
