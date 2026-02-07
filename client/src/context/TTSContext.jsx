import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAccessibility } from './AccessibilityContext';
import { useLocation } from 'react-router-dom';

const TTSContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useTTS() {
  return useContext(TTSContext);
}

export function TTSProvider({ children }) {
  const { voiceFeedback } = useAccessibility();
  const location = useLocation();
  const [voices, setVoices] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synth = useRef(window.speechSynthesis);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = synth.current.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Cancel speech on unmount
  useEffect(() => {
    const synthInstance = synth.current;
    return () => {
      synthInstance.cancel();
    };
  }, []);

  const speak = useCallback((text, priority = false, onEnd = null) => {
    if (!voiceFeedback && !priority) {
        if (onEnd) onEnd();
        return;
    }
    
    // Cancel previous speech if priority or just to be responsive
    synth.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to find an Arabic voice
    const arabicVoice = voices.find(v => v.lang.includes('ar'));
    if (arabicVoice) {
      utterance.voice = arabicVoice;
      utterance.lang = 'ar-TN'; // Try specific locale, fallback to voice default
    } else {
        // Fallback to French or English if no Arabic
        const fallback = voices.find(v => v.lang.includes('fr') || v.lang.includes('en'));
        if (fallback) utterance.voice = fallback;
    }

    utterance.rate = 1.0; // Normal speed
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
    };
    utterance.onerror = (e) => {
        setIsSpeaking(false);
        console.error("TTS Error:", e);
        if (onEnd) onEnd();
    };

    synth.current.speak(utterance);
  }, [voiceFeedback, voices]);

  const stop = useCallback(() => {
    synth.current.cancel();
    setIsSpeaking(false);
  }, []);

  // --- Page Scanner Logic ---
  const scanAndAnnounce = useCallback(() => {
    if (!voiceFeedback) return;

    // Small delay to ensure DOM is ready
    setTimeout(() => {
        const title = document.title;
        const heading = document.querySelector('h1')?.innerText || '';
        const buttons = document.querySelectorAll('button').length;
        const links = document.querySelectorAll('a').length;
        const inputs = document.querySelectorAll('input, textarea, select').length;

        let announcement = `الصفحة: ${title}. `;
        if (heading && heading !== title) {
            announcement += `${heading}. `;
        }
        
        announcement += `في الصفحة هذي فما: `;
        if (buttons > 0) announcement += `${buttons} بطونة, `;
        if (links > 0) announcement += `${links} رابط, `;
        if (inputs > 0) announcement += `${inputs} بلاصة للكتابة. `;
        
        announcement += "تجم تسألني نعاونك.";

        speak(announcement);
    }, 500);
  }, [speak, voiceFeedback]);

  // Auto-announce on navigation
  useEffect(() => {
    scanAndAnnounce();
  }, [location.pathname, scanAndAnnounce]);

  return (
    <TTSContext.Provider value={{ speak, stop, isSpeaking, scanAndAnnounce }}>
      {children}
    </TTSContext.Provider>
  );
}
