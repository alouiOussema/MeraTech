import { extractNumbers, detectDoubleShortcut, normalizeArabic } from './numberParser';

/**
 * Parses voice text into an intent/action.
 * @param {string} text 
 * @returns {object} { type, payload?, confidence }
 */
export const parseVoiceCommand = (text) => {
  if (!text) return { type: 'NO_MATCH' };

  const normalized = normalizeArabic(text);
  const numbers = extractNumbers(text);

  // 1. Double Shortcuts (High Priority)
  const doubleAction = detectDoubleShortcut(numbers);
  if (doubleAction) {
    return { ...doubleAction, confidence: 1.0 };
  }

  // 2. Single Menu Choice (1-9)
  // We look for a single number in the range 1-9
  // If multiple numbers, we might be confused, but let's take the first valid one
  const validNum = numbers.find(n => n >= 1 && n <= 9);
  if (validNum !== undefined) {
    return { type: 'SELECT_OPTION', payload: validNum, confidence: 0.9 };
  }

  // 3. Keyword Matching (Fallback)
  if (normalized.includes('رئيسيه') || normalized.includes('home')) {
    return { type: 'NAVIGATE', payload: '/', confidence: 0.8 };
  }
  if (normalized.includes('رجوع') || normalized.includes('back')) {
    return { type: 'GO_BACK', confidence: 0.8 };
  }
  if (normalized.includes('مساعده') || normalized.includes('help')) {
    return { type: 'HELP', confidence: 0.8 };
  }
  if (normalized.includes('عاود') || normalized.includes('repeat')) {
    return { type: 'REPEAT', confidence: 0.8 };
  }

  return { type: 'NO_MATCH' };
};

/**
 * Parses keyboard events into an intent/action.
 * @param {KeyboardEvent} event 
 * @returns {object|null} { type, payload? } or null if not a command key
 */
export const parseKeyboardCommand = (event) => {
  // Ignore if typing in an input
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    return null;
  }

  const key = event.key.toLowerCase();

  // 1. Menu Selection (1-9)
  if (/^[1-9]$/.test(key)) {
    return { type: 'SELECT_OPTION', payload: parseInt(key, 10) };
  }

  // 2. Shortcuts
  switch (key) {
    case 'h': return { type: 'NAVIGATE', payload: '/' };
    case 'b': return { type: 'NAVIGATE', payload: '/banque' }; // 'b' for Banque
    case 'p': return { type: 'NAVIGATE', payload: '/products' };
    case 'r': return { type: 'REPEAT' };
    case '?': return { type: 'HELP' };
    case 'backspace': return { type: 'GO_BACK' };
    case 'escape': return { type: 'GO_BACK' }; // Common pattern
    case ' ': return { type: 'TOGGLE_LISTENING' }; // Space to toggle mic
    default: return null;
  }
};
