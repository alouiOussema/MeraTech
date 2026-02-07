import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

const OtpDigitsInput = forwardRef(({ value, onChange, labelId, error }, ref) => {
  const inputsRef = useRef([]);

  // Ensure inputsRef has correct length
  if (inputsRef.current.length !== 6) {
    inputsRef.current = new Array(6).fill(null);
  }

  useImperativeHandle(ref, () => ({
    focus: () => {
      // Focus first empty input or the last one if full, or just the first one?
      // Usually first empty is best.
      // value is a string, e.g. "123"
      const len = value ? value.length : 0;
      const targetIndex = Math.min(len, 5);
      const target = inputsRef.current[targetIndex];
      if (target) {
        target.focus();
      }
    }
  }));

  const handleChange = (index, e) => {
    const val = e.target.value;
    if (!/^\d*$/.test(val)) return; // Only digits

    const newValue = value.split('');
    // Ensure value is length 6 padded with empty strings
    while (newValue.length < 6) newValue.push('');
    
    // If user pasted multiple chars (not supported by this simple logic but safe to handle just last char)
    // We actually only take the last character typed
    const char = val.slice(-1); 
    
    newValue[index] = char;
    const newString = newValue.join('').slice(0, 6); // Rejoin
    
    onChange(newString);

    // Auto advance
    if (char && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // If empty and backspace, move previous
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      onChange(pastedData);
      // Focus the next empty or last
      const nextIndex = Math.min(pastedData.length, 5);
      inputsRef.current[nextIndex]?.focus();
    }
  };

  return (
    <div 
      className="flex gap-2 justify-center direction-ltr" 
      role="group" 
      aria-labelledby={labelId}
      dir="ltr" // Force LTR for OTP input order even in RTL layout
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={el => inputsRef.current[i] = el}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={`
            w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-lg border-2 
            focus:ring-4 focus:ring-blue-200 transition-all outline-none
            ${error 
              ? 'border-red-500 text-red-900 bg-red-50 focus:border-red-500' 
              : 'border-slate-300 text-slate-900 bg-white focus:border-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white'}
          `}
          aria-label={`رقم ${i + 1} من 6`}
        />
      ))}
    </div>
  );
});

OtpDigitsInput.displayName = 'OtpDigitsInput';
export default OtpDigitsInput;
