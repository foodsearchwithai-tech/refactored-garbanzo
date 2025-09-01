// Test script to verify onboarding form data processing
// Run this in the browser console on the onboarding page

// Test data that matches the form structure
const testFormData = {
  restaurantName: "Test Restaurant",
  description: "A test restaurant for data verification",
  categories: ["restaurant"],
  cuisineTypes: ["Italian"],
  address: "123 Test Street",
  city: "Test City", 
  state: "TS",
  zipCode: "12345",
  phone: "555-123-4567",
  email: "test@restaurant.com",
  website: "https://testrestaurant.com",
  
  // Social media data - the key part we're testing
  socialMedia: {
    facebook: "https://facebook.com/testrestaurant",
    instagram: "https://instagram.com/testrestaurant",
    twitter: "https://twitter.com/testrestaurant"
  },
  
  // Delivery partners data - the other key part we're testing
  deliveryPartners: {
    uberEats: "https://ubereats.com/testrestaurant",
    doorDash: "https://doordash.com/testrestaurant",
    grubHub: "https://grubhub.com/testrestaurant"
  },
  
  customSocialUrls: [],
  customDeliveryUrls: [],
  
  operatingHours: {
    monday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
    tuesday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
    wednesday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
    thursday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
    friday: { isOpen: true, openTime: '09:00', closeTime: '23:00' },
    saturday: { isOpen: true, openTime: '09:00', closeTime: '23:00' },
    sunday: { isOpen: true, openTime: '10:00', closeTime: '21:00' }
  },
  
  features: ['dine_in'],
  policies: {
    cancellation: '',
    delivery: '',
    reservation: '',
    dressCode: '',
  },
  
  kitchenStory: '',
  kitchenPhotos: [],
  achievements: [],
  achievementPhotos: [],
  latitude: 40.7128,
  longitude: -74.0060
};

async function testOnboardingDataProcessing() {
  console.log('🧪 Testing Onboarding Data Processing...');
  
  // Simulate the data processing logic from the form
  const socialMediaEntries = Object.entries(testFormData.socialMedia).filter(([, value]) => value && value.trim() !== '');
  const customSocialEntries = testFormData.customSocialUrls.filter(custom => custom.label && custom.url);
  
  const socialMediaData = {
    ...Object.fromEntries(socialMediaEntries),
    ...customSocialEntries.reduce((acc, custom, index) => {
      acc[`custom_${index}`] = custom.url;
      acc[`custom_${index}_label`] = custom.label;
      acc[`custom_${index}_icon`] = custom.icon || '';
      return acc;
    }, {})
  };

  const deliveryPartnerEntries = Object.entries(testFormData.deliveryPartners).filter(([, value]) => value && value.trim() !== '');
  const customDeliveryEntries = testFormData.customDeliveryUrls.filter(custom => custom.label && custom.url);
  
  const deliveryPartnersData = {
    ...Object.fromEntries(deliveryPartnerEntries),
    ...customDeliveryEntries.reduce((acc, custom, index) => {
      acc[`custom_${index}`] = custom.url;
      acc[`custom_${index}_label`] = custom.label;
      acc[`custom_${index}_icon`] = custom.icon || '';
      return acc;
    }, {})
  };

  const externalLinksData = {
    other: customDeliveryEntries.map(url => ({
      label: url.label,
      url: url.url,
      icon: url.icon || ''
    }))
  };

  console.log('📊 Processed Data:');
  console.log('Social Media:', JSON.stringify(socialMediaData, null, 2));
  console.log('Delivery Partners:', JSON.stringify(deliveryPartnersData, null, 2)); 
  console.log('External Links:', JSON.stringify(externalLinksData, null, 2));
  
  // Test API call
  const basicData = {
    ...testFormData,
    socialMedia: socialMediaData,
    deliveryPartners: deliveryPartnersData,
    externalLinks: externalLinksData,
  };
  
  console.log('🚀 Sending test data to API...');
  
  try {
    const response = await fetch('/api/onboarding/restaurant-owner', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(basicData),
    });
    
    const result = await response.json();
    console.log('✅ API Response:', result);
    
    if (response.ok) {
      console.log('🎉 Test successful! Restaurant created with ID:', result.restaurantId);
    } else {
      console.error('❌ API Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
}

// Run the test
testOnboardingDataProcessing();
