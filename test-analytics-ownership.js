// Analytics Test Script - Verifying Owner Detection
// Run this in the browser console on the restaurant dashboard

async function testAnalyticsOwnerDetection() {
  console.log('🧪 Testing Analytics Owner Detection...');
  
  // Test 1: Dashboard event (should be skipped)
  const dashboardTest = await fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restaurantId: '87d49949-d757-420c-a7a6-0898867cb30a',
      eventType: 'dashboard_view',
      metadata: { section: 'test', timestamp: new Date().toISOString() }
    })
  });
  
  const dashboardResult = await dashboardTest.json();
  console.log('Dashboard Event Test:', dashboardResult);
  
  // Test 2: Profile view event (should be skipped if owner)
  const profileTest = await fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restaurantId: '87d49949-d757-420c-a7a6-0898867cb30a',
      eventType: 'view',
      metadata: { source: 'test_profile_page', timestamp: new Date().toISOString() }
    })
  });
  
  const profileResult = await profileTest.json();
  console.log('Profile View Test (Own Restaurant):', profileResult);
  
  // Test 3: View different restaurant (should be tracked)
  const otherRestaurantTest = await fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restaurantId: 'f9985c8f-f55a-4a48-abe2-bf9f96e639b1',
      eventType: 'view',
      metadata: { source: 'test_other_restaurant', timestamp: new Date().toISOString() }
    })
  });
  
  const otherResult = await otherRestaurantTest.json();
  console.log('Other Restaurant View Test:', otherResult);
}

// Run the test
testAnalyticsOwnerDetection();
