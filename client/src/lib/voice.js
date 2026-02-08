// Voice Synthesis (TTS) and Recognition (STT) Utilities

// Diagnostic Logger
export const log = (type, message, data = null) => {
  const timestamp = new Date().toLocaleTimeString();
  const style =
    type === "error"
      ? "background: #fee; color: #c00"
      : "background: #e6f7ff; color: #0066cc";
  console.log(
    `%c[Voice:${type.toUpperCase()}] ${timestamp} - ${message}`,
    style,
    data || "",
  );
};

export const normalizeTTS = (text) => {
  if (!text) return "";
  
  // 1. Log before
  const original = text;
  
  let normalized = text
    .replace(/المريقل/g, "تمام")
    .replace(/توا/g, "الآن")
    .replace(/باهي/g, "باهِي");

  // 2. Fix Phrasing Order (Problem 1)
  // Replace variants of "باهي بينا هيا" to "باهي هيا بينا"
  if (normalized.includes("بينا هيا") || normalized.includes("باهِي. بينا") || normalized.includes("باهِي بينا")) {
     normalized = normalized
       .replace(/باهِي\. بينا هيا/g, "باهِي. هيا بينا")
       .replace(/باهِي بينا هيا/g, "باهِي. هيا بينا")
       .replace(/بينا هيا/g, "هيا بينا")
       .replace(/باهِي\. بينا/g, "باهِي. هيا بينا");
  }

  // 3. Fix Arabic Article "لالـ" -> "للـ" for known routes
  const routeFixes = [
    { wrong: "لالدخول", right: "للدخول" },
    { wrong: "لالتسجيل", right: "للتسجيل" },
    { wrong: "لالمنتجات", right: "للمنتجات" },
    { wrong: "لالبنك", right: "للبنك" },
    { wrong: "لالإعدادات", right: "للإعدادات" }
  ];

  routeFixes.forEach(fix => {
    if (normalized.includes(fix.wrong)) {
      normalized = normalized.replace(new RegExp(fix.wrong, 'g'), fix.right);
    }
  });

  // Log if changed
  if (normalized !== original) {
    log("info", `[TTS] normalized: "${original}" -> "${normalized}"`);
  }

  return normalized;
};

export const speak = (text, onEnd, onError, customRate = null) => {
  if (!window.speechSynthesis) {
    log("error", "Speech Synthesis not supported");
    return;
  }

  // Global Normalization
  const cleanText = normalizeTTS(text);

  const doSpeak = () => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice =
      voices.find(
        (v) => v.lang.includes("ar") && v.name.toLowerCase().includes("google"),
      ) ||
      voices.find(
        (v) => v.lang.includes("ar") && v.name.toLowerCase().includes("hoda"),
      ) ||
      voices.find(
        (v) => v.lang.includes("ar") && v.name.toLowerCase().includes("naayf"),
      ) ||
      voices.find(
        (v) =>
          v.lang.includes("ar") && v.name.toLowerCase().includes("microsoft"),
      ) || // Generic Microsoft
      voices.find((v) => v.lang.includes("ar")); 

    if (arabicVoice) {
      utterance.voice = arabicVoice;
      utterance.lang = arabicVoice.lang;
      log("info", `Selected Voice: ${arabicVoice.name} (${arabicVoice.lang})`);
    } else {
      utterance.lang = "ar-TN";
      log("warn", "No specific Arabic voice found. Using default ar-TN.");
    }

    // Rate optimized for naturalness (0.9 is better than 0.85 for modern voices)
    utterance.rate = customRate !== null ? customRate : 0.9;
    utterance.pitch = 1;

    utterance.onstart = () => log("info", `Speaking: "${cleanText}"`);

    utterance.onend = () => {
      log("info", "Finished speaking");
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      // Ignore benign errors caused by canceling speech
      if (e.error === "interrupted" || e.error === "canceled") {
        log("info", `TTS Interrupted (${e.error})`);
        return;
      }

      log("error", "TTS Error", e);
      if (e.error === "not-allowed" && onError) {
        onError(e);
      } else {
        // For other errors, just proceed to avoid getting stuck
        if (onEnd) onEnd();
      }
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      log("error", "SpeechSynthesis.speak failed", err);
      if (onEnd) onEnd();
    }
  };

  // If voices are not loaded yet, wait for them
  if (window.speechSynthesis.getVoices().length === 0) {
    log("info", "Voices not loaded yet, waiting for voiceschanged event...");
    const voicesChangedHandler = () => {
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        voicesChangedHandler,
      );
      doSpeak();
    };
    window.speechSynthesis.addEventListener(
      "voiceschanged",
      voicesChangedHandler,
    );

    // Fallback if event never fires (timeout after 1s)
    setTimeout(() => {
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        voicesChangedHandler,
      );
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending)
        return; // Already started
      // If still no voices, try anyway
      doSpeak();
    }, 1000);
  } else {
    doSpeak();
  }
};

export const stopSpeaking = () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    log("info", "Stopped speaking manually");
  }
};

export const checkMicrophonePermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop the stream immediately, we just wanted to ask/check permission
    stream.getTracks().forEach((track) => track.stop());
    log("info", "Microphone permission confirmed");
    return "granted";
  } catch (error) {
    log("error", "Mic permission denied/error", error);
    return "denied";
  }
};

// Speech Recognition (STT)
export const startListening = async (
  onResult,
  onError,
  onEnd,
  options = {},
) => {
  // Deprecated: VoiceContext now uses react-speech-recognition
  log(
    "warn",
    "voice.js startListening is deprecated. Use VoiceContext instead.",
  );
  return null;
};
