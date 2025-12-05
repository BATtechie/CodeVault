// API configuration
// Automatically uses the correct backend URL based on environment

const getBackendUrl = () => {
  // In production (Vercel), use the environment variable
  // In development, use localhost
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  
  // Fallback: detect if we're in production
  if (import.meta.env.PROD) {
    // Production fallback - should be set via Vercel environment variables
    console.warn('VITE_BACKEND_URL not set in production!');
    return 'https://codevault-g030.onrender.com'; // Your Render backend URL
  }
  
  // Development fallback
  return 'http://localhost:3000';
};

export const API_BASE_URL = getBackendUrl();

// Helper function to test backend connection
export const testBackendConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      credentials: 'include',
    });
    const data = await response.json();
    console.log('Backend health check:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Backend connection test failed:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to make API calls
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    return response;
  } catch (error) {
    console.error('API call failed:', error);
    console.error('Attempted URL:', url);
    throw error;
  }
};

// Log backend URL on module load
console.log('Backend URL configured:', API_BASE_URL);



