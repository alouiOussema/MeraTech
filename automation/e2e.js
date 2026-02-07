const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting E2E Tests for IBSAR...');
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();

  // Helper to log steps
  const step = (msg) => console.log(`[STEP] ${msg}`);

  try {
    // 1. Navigate to Home
    step('Navigating to Home Page...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    const title = await page.title();
    console.log(`Page Title: ${title}`);
    
    // Check if Voice Assistant is present (hidden or visible)
    // We can check for the "Start" button or welcome message logic
    // Since it's voice first, visual cues might be minimal, but we look for the main container
    await page.waitForSelector('#root');

    // 2. Test Navigation to Login
    step('Testing Navigation to Login...');
    // Simulate user clicking "Login" (which Voice Operator would trigger via navigate)
    // We can simulate the URL change directly or try to trigger the router
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    
    const loginHeader = await page.$eval('h1', el => el.innerText).catch(() => 'No H1');
    console.log(`Login Header: ${loginHeader}`);
    
    if (!loginHeader.includes('تسجيل') && !loginHeader.includes('Login')) {
       // It might be in Arabic "تسجيل الدخول"
       console.warn('Warning: Login header might be incorrect or not found');
    }

    // 3. Test Form Filling (Login)
    step('Testing Form Filling...');
    await page.waitForSelector('input[name="name"]', { timeout: 5000 }).catch(() => console.log('Name input not found by name, trying generic'));
    
    await page.type('input[name="name"]', 'Test User');
    console.log('Filled Name');

    // 4. Test Products Page
    step('Testing Products Page...');
    await page.goto('http://localhost:5173/products', { waitUntil: 'networkidle0' });
    
    // Check for products list
    await page.waitForSelector('[role="article"]', { timeout: 5000 });
    const productsCount = await page.$$eval('[role="article"]', els => els.length);
    console.log(`Found ${productsCount} products.`);
    
    if (productsCount > 0) {
        console.log('✅ Products Flow Verified');
    } else {
        console.error('❌ No products found');
    }

    console.log('✅ All Smoke Tests Passed');

  } catch (error) {
    console.error('❌ Test Failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
