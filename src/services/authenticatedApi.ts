import axios from 'axios';
import { resolvePreferredLanguageCode } from './language-preference';

export function createAuthenticatedApiClient(baseURL: string, tokenKey: string = 'authToken') {
  const api = axios.create({ baseURL });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem(tokenKey);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    config.headers['Accept-Language'] = resolvePreferredLanguageCode();
    return config;
  });

  return api;
}
