import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { speak, stopSpeaking, checkMicrophonePermission, log } from '../lib/voice';
import { parseIntent, INTENTS } from '../lib/intents';
import { useNavigate, useLocation } from 'react-router-dom';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const VoiceContext = createContext();

export function useVoice() {
  return useContext(VoiceContext);
}

export function VoiceProvider({ children }) {
  // State
  const [permissionStatus, setPermissionStatus] = useState('prompt'); 
  const [autoStartBlocked, setAutoStartBlocked] = useState(false);
  const [lastSpokenText, setLastSpokenText] = useState("");
  const [pageHandler, setPageHandler] = useState(null);

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
  const noSpeechCount = useRef(0);

  // --- Core Listening Logic ---

  const startListeningSafe = useCallback(() => {
    isExpectedListening.current = true;
    try {
        if (!browserSupportsSpeechRecognition) {
            log('error', "Browser does not support Speech Recognition");
            return;
        }
        
        // Abort previous instances to be safe
        SpeechRecognition.abortListening();
        
        // Using ar-TN with continuous: true should work now that we confirmed the mic is fine
        // If it fails again, we will switch to ar-SA or continuous: false
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
    SpeechRecognition.stopListening();
  }, []);

  // Watch transcript changes
  useEffect(() => {
      // Log interim results for debugging
      if (transcript && listening) {
          console.log('[VoiceContext] Interim:', transcript);
      } else if (listening) {
          // Log heartbeat to confirm we are "checking"
          // console.log('[VoiceContext] Heartbeat - listening...');
      }

      if (transcript) { // Removed !listening check to allow real-time processing
          // Final result (mostly)
          const cleanText = transcript.trim().toLowerCase();
          
          // Debounce slightly to avoid processing partial words too aggressively
          // But for now let's just log it
          log('info', "Transcript update:", cleanText);
          
          // If we want to process commands WHILE listening (faster):
          // handleCommand(cleanText); 
          // resetTranscript();
          // BUT: Usually we wait for a pause. The lib doesn't give 'isFinal' easily in the hook.
          // We can check if the user stopped talking for a bit?
      }
  }, [transcript, listening]);

  // Use a silence timer to detect end of speech manually if needed
  useEffect(() => {
     if (transcript && listening) {
         const timer = setTimeout(() => {
             log('info', "Silence detected, processing command...");
             const cleanText = transcript.trim().toLowerCase();
             if (cleanText) {
                 handleCommand(cleanText);
                 resetTranscript();
             }
         }, 1500); // 1.5s of silence -> process
         return () => clearTimeout(timer);
     }
  }, [transcript, listening, resetTranscript]);

  // Watch listening state to auto-restart if needed
  useEffect(() => {
      // Verbose state logging
      console.log(`[VoiceContext] Listening: ${listening}, Expected: ${isExpectedListening.current}, Permission: ${permissionStatus}`);
      
      if (!listening && isExpectedListening.current && permissionStatus === 'granted') {
          // Restart quickly for "continuous-like" experience
          const timer = setTimeout(() => {
              console.log('[VoiceContext] Auto-restarting listening...');
              startListeningSafe();
          }, 200); 
          return () => clearTimeout(timer);
      }
  }, [listening, startListeningSafe, permissionStatus]);


  const registerPageHandler = useCallback((handler) => {
    setPageHandler(() => handler);
    return () => setPageHandler(null);
  }, []);


  // --- TTS Logic ---

  const speakText = useCallback((text, onEnd) => {
    setLastSpokenText(text);
    
    // 1. Pause Listening
    const wasListening = isExpectedListening.current;
    if (listening) {
        isExpectedListening.current = false;
        SpeechRecognition.stopListening();
    }
    
    speak(text, () => {
        if (onEnd) onEnd();
        
        // 2. Resume Listening
        if (wasListening) {
             startListeningSafe();
        }
    }, (error) => {
        // Handle Error
        if (error.error === 'not-allowed') {
            log('warn', "TTS Autoplay blocked. Requesting user interaction.");
            setAutoStartBlocked(true);
        }
        // Still try to resume listening if possible
        if (wasListening) {
            startListeningSafe();
        }
        // If onEnd was expected, we might want to call it or not. 
        // Usually if speak fails, we want the flow to continue (like navigating).
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

  // --- Intent Handling ---

  const handleCommand = (text) => {
    const { intent, confidence } = parseIntent(text);
    console.log(`[VoiceContext] Processing: "${text}" -> ${intent} (${confidence})`);

    // Feedback for unclear speech
    if (confidence < 0.6) {
        if (text.length > 2) {
             speakText("ما فهمتكش، تنجم تقول: دخول ولا تسجيل");
        }
        return;
    }

    // 1. Check Global Intents
    switch (intent) {
        case INTENTS.HOME:
          speakText("باهي، نمشيو للصفحة الرئيسية");
          navigate('/');
          return;
        case INTENTS.LOGIN:
          speakText("باهي، نمشيو للدخول");
          navigate('/login');
          return;
        case INTENTS.REGISTER:
          speakText("باهي، نمشيو للتسجيل");
          navigate('/register');
          return;
        case INTENTS.BANK:
          speakText("باهي، نمشيو للبنك");
          navigate('/banque');
          return;
        case INTENTS.COURSES:
          speakText("باهي، نمشيو للكورسة");
          navigate('/courses');
          return;
        case INTENTS.HELP:
          speakText("تنجم تقلي: نحب ندخل، نحب نسجل، البنك، ولا الكورسة");
          return;
        case INTENTS.REPEAT:
          repeatLast();
          return;
    }

    // 2. Page Handler
    if (pageHandler) {
      pageHandler(text, intent);
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
          // Use simpler Arabic for TTS compatibility (Standard Arabic)
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

  // Route Announcements
  const lastAnnouncedPath = useRef(null);

  useEffect(() => {
    // Avoid re-announcing if path hasn't changed (prevents loop with speakText dependency)
    if (location.pathname === lastAnnouncedPath.current) return;

    const timer = setTimeout(() => {
        let pageName = "";
        if (location.pathname === '/') pageName = "الصفحة الرئيسية";
        else if (location.pathname === '/login') pageName = "صفحة الدخول";
        else if (location.pathname === '/register') pageName = "صفحة التسجيل";
        else if (location.pathname === '/banque') pageName = "البنك";
        else if (location.pathname === '/courses') pageName = "الكورسة";
        
        if (pageName) {
            lastAnnouncedPath.current = location.pathname;
            speakText(`إنت توّا في ${pageName}`);
        }
    }, 500);
    return () => clearTimeout(timer);
  }, [location.pathname, speakText]);

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
    transcript,
    interimTranscript: transcript, // Lib gives partials in same var
    toggleListening,
    speak: speakText,
    stopSpeaking,
    repeatLast,
    processText: handleCommand,
    registerPageHandler,
    permissionStatus,
    autoStartBlocked,
    requestPermissionManual
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
}
