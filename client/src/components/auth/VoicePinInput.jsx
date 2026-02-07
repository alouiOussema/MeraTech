import React, { forwardRef } from 'react';
import OtpDigitsInput from './OtpDigitsInput';

const VoicePinInput = forwardRef(({ 
  id, 
  label, 
  value, 
  onChange, 
  error, 
  helperText 
}, ref) => {
  return (
    <div className="space-y-2">
      <label id={`${id}-label`} htmlFor={id} className="block text-lg font-bold text-slate-800 dark:text-white">
        {label}
      </label>

      {/* Simplified PIN Input Area - No Mic */}
      <div className="relative pt-1">
        <OtpDigitsInput 
          ref={ref}
          value={value} 
          onChange={onChange} 
          labelId={`${id}-label`}
          error={error}
        />
      </div>

      {helperText && (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1">
          {helperText}
        </p>
      )}

      {error && (
        <p className="text-red-600 font-bold text-sm mt-1 flex items-center gap-1 justify-center" role="alert">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
});

VoicePinInput.displayName = 'VoicePinInput';
export default VoicePinInput;
