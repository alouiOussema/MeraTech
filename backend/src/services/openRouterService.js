const axios = require('axios');

// --- Configuration ---
const PRIMARY_MODEL = 'google/gemma-3-12b-it:free';
const FALLBACK_MODEL = 'mistralai/mistral-7b-instruct:free';
const TIMEOUT_MS = 8000;

// --- Local NLU Configuration (Hybrid Fallback) ---
const INTENT_DEFINITIONS = {
    HOME: {
        action: 'NAVIGATE',
        route: '/',
        keywords: [
            'home', 'dar', 'accueil', 'الرئيسية', 'رجعني', 'بداية', 'main', 'menu', 'principal',
            'هزني للدار', 'ارجع', 'الصفحة الاولى', 'page d\'accueil'
        ],
        reply: "باهي، نرجعو للرئيسية"
    },
    LOGIN: {
        action: 'NAVIGATE',
        route: '/login',
        keywords: [
            'login', 'connexion', 'signin', 'دخول', 'نسجل دخول', 'log in', 'connecter', 'ندخل', 'connect',
            'compte', 'identifiant', 'تسجيل الدخول', 'ادخل'
        ],
        reply: "باهي، نمشيو لصفحة الدخول"
    },
    REGISTER: {
        action: 'NAVIGATE',
        route: '/register',
        keywords: [
            'register', 'signup', 'compte', 'حساب', 'تسجيل', 'nouveau', 'new', 'انشاء', 'create',
            'حل كونط', 'نعمل كونط', 'حساب جديد', 'inscrire', 'inscription'
        ],
        reply: "باهي، نعملو حساب جديد"
    },
    BANK: {
        action: 'NAVIGATE',
        route: '/bank',
        keywords: [
            'bank', 'banque', 'compte bancaire', 'بنك', 'البنك', 'rside', 'solde', 'flousi', 'argent',
            'هزني للبنك', 'الكونط', 'حسابي البنكي', 'el banka', 'lbanque'
        ],
        reply: "باهي، نمشيو للبنك"
    },
    PRODUCTS: {
        action: 'NAVIGATE',
        route: '/products',
        keywords: [
            'products', 'shopping', 'achats', 'market', 'قضية', 'تسوق', 'شراء', 'store', 'magasin',
            'marche', 'souk', 'السوق', 'المغازة', 'نقضي', 'na9dhi', 'نحب نشري', 'buy something', 'أريد أن أشتري'
        ],
        reply: "باهي، نمشيو للمنتجات"
    },
    BANK_TRANSFER: {
        action: 'API_CALL',
        route: '/api/bank/transfer',
        keywords: [
            'transfer', 'virement', 'verser', 'envoyer', 'hawel', 'baath', 'ab3ath', 'حول', 'إرسال', 'ابعث',
            'versilou', 'sablou', 'صب ل', 'بعث ل'
        ],
        reply: (slots) => `باهي، باش نحول ${slots.amount || 'فلوس'} لـ ${slots.toName || 'شخص'}`
    },
    ADD_ITEM: {
        action: 'API_CALL',
        route: '/api/cart/add',
        keywords: [
            'add', 'ajouter', 'zid', 'chri', 'achete', 'زيد', 'شري', 'اضافة', 'nheb',
            'hot', 'hott', 'jib', 'jeb', 'جيب', 'حط'
        ],
        reply: (slots) => `باهي، نزيدو ${slots.qty ? slots.qty + ' ' : ''}${slots.itemName || 'حاجة'}`
    },
    CHECK_PRICE: {
        action: 'API_CALL',
        route: '/api/products/price',
        keywords: [
            'price', 'prix', 'soum', 'kadech', 'combien', 'سوم', 'قداش', 'سعر',
            'b9adeh', 'bgadech', 'بقداش'
        ],
        reply: (slots) => `باهي، نشوفلك سوم ${slots.itemName || 'هذا'}`
    },
    GET_BALANCE: {
        action: 'API_CALL',
        route: '/api/bank/balance',
        keywords: [
            'balance', 'solde', 'flousi', 'rside', 'رصيدي', 'فلوسي', 'flouss',
            'kadech 3andi', 'solde mte3i', 'compte fih', 'الرصيد'
        ],
        reply: "باهي، نشوفلك الرصيد"
    },
    HELP: {
        action: 'UNKNOWN', // Or specific HELP action
        route: null,
        keywords: ['help', 'aide', '3aweni', 'musada', 'مساعدة', 'عاوني'],
        reply: "أنا هنا باش نعاونك. تنجم تقولي وين تحب تمشي ولا شنوة تحب تعمل"
    }
};

