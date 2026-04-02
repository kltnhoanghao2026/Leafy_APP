import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import * as SecureStore from "expo-secure-store";
import { getDeviceId } from "../utils/device";
import { API_ENDPOINTS, ROUTES } from "./routes";
import { type ApiResponse } from "../shared/api";
import { ERROR_CODES } from "./routes";

export type { ApiResponse };

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
}

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const ACCESS_TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export const getAccessToken = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
};

export const setAccessToken = async (token: string | null): Promise<void> => {
  if (token) {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    return;
  }

  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
};

export const setRefreshToken = async (token: string | null): Promise<void> => {
  if (token) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    return;
  }

  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
};

export const clearAuthTokens = async (): Promise<void> => {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
};

const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_URL || "http://192.168.100.34:8060/api";

const isAuthEndpoint = (url?: string): boolean => {
  if (!url) {
    return false;
  }

  return [
    API_ENDPOINTS.AUTH.LOGIN,
    API_ENDPOINTS.AUTH.REGISTER_INIT,
    API_ENDPOINTS.AUTH.REGISTER_VERIFY,
    API_ENDPOINTS.AUTH.REGISTER_RESEND_OTP,
    API_ENDPOINTS.AUTH.REFRESH_MOBILE,
    API_ENDPOINTS.AUTH.LOGOUT_MOBILE,
  ].some((endpoint) => url.includes(endpoint));
};

const http = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

const subscribeRefresh = (callback: (token: string | null) => void): void => {
  refreshSubscribers.push(callback);
};

const notifyRefreshSubscribers = (token: string | null): void => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const isRefreshableAuthError = (error: AxiosError): boolean => {
  const status = error.response?.status;
  const apiError = error.response?.data as ApiResponse<unknown> | undefined;
  const code = apiError?.code;

  if (status === 401) {
    return true;
  }

  return (
    code === ERROR_CODES.AUTH_UNAUTHENTICATED ||
    code === ERROR_CODES.JWT_INVALID_TOKEN ||
    code === ERROR_CODES.JWT_EXPIRED_TOKEN ||
    code === ERROR_CODES.TOKEN_REVOKED
  );
};

const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    const deviceId = await getDeviceId();
    const response = await axios.post<ApiResponse<AuthResponse>>(
      `${apiBaseUrl}${API_ENDPOINTS.AUTH.REFRESH_MOBILE}`,
      { refreshToken },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Device-ID": deviceId,
        },
      },
    );

    const authData = response.data?.data;
    const newAccessToken = authData?.accessToken ?? null;
    const newRefreshToken = authData?.refreshToken ?? null;

    await setAccessToken(newAccessToken);
    if (newRefreshToken) {
      await setRefreshToken(newRefreshToken);
    }

    return newAccessToken;
  } catch {
    return null;
  }
};

http.interceptors.request.use(async (config) => {
  const deviceId = await getDeviceId();
  config.headers.set("X-Device-ID", deviceId);

  if (isAuthEndpoint(config.url)) {
    return config;
  }

  const token = await getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
}, Promise.reject);

http.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (!originalRequest || !isRefreshableAuthError(error)) {
      return Promise.reject(error);
    }

    if (isAuthEndpoint(originalRequest.url)) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      await clearAuthTokens();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeRefresh((token) => {
          if (!token) {
            reject(error);
            return;
          }

          originalRequest.headers.set("Authorization", `Bearer ${token}`);
          resolve(http(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();
      notifyRefreshSubscribers(newToken);

      if (!newToken) {
        await clearAuthTokens();
        return Promise.reject(error);
      }

      originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
      return http(originalRequest);
    } catch (refreshError) {
      notifyRefreshSubscribers(null);
      await clearAuthTokens();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export const apiClient = http;

export const AUTH_REDIRECT_ROUTE = ROUTES.AUTH.LOGIN;

export default http;
