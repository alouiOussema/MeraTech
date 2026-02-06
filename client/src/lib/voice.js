// Voice Synthesis (TTS) and Recognition (STT) Utilities

export const speak = (text, onEnd) => {
  if (!window.speechSynthesis) {
    console.error("Speech Synthesis not supported");
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  // Try to find an Arabic voice
  const voices = window.speechSynthesis.getVoices();
  const arabicVoice = voices.find(v => v.lang.includes('ar'));
  
  if (arabicVoice) {
    utterance.voice = arabicVoice;
  }
  
  utterance.lang = 'ar-TN'; // Tunisian Arabic if available, else Arabic
  utterance.rate = 0.9; // Slightly slower for clarity
  utterance.pitch = 1;

  if (onEnd) {
    utterance.onend = onEnd;
  }

  console.log(`[Voice] Speaking: "${text}"`);
  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

export const checkMicrophonePermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop the stream immediately, we just wanted to ask for permission
    stream.getTracks().forEach(track => track.stop());
    return 'granted';
  } catch (error) {
    console.error("[Voice] Mic permission denied/error:", error);
    return 'denied';
  }
};

// Speech Recognition (STT)
export const startListening = (onResult, onError, onEnd, options = {}) => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    console.error("Speech Recognition not supported");
    if (onError) onError("المتصفح هذا ما يدعمش الصوت");
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'ar-TN'; 
  recognition.continuous = options.continuous !== undefined ? options.continuous : true;
  recognition.interimResults = options.interimResults !== undefined ? options.interimResults : true;

  recognition.onresult = (event) => {
    // With continuous=true, we might get multiple results.
    // We are interested in the latest final result or the interim result.
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    if (finalTranscript) {
      console.log("[Voice] Final Transcript:", finalTranscript);
      if (onResult) onResult(finalTranscript, true); // true = isFinal
    } else if (interimTranscript) {
      // console.log("[Voice] Interim:", interimTranscript);
      if (onResult) onResult(interimTranscript, false); // false = isFinal
    }
  };

  recognition.onerror = (event) => {
    // Ignore "no-speech" errors in continuous mode usually, but good to log
    if (event.error === 'no-speech') {
       // console.log("[Voice] No speech detected (normal in continuous)");
       return; 
    }
    console.error("[Voice] Speech recognition error", event.error);
    if (onError) onError(event.error);
  };

  recognition.onstart = () => {
    console.log("[Voice] Recognition started");
  };

  recognition.onend = () => {
    console.log("[Voice] Recognition ended");
    if (onEnd) onEnd();
  };

  try {
    recognition.start();
    console.log("[Voice] recognition.start() called");
    return recognition;
  } catch (e) {
    console.error("[Voice] Error starting recognition", e);
    return null;
  }
};
