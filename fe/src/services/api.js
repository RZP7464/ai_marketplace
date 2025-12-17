// API Service for authentication and other API calls
import { API_BASE_URL } from '../config/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method for making API calls
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = this.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth methods
  async login(email, password) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data.token) {
      this.setToken(response.data.token);
      this.setUser(response.data.user);
    }

    return response;
  }

  async register(userData) {
    const response = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data.token) {
      this.setToken(response.data.token);
      this.setUser(response.data.user);
    }

    return response;
  }

  async merchantRegister(userData) {
    const response = await this.request('/api/auth/merchant-register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data.token) {
      this.setToken(response.data.token);
      this.setUser(response.data.user);
    }

    return response;
  }

  async getCurrentUser() {
    const response = await this.request('/api/auth/me', {
      method: 'GET',
    });

    if (response.success && response.data.user) {
      this.setUser(response.data.user);
    }

    return response;
  }

  // Token management
  setToken(token) {
    localStorage.setItem('auth_token', token);
  }

  getToken() {
    return localStorage.getItem('auth_token');
  }

  removeToken() {
    localStorage.removeItem('auth_token');
  }

  // User management
  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  removeUser() {
    localStorage.removeItem('user');
  }

  // Logout
  logout() {
    this.removeToken();
    this.removeUser();
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken();
  }

  // Merchant API methods
  async getMerchant() {
    return this.request('/api/merchant', { method: 'GET' });
  }

  async updateBrand(brandData) {
    return this.request('/api/merchant/brand', {
      method: 'PUT',
      body: JSON.stringify(brandData),
    });
  }

  async updateSettings(settingsData) {
    return this.request('/api/merchant/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
  }

  async uploadLogo(logoData) {
    return this.request('/api/merchant/upload-logo', {
      method: 'POST',
      body: JSON.stringify(logoData),
    });
  }

  async completeSetup(setupData) {
    return this.request('/api/merchant/complete-setup', {
      method: 'POST',
      body: JSON.stringify(setupData),
    });
  }

  // Merchant APIs methods
  async getMerchantApis() {
    return this.request('/api/merchant-apis', { method: 'GET' });
  }

  async createMerchantApi(apiData) {
    return this.request('/api/merchant-apis', {
      method: 'POST',
      body: JSON.stringify(apiData),
    });
  }

  async updateMerchantApi(apiType, apiData) {
    return this.request(`/api/merchant-apis/${apiType}`, {
      method: 'PUT',
      body: JSON.stringify(apiData),
    });
  }

  async deleteMerchantApi(apiType) {
    return this.request(`/api/merchant-apis/${apiType}`, {
      method: 'DELETE',
    });
  }

  async bulkCreateMerchantApis(apis) {
    return this.request('/api/merchant-apis/bulk', {
      method: 'POST',
      body: JSON.stringify({ apis }),
    });
  }

  // Helper to convert file to base64
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }
}

// Create a singleton instance
const apiService = new ApiService();

export default apiService;

