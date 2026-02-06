// Simple Intent Router for Tunisian Darja

export const INTENTS = {
  LOGIN: 'LOGIN',
  REGISTER: 'REGISTER',
  BANK: 'BANK',
  COURSES: 'COURSES',
  HELP: 'HELP',
  REPEAT: 'REPEAT',
  UNKNOWN: 'UNKNOWN'
};

export const parseIntent = (text) => {
  if (!text) return { intent: INTENTS.UNKNOWN, confidence: 0 };
  
  const normalized = text.toLowerCase().trim();

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
