import axios from 'axios';

// Simple Intent Router for Tunisian Darja
export const INTENTS = {
  HOME: 'HOME',
  LOGIN: 'LOGIN',
  REGISTER: 'REGISTER',
  BANK: 'BANK',
  COURSES: 'COURSES',
  HELP: 'HELP',
  REPEAT: 'REPEAT',
  UNKNOWN: 'UNKNOWN'
};

// Local Rule-Based Parsing (Fallback & Fast Path)
export const parseIntentLocal = (text) => {
  if (!text) return { intent: INTENTS.UNKNOWN, confidence: 0 };
  
  const normalized = text.toLowerCase().trim();

  // Home/Landing Rules
  if (
    normalized.includes('الرئيسية') || 
    normalized.includes('الرئيسيه') || 
    normalized.includes('home') || 
    normalized.includes('البداية') ||
    normalized.includes('رجعني') ||
    normalized.includes('main') ||
    normalized.includes('أرجع') ||
    normalized.includes('الدار') ||
    normalized.includes('رجوع') ||
    normalized.includes('أول') ||
    normalized.includes('واجهة') ||
    normalized.includes('واجهه')
  ) {
    return { intent: INTENTS.HOME, confidence: 0.9 };
  }

  // Login Rules
  if (
    normalized.includes('دخول') || 
    normalized.includes('ندخل') || 
    normalized.includes('login') ||
    normalized.includes('log in') ||
    normalized.includes('sign in') ||
    normalized.includes('connexion') ||
    normalized.includes('لوجين') ||
    normalized.includes('لوقين') ||
    normalized.includes('الولوج')
  ) {
    return { intent: INTENTS.LOGIN, confidence: 0.9 };
  }

  // Register Rules
  if (
    normalized.includes('تسجيل') || 
    normalized.includes('نسجّل') || 
    normalized.includes('register') ||
    normalized.includes('حساب جديد')
  ) {
    return { intent: INTENTS.REGISTER, confidence: 0.9 };
  }

  // Bank Rules
  if (
    normalized.includes('البنك') || 
    normalized.includes('bank') || 
    normalized.includes('رصيدي') ||
    normalized.includes('فلوس')
  ) {
    return { intent: INTENTS.BANK, confidence: 0.8 };
  }

  // Courses Rules
  if (
    normalized.includes('قْوْرْسَة') || 
    normalized.includes('قضية') || 
    normalized.includes('شراء') ||
    normalized.includes('shopping') ||
    normalized.includes('courses')
  ) {
    return { intent: INTENTS.COURSES, confidence: 0.8 };
  }

  // Help Rules
  if (
    normalized.includes('مساعدة') || 
    normalized.includes('عاوني') || 
    normalized.includes('شنوة نعمل') ||
    normalized.includes('الإعدادات') ||
    normalized.includes('help')
  ) {
    return { intent: INTENTS.HELP, confidence: 0.9 };
  }

  // Repeat Rules
  if (
    normalized.includes('عاود') || 
    normalized.includes('repeat') ||
    normalized.includes('ما سمعتش')
  ) {
    return { intent: INTENTS.REPEAT, confidence: 0.9 };
  }

  return { intent: INTENTS.UNKNOWN, confidence: 0 };
};

// Hybrid Parsing: Rules first, then LLM
export const parseIntent = async (text) => {
    // 1. Try Local Rules First (Fast)
    const localResult = parseIntentLocal(text);
    
    // If high confidence, return immediately
    if (localResult.confidence >= 0.8) {
        console.log(`[Intent] Local Match: ${localResult.intent} (${localResult.confidence})`);
        return localResult;
    }

    // 2. If unclear, call Backend LLM (Slow but Smart)
    try {
        console.log(`[Intent] Calling LLM for: "${text}"`);
        const response = await axios.post('http://localhost:4000/api/nlu/intent', { text });
        
        if (response.data && response.data.intent) {
             console.log(`[Intent] LLM Match: ${response.data.intent} (${response.data.confidence})`);
             return {
                 intent: response.data.intent,
                 confidence: response.data.confidence || 0.7,
                 reply: response.data.reply_darija // Optional: use this for TTS response
             };
        }
    } catch (error) {
        console.error("[Intent] LLM Call Failed:", error);
    }

    // 3. Fallback to local result if LLM fails
    return localResult;
};
