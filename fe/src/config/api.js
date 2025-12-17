// API Configuration
// Automatically detects the correct API URL based on environment

const getApiBaseUrl = () => {
  // 1. Check if explicit environment variable is set
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 2. For production, use the backend URL
  if (import.meta.env.PROD) {
    return 'https://ai-marketplace-api.onrender.com';
  }

  // 3. Development default
  return 'http://localhost:3001';
};

export const API_BASE_URL = getApiBaseUrl();

// Export for debugging
export const debugApiConfig = () => {
  console.log('🔧 API Configuration:');
  console.log('  Environment:', import.meta.env.MODE);
  console.log('  VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('  Detected API_BASE_URL:', API_BASE_URL);
  console.log('  Current Host:', window.location.hostname);
};

