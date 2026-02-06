const axios = require('axios');

async function testOpenRouter() {
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'qwen/qwen3-coder:free',
        messages: [{ role: 'user', content: 'Hello' }]
      },
      {
        headers: {
          'Authorization': 'Bearer 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',
          'Content-Type': 'application/json'
        }
      }
    );
    console.log("Success:", response.data);
  } catch (error) {
    console.error("Error Status:", error.response?.status);
    console.error("Error Data:", error.response?.data);
  }
}

testOpenRouter();