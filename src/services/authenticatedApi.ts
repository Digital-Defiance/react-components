import axios from 'axios';

export function createAuthenticatedApiClient(baseURL: string, tokenKey: string = 'authToken') {
  const api = axios.create({ baseURL });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem(tokenKey);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    const languageCode = localStorage.getItem('languageCode') ?? 'en-US';
    config.headers['Accept-Language'] = languageCode;
    return config;
  });

  return api;
}
