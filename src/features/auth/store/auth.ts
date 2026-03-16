import { create } from "zustand";
import { AuthResponse } from "@/src/lib/axios";
import {
  setAccessToken,
  setRefreshToken,
  clearAuthTokens,
} from "@/src/lib/axios";

interface AuthStore {
  // State
  isAuthenticated: boolean;
  user: { id?: string; email?: string } | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setAuthResponse: (
    response: AuthResponse,
    userEmail?: string,
  ) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => Promise<void>;
  clearError: () => void;
}

/**
 * Auth store using Zustand
 * Manages authentication state and tokens
 */
export const useAuthStore = create<AuthStore>((set) => ({
  // Initial state
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,

  // Set auth response (tokens and user info)
  setAuthResponse: async (response: AuthResponse, userEmail?: string) => {
    await setAccessToken(response.accessToken);

    if (response.refreshToken) {
      await setRefreshToken(response.refreshToken);
    }

    set({
      isAuthenticated: true,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken || null,
      user: {
        email: userEmail,
      },
      error: null,
    });
  },

  // Set loading state
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  // Set error message
  setError: (error: string | null) => {
    set({ error });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Logout and clear auth state
  logout: async () => {
    await clearAuthTokens();
    set({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      error: null,
    });
  },
}));
