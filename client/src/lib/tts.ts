interface PlayAudioOptions {
  voiceId?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
  lang?: string;
}

/**
 * Play text as speech using browser native SpeechSynthesis.
 */
export const playAudio = (text: string, options: PlayAudioOptions = {}) => {
  // Stop any currently playing audio
  stopAudio();

  if (!text) return;

  if (!window.speechSynthesis) {
    console.warn("SpeechSynthesis is not supported in this browser.");
    if (options.onError) options.onError(new Error("SpeechSynthesis not supported"));
    if (options.onEnd) options.onEnd(); // Ensure flow continues
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Default to Arabic (Tunisia) or fallback to generic Arabic
  utterance.lang = options.lang || 'ar-TN';
  
  // Optional: You could allow selecting voices here if needed
  // const voices = window.speechSynthesis.getVoices();
  // utterance.voice = voices.find(v => ...) || null;

  utterance.onstart = () => {
    if (options.onStart) options.onStart();
  };

  utterance.onend = () => {
    if (options.onEnd) options.onEnd();
  };

  utterance.onerror = (e) => {
    console.error("Browser TTS Error:", e);
    // Note: onend might not be called on error in some browsers, so we call onError
    if (options.onError) options.onError(e);
  };

  window.speechSynthesis.speak(utterance);
};

/**
 * Stop currently playing audio.
 */
export const stopAudio = () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Check if audio is currently playing.
 */
export const isAudioPlaying = () => {
  return window.speechSynthesis ? window.speechSynthesis.speaking : false;
};
