// Cookie-only auth helpers.
// We intentionally do NOT store tokens in localStorage to avoid XSS token theft.

export const getAuthToken = () => null;
export const setAuthToken = () => {};
export const removeAuthToken = () => {};

export const getAuthHeaders = () => ({});

export const fetchWithAuth = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
};

