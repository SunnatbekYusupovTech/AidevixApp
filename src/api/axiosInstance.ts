import axios, { AxiosResponse } from 'axios';
import { storage } from '../utils/storage';
import { API_URL } from '../utils/constants';

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    // Backend shu header'ni ko'rib login/refresh javoblariga accessToken+refreshToken'ni
    // JSON body'da qaytaradi (RN httpOnly cookie'ni o'qiy olmaydi). Web cookie-only qoladi.
    'X-Client-Type': 'mobile',
  },
});

const extractCookie = (setCookie: unknown, name: string): string | null => {
  if (!setCookie) return null;
  const list = Array.isArray(setCookie) ? setCookie : [String(setCookie)];
  for (const entry of list) {
    const match = entry.match(new RegExp(`${name}=([^;]+)`));
    if (match) return match[1];
  }
  return null;
};

const pickString = (obj: any, keys: string[]): string | null => {
  if (!obj || typeof obj !== 'object') return null;
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return null;
};

// Native ilovada token JSON body'da keladi (cookie emas — MOBILE_APP_GUIDE.md 3.1).
// Backend javob shakli aniq ma'lum emasligi uchun barcha keng tarqalgan
// joylarni tekshiramiz: {accessToken}, {data:{accessToken}}, {tokens:{access}}, ...
const extractTokensFromBody = (body: any): { access: string | null; refresh: string | null } => {
  const containers = [body, body?.data, body?.tokens, body?.data?.tokens].filter(Boolean);
  let access: string | null = null;
  let refresh: string | null = null;
  for (const container of containers) {
    access = access || pickString(container, ['accessToken', 'access_token', 'access', 'token']);
    refresh = refresh || pickString(container, ['refreshToken', 'refresh_token', 'refresh']);
  }
  return { access, refresh };
};

const persistTokensFromResponse = async (response: AxiosResponse) => {
  // 1-usul: JSON body (native uchun asosiy yo'l)
  const fromBody = extractTokensFromBody(response.data);
  if (fromBody.access) await storage.setToken(fromBody.access);
  if (fromBody.refresh) await storage.setRefreshToken(fromBody.refresh);

  // 2-usul: Set-Cookie (zaxira — RN'da odatda ko'rinmaydi, lekin web'da ishlaydi)
  if (!fromBody.access || !fromBody.refresh) {
    const setCookie = (response.headers as any)?.['set-cookie'];
    const access = extractCookie(setCookie, 'aidevix_access');
    const refresh = extractCookie(setCookie, 'aidevix_refresh');
    if (!fromBody.access && access) await storage.setToken(access);
    if (!fromBody.refresh && refresh) await storage.setRefreshToken(refresh);
  }
};

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  async (response) => {
    await persistTokensFromResponse(response);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const url: string = originalRequest?.url || '';
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh-token');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthCall) {
      originalRequest._retry = true;
      try {
        const refreshToken = await storage.getRefreshToken();
        const refreshResp = await axios.post(
          `${API_URL}/auth/refresh-token`,
          { refreshToken }
        );
        await persistTokensFromResponse(refreshResp);
        const newToken = await storage.getToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        await storage.clearTokens();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
