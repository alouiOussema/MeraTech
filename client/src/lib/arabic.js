export const normalizeArabic = (text) => {
  if (!text) return '';
  return text
    .replace(/[ًٌٍَُِّْ]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/گ/g, 'ك')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

export const extractChoiceNumber = (text) => {
  if (!text) return null;
  let normalized = normalizeArabic(text);

  const arabicIndicMap = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
  };
  
  for (const [digit, western] of Object.entries(arabicIndicMap)) {
    normalized = normalized.split(digit).join(western);
  }

  const westernDigits = normalized.match(/\d+/);
  if (westernDigits) return parseInt(westernDigits[0], 10);

  const numberWords = {
    1: ['واحد', 'للول', 'الاول', 'رقم واحد', 'one', 'واحِد'],
    2: ['اثنين', 'ثنين', 'ثاني', 'الثاني', 'رقم اثنين', 'two', 'إثنان', 'اثنان'],
    3: ['ثلاثة', 'ثلاثه', 'تلاثة', 'ثالث', 'three', 'ثلاث'],
    4: ['اربعة', 'ربعة', 'رابع', 'four', 'أربعة'],
    5: ['خمسة', 'خمس', 'خامس', 'five'],
    6: ['ستة', 'سته', 'سات', 'six'],
    7: ['سبعة', 'سبعه', 'سابع', 'seven'],
    8: ['ثمانية', 'ثمنية', 'ثامن', 'eight'],
    9: ['تسعة', 'تسعه', 'تاسع', 'nine'],
    10: ['عشرة', 'عشره', 'ten']
  };

  for (const [num, words] of Object.entries(numberWords)) {
    if (words.some(w => normalized.includes(w))) {
      return parseInt(num, 10);
    }
  }

  return null;
};

export const productMatchScoring = (query, productName) => {
  if (!query || !productName) return 0;
  
  const normQuery = normalizeArabic(query);
  const normName = normalizeArabic(productName);

  if (normName.includes(normQuery)) return 1;

  const queryTokens = normQuery.split(' ');
  const nameTokens = normName.split(' ');
  
  let matches = 0;
  queryTokens.forEach(token => {
    if (nameTokens.some(t => t.includes(token))) matches++;
  });

  return matches / queryTokens.length;
};

export const INTENTS = {
  FILTER: 'FILTER',
  ADD_CART: 'ADD_CART',
  SEARCH: 'SEARCH',
  CHECKOUT: 'CHECKOUT',
  UNKNOWN: 'UNKNOWN'
};

export const detectIntent = (text) => {
  const norm = normalizeArabic(text);
  
  // Filter / Show / Fetch
  if (norm.match(/(وريني|نحب نشوف|اعطيني|جبلي|شوف|filter|show|fetch|get)/)) {
    return { type: INTENTS.FILTER, text: norm };
  }
  
  // Add to cart
  if (norm.match(/(زيد|حط|اشري|add|buy)/)) {
    return { type: INTENTS.ADD_CART, text: norm };
  }
  
  // Search
  if (norm.match(/(لوج|بحث|find|search|look for)/)) {
    return { type: INTENTS.SEARCH, text: norm };
  }

  return { type: INTENTS.UNKNOWN, text: norm };
};

export const findCategory = (text, categories) => {
  const norm = normalizeArabic(text);
  // Simple keyword mapping
  const mappings = {
    'ماكلة': 'مواد غذائية',
    'طعام': 'مواد غذائية',
    'غذائية': 'مواد غذائية',
    'لبسة': 'ملابس تقليدية',
    'حوايج': 'ملابس تقليدية',
    'ملابس': 'ملابس تقليدية',
    'صناعة': 'صناعات تقليدية',
    'تقليدية': 'صناعات تقليدية',
    'أثاث': 'أثاث وديكور',
    'ديكور': 'أثاث وديكور',
    'فرش': 'أثاث وديكور',
    'عناية': 'عناية شخصية',
    'ماكياج': 'عناية شخصية',
    'طبيعي': 'عناية شخصية', 
    'بيو': 'مواد غذائية',
    'ماعون': 'أواني منزلية',
    'أواني': 'أواني منزلية'
  };
  
  // Check exact category names
  for (const cat of categories) {
    if (norm.includes(normalizeArabic(cat))) return cat;
  }
  
  // Check mappings
  for (const [key, cat] of Object.entries(mappings)) {
    if (norm.includes(key)) return cat;
  }
  
  return null;
};
