// const fetch = require('node-fetch'); // Native fetch in Node 18+

const API_URL = 'http://localhost:4000/api';

async function runTest() {
  console.log('🚀 Starting Commerce Integration Test...');

  try {
    // 1. Seed Products
    console.log('\n1. Seeding Products...');
    const seedRes = await fetch(`${API_URL}/products/seed?force=true`, { method: 'POST' });
    const seedData = await seedRes.json();
    if (!seedRes.ok) throw new Error(seedData.error || 'Seed failed');
    console.log('   ✅ Seeded:', seedData.count, 'products');

    // 2. List Products
    console.log('\n2. Fetching Products (Page 1)...');
    const listRes = await fetch(`${API_URL}/products?page=1&limit=5`);
    const listData = await listRes.json();
    if (!listRes.ok) throw new Error('List failed');
    console.log('   ✅ Fetched:', listData.products.length, 'products');
    console.log('   Total Products:', listData.totalProducts);

    if (listData.products.length === 0) throw new Error('No products found');
    const firstProduct = listData.products[0];
    console.log('   First Product:', firstProduct.name, `(${firstProduct.price} TND)`);

    // 3. Get Product Detail
    console.log(`\n3. Fetching Details for ${firstProduct._id}...`);
    const detailRes = await fetch(`${API_URL}/products/${firstProduct._id}`);
    const detailData = await detailRes.json();
    if (!detailRes.ok) throw new Error('Detail failed');
    
    if (detailData.name === firstProduct.name) {
      console.log('   ✅ Product Details Verified');
    } else {
      throw new Error('Product details mismatch');
    }

    // 4. Test Category Filter
    const category = firstProduct.category;
    console.log(`\n4. Filtering by Category: ${category}...`);
    const catRes = await fetch(`${API_URL}/products?category=${encodeURIComponent(category)}`);
    const catData = await catRes.json();
    const allMatch = catData.products.every(p => p.category === category);
    
    if (allMatch && catData.products.length > 0) {
      console.log(`   ✅ Filter Success. Found ${catData.products.length} items in category.`);
    } else {
      throw new Error('Category filter failed');
    }

    console.log('\n🎉 Commerce API Integration Test Passed!');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    process.exit(1);
  }
}

// Node 18+ has native fetch, but if running in older env, might need polyfill. 
// Assuming Node 18+ based on Dockerfile.
runTest();
