import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Input({ 
  label, 
  type = 'text', 
  id, 
  error, 
  helperText, 
  ...props 
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  
  const describedBy = [];
  if (helperText) describedBy.push(`${id}-helper`);
  if (error) describedBy.push(`${id}-error`);

  return (
    <div className="flex flex-col gap-2 mb-4">
      <label htmlFor={id} className="text-lg font-medium text-slate-800 dark:text-slate-200">
        {label}
      </label>
      
      <div className="relative">
        <input
          id={id}
          type={inputType}
          className={`
            w-full px-4 py-3 rounded-lg border-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white
            focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900/50 transition-all
            ${error 
              ? 'border-red-500 focus:border-red-500' 
              : 'border-slate-300 dark:border-slate-600 focus:border-blue-500'}
          `}
          aria-invalid={!!error}
          aria-describedby={describedBy.length > 0 ? describedBy.join(' ') : undefined}
          {...props}
        />
        
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1"
            aria-label={showPassword ? "إخفاء كلمة السر" : "إظهار كلمة السر"}
          >
            {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
          </button>
        )}
      </div>

      {helperText && !error && (
        <p id={`${id}-helper`} className="text-sm text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      )}
      
      {error && (
        <p id={`${id}-error`} className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
