
import { extractChoiceNumber, normalizeArabic } from './arabic.js';

console.log("Running Arabic Debug Tests...");

const tests = [
  { input: "1", expected: 1 },
  { input: "واحد", expected: 1 },
  { input: "١", expected: 1 },
  { input: "  1  ", expected: 1 },
  { input: "رقم 1", expected: 1 },
  { input: "الخيار 1", expected: 1 },
  { input: "one", expected: 1 },
  { input: "One", expected: 1 },
  { input: "1.", expected: 1 },
  { input: "واحد.", expected: 1 },
  { input: "١٠", expected: 10 }, // Potential bug case
  { input: "10", expected: 10 },
  { input: "عشرة", expected: 10 },
  { input: "2", expected: 2 },
  { input: "اثنين", expected: 2 },
  { input: "رقم واحد", expected: 1 },
  { input: "الأول", expected: 1 }, // With Hamza
  { input: "الاول", expected: 1 }, // Without Hamza
];

let failed = 0;

tests.forEach(({ input, expected }) => {
  try {
    const normalized = normalizeArabic(input);
    const result = extractChoiceNumber(input);
    
    if (result !== expected) {
      console.error(`❌ FAIL: Input: "${input}" (Norm: "${normalized}") -> Got: ${result}, Expected: ${expected}`);
      failed++;
    } else {
      console.log(`✅ PASS: "${input}" -> ${result}`);
    }
  } catch (e) {
    console.error(`❌ ERROR: Input: "${input}" -> Exception:`, e);
    failed++;
  }
});

console.log(`\nTests Completed. Failed: ${failed}`);

if (failed > 0) process.exit(1);
