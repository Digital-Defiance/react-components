import axios from 'axios';
import { resolvePreferredLanguageCode } from './language-preference';

export function createApiClient(baseURL: string) {
  const api = axios.create({ baseURL });

  api.interceptors.request.use((config) => {
    config.headers['Accept-Language'] = resolvePreferredLanguageCode();
    return config;
  });

  return api;
}
