
let sharedAudioCtx = null;

export const playBeep = async () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;

    // Use shared context to respect user gesture unlock
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioContext();
    }

    // Always try to resume if suspended (common in browsers until gesture)
    if (sharedAudioCtx.state === 'suspended') {
      try {
        await sharedAudioCtx.resume();
        console.log('[Audio] Context resumed successfully');
      } catch (e) {
        console.warn('[Audio] Failed to resume context (waiting for gesture):', e);
        return false;
      }
    }

    // Double check state
    if (sharedAudioCtx.state === 'suspended') {
       return false;
    }

    const osc = sharedAudioCtx.createOscillator();
    const gain = sharedAudioCtx.createGain();

    osc.connect(gain);
    gain.connect(sharedAudioCtx.destination);

    osc.type = 'sine';
    osc.frequency.value = 880; // A5
    gain.gain.value = 0.1;

    osc.start();
    console.log('[Audio] Beep started');
    
    setTimeout(() => {
      osc.stop();
      // Do not close shared context
      console.log('[Audio] Beep stopped');
    }, 200);

    return true;
  } catch (err) {
    if (err.message && err.message.includes('Receiving end does not exist')) {
       console.warn('[Audio] Extension error detected (safe to ignore):', err);
    } else {
       console.error('[Audio] Beep failed:', err);
    }
    return false;
  }
};
