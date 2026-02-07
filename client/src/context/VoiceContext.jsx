
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { checkMicrophonePermission, log, speak, stopSpeaking } from '../lib/voice';

const VoiceContext = createContext();

export function useVoice() {
  return useContext(VoiceContext);
}

export function VoiceProvider({ children }) {
  // State
  const [permissionStatus, setPermissionStatus] = useState('prompt');
  const [autoStartBlocked, setAutoStartBlocked] = useState(false);
  const [lastSpokenText, setLastSpokenText] = useState("");
  const [commandHandler, setCommandHandler] = useState(null);

  // Use react-speech-recognition hook
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition();

  const navigate = useNavigate();
  const location = useLocation();

  // Refs for state access
  const isExpectedListening = useRef(false);
  const [isAssistantEnabled, setIsAssistantEnabled] = useState(false);

  // --- Core Listening Logic ---

  const startListeningSafe = useCallback(() => {
    isExpectedListening.current = true;
    setIsAssistantEnabled(true);
    try {
      if (!browserSupportsSpeechRecognition) {
        log('error', "Browser does not support Speech Recognition");
        return;
      }

      SpeechRecognition.abortListening();

      SpeechRecognition.startListening({
        continuous: true,
        language: 'ar-TN',
        interimResults: true
      });
      log('info', "Called SpeechRecognition.startListening (ar-TN, Continuous)");
    } catch (e) {
      log('error', "Error starting recognition lib", e);
    }
  }, [browserSupportsSpeechRecognition]);

  const stopListeningSafe = useCallback(() => {
    isExpectedListening.current = false;
    setIsAssistantEnabled(false);
    SpeechRecognition.stopListening();
  }, []);

  // Watch transcript changes
  useEffect(() => {
    if (transcript && listening) {
      console.log('[VoiceContext] Interim:', transcript);
    }

    if (transcript) {
      const cleanText = transcript.trim().toLowerCase();
      log('info', "Transcript update:", cleanText);
    }
  }, [transcript, listening]);

  // Silence Timer - Extended to 2s for better user experience
  useEffect(() => {
    if (transcript && listening) {
      const timer = setTimeout(() => {
        log('info', "Silence detected, processing command...");
        const cleanText = transcript.trim().toLowerCase();
        if (cleanText) {
          handleCommand(cleanText);
          resetTranscript();
        }
      }, 2000); // 2.0s of silence -> process (more time for users to think)
      return () => clearTimeout(timer);
    }
  }, [transcript, listening, resetTranscript]);

  // Auto-restart
  useEffect(() => {
    if (!listening && isExpectedListening.current && permissionStatus === 'granted') {
      const timer = setTimeout(() => {
        console.log('[VoiceContext] Auto-restarting listening...');
        startListeningSafe();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [listening, startListeningSafe, permissionStatus]);


  // --- TTS Logic ---

  const speakText = useCallback((text, onEnd) => {
    setLastSpokenText(text);

    const wasListening = isExpectedListening.current;
    if (listening) {
      isExpectedListening.current = false;
      SpeechRecognition.stopListening();
    }

    speak(text, () => {
      if (onEnd) onEnd();
      if (wasListening) {
        startListeningSafe();
      }
    }, (error) => {
      if (error.error === 'not-allowed') {
        log('warn', "TTS Autoplay blocked. Requesting user interaction.");
        setAutoStartBlocked(true);
      }
      if (wasListening) {
        startListeningSafe();
      }
      if (onEnd) onEnd();
    });
  }, [listening, startListeningSafe]);

  const repeatLast = useCallback(() => {
    if (lastSpokenText) {
      speakText(lastSpokenText);
    } else {
      speakText("ما قلت شي قبل هذا.");
    }
  }, [lastSpokenText, speakText]);

  // --- Command Handling ---

  const handleCommand = async (text) => {
    if (commandHandler) {
      setLastSpokenText(text);
      commandHandler(text);
    } else {
      console.log('[VoiceContext] No handler registered for:', text);
    }
  };

  const toggleListening = () => {
    if (listening) {
      stopSpeaking();
      stopListeningSafe();
      speak("وقّفت السمع.");
    } else {
      speakText("نسمع فيك", () => {
        startListeningSafe();
      });
    }
  };

  // --- Initialization ---

  const initializeVoice = async () => {
    if (!browserSupportsSpeechRecognition) {
      speak("المتصفح هذا ما يدعمش الصوت.");
      return;
    }

    const status = await checkMicrophonePermission();
    setPermissionStatus(status);

    if (status === 'granted') {
      speakText("مرحبا بك في منصة إبصار. أنا المساعد الصوتي.", () => {
        startListeningSafe();
      });
    } else {
      setAutoStartBlocked(true);
    }
  };

  const requestPermissionManual = async () => {
    const status = await checkMicrophonePermission();
    setPermissionStatus(status);
    if (status === 'granted') {
      setAutoStartBlocked(false);
      speakText("يعطيك الصحّة. نسمع فيك توّا.", () => {
        startListeningSafe();
      });
    } else {
      speakText("ما نجّمتش ناخذ إذن الميكروفون.");
    }
  };

  // Route Announcements & Hotkeys - MOVED TO VoiceOperator mostly, 
  // but keeping Hotkeys here for global access if needed.
  // Actually, VoiceOperator should handle route announcements.

  // Global Hotkeys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        toggleListening();
      }
      if (e.code === 'KeyR' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        repeatLast();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleListening, repeatLast]);

  // Initial mount
  const hasInitialized = useRef(false);
  useEffect(() => {
    let timer = null;
    if (!hasInitialized.current) {
      timer = setTimeout(() => {
        if (!hasInitialized.current) {
          hasInitialized.current = true;
          initializeVoice();
        }
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
      SpeechRecognition.stopListening();
    };
  }, []);

  const value = {
    isListening: listening,
    isAssistantEnabled, // Expose persistent state
    transcript,
    interimTranscript: transcript,
    toggleListening,
    speak: speakText,
    stopSpeaking,
    repeatLast,
    setCommandHandler, // New API
    permissionStatus,
    autoStartBlocked,
    requestPermissionManual,
    // Legacy support if components still use it (optional)
    registerPageHandler: (handler) => { setCommandHandler(() => handler); return () => setCommandHandler(null); }
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
}