// --- Helper Functions ---

const normalizeText = (text) => {
    if (!text) return '';
    return text
        .toLowerCase()
        .trim()
        // Arabic Normalization
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[ًٌٍَُِّْ]/g, '') // Remove Tashkeel
        // Common Transliteration Normalization
        .replace(/3/g, 'a') // 3ayn -> a/e often
        .replace(/5/g, 'kh')
        .replace(/7/g, 'h')
        .replace(/9/g, 'k') // qaf
        .replace(/\s+/g, ' ');
};

const extractJSON = (text) => {
    try {
        // Try strict parse first
        return JSON.parse(text);
    } catch (e) {
        // Try to find JSON object in text
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                return JSON.parse(match[0]);
            } catch (e2) {
                return null;
            }
        }
        return null;
    }
};

// --- Main Service Logic ---

const parseIntentWithLLM = async (text) => {
    console.log(`[NLU] Input: "${text}"`);
    
    // 1. Try LLM
    try {
        const result = await callLLM(text);
        if (result) return result;
    } catch (error) {
        console.error(`[NLU] LLM Failed: ${error.message}`);
    }

    // 2. Fallback to Local Hybrid Logic
    console.log('[NLU] Falling back to robust local parsing...');
    return parseIntentLocal(text);
};

const callLLM = async (text, model = PRIMARY_MODEL, retry = true) => {
    try {
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: `You are an intelligent voice assistant for a Tunisian web app (Darja/French/English).
Analyze the user's speech and extract the intent, action, and entities strictly.

OUTPUT SCHEMA (JSON ONLY):
{
  "action": "NAVIGATE|FORM_FILL|API_CALL|UNKNOWN",
  "route": "string (e.g., /login, /register, /bank, /courses, /api/bank/transfer)",
  "intent": "HOME|LOGIN|REGISTER|BANK|COURSES|HELP|REPEAT|UNKNOWN|BANK_TRANSFER|ADD_ITEM|REMOVE_ITEM|CHECK_PRICE|GET_BALANCE|GET_TOTAL",
  "confidence": 0.0-1.0,
  "slots": {
    "fullName": "string|null",
    "voicePin": "string|null",
    "toName": "string|null (recipient for transfers)",
    "amount": number|null,
    "itemName": "string|null",
    "qty": number|null
  },
  "reply_darija": "Short, natural Tunisian Darja response confirming the action"
}

RULES:
- Infer meaning semantically (e.g., "nheb na3mel compte" -> REGISTER).
- "solde", "flousi" -> GET_BALANCE.
- "hawel 20 l sara" -> BANK_TRANSFER (amount: 20, toName: "sara").
- "zid hlib" -> ADD_ITEM (itemName: "hlib").
- If intent is unclear, use UNKNOWN.`
                    },
                    { role: 'user', content: text }
                ],
                temperature: 0.1,
                max_tokens: 200
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://esprit-hack.com',
                    'X-Title': 'Ibsar Accessibility'
                },
                timeout: TIMEOUT_MS
            }
        );

        const raw = response.data.choices[0].message.content;
        const json = extractJSON(raw);
        
        if (!json) {
            throw new Error('Invalid JSON received from LLM');
        }

        console.log(`[NLU] LLM Success (${model}):`, JSON.stringify(json));
        return json;

    } catch (error) {
        if (retry && model === PRIMARY_MODEL) {
            console.warn(`[NLU] Primary model failed, trying fallback (${FALLBACK_MODEL})...`);
            return callLLM(text, FALLBACK_MODEL, false);
        }
        throw error;
    }
};

