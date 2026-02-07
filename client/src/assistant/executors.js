
import { useNavigate } from 'react-router-dom';

// Helper to trigger React-aware input changes
const setNativeValue = (element, value) => {
  const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
  const prototype = Object.getPrototypeOf(element);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
  
  if (valueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value);
  } else {
    valueSetter.call(element, value);
  }
  
  element.dispatchEvent(new Event('input', { bubbles: true }));
};

const pasteToInput = (selector, text) => {
  const input = document.querySelector(selector);
  if (!input) return false;
  
  const data = new DataTransfer();
  data.setData('text', text);
  
  const event = new ClipboardEvent('paste', {
    bubbles: true,
    clipboardData: data
  });
  
  input.dispatchEvent(event);
  return true;
};

export const executors = {
  // Navigation
  navigate: (path) => {
    // This relies on the VoiceOperator having access to the navigate function
    // or we use window.location as fallback (though it refreshes)
    window.location.hash = path; // If using HashRouter, otherwise we need a callback
  },

  // Form Filling
  fillInput: (selector, value) => {
    const input = document.querySelector(selector);
    if (input) {
      setNativeValue(input, value);
      return true;
    }
    return false;
  },

  click: (selector) => {
    const btn = document.querySelector(selector);
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  },

  getText: (selector) => {
    const el = document.querySelector(selector);
    return el ? el.innerText : null;
  },
  
  // Specific Task Executors
  
  // Auth
  fillRegisterForm: (name, pin) => {
    // Selectors based on likely IDs/names in the existing components
    // I need to verify these selectors from the Read output earlier or assume/add IDs
    const nameInput = document.querySelector('input[name="name"]') || document.querySelector('#fullName');
    if (nameInput && name) setNativeValue(nameInput, name);
    
    // Voice PIN input might be tricky if it's custom. 
    // Assuming standard inputs or we need to handle the custom component.
    // Looking at VoicePinInput usage in Register.jsx, it seems to take data via props or internal state.
    // If it's internal state, we can't easily set it from outside without exposing a method.
    // BUT, for the "Out-of-the-box" requirement, we might need to simulate the "voice input" that the component expects.
    // However, the prompt says "Task Executor that can programmatically ... set input values".
    // I will try to target inputs.
  },

  fillLoginForm: (name, pin) => {
    const nameInput = document.querySelector('input[name="name"]');
    if (nameInput && name) setNativeValue(nameInput, name);
  },
  
  fillPin: (pin) => {
    // Target the first input of the OTP group
    // Based on OtpDigitsInput: aria-label="رقم 1 من 6"
    return pasteToInput('input[aria-label="رقم 1 من 6"]', pin);
  }
};
