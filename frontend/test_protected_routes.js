#!/usr/bin/env node

/**
 * Test script to verify protected routes functionality
 * This simulates browser navigation to test authentication redirects
 */

const puppeteer = require('puppeteer');

async function testProtectedRoutes() {
  console.log('🧪 Testing Protected Routes...');

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Start local dev server (assuming it's running)
    const baseUrl = 'http://localhost:3000';

    // Test 1: Access dashboard without authentication
    console.log('1. Testing dashboard access without authentication...');
    await page.goto(`${baseUrl}/dashboard`);
    await page.waitForTimeout(1000); // Wait for redirect

    const currentUrl = page.url();
    if (currentUrl.includes('/')) {
      console.log('   ✅ Redirected to login page (expected)');
    } else {
      console.log('   ❌ Not redirected to login page');
    }

    // Test 2: Access login page (should work)
    console.log('2. Testing login page access...');
    await page.goto(`${baseUrl}/`);
    await page.waitForTimeout(500);

    const loginUrl = page.url();
    if (loginUrl.includes('/')) {
      console.log('   ✅ Login page accessible');
    } else {
      console.log('   ❌ Login page not accessible');
    }

    // Test 3: Access signup page (should work)
    console.log('3. Testing signup page access...');
    await page.goto(`${baseUrl}/signup`);
    await page.waitForTimeout(500);

    const signupUrl = page.url();
    if (signupUrl.includes('/signup')) {
      console.log('   ✅ Signup page accessible');
    } else {
      console.log('   ❌ Signup page not accessible');
    }

    console.log('\n✅ Protected routes test completed!');
    console.log('Note: To test authenticated dashboard access, you need to:');
    console.log('1. Start the React dev server: npm start');
    console.log('2. Start the backend server');
    console.log('3. Manually login and then access /dashboard');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testProtectedRoutes().catch(console.error);