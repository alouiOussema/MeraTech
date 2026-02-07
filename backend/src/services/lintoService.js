const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load the local "Model" (JSON database)
const MODEL_PATH = path.join(__dirname, '../data/tunisian_nlu_model.json');
let localModel = null;

try {
  const data = fs.readFileSync(MODEL_PATH, 'utf8');
  localModel = JSON.parse(data);
  console.log(`[LinTOService] Loaded local model: ${localModel.meta.name} v${localModel.meta.version}`);
} catch (e) {
  console.error('[LinTOService] Failed to load local model:', e.message);
}

// Helper: Normalize Text (Tunisian Specific)
const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[ًٌٍَُِّْ]/g, '') // Remove Tashkeel
    .replace(/3/g, 'a') 
    .replace(/5/g, 'kh')
    .replace(/7/g, 'h')
    .replace(/9/g, 'k')
    .replace(/\s+/g, ' ');
};

// Helper: Levenshtein Distance
const levenshteinDistance = (a, b) => {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1,   // insertion
            matrix[i - 1][j] + 1    // deletion
          )
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

// Mock Engine (Simulates LinTO NLU)
const mockLintoNLU = (text) => {
  const normalized = normalizeText(text);
  console.log(`[LinTOService] Processing (Mock): "${normalized}"`);

  let bestMatch = {
    intent: 'UNKNOWN',
    score: 0,
    def: null
  };

  // 1. Intent Classification
  if (localModel && localModel.intents) {
    for (const intentDef of localModel.intents) {
      let score = 0;
      
      // Check examples
      for (const example of intentDef.examples) {
        const normExample = normalizeText(example);
        
        // Exact match
        if (normalized === normExample) {
          score = 1.0;
          break; // Perfect match
        }
        
        // Contains match (if example is > 3 chars)
        if (normExample.length > 3 && normalized.includes(normExample)) {
          // Weight based on length ratio
          const currentScore = 0.8 * (normExample.length / normalized.length);
          if (currentScore > score) score = currentScore;
        }

        // Levenshtein (Fuzzy) Match
        const dist = levenshteinDistance(normalized, normExample);
        const maxLen = Math.max(normalized.length, normExample.length);
        const fuzzyScore = 1 - (dist / maxLen);
        
        // Threshold for fuzzy match (e.g., > 0.7 means very similar)
        if (fuzzyScore > 0.7 && fuzzyScore > score) {
            score = fuzzyScore;
        }

        // Token overlap
        const tokens = normExample.split(' ');
        const inputTokens = normalized.split(' ');
        const matches = tokens.filter(t => inputTokens.includes(t)).length;
        const overlapScore = (matches / tokens.length) * 0.7;
        
        if (overlapScore > score) score = overlapScore;
      }

      if (score > bestMatch.score) {
        bestMatch = { intent: intentDef.name, score, def: intentDef };
      }
    }
  }

  // 2. Entity Extraction (Rule-based Slot Filling)
  let entities = {};
  let slots = {};

  if (bestMatch.def && bestMatch.def.slots) {
    // Very basic heuristic slot filling
    // In a real LinTO model, this uses CRF or Transformers
    
    // Remove intent keywords from text to isolate entities
    let remainingText = normalized;
    bestMatch.def.examples.forEach(ex => {
        remainingText = remainingText.replace(normalizeText(ex), '');
    });

    for (const slot of bestMatch.def.slots) {
      if (slot.type === 'number') {
        const match = remainingText.match(/(\d+(\.\d+)?)/);
        if (match) {
           slots[slot.name] = parseFloat(match[0]);
           entities[slot.name] = parseFloat(match[0]);
        }
      } else if (slot.type === 'person') {
        // Look for common names or just assume the text after "l" or "ila"
        const match = remainingText.match(/(?:l|li|el|ila|for|pour|ل)\s*([a-z\u0600-\u06FF]+)/i);
        if (match) {
            slots[slot.name] = match[1];
            entities[slot.name] = match[1];
        }
      } else if (slot.type === 'string') {
        // Take whatever is left
        const clean = remainingText.replace(/\b(nheb|nhab|bghit|abghi|please|aman|bellehi)\b/g, '').trim();
        if (clean) {
            slots[slot.name] = clean;
            entities[slot.name] = clean;
        }
      }
    }
  }

  // Format Reply
  let reply = "سامحني، ما فهمتكش.";
  if (bestMatch.def && bestMatch.def.reply) {
    reply = bestMatch.def.reply;
    // Template substitution
    for (const [key, val] of Object.entries(slots)) {
      reply = reply.replace(`{${key}}`, val || '');
    }
    // Clean up empty placeholders
    reply = reply.replace(/\{.*?\}/g, '');
  }

  // Return standard LinTO-like structure
  return {
    transcript: text,
    nlu: {
      intent: bestMatch.intent,
      confidence: bestMatch.score,
      entities: Object.keys(entities).map(k => ({ entity: k, value: entities[k] }))
    },
    // Custom field for our app to consume easily
    action: bestMatch.def ? bestMatch.def.action : 'UNKNOWN',
    route: bestMatch.def ? bestMatch.def.route : null,
    reply_darija: reply,
    slots: slots
  };
};

// Main Exported Service
const parseIntent = async (text) => {
  const LINTO_URL = process.env.LINTO_NLU_URL;

  // 1. Try Remote LinTO Service (if configured)
  if (LINTO_URL) {
    try {
      console.log(`[LinTOService] Calling external LinTO at ${LINTO_URL}`);
      const response = await axios.post(LINTO_URL, {
        transcript: text,
        conversationData: {}
      });
      return response.data; // Assumes standard LinTO output
    } catch (error) {
      console.error('[LinTOService] Remote call failed, falling back to local model:', error.message);
    }
  }

  // 2. Use Local Simulation
  return mockLintoNLU(text);
};

module.exports = { parseIntent };
