
// Arabic Normalization & Number Extraction Helper

// Arabic Number Words Mapping (0-9)
// Keys must be normalized (alef->a, teh marbuta->ha, yeh->ya)
const ARABIC_WORD_TO_DIGIT = {
  // 0
  'صفر': 0, 'زيرو': 0, 'والو': 0, 'zero': 0,
  // 1
  'واحد': 1, 'واحده': 1, 'لاول': 1, 'الاول': 1, 'اول': 1, 'one': 1,
  // 2
  'اثنين': 2, 'ثنين': 2, 'ثاني': 2, 'الثاني': 2, 'زوج': 2, 'two': 2, 'to': 2,
  // 3
  'ثلاثة': 3, 'ثلاثه': 3, 'تلاثة': 3, 'تلاثه': 3, 'ثالث': 3, 'الثالث': 3, 'تلاث': 3, 'three': 3,
  // 4
  'اربعة': 4, 'اربعه': 4, 'رابع': 4, 'الرابع': 4, 'four': 4, 'for': 4,
  // 5
  'خمسة': 5, 'خمسه': 5, 'خامس': 5, 'الخامس': 5, 'five': 5,
  // 6
  'ستة': 6, 'سته': 6, 'سادس': 6, 'السادس': 6, 'six': 6,
  // 7
  'سبعة': 7, 'سبعه': 7, 'سابع': 7, 'السابع': 7, 'seven': 7,
  // 8
  'ثمانية': 8, 'ثمانيه': 8, 'ثامن': 8, 'الثامن': 8, 'تمنية': 8, 'تمنيه': 8, 'eight': 8,
  // 9
  'تسعة': 9, 'تسعه': 9, 'تاسع': 9, 'التاسع': 9, 'nine': 9
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
    .toLowerCase() // Handle English chars
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ') // Replace punctuation with space
    .replace(/[.,،؟?!]/g, ' ') // Explicitly handle common punctuation just in case
    .replace(/[\u064B-\u065F]/g, '') // Remove diacritics
    .replace(/[أإآ]/g, 'ا') // Normalize Alef
    .replace(/[ى]/g, 'ي') // Normalize Yeh
    .replace(/[ة]/g, 'ه') // Normalize Teh Marbuta
    .replace(/\s+/g, ' ') // Collapse spaces
    .trim();
};

export const isYes = (text) => {
  const t = normalizeArabic(text);
  // Match common yes words
  // Includes: naam, ay, ey, oui, yes, tamam, mwafaq, bahi, ok
  return /(?:^|\s)(نعم|اي|ايه|إي|صحيح|موافق|باهي|باهِي|تمام|ok|yes|oui|ah|y|ye)(?:\s|$)/i.test(t);
};

export const isNo = (text) => {
  const t = normalizeArabic(text);
  // Match common no words
  // Includes: la, non, no, mosh, manich
  return /(?:^|\s)(لا|للا|لي|غلط|مش|موش|مانيش|no|non|n)(?:\s|$)/i.test(t);
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
    if (ARABIC_WORD_TO_DIGIT.hasOwnProperty(token)) {
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
 * CANONICAL FUNCTION: Parse a choice number (0-9) from text.
 * Returns the FIRST valid number found.
 * @param {string} text 
 * @returns {number|null} Integer 0-9 or null
 */
export const parseChoiceNumber = (text) => {
  const nums = extractNumbers(text);
  // Return first number that is between 0 and 9
  const valid = nums.find(n => n >= 0 && n <= 9);
  return valid !== undefined ? valid : null;
};

/**
 * Legacy wrapper for backward compatibility if needed, 
 * but better to replace usages with parseChoiceNumber.
 */
export const parseSingleMenuChoice = (text) => {
  const n = parseChoiceNumber(text);
  // Original only allowed 1-9? User request says 0 is allowed now for Back.
  // We will allow 0-9 here too to be safe.
  return n; 
};
