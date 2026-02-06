import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function AccessibleAlert({ message, type = 'error' }) {
  if (!message) return null;

  const styles = type === 'error' 
    ? 'bg-red-50 text-red-900 border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800'
    : 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800';

  return (
    <div 
      role="alert" 
      className={`p-4 rounded-xl border flex items-start gap-3 ${styles} animate-fade-in`}
    >
      <AlertCircle className="shrink-0 mt-0.5" size={20} />
      <span className="font-medium">{message}</span>
    </div>
  );
}
