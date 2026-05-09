const cleanEnvValue = (value) =>
  String(value || '')
    .trim()
    .replace(/^['"]+|['"]+$/g, '');

const viteEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

const getBackendUrl = () => {
  const configuredUrl = cleanEnvValue(viteEnv.VITE_BACKEND_URL);

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '');
  }

  if (viteEnv.PROD) {
    console.warn('VITE_BACKEND_URL is not configured. Falling back to localhost.');
  }

  return 'http://localhost:3000';
};

export const API_BASE_URL = getBackendUrl();

export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status ?? 500;
    this.data = options.data;
  }
}

const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    searchParams.set(key, value);
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

export const apiRequest = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    throw new ApiError(payload?.message || 'Request failed.', {
      status: response.status,
      data: payload,
    });
  }

  return payload;
};

export const getErrorMessage = (error, fallback) =>
  error instanceof ApiError ? error.message : fallback;
