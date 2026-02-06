const axios = require('axios');

const parseIntentWithLLM = async (text) => {
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'google/gemma-3-12b-it:free',
        messages: [
          {
            role: 'system',
            content: `You are an intent classifier for a voice-first accessibility web app.
The user speaks Tunisian Darja Arabic (may include French/English words).
Your output MUST be strict JSON with no markdown formatting.
JSON Schema:
{
  "intent": "HOME|LOGIN|REGISTER|BANK|COURSES|HELP|REPEAT|UNKNOWN",
  "confidence": 0.0-1.0,
  "entities": {
     "toName": string|null,
     "amount": number|null,
     "itemName": string|null,
     "qty": number|null
  },
  "reply_darija": "short Darja Arabic assistant sentence"
}

Rules:
- "الرئيسية", "home", "رجعني" -> HOME
- "دخول", "login", "connexion" -> LOGIN
- "تسجيل", "register", "compte" -> REGISTER
- "bank", "solde", "flous", "compte bancaire" -> BANK
- "courses", "shopping", "achats", "liste" -> COURSES
- "help", "aide", "3aweni" -> HELP
- "repeat", "3awed" -> REPEAT
- If unclear -> UNKNOWN (confidence < 0.5)

Examples:
User: "hezeni lel login page"
Output: {"intent": "LOGIN", "confidence": 0.95, "entities": {}, "reply_darija": "باهي، نمشيو لصفحة الدخول"}

User: "nheb nechri 2 kg batata"
Output: {"intent": "COURSES", "confidence": 0.9, "entities": {"itemName": "batata", "qty": 2}, "reply_darija": "زدنا 2 كيلو بطاطا للقائمة"}
`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.1,
        max_tokens: 150
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://esprit-hack.com',
          'X-Title': 'Ibsar Accessibility App'
        },
        timeout: 6000 // 6s timeout
      }
    );

    const rawContent = response.data.choices[0].message.content;
    // Attempt to clean markdown code blocks if present
    const cleanContent = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanContent);
  } catch (error) {
    console.error('LLM Intent Error:', error.message);
    return null;
  }
};

module.exports = { parseIntentWithLLM };