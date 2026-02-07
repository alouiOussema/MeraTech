
// Arabic Normalization & Number Extraction Helper

// Arabic Number Words Mapping (1-9)
// Keys must be normalized (alef->a, teh marbuta->ha, yeh->ya)
const ARABIC_WORD_TO_DIGIT = {
  // 1
  'واحد': 1, 'واحده': 1, 'لاول': 1, 'الاول': 1, 'اول': 1,
  // 2
  'اثنين': 2, 'ثنين': 2, 'ثاني': 2, 'الثاني': 2, 'زوج': 2,
  // 3
  'ثلاثة': 3, 'ثلاثه': 3, 'تلاثة': 3, 'تلاثه': 3, 'ثالث': 3, 'الثالث': 3, 'تلاث': 3,
  // 4
  'اربعة': 4, 'اربعه': 4, 'رابع': 4, 'الرابع': 4,
  // 5
  'خمسة': 5, 'خمسه': 5, 'خامس': 5, 'الخامس': 5,
  // 6
  'ستة': 6, 'سته': 6, 'سادس': 6, 'السادس': 6,
  // 7
  'سبعة': 7, 'سبعه': 7, 'سابع': 7, 'السابع': 7,
  // 8
  'ثمانية': 8, 'ثمانيه': 8, 'ثامن': 8, 'الثامن': 8, 'تمنية': 8, 'تمنيه': 8,
  // 9
  'تسعة': 9, 'تسعه': 9, 'تاسع': 9, 'التاسع': 9
};

const INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/**
 * Normalize Arabic text:
 * - Remove diacritics
 * - Normalize Alef (أ -> ا)
 * - Normalize Yeh (ى -> ي)
 * - Normalize Teh Marbuta (ة -> ه)
 * - Collapse multiple spaces
 */
export const normalizeArabic = (text) => {
  if (!text) return '';
  return text
    .replace(/[^\w\s\u0600-\u06FF]/g, '') // Remove punctuation (keep arabic chars, digits, spaces)
    .replace(/[\u064B-\u065F]/g, '') // Remove diacritics
    .replace(/[أإآ]/g, 'ا') // Normalize Alef
    .replace(/ى/g, 'ي') // Normalize Yeh
    .replace(/ة/g, 'ه') // Normalize Teh Marbuta
    .replace(/\s+/g, ' ') // Collapse spaces
    .trim();
};

export const isYes = (text) => {
  const t = normalizeArabic(text);
  // Match common yes words, allowing for surrounding text
  return /\b(نعم|اي|ايه|صحيح|موافق|باهي|ok|yes|oui|ah|y|ye)\b/i.test(t);
};

export const isNo = (text) => {
  const t = normalizeArabic(text);
  // Match common no words, allowing for surrounding text
  return /\b(لا|للا|غلط|no|non|n)\b/i.test(t);
};

/**
 * Extract an ordered array of numbers from text.
 * Handles Western digits, Arabic-Indic digits, and Arabic words.
 * @param {string} text 
 * @returns {number[]} Array of found numbers e.g. [3, 3]
 */
export const extractNumbers = (text) => {
  const normalized = normalizeArabic(text);
  const tokens = normalized.split(' ');
  const foundNumbers = [];

  for (const token of tokens) {
    // 1. Check for Western digits
    const digitMatch = token.match(/\d+/);
    if (digitMatch) {
      foundNumbers.push(parseInt(digitMatch[0], 10));
      continue;
    }

    // 2. Check for Arabic-Indic digits
    let indicVal = -1;
    for (let i = 0; i < 10; i++) {
      if (token.includes(INDIC_DIGITS[i])) {
        indicVal = i;
        break;
      }
    }
    if (indicVal !== -1) {
      foundNumbers.push(indicVal);
      continue;
    }

    // 3. Check for words
    // We try to match the token against keys in our map
    // The map keys are already somewhat normalized, but let's normalize the token fully
    // We iterate the map because the token might be "رقم ثلاثة" -> we split by space earlier so "ثلاثة" is token
    if (ARABIC_WORD_TO_DIGIT[token]) {
      foundNumbers.push(ARABIC_WORD_TO_DIGIT[token]);
    }
  }

  return foundNumbers;
};

/**
 * Detect Global Double Shortcuts.
 * Returns action type and optional target/payload.
 * @param {number[]} numbers 
 * @returns {{ type: string, target?: string } | null}
 */
export const detectDoubleShortcut = (numbers) => {
  if (numbers.length < 2) return null;

  // We look for any consecutive pair or just existence of two same numbers?
  // "Transcript contains the same number twice in the same utterance"
  // Implies "3 3" or "I want 3 and 3". Let's look for consecutive pair or just counts.
  // The prompt examples: "3 3", "ثلاثة ثلاثة".
  // Let's go with consecutive pair for stricter intent, or just checking if array is [x, x].
  // Assuming short commands, [x, x] is likely. But "Go to 3 and 3" -> [3, 3].
  
  for (let i = 0; i < numbers.length - 1; i++) {
    if (numbers[i] === numbers[i+1]) {
      const val = numbers[i];
      switch (val) {
        case 1: return { type: 'NAVIGATE', target: '/' }; // Double 1
        case 2: return { type: 'GO_BACK' }; // Double 2
        case 3: return { type: 'NAVIGATE', target: '/banque' }; // Double 3
        case 4: return { type: 'NAVIGATE', target: '/products' }; // Double 4
        case 5: return { type: 'REPEAT' }; // Double 5
        case 6: return { type: 'HELP' }; // Double 6
        default: return { type: 'HELP' }; // Other doubles -> Help
      }
    }
  }
  return null;
};

/**
 * Parse a single menu choice (1-9).
 * Returns number if exactly one valid number is found (or first one if multiple? usually one).
 * @param {string} text 
 * @returns {number|null}
 */
export const parseSingleMenuChoice = (text) => {
  const nums = extractNumbers(text);
  // If we have numbers, return the first valid 1-9
  const valid = nums.find(n => n >= 1 && n <= 9);
  return valid || null;
};
