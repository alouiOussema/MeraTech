import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { useAccessibility } from './AccessibilityContext';
import { playAudio, stopAudio, isAudioPlaying } from '../lib/tts';

const TTSContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useTTS() {
  return useContext(TTSContext);
}

export function TTSProvider({ children }) {
  const { voiceFeedback } = useAccessibility();

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const speak = useCallback((text, onEnd = null) => {
    if (!voiceFeedback) {
        if (onEnd) onEnd();
        return;
    }
    
    // Stop previous audio (handled inside playAudio too, but good to be explicit)
    stopAudio();

    playAudio(text, {
      onEnd: () => {
        if (onEnd) onEnd();
      },
      onError: (err) => {
        console.error("TTS Error:", err);
        // Ensure onEnd is called even on error so flow continues
        if (onEnd) onEnd();
      }
    });

  }, [voiceFeedback]);

  const stop = useCallback(() => {
    stopAudio();
  }, []);

  // --- Page Scanner Logic (Simplified for now, can be expanded) ---
  const scanAndAnnounce = useCallback(() => {
    if (!voiceFeedback) return;
    // Logic moved to VoiceOperator or similar if needed, 
    // or keep simple implementation here using new TTS.
    // For now, we rely on VoiceOperator to drive announcements.
  }, [voiceFeedback]);

  const value = {
    speak,
    stop,
    scanAndAnnounce,
    isSpeaking: isAudioPlaying
  };

  return (
    <TTSContext.Provider value={value}>
      {children}
    </TTSContext.Provider>
  );
}
