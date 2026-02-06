// import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
// import { speak, stopSpeaking, startListening, checkMicrophonePermission } from '../lib/voice';
// import { parseIntent, INTENTS } from '../lib/intents';
// import { useNavigate, useLocation } from 'react-router-dom';

// const VoiceContext = createContext();

// export function useVoice() {
//   return useContext(VoiceContext);
// }

// export function VoiceProvider({ children }) {
//   const [isListening, setIsListening] = useState(false);
//   const [transcript, setTranscript] = useState("");
//   const [interimTranscript, setInterimTranscript] = useState("");
//   const [permissionStatus, setPermissionStatus] = useState('prompt'); // prompt, granted, denied
//   const [autoStartBlocked, setAutoStartBlocked] = useState(false); // If browser blocks autoplay

//   const recognitionRef = useRef(null);
//   const navigate = useNavigate();
//   const location = useLocation();

//   // Page-specific command handler
//   const [pageHandler, setPageHandler] = useState(null);

//   const registerPageHandler = useCallback((handler) => {
//     setPageHandler(() => handler);
//     return () => setPageHandler(null);
//   }, []);

//   const [lastSpokenText, setLastSpokenText] = useState("");

//   const speakText = useCallback((text, onEnd) => {
//     setLastSpokenText(text);
//     // If we are listening, we might want to pause listening while speaking?
//     // For now, let's keep it simple. Echo cancellation is hard on web.
//     // Usually, we stop listening before speaking to avoid hearing ourselves.
//     if (recognitionRef.current) {
//         recognitionRef.current.stop(); // Temporarily stop
//     }
    
//     speak(text, () => {
//         if (onEnd) onEnd();
//         // Resume listening if we were in "listening mode" (heuristic)
//         // For this app, we almost always want to resume listening after speaking.
//         if (permissionStatus === 'granted' && !autoStartBlocked) {
//              startListeningSafe();
//         }
//     });
//   }, [permissionStatus, autoStartBlocked]);

//   const repeatLast = useCallback(() => {
//     if (lastSpokenText) {
//       speakText(lastSpokenText);
//     } else {
//       speakText("ما قلت شي قبل هذا.");
//     }
//   }, [lastSpokenText, speakText]);

//   const handleCommand = (text) => {
//     const { intent, confidence } = parseIntent(text);
//     console.log(`[VoiceContext] Intent: ${intent}, Confidence: ${confidence}`);

//     // 1. Check Global Intents
//     if (confidence > 0.6) {
//       switch (intent) {
//         case INTENTS.LOGIN:
//           speakText("باهي، نمشيو للدخول");
//           navigate('/login');
//           return;
//         case INTENTS.REGISTER:
//           speakText("باهي، نمشيو للتسجيل");
//           navigate('/register');
//           return;
//         case INTENTS.BANK:
//           speakText("باهي، نمشيو للبنك");
//           navigate('/banque');
//           return;
//         case INTENTS.COURSES:
//           speakText("باهي، نمشيو للكورسة");
//           navigate('/courses');
//           return;
//         case INTENTS.HELP:
//           speakText("تنجم تقلي: نحب ندخل، نحب نسجل، البنك، ولا الكورسة");
//           return;
//         case INTENTS.REPEAT:
//           repeatLast();
//           return;
//       }
//     }

//     // 2. Page Handler
//     if (pageHandler) {
//       pageHandler(text, intent);
//     } else {
//         // Only give feedback if it's a "Final" silence or explicit command
//         // For continuous, we might be too chatty if we say "I didn't understand" constantly.
//         // Let's stay silent if we don't understand, unless the user specifically asked for help?
//         // Or maybe just a subtle sound.
//     }
//   };

//   const startListeningSafe = () => {
//       if (recognitionRef.current) {
//           try { recognitionRef.current.stop(); } catch(e) {}
//       }
      
//       setIsListening(true);
//       const recognition = startListening(
//         (text, isFinal) => {
//             if (isFinal) {
//                 setTranscript(text);
//                 setInterimTranscript("");
//                 handleCommand(text);
//             } else {
//                 setInterimTranscript(text);
//             }
//         },
//         (error) => {
//            console.error("[VoiceContext] Recognition error:", error);
//            if (error === 'not-allowed') {
//                setPermissionStatus('denied');
//                setIsListening(false);
//            }
//         },
//         () => {
//             // On End - if we want continuous, we might need to restart?
//             // But if we called stop() manually, we don't want to restart.
//             // The lib/voice.js handles 'continuous' flag, but some browsers stop anyway.
//             // We'll rely on the logic in speakText to restart.
//             // Or if it stopped unexpectedly, we might want to restart.
//              console.log("[VoiceContext] Recognition stopped");
//              // Don't auto-restart here blindly to avoid loops.
//         },
//         { continuous: true, interimResults: true }
//       );
//       recognitionRef.current = recognition;
//   };

//   const toggleListening = () => {
//     if (isListening) {
//       stopSpeaking();
//       if (recognitionRef.current) recognitionRef.current.stop();
//       setIsListening(false);
//       speak("وقّفت السمع.");
//     } else {
//       speakText("نسمع فيك", () => {
//           startListeningSafe();
//       });
//     }
//   };

//   // 3. Auto-start Logic & Permissions
//   const initializeVoice = async () => {
//       // Try to get permission
//       const status = await checkMicrophonePermission();
//       setPermissionStatus(status);

//       if (status === 'granted') {
//           speakText("مرحبا بيك في منصّة إبصار. أنا المساعد الصوتي. باش نسمعك، لازم تعطيني إذن للميكروفون. قلّي: موافق ولا لا.", () => {
//              // Actually we already have permission if status is granted, 
//              // but maybe it was persisted.
//              // If we have it, just start.
//              startListeningSafe();
//           });
//       } else {
//           // If prompt needed or denied
//           // We can't force it without user gesture if denied.
//           // We'll rely on the UI to ask the user to click "Start".
//           setAutoStartBlocked(true);
//       }
//   };

//   // Route Announcements
//   useEffect(() => {
//     // Small delay to let page load
//     const timer = setTimeout(() => {
//         let pageName = "";
//         if (location.pathname === '/') pageName = "الصفحة الرئيسية";
//         else if (location.pathname === '/login') pageName = "صفحة الدخول";
//         else if (location.pathname === '/register') pageName = "صفحة التسجيل";
//         else if (location.pathname === '/banque') pageName = "البنك";
//         else if (location.pathname === '/courses') pageName = "الكورسة";
        
//         if (pageName) {
//             speakText(`إنت توّا في ${pageName}`);
//         }
//     }, 500);
//     return () => clearTimeout(timer);
//   }, [location.pathname, speakText]);

//   // Global Hotkeys
//   useEffect(() => {
//       const handleKeyDown = (e) => {
//           // Space to toggle (if not in input)
//           if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
//               e.preventDefault();
//               toggleListening();
//           }
//           // R to repeat
//           if (e.code === 'KeyR' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
//               e.preventDefault();
//               repeatLast();
//           }
//       };

//       window.addEventListener('keydown', handleKeyDown);
//       return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [toggleListening, repeatLast]);

//   // Initial mount
//   useEffect(() => {
//       // Attempt to speak immediately (might fail if no gesture)
//       // We'll try.
//       speak("مرحبا بيك");
//       // Then check perms
//       initializeVoice();
//   }, []);

//   const requestPermissionManual = async () => {
//       const status = await checkMicrophonePermission();
//       setPermissionStatus(status);
//       if (status === 'granted') {
//           setAutoStartBlocked(false);
//           speakText("يعطيك الصحّة. نسمع فيك توّا. شنوّة تحب تعمل؟ دخول ولا تسجيل؟");
//           startListeningSafe();
//       } else {
//           speakText("ما نجّمتش ناخذ إذن الميكروفون.");
//       }
//   };

//   const value = {
//     isListening,
//     transcript,
//     interimTranscript,
//     toggleListening,
//     speak: speakText,
//     stopSpeaking,
//     repeatLast,
//     processText: handleCommand,
//     registerPageHandler,
//     permissionStatus,
//     autoStartBlocked,
//     requestPermissionManual
//   };

//   return (
//     <VoiceContext.Provider value={value}>
//       {children}
//     </VoiceContext.Provider>
//   );
// }
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const VoiceContext = createContext(null);

const LANGUAGE_CONFIGS = {
  'ar-tn': { code: 'ar-TN', name: 'Tunisian Darja' },
  'ar': { code: 'ar-SA', name: 'Standard Arabic' },
  'fr': { code: 'fr-FR', name: 'French' },
  'en': { code: 'en-US', name: 'English' }
};

