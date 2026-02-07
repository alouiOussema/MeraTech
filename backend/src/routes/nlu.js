const express = require('express');
const router = express.Router();
const { parseIntent } = require('../services/lintoService'); // Switched to LinTO Service
const { parseIntentWithLLM } = require('../services/openRouterService');

router.post('/intent', async (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  // Priority: LinTO Service (Local Model or Remote) -> LLM Fallback
  // The user requested "LinTO as a service", so we prioritize it.
  
  try {
    // 1. Try LinTO Service
    const lintoResult = await parseIntent(text);
    
    // Check if LinTO found a confident match
    if (lintoResult.nlu && lintoResult.nlu.intent !== 'UNKNOWN' && lintoResult.nlu.confidence > 0.4) {
      console.log('[NLU] LinTO matched:', lintoResult.nlu.intent);
      
      // Map LinTO output to our frontend's expected format if needed
      // Our lintoService.js already outputs compatible fields (action, route, reply_darija)
      return res.json({
        intent: lintoResult.nlu.intent,
        confidence: lintoResult.nlu.confidence,
        entities: lintoResult.slots || {}, // Map slots to entities
        action: lintoResult.action,
        route: lintoResult.route,
        reply_darija: lintoResult.reply_darija
      });
    }

    // 2. Fallback to OpenRouter LLM (if LinTO was unsure)
    console.log('[NLU] LinTO unsure, falling back to LLM...');
    const llmResult = await parseIntentWithLLM(text);
    if (llmResult) {
       return res.json(llmResult);
    }

  } catch (error) {
    console.error('[NLU] Error:', error);
  }

  // 3. Final Fallback
  res.json({ 
      intent: 'UNKNOWN', 
      confidence: 0, 
      entities: {}, 
      reply_darija: "سامحني، ما فهمتكش مليح. تنجم تعاود؟" 
  });
});

module.exports = router;