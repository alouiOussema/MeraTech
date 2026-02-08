
import { parseChoiceNumber } from './numberParser.js';

const runTests = () => {
    console.log("Running Number Parser Tests...");
    let passed = 0;
    let failed = 0;

    const assert = (desc, actual, expected) => {
        if (actual === expected) {
            passed++;
        } else {
            console.error(`FAILED: ${desc}: Expected ${expected}, got ${actual}`);
            failed++;
        }
    };

    try {
        // Test Cases
        assert('Parse "1"', parseChoiceNumber("1"), 1);
        assert('Parse "١" (Arabic-Indic)', parseChoiceNumber("١"), 1);
        assert('Parse "واحد"', parseChoiceNumber("واحد"), 1);
        assert('Parse "رقم واحد"', parseChoiceNumber("رقم واحد"), 1);
        assert('Parse "اختار 2"', parseChoiceNumber("اختار 2"), 2);
        assert('Parse "اثنين"', parseChoiceNumber("اثنين"), 2);
        assert('Parse "تسعة"', parseChoiceNumber("تسعة"), 9);
        assert('Parse "0"', parseChoiceNumber("0"), 0);
        assert('Parse "صفر"', parseChoiceNumber("صفر"), 0);
        assert('Parse "ما نحبش" (Invalid)', parseChoiceNumber("ما نحبش"), null);
        assert('Parse "help" (Invalid)', parseChoiceNumber("help"), null);
        
        // Edge cases
        assert('Parse "ثلاثة 3" (First valid)', parseChoiceNumber("ثلاثة 3"), 3);
        assert('Parse "رقم خمسة من فضلك"', parseChoiceNumber("رقم خمسة من فضلك"), 5);
        
        console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed.`);
        
        if (failed > 0) process.exit(1);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

runTests();
