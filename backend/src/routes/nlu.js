const express = require('express');
const router = express.Router();
const { parseIntentWithLLM } = require('../services/openRouterService');

router.post('/intent', async (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const result = await parseIntentWithLLM(text);
  
  if (result) {
    res.json(result);
  } else {
    // Return a fallback/error response structure
    res.json({ 
        intent: 'UNKNOWN', 
        confidence: 0, 
        entities: {}, 
        reply_darija: "سامحني، ما فهمتكش مليح. تنجم تعاود؟" 
    });
  }
});

module.exports = router;