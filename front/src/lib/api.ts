import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
  type AxiosRequestHeaders,
} from 'axios';
import { authTokenStorage } from './auth-token';

type ApiResponse<T> = {
  success: boolean;
  message?: string | null;
  data: T;
};

type ReissueResponse = ApiResponse<{
  accessToken: string;
  expiresIn: number;
}>;

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
};

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let refreshPromise: Promise<string> | null = null;

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = authTokenStorage.get();
  if (!token) {
    return config;
  }

  const headers = (config.headers ?? {}) as AxiosRequestHeaders;
  headers.Authorization = `Bearer ${token}`;
  config.headers = headers;
  return config;
});

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;

    if (!originalRequest || status !== 401) {
      throw error;
    }

    if (originalRequest.skipAuthRefresh || originalRequest._retry) {
      authTokenStorage.clear();
      throw error;
    }

    originalRequest._retry = true;

    try {
      const newAccessToken = await getRefreshPromise();
      const headers = (originalRequest.headers ?? {}) as AxiosRequestHeaders;
      headers.Authorization = `Bearer ${newAccessToken}`;
      originalRequest.headers = headers;
      return api(originalRequest);
    } catch (refreshError) {
      authTokenStorage.clear();
      if (window.location.pathname !== '/auth/login') {
        window.location.href = '/auth/login';
      }
      throw refreshError;
    }
  }
);

async function reissueAccessToken() {
  const response = await refreshClient.post<ReissueResponse>(
    '/api/auth/reissue',
    null,
    {
      withCredentials: true,
      headers: {
        Accept: 'application/json',
      },
    }
  );

  const newAccessToken = response.data.data.accessToken;
  authTokenStorage.set(newAccessToken);
  return newAccessToken;
}

function getRefreshPromise() {
  if (!refreshPromise) {
    refreshPromise = reissueAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export { authTokenStorage, type ApiResponse };
