// Voice Synthesis (TTS) and Recognition (STT) Utilities

// Diagnostic Logger
export const log = (type, message, data = null) => {
  const timestamp = new Date().toLocaleTimeString();
  const style = type === 'error' ? 'background: #fee; color: #c00' : 'background: #e6f7ff; color: #0066cc';
  console.log(`%c[Voice:${type.toUpperCase()}] ${timestamp} - ${message}`, style, data || '');
};

export const speak = (text, onEnd, onError) => {
  if (!window.speechSynthesis) {
    log('error', "Speech Synthesis not supported");
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Try to find an Arabic voice
  const voices = window.speechSynthesis.getVoices();
  
  // 1. Look for "Google" Arabic voices (usually high quality)
  // 2. Look for any voice starting with "ar"
  const arabicVoice = voices.find(v => v.lang.includes('ar') && v.name.includes('Google')) || 
                      voices.find(v => v.lang.includes('ar'));
  
  if (arabicVoice) {
    utterance.voice = arabicVoice;
    // Keep the voice's native language if possible, otherwise force SA
    utterance.lang = arabicVoice.lang; 
  } else {
    // Fallback if no specific voice object found, hope the browser engine handles the locale
    utterance.lang = 'ar-SA'; 
  }

  // Force ar-SA if the selected voice is generic, as ar-TN TTS is very rare
  if (!utterance.voice || !utterance.voice.lang.includes('TN')) {
     utterance.lang = 'ar-SA';
  }

  utterance.rate = 1.0; // Slightly faster for standard Arabic
  utterance.pitch = 1;

  utterance.onstart = () => log('info', `Speaking: "${text}"`);
  
  utterance.onend = () => {
    log('info', "Finished speaking");
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    log('error', "TTS Error", e);
    if (e.error === 'not-allowed' && onError) {
        onError(e);
    } else {
        // For other errors, just proceed to avoid getting stuck
        if (onEnd) onEnd();
    }
  };

  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    log('info', "Stopped speaking manually");
  }
};

export const checkMicrophonePermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop the stream immediately, we just wanted to ask/check permission
    stream.getTracks().forEach(track => track.stop());
    log('info', "Microphone permission confirmed");
    return 'granted';
  } catch (error) {
    log('error', "Mic permission denied/error", error);
    return 'denied';
  }
};

// Speech Recognition (STT)
export const startListening = async (onResult, onError, onEnd, options = {}) => {
  // Deprecated: VoiceContext now uses react-speech-recognition
  log('warn', "voice.js startListening is deprecated. Use VoiceContext instead.");
  return null;
};
