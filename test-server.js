const http = require('http');

const API_BASE = 'http://localhost:3000';

async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Server Tests...\n');
  let passed = 0;
  const total = 6;

  // Test 1: Health check
  console.log('Test 1: Server Health Check...');
  try {
    const res = await makeRequest('/health');
    if (res.status === 200) {
      console.log('✅ PASS: Server is running');
      console.log(`   Exchange rate: ${res.data.exchangeRate}`);
      passed++;
    } else {
      console.log('❌ FAIL: Server not responding correctly');
    }
  } catch (error) {
    console.log('❌ FAIL: Server not responding');
    console.log('   Make sure you ran: npm start');
  }

  // Test 2: Single stock API
  console.log('\nTest 2: Single Stock API (AAPL)...');
  try {
    const res = await makeRequest('/api/stock/AAPL');
    if (res.status === 200 && res.data.success) {
      console.log('✅ PASS: Stock API working');
      console.log(`   ${res.data.data.name}: $${res.data.data.price}`);
      passed++;
    } else {
      console.log('❌ FAIL: Stock API error');
    }
  } catch (error) {
    console.log('❌ FAIL: Stock API error');
  }

  // Test 3: Indian stock
  console.log('\nTest 3: Indian Stock API (RELIANCE.NS)...');
  try {
    const res = await makeRequest('/api/stock/RELIANCE');
    if (res.status === 200 && res.data.success) {
      console.log('✅ PASS: Indian stock API working');
      console.log(`   ${res.data.data.name}: ₹${res.data.data.priceINR}`);
      passed++;
    } else {
      console.log('❌ FAIL: Indian stock API error');
    }
  } catch (error) {
    console.log('❌ FAIL: Indian stock API error');
  }

  // Test 4: Comparison
  console.log('\nTest 4: Comparison API (AAPL vs MSFT)...');
  try {
    const res = await makeRequest('/api/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { stock1: 'AAPL', stock2: 'MSFT' },
    });
    if (res.status === 200 && res.data.success) {
      console.log('✅ PASS: Comparison API working');
      passed++;
    } else {
      console.log('❌ FAIL: Comparison API error');
    }
  } catch (error) {
    console.log('❌ FAIL: Comparison API error');
  }

  // Test 5: Analysis
  console.log('\nTest 5: Analysis API (GOOGL)...');
  try {
    const res = await makeRequest('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { symbol: 'GOOGL', query: 'Analyze this stock' },
    });
    if (res.status === 200 && res.data.success) {
      console.log('✅ PASS: Analysis API working');
      passed++;
    } else {
      console.log('❌ FAIL: Analysis API error');
    }
  } catch (error) {
    console.log('❌ FAIL: Analysis API error');
  }

  // Test 6: Frontend
  console.log('\nTest 6: Frontend Loading...');
  try {
    const res = await makeRequest('/');
    if (res.status === 200) {
      console.log('✅ PASS: Frontend loads correctly');
      passed++;
    } else {
      console.log('❌ FAIL: Frontend error');
    }
  } catch (error) {
    console.log('❌ FAIL: Frontend error');
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('✨ All tests passed! Your server is working perfectly.');
    console.log('🌐 Open http://localhost:3000 in your browser');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.');
    console.log('Common fixes:');
    console.log('  1. Make sure server is running: npm start');
    console.log('  2. Check no errors in server terminal');
    console.log('  3. Verify port 3000 is not in use');
    console.log('  4. Try: rm -rf node_modules && npm install');
  }
}

runTests();