const parseIntentLocal = (text) => {
    const normalized = normalizeText(text);
    console.log(`[LocalNLU] Normalized: "${normalized}"`);

    let bestMatch = {
        intent: 'UNKNOWN',
        score: 0,
        def: null
    };

    // 1. Fuzzy Keyword Matching
    for (const [intent, def] of Object.entries(INTENT_DEFINITIONS)) {
        let matchCount = 0;
        let wordMatch = false;

        // Check each keyword against the input
        for (const keyword of def.keywords) {
            const normKeyword = normalizeText(keyword);
            
            // Exact word match (word boundary)
            const regex = new RegExp(`(^|\\s)${normKeyword}($|\\s|[.,!?])`, 'i');
            if (regex.test(normalized)) {
                matchCount += 3; // High weight for exact word match
                wordMatch = true;
            } 
            // Partial match (substring) - lower weight
            else if (normalized.includes(normKeyword)) {
                matchCount += 1;
            }
        }

        if (matchCount > bestMatch.score) {
            bestMatch = { intent, score: matchCount, def };
        }
    }

    // 2. Entity Extraction (Heuristics)
    let slots = {
        amount: null,
        toName: null,
        itemName: null,
        qty: null
    };

    if (bestMatch.intent !== 'UNKNOWN' && bestMatch.score >= 1) { // Threshold
        // Extract Amount (Number)
        const amountMatch = normalized.match(/(\d+(\.\d+)?)/);
        if (amountMatch) slots.amount = parseFloat(amountMatch[0]);

        // Extract Recipient (after 'l' or 'ila' or 'for')
        // Patterns: "l sara", "ila ahmed", "for mohamed", "lsara" (attached lam)
        const recipientMatch = normalized.match(/(?:^|\s)(?:l|li|el|ila|for|pour|ل)\s*([a-z\u0600-\u06FF]+)/i);
        if (recipientMatch) slots.toName = recipientMatch[1];

        // Extract Item & Qty (for ADD_ITEM / CHECK_PRICE)
        if (['ADD_ITEM', 'CHECK_PRICE', 'COURSES'].includes(bestMatch.intent)) {
            // Remove intent keywords to find the "rest" of the sentence
            let cleanText = normalized;
            bestMatch.def.keywords.forEach(k => {
                cleanText = cleanText.replace(new RegExp(normalizeText(k), 'gi'), '');
            });
            
            // Remove common filler words
            cleanText = cleanText.replace(/\b(nheb|nhab|bghit|abghi|please|aman|bellehi)\b/g, '');
            
            // Check for quantity (e.g., "2 kg", "3 packet")
            const qtyMatch = cleanText.match(/(\d+)\s*(?:kg|kilo|packet|box|litres?)?/i);
            if (qtyMatch) {
                slots.qty = parseInt(qtyMatch[1]);
                cleanText = cleanText.replace(qtyMatch[0], ''); // Remove qty from item name
            }

            slots.itemName = cleanText.trim();
        }

        // Refine Action/Route based on intent
        let reply = bestMatch.def.reply;
        if (typeof reply === 'function') {
            reply = reply(slots);
        }

        return {
            action: bestMatch.def.action,
            route: bestMatch.def.route,
            intent: bestMatch.intent,
            confidence: bestMatch.score >= 3 ? 0.9 : 0.6,
            slots: slots,
            reply_darija: reply
        };
    }

    return {
        action: 'UNKNOWN',
        route: null,
        intent: 'UNKNOWN',
        confidence: 0,
        slots: {},
        reply_darija: "سامحني، ما فهمتكش. تحب دخول ولا تسجيل؟"
    };
};

module.exports = { parseIntentWithLLM };