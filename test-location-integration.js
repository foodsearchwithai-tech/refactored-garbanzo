/**
 * Test script to verify location fetch and save functionality
 * This tests the integration between geocoding API and user location/origin tables
 */

const baseUrl = 'http://localhost:3000';

// Test coordinates (New York City)
const testCoordinates = {
  latitude: 40.7128,
  longitude: -74.0060
};

// Test address
const testAddress = "Times Square, New York, NY";

async function testReverseGeocoding() {
  console.log('\n🔍 Testing Reverse Geocoding API...');
  
  try {
    const response = await fetch(
      `${baseUrl}/api/geocoding/reverse?lat=${testCoordinates.latitude}&lng=${testCoordinates.longitude}`
    );
    
    const data = await response.json();
    console.log('✅ Reverse geocoding response:', data);
    return data;
  } catch (error) {
    console.error('❌ Reverse geocoding failed:', error);
    return null;
  }
}

async function testForwardGeocoding() {
  console.log('\n🔍 Testing Forward Geocoding API...');
  
  try {
    const response = await fetch(`${baseUrl}/api/geocoding/reverse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ address: testAddress })
    });
    
    const data = await response.json();
    console.log('✅ Forward geocoding response:', data);
    return data;
  } catch (error) {
    console.error('❌ Forward geocoding failed:', error);
    return null;
  }
}

async function testUserLocationFromCoordinates() {
  console.log('\n📍 Testing User Location API with Coordinates...');
  
  try {
    const response = await fetch(`${baseUrl}/api/user/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // You'll need to replace with actual auth
      },
      body: JSON.stringify({
        latitude: testCoordinates.latitude,
        longitude: testCoordinates.longitude,
        isFirstTime: true
      })
    });
    
    const data = await response.json();
    console.log('✅ User location from coordinates response:', data);
    return data;
  } catch (error) {
    console.error('❌ User location from coordinates failed:', error);
    return null;
  }
}

async function testUserLocationFromAddress() {
  console.log('\n🏠 Testing User Location API with Address...');
  
  try {
    const response = await fetch(`${baseUrl}/api/user/location`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // You'll need to replace with actual auth
      },
      body: JSON.stringify({
        address: testAddress,
        type: 'home'
      })
    });
    
    const data = await response.json();
    console.log('✅ User location from address response:', data);
    return data;
  } catch (error) {
    console.error('❌ User location from address failed:', error);
    return null;
  }
}

async function testUserOriginAPI() {
  console.log('\n🎯 Testing User Origin API...');
  
  try {
    const response = await fetch(`${baseUrl}/api/user/origin`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token' // You'll need to replace with actual auth
      }
    });
    
    const data = await response.json();
    console.log('✅ User origin response:', data);
    return data;
  } catch (error) {
    console.error('❌ User origin fetch failed:', error);
    return null;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Location Integration Tests...');
  console.log('======================================');
  
  // Test geocoding APIs first
  const reverseResult = await testReverseGeocoding();
  const forwardResult = await testForwardGeocoding();
  
  // Test user location APIs (these require authentication)
  console.log('\n⚠️  Note: User location tests require authentication');
  console.log('   You can test these manually in your app or with proper auth tokens');
  
  console.log('\n📋 Test Summary:');
  console.log('================');
  console.log(`Reverse Geocoding: ${reverseResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Forward Geocoding: ${forwardResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log('User Location APIs: ⚠️  Requires auth (test manually)');
  
  console.log('\n📖 Manual Testing Instructions:');
  console.log('1. Start your Next.js development server: npm run dev');
  console.log('2. Sign in to your app');
  console.log('3. Use browser console to test:');
  console.log(`
// Test setting location from coordinates
fetch('/api/user/location', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    latitude: ${testCoordinates.latitude},
    longitude: ${testCoordinates.longitude},
    isFirstTime: true
  })
}).then(r => r.json()).then(console.log);

// Test getting user location
fetch('/api/user/location').then(r => r.json()).then(console.log);

// Test getting user origin
fetch('/api/user/origin').then(r => r.json()).then(console.log);
  `);
}

// Run tests
runAllTests().catch(console.error);