export const VoiceProvider = ({ children }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('ar-tn');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const isListeningRef = useRef(false);
  const restartCountRef = useRef(0);

  // Check browser support and request permission on mount
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false);
      setError('Speech recognition not supported. Use Chrome or Edge.');
      return;
    }

    // Request microphone permission early
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => {
        console.log('[Voice] Microphone permission granted');
        setHasPermission(true);
      })
      .catch((err) => {
        console.error('[Voice] Microphone permission denied:', err);
        setHasPermission(false);
        setError('Microphone permission denied. Please allow microphone access.');
      });
  }, []);

  const initRecognition = useCallback(() => {
    if (!isSupported) return null;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    const langConfig = LANGUAGE_CONFIGS[currentLanguage];
    recognition.lang = langConfig.code;
    recognition.continuous = false;  // Changed: Let it stop naturally, we'll restart
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    
    return recognition;
  }, [currentLanguage, isSupported]);

  const speak = useCallback((text, lang = null) => {
    if (!window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const targetLang = lang || currentLanguage;
    const langConfig = LANGUAGE_CONFIGS[targetLang];
    
    utterance.lang = langConfig?.code || 'ar-SA';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to find appropriate voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.lang.startsWith(langConfig?.code) || 
      v.lang.includes(targetLang)
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => console.log('[Voice] Speaking:', text);
    utterance.onerror = (e) => console.error('[Voice] TTS error:', e);

    window.speechSynthesis.speak(utterance);
  }, [currentLanguage]);

  const stopListening = useCallback(() => {
    console.log('[Voice] Stopping...');
    
    isListeningRef.current = false;
    restartCountRef.current = 0;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;  // Remove handler to prevent restart
        recognitionRef.current.stop();
        console.log('[Voice] Stopped');
      } catch (e) {
        console.log('[Voice] Stop error (ignored):', e.message);
      }
    }
    
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported || !hasPermission) {
      console.error('[Voice] Cannot start: not supported or no permission');
      setError('Please allow microphone access');
      return;
    }

    // Stop any existing
    if (recognitionRef.current) {
      try { 
        recognitionRef.current.onend = null;
        recognitionRef.current.stop(); 
      } catch (e) {}
    }

    const recognition = initRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;
    isListeningRef.current = true;
    restartCountRef.current = 0;
    setIsListening(true);
    setTranscript('');
    setInterimTranscript('');
    setError(null);

    let finalTranscript = '';
    let hasReceivedResult = false;

    recognition.onstart = () => {
      console.log('[Voice] Started');
      hasReceivedResult = false;
      
      // Silence timer - stop if no speech for 5 seconds
      silenceTimerRef.current = setTimeout(() => {
        if (isListeningRef.current && !hasReceivedResult) {
          console.log('[Voice] No speech detected, stopping');
          stopListening();
          speak('ما سمعتش حاجة. جرّب ثاني.', 'ar-tn');
        }
      }, 5000);
    };

    recognition.onresult = (event) => {
      hasReceivedResult = true;
      
      // Reset silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      
      // Set new silence timer
      silenceTimerRef.current = setTimeout(() => {
        if (isListeningRef.current) {
          console.log('[Voice] Silence detected, stopping');
          stopListening();
        }
      }, 2000);  // Stop 2 seconds after speech ends

      let interim = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          console.log('[Voice] Final:', transcript);
        } else {
          interim += transcript;
        }
      }

      setTranscript(finalTranscript);
      setInterimTranscript(interim);
      console.log('[Voice] Interim:', interim || finalTranscript);
    };

    recognition.onerror = (event) => {
      console.error('[Voice] Error:', event.error);
      
      switch(event.error) {
        case 'no-speech':
          console.log('[Voice] No speech');
          break;
        case 'audio-capture':
          setError('No microphone found');
          break;
        case 'not-allowed':
          setError('Microphone blocked');
          setHasPermission(false);
          break;
        case 'network':
          setError('Network error');
          break;
        case 'aborted':
          console.log('[Voice] Aborted');
          break;
        default:
          setError(`Error: ${event.error}`);
      }
      
      // Don't restart on error, just stop
      isListeningRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('[Voice] Ended, final transcript:', finalTranscript);
      
      // Only restart if we have no final transcript and haven't restarted too many times
      if (isListeningRef.current && !finalTranscript && restartCountRef.current < 3) {
        restartCountRef.current++;
        console.log('[Voice] Restarting...', restartCountRef.current);
        try {
          recognition.start();
        } catch (e) {
          console.error('[Voice] Restart failed:', e);
          isListeningRef.current = false;
          setIsListening(false);
        }
      } else {
        isListeningRef.current = false;
        setIsListening(false);
        setInterimTranscript('');
        
        // If we have a final transcript, speak confirmation
        if (finalTranscript) {
          console.log('[Voice] Final result:', finalTranscript);
        }
      }
    };

    try {
      recognition.start();
      console.log('[Voice] recognition.start() called');
    } catch (e) {
      console.error('[Voice] Start failed:', e);
      setIsListening(false);
      setError('Failed to start');
    }
  }, [initRecognition, speak, stopListening, isSupported, hasPermission]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const changeLanguage = useCallback((langCode) => {
    if (LANGUAGE_CONFIGS[langCode]) {
      setCurrentLanguage(langCode);
      speak(`Language: ${LANGUAGE_CONFIGS[langCode].name}`, langCode);
    }
  }, [speak]);

  const value = {
    isListening,
    transcript,
    interimTranscript,
    currentLanguage,
    error,
    isSupported,
    hasPermission,
    speak,
    startListening,
    stopListening,
    toggleListening,
    changeLanguage,
    availableLanguages: LANGUAGE_CONFIGS
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) throw new Error('useVoice must be used within VoiceProvider');
  return context;
};

export default VoiceContext;