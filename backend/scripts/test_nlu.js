const axios = require('axios');

const TEST_CASES = [
    "hezeni lel login page",
    "nheb nconnecti",
    "winou solde mte3i",
    "choufli les courses",
    "nheb nechri 2 kg batata",
    "rajja3ni lel home page",
    "3aweni aman",
    "chniya lmochkla", // Ambiguous
    "a3tini flous",
    "nheb na3mel compte jdid"
];

async function runTests() {
    console.log("Starting Intent Parsing Tests (Backend + LLM)...\n");
    
    for (const text of TEST_CASES) {
        console.log(`Input: "${text}"`);
        try {
            // Assuming backend is running on port 4000
            const response = await axios.post('http://localhost:4000/api/nlu/intent', { text });
            console.log("Result:", JSON.stringify(response.data, null, 2));
        } catch (e) {
            console.error("Error:", e.message);
        }
        console.log("-".repeat(40));
    }
}

runTests();