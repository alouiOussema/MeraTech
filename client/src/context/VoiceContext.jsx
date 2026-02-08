import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import {
  checkMicrophonePermission,
  log,
  speak,
  stopSpeaking,
} from "../lib/voice";
import { playBeep } from "../lib/audio";
import { isYes, isNo } from "../assistant/numberParser";
import { QUICK_MENU, speakQuickMenu } from "../assistant/menus";

const VoiceContext = createContext();

export function useVoice() {
  return useContext(VoiceContext);
}

export function VoiceProvider({ children }) {
  // State
  const [permissionStatus, setPermissionStatus] = useState("prompt");
  const [autoStartBlocked, setAutoStartBlocked] = useState(false);
  const [lastSpokenText, setLastSpokenText] = useState("");
  const [commandHandler, setCommandHandler] = useState(null);
  const [defaultCommandHandler, setDefaultCommandHandler] = useState(null);
  const [interactionMode, setInteractionMode] = useState('UNSET'); // 'UNSET' | 'KEYBOARD' | 'VOICE'
  const [onboardingActive, setOnboardingActive] = useState(true);
  const [pendingModeChoice, setPendingModeChoice] = useState(null);
  const [awaitingModeConfirmation, setAwaitingModeConfirmation] = useState(false);
  const hasForcedHome = useRef(false);
  const [voiceDisabled, setVoiceDisabled] = useState(false);
  // Use react-speech-recognition hook
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    error, // Destructure error
  } = useSpeechRecognition({
    transcribing: true,
    clearTranscriptOnListen: true,
  });

  // Log errors
  useEffect(() => {
    if (error) {
      log("error", "Speech Recognition Error:", error);
    }
  }, [error]);

  useEffect(() => {
    if (!hasForcedHome.current) {
      hasForcedHome.current = true;

      // Always force landing on first mount (as you requested)
      if (location.pathname !== "/") {
        navigate("/", { replace: true });
        log(
          "info",
          `[VoiceContext] Forced route to "/" from "${location.pathname}" on reload`,
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Diagnostic: Monitor Microphone Availability
  useEffect(() => {
    log(
      "info",
      `Microphone availability changed: ${isMicrophoneAvailable ? "Available" : "Unavailable"}`,
    );
  }, [isMicrophoneAvailable]);

  // Diagnostic: Monitor Network Status (Crucial for Cloud Speech API)
  useEffect(() => {
    const handleOnline = () =>
      log("info", "Network is Online - Voice services available");
    const handleOffline = () =>
      log("error", "Network is Offline - Voice services may fail");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    if (!navigator.onLine) log("error", "Initial Network Status: Offline");

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  // Debug Navigation and Mode
  useEffect(() => {
    console.log(`[Voice] route=${location.pathname} mode=${interactionMode} listening=${listening} expected=${isExpectedListening.current}`);
  }, [location.pathname, interactionMode, listening]);

  // Refs for state access
  const isExpectedListening = useRef(false);
  const listeningRef = useRef(listening);
  const [isAssistantEnabled, setIsAssistantEnabled] = useState(false);

  useEffect(() => {
    listeningRef.current = listening;
  }, [listening]);

  const startListeningSafe = useCallback(() => {
    isExpectedListening.current = true;
    setIsAssistantEnabled(true);
    try {
      if (!browserSupportsSpeechRecognition) {
        log("error", "Browser does not support Speech Recognition");
        return;
      }

      SpeechRecognition.abortListening();

      SpeechRecognition.startListening({
        continuous: true,
        language: "ar-TN", // Optimized for Tunisian dialect
        interimResults: true,
      });
      log(
        "info",
        "Called SpeechRecognition.startListening (ar-TN, Continuous)",
      );
    } catch (e) {
      log("error", "Error starting recognition lib", e);
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
      console.log("[VoiceContext] Interim:", transcript);
    }

    if (transcript) {
      const cleanText = transcript.trim().toLowerCase();
      log("info", "Transcript update:", cleanText);
    }
  }, [transcript, listening]);

  // Silence Timer - Optimized for responsiveness
  useEffect(() => {
    if (transcript && listening) {
      const timer = setTimeout(() => {
        log("info", "Silence detected, processing command...");
        const cleanText = transcript.trim().toLowerCase();
        if (cleanText) {
          handleCommand(cleanText);
          resetTranscript();
        }
      }, 1500); // 1.5s
      return () => clearTimeout(timer);
    }
  }, [transcript, listening, resetTranscript]);

  // Auto-restart
  useEffect(() => {
    if (
      !listening &&
      permissionStatus === "granted" &&
      interactionMode !== 'KEYBOARD' && // Don't auto-restart in Keyboard mode
      (isExpectedListening.current || interactionMode === 'VOICE') // Force restart in VOICE mode if not KEYBOARD
    ) {
      const timer = setTimeout(() => {
        console.log("[VoiceContext] Auto-restarting listening...");
        startListeningSafe();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [listening, startListeningSafe, permissionStatus, interactionMode]);

  // --- TTS Logic ---

  const speakText = useCallback(
    (text, onEnd, preventAutoRestart = false) => {
      setLastSpokenText(text);

      const wasListening = isExpectedListening.current;
      if (listeningRef.current) {
        isExpectedListening.current = false;
        SpeechRecognition.stopListening();
      }

      speak(
        text,
        () => {
          if (onEnd) onEnd();
          if (wasListening && !preventAutoRestart) {
            startListeningSafe();
          }
        },
        (error) => {
          if (error.error === "not-allowed") {
            log("warn", "TTS Autoplay blocked. Requesting user interaction.");
            setAutoStartBlocked(true);
          }
          if (wasListening && !preventAutoRestart) {
            startListeningSafe();
          }
          if (onEnd) onEnd();
        },
      );
    },
    [startListeningSafe],
  );

  const repeatLast = useCallback(() => {
    if (lastSpokenText) {
      speakText(lastSpokenText);
    } else {
      speakText("ما قلت شي قبل هذا.");
    }
  }, [lastSpokenText, speakText]);

  // --- Command Handling ---

  const safePlayBeep = useCallback(async () => {
    const success = await playBeep();
    if (!success) {
      setAutoStartBlocked(true);
    }
  }, []);

  // --- Command Handling ---

  const handleCommand = async (text) => {
    // A) MODE GATE (Strict Onboarding Logic)
    if (onboardingActive) {
      const lower = text.toLowerCase();
      console.log(`[ModeGate] active, pending: ${pendingModeChoice}, awaiting: ${awaitingModeConfirmation}, text: ${text}`);

      if (awaitingModeConfirmation) {
        if (isYes(text)) {
           // Commit Choice
           if (pendingModeChoice === 1) {
              const rules = "باهِي. اخترت لوحة المفاتيح. الان التنقّل يكون بالأزرار. استعمل الأرقام من 1 حتى 9 للاختيار. " + speakQuickMenu();
              speakText(rules, () => {
                 setInteractionMode('KEYBOARD');
                 setOnboardingActive(false);
                 setPendingModeChoice(null);
                 setAwaitingModeConfirmation(false);
                 stopListeningSafe(); // Explicitly stop
                 isExpectedListening.current = false; // Ensure auto-restart doesn't fire
              }, true); 
           } else if (pendingModeChoice === 2) {
              const confirmation = "باهِي. اخترت التنقّل بالصوت. من توّا أنا مرشدك الصوتي. وبعدها قولي شنوة تحب تعمل.";
              speakText(confirmation, () => {
                 setInteractionMode('VOICE');
                 setOnboardingActive(false);
                 setPendingModeChoice(null);
                 setAwaitingModeConfirmation(false);
                 if (!listeningRef.current) startListeningSafe();
              });
           }
           return;
        } else if (isNo(text)) {
           // Reset
           speakText("باهِي، نعاودو. اختار 1 لوحة المفاتيح، والا 2 للصوت.", () => {
              setPendingModeChoice(null);
              setAwaitingModeConfirmation(false);
              safePlayBeep();
              startListeningSafe();
           });
           return;
        } else {
           // Invalid input during confirmation
           speakText("اختار نعم أو لا.", () => {
              safePlayBeep();
              startListeningSafe();
           });
           return;
        }
      }

      // Selection Phase
      const isOne = lower.includes('1') || lower.includes('واحد') || lower.includes('one') || lower.includes('keyboard');
      const isTwo = lower.includes('2') || lower.includes('اثنين') || lower.includes('two') || lower.includes('voice');

      if (isOne) {
        speakText("اخترت 1: لوحة المفاتيح. اختار نعم أو لا.", () => {
          setPendingModeChoice(1);
          setAwaitingModeConfirmation(true);
          safePlayBeep();
          startListeningSafe();
        });
        return;
      }
      
      if (isTwo) {
        speakText("اخترت 2: الصوت. اختار نعم أو لا.", () => {
          setPendingModeChoice(2);
          setAwaitingModeConfirmation(true);
          safePlayBeep();
          startListeningSafe();
        });
        return;
      }
      
      return; // Ignore other inputs during onboarding
    }

    // B) Keyboard Mode
    if (interactionMode === 'KEYBOARD') {
      // In keyboard mode, we generally don't process voice commands unless manually triggered
    }

    // C) Voice Mode (or others)
    const handler = commandHandler || defaultCommandHandler;
    
    if (handler) {
      setLastSpokenText(text);
      try {
        await handler(text);
      } catch (err) {
        console.error("[VoiceContext] Handler failed:", err);
      }
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

    if (status === "granted") {
      // ✅ Always land on "/" before intro
      if (location.pathname !== "/") {
        navigate("/", { replace: true });
        // small delay to let route settle before speaking
        await new Promise((r) => setTimeout(r, 200));
      }

      const intro =
        "مرحبا بيك في منصة إبصار. " + "أنا مرشد، نرافقك بالصوت خطوة بخطوة.";

      const options =
        "الان عندك زوز اختيارات. " +
        "إذا تريد استعمال لوحة المفاتيح، اضغط على 1. " +
        "وإذا تحب ان تكمّل بالصوت، اختار 2. " +
        "استنّى الصوت وبعدها احكي.";

      // ✅ speak intro -> pause -> speak options -> beep -> listen
      speakText(
        intro,
        () => {
          setTimeout(() => {
            speakText(
              options,
              () => {
                safePlayBeep();
                startListeningSafe();
              },
              true,
            );
          }, 600); // ✅ pause between intro and options
        },
        true,
      );
    } else {
      setAutoStartBlocked(true);
    }
  };

  const requestPermissionManual = async () => {
    const status = await checkMicrophonePermission();
    setPermissionStatus(status);
    if (status === "granted") {
      setAutoStartBlocked(false);
      speakText("يعطيك الصحّة. نسمع فيك توّا.", () => {
        startListeningSafe();
      });
    } else {
      speakText("ما نجّمتش ناخذ إذن الميكروفون.");
    }
  };

  // Global Hotkeys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      if (e.code === "Space") {
        e.preventDefault();
        toggleListening();
        return;
      }
      if (e.code === "KeyR") {
        e.preventDefault();
        repeatLast();
        return;
      }

      // VOICE ONLY CONFIRMATION: Block keyboard during onboarding confirmation
      if (onboardingActive && awaitingModeConfirmation) return;

      // KEYBOARD MODE NAVIGATION (Global Router)
      if (interactionMode === 'KEYBOARD' && !onboardingActive) {
        const key = e.key;
        const item = QUICK_MENU.find(i => i.id.toString() === key);
        
        if (item) {
          e.preventDefault();
          if (key === '9') {
            speakText(speakQuickMenu());
          } else if (item.path) {
            const label = item.label;
            speakText(`باهِي. نمشيو ل${label}.`, () => {
              navigate(item.path);
            });
          }
          return; 
        }
      }

      if (e.key === '1') {
        handleCommand('1');
      } else if (e.key === '2') {
        handleCommand('2');
      } else if (e.key === 'Enter') {
         // Future global Enter handling
      } else if (e.key === 'Escape') {
         // Future global Escape handling
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleListening, repeatLast, interactionMode, location.pathname, awaitingModeConfirmation, pendingModeChoice, handleCommand, onboardingActive]);

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
    error, // Expose error to UI
    isMicrophoneAvailable, // Expose mic status
    browserSupportsSpeechRecognition, // Expose browser support
    toggleListening,
    speak: speakText,
    stopSpeaking,
    startListening: startListeningSafe, // Expose startListening
    stopListening: stopListeningSafe,
    repeatLast,
    setCommandHandler, // New API
    setDefaultCommandHandler, // For VoiceOperator
    permissionStatus,
    autoStartBlocked,
    requestPermissionManual,
    interactionMode,
    setInteractionMode,
    onboardingActive,
    setOnboardingActive,
    // Legacy support if components still use it (optional)
    registerPageHandler: (handler) => {
      setCommandHandler(() => handler);
      return () => setCommandHandler(null);
    },
  };

  return (
    <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>
  );
}
