import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { speak, stopSpeaking, startListening, checkMicrophonePermission } from '../lib/voice';
import { parseIntent, INTENTS } from '../lib/intents';
import { useNavigate, useLocation } from 'react-router-dom';

const VoiceContext = createContext();

export function useVoice() {
  return useContext(VoiceContext);
}

export function VoiceProvider({ children }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // prompt, granted, denied
  const [autoStartBlocked, setAutoStartBlocked] = useState(false); // If browser blocks autoplay

  const recognitionRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Page-specific command handler
  const [pageHandler, setPageHandler] = useState(null);

  const registerPageHandler = useCallback((handler) => {
    setPageHandler(() => handler);
    return () => setPageHandler(null);
  }, []);

  const [lastSpokenText, setLastSpokenText] = useState("");

  const speakText = useCallback((text, onEnd) => {
    setLastSpokenText(text);
    // If we are listening, we might want to pause listening while speaking?
    // For now, let's keep it simple. Echo cancellation is hard on web.
    // Usually, we stop listening before speaking to avoid hearing ourselves.
    if (recognitionRef.current) {
        recognitionRef.current.stop(); // Temporarily stop
    }
    
    speak(text, () => {
        if (onEnd) onEnd();
        // Resume listening if we were in "listening mode" (heuristic)
        // For this app, we almost always want to resume listening after speaking.
        if (permissionStatus === 'granted' && !autoStartBlocked) {
             startListeningSafe();
        }
    });
  }, [permissionStatus, autoStartBlocked]);

  const repeatLast = useCallback(() => {
    if (lastSpokenText) {
      speakText(lastSpokenText);
    } else {
      speakText("ما قلت شي قبل هذا.");
    }
  }, [lastSpokenText, speakText]);

  const handleCommand = (text) => {
    const { intent, confidence } = parseIntent(text);
    console.log(`[VoiceContext] Intent: ${intent}, Confidence: ${confidence}`);

    // 1. Check Global Intents
    if (confidence > 0.6) {
      switch (intent) {
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
    }

    // 2. Page Handler
    if (pageHandler) {
      pageHandler(text, intent);
    } else {
        // Only give feedback if it's a "Final" silence or explicit command
        // For continuous, we might be too chatty if we say "I didn't understand" constantly.
        // Let's stay silent if we don't understand, unless the user specifically asked for help?
        // Or maybe just a subtle sound.
    }
  };

  const startListeningSafe = () => {
      if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch(e) {}
      }
      
      setIsListening(true);
      const recognition = startListening(
        (text, isFinal) => {
            if (isFinal) {
                setTranscript(text);
                setInterimTranscript("");
                handleCommand(text);
            } else {
                setInterimTranscript(text);
            }
        },
        (error) => {
           console.error("[VoiceContext] Recognition error:", error);
           if (error === 'not-allowed') {
               setPermissionStatus('denied');
               setIsListening(false);
           }
        },
        () => {
            // On End - if we want continuous, we might need to restart?
            // But if we called stop() manually, we don't want to restart.
            // The lib/voice.js handles 'continuous' flag, but some browsers stop anyway.
            // We'll rely on the logic in speakText to restart.
            // Or if it stopped unexpectedly, we might want to restart.
             console.log("[VoiceContext] Recognition stopped");
             // Don't auto-restart here blindly to avoid loops.
        },
        { continuous: true, interimResults: true }
      );
      recognitionRef.current = recognition;
  };

  const toggleListening = () => {
    if (isListening) {
      stopSpeaking();
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      speak("وقّفت السمع.");
    } else {
      speakText("نسمع فيك", () => {
          startListeningSafe();
      });
    }
  };

  // 3. Auto-start Logic & Permissions
  const initializeVoice = async () => {
      // Try to get permission
      const status = await checkMicrophonePermission();
      setPermissionStatus(status);

      if (status === 'granted') {
          speakText("مرحبا بيك في منصّة إبصار. أنا المساعد الصوتي. باش نسمعك، لازم تعطيني إذن للميكروفون. قلّي: موافق ولا لا.", () => {
             // Actually we already have permission if status is granted, 
             // but maybe it was persisted.
             // If we have it, just start.
             startListeningSafe();
          });
      } else {
          // If prompt needed or denied
          // We can't force it without user gesture if denied.
          // We'll rely on the UI to ask the user to click "Start".
          setAutoStartBlocked(true);
      }
  };

  // Route Announcements
  useEffect(() => {
    // Small delay to let page load
    const timer = setTimeout(() => {
        let pageName = "";
        if (location.pathname === '/') pageName = "الصفحة الرئيسية";
        else if (location.pathname === '/login') pageName = "صفحة الدخول";
        else if (location.pathname === '/register') pageName = "صفحة التسجيل";
        else if (location.pathname === '/banque') pageName = "البنك";
        else if (location.pathname === '/courses') pageName = "الكورسة";
        
        if (pageName) {
            speakText(`إنت توّا في ${pageName}`);
        }
    }, 500);
    return () => clearTimeout(timer);
  }, [location.pathname, speakText]);

  // Global Hotkeys
  useEffect(() => {
      const handleKeyDown = (e) => {
          // Space to toggle (if not in input)
          if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
              e.preventDefault();
              toggleListening();
          }
          // R to repeat
          if (e.code === 'KeyR' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
              e.preventDefault();
              repeatLast();
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleListening, repeatLast]);

  // Initial mount
  useEffect(() => {
      // Attempt to speak immediately (might fail if no gesture)
      // We'll try.
      speak("مرحبا بيك");
      // Then check perms
      initializeVoice();
  }, []);

  const requestPermissionManual = async () => {
      const status = await checkMicrophonePermission();
      setPermissionStatus(status);
      if (status === 'granted') {
          setAutoStartBlocked(false);
          speakText("يعطيك الصحّة. نسمع فيك توّا. شنوّة تحب تعمل؟ دخول ولا تسجيل؟");
          startListeningSafe();
      } else {
          speakText("ما نجّمتش ناخذ إذن الميكروفون.");
      }
  };

  const value = {
    isListening,
    transcript,
    interimTranscript,
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
