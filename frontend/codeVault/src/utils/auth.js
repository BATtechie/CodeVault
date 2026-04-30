import { apiRequest } from '../config/api.js';

// Cookie-only auth helpers.
// We intentionally keep tokens out of localStorage so browser XSS does not expose session secrets.

export const getAuthToken = () => null;
export const setAuthToken = () => {};
export const removeAuthToken = () => {};

export const getAuthHeaders = () => ({});

export const fetchWithAuth = async (path, options = {}) => apiRequest(path, options);
