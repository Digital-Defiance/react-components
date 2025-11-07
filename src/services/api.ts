import axios from 'axios';

export function createApiClient(baseURL: string) {
  const api = axios.create({ baseURL });

  api.interceptors.request.use((config) => {
    const languageCode = localStorage.getItem('languageCode') ?? 'en-US';
    config.headers['Accept-Language'] = languageCode;
    return config;
  });

  return api;
}
