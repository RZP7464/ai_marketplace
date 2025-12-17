// API Configuration - Single Source of Truth
// All backend API calls will use this URL

const getApiBaseUrl = () => {
  // Production: Use production backend
  if (import.meta.env.PROD) {
    return 'https://ai-marketplace-api.onrender.com';
  }

  // Development: Use local backend
  return 'http://localhost:3001';
};

export const API_BASE_URL = getApiBaseUrl();

// Export for debugging
export const debugApiConfig = () => {
  console.log('🔧 API Configuration:');
  console.log('  Environment:', import.meta.env.MODE);
  console.log('  Production:', import.meta.env.PROD);
  console.log('  API_BASE_URL:', API_BASE_URL);
  console.log('  Current Host:', window.location.hostname);
};

