// API configuration - works on both local dev and production
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function apiFetch(endpoint: string, options?: RequestInit) {
  const url = `${API_URL}${endpoint}`;
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}
