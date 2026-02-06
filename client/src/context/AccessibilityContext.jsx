import { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

export function AccessibilityProvider({ children }) {
  // Initialize state from localStorage or defaults
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('fontSize') || 'normal');
  const [voiceFeedback, setVoiceFeedback] = useState(() => localStorage.getItem('voiceFeedback') === 'true');
  const [reduceMotion, setReduceMotion] = useState(() => localStorage.getItem('reduceMotion') === 'true');

  // Apply theme class to html element
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Apply font size class to html element
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('text-base', 'text-lg', 'text-xl');
    if (fontSize === 'normal') root.classList.add('text-base');
    if (fontSize === 'large') root.classList.add('text-lg');
    if (fontSize === 'extra-large') root.classList.add('text-xl');
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  // Persist other settings
  useEffect(() => {
    localStorage.setItem('voiceFeedback', voiceFeedback);
  }, [voiceFeedback]);

  useEffect(() => {
    localStorage.setItem('reduceMotion', reduceMotion);
    // You might want to apply a class for reduce-motion if you handle it manually, 
    // but usually media query handles it. We can force it via class if needed.
    if (reduceMotion) {
      document.documentElement.classList.add('motion-reduce');
    } else {
      document.documentElement.classList.remove('motion-reduce');
    }
  }, [reduceMotion]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleVoiceFeedback = () => setVoiceFeedback(prev => !prev);
  const toggleReduceMotion = () => setReduceMotion(prev => !prev);
  
  const cycleFontSize = () => {
    setFontSize(prev => {
      if (prev === 'normal') return 'large';
      if (prev === 'large') return 'extra-large';
      return 'normal';
    });
  };

  return (
    <AccessibilityContext.Provider value={{
      theme, setTheme, toggleTheme,
      fontSize, setFontSize, cycleFontSize,
      voiceFeedback, setVoiceFeedback, toggleVoiceFeedback,
      reduceMotion, setReduceMotion, toggleReduceMotion
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  return useContext(AccessibilityContext);
}
