import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getAccessToken,
  setAccessToken,
  setRefreshToken,
  clearAuthTokens,
  type AuthResponse,
} from "@/src/lib/axios";
import { parseApiError } from "@/src/lib/error-handler";
import { getMyProfileQueryOptions } from "@/src/features/user-profile/queries/options";
import type { ProfileResponse } from "@/src/features/user-profile/schema/user.schema";
import {
  saveUserInfo,
  saveProfileInfo,
  getProfileInfo,
  clearAllUserStorage,
} from "@/src/lib/secure-user-storage";
import { authEvents } from "@/src/lib/auth-event";

interface AuthContextType {
  user: ProfileResponse | null;
  profileId: string | null;
  isAuthenticated: boolean;
  isRestoringAuth: boolean;
  setAuthUser: (user: ProfileResponse | null) => void;
  logoutLocal: () => Promise<void>;
  updateUser: (user: ProfileResponse) => void;
  refetchUser: () => Promise<void>;
  loginSuccess: (authResponse: AuthResponse) => Promise<ProfileResponse>;
  loginOffline: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Persist both userInfo (lightweight identity) and profileInfo (full profile)
 * to SecureStore so the app can restore sessions instantly.
 */
const persistUserData = async (profile: ProfileResponse): Promise<void> => {
  await Promise.all([
    saveUserInfo({
      userId: profile.userId,
      email: profile.email,
      role: profile.role,
    }),
    saveProfileInfo(profile),
  ]);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<ProfileResponse | null>(null);
  const [isRestoringAuth, setIsRestoringAuth] = useState(true);
  const queryClient = useQueryClient();
  const profileId = user?.id ?? null;

  // On mount: restore cached user from SecureStore first (instant),
  // then refresh from the API in the background.
  useEffect(() => {
    const restore = async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          await clearAuthTokens();
          await clearAllUserStorage();
          setUser(null);
          return;
        }

        // 1. Restore from SecureStore for instant display
        const cachedProfile = await getProfileInfo();
        if (cachedProfile) {
          setUser(cachedProfile);
        }

        // 2. Refresh from the API in the background
        try {
          const freshData = await queryClient.fetchQuery(
            getMyProfileQueryOptions(),
          );
          setUser(freshData);
          await persistUserData(freshData);
        } catch {
          // If API fails but we have cached data, keep using it
          if (!cachedProfile) {
            await clearAuthTokens();
            await clearAllUserStorage();
            setUser(null);
          }
        }
      } catch {
        await clearAuthTokens();
        await clearAllUserStorage();
        setUser(null);
      } finally {
        setIsRestoringAuth(false);
      }
    };

    restore();
  }, [queryClient]);

  // Listen for session expiry from the Axios interceptor (e.g. refresh failed).
  // When it fires, we wipe local state so RootLayoutNav's useEffect redirects
  // the user back to /login automatically.
  useEffect(() => {
    const unsubscribe = authEvents.on("SESSION_EXPIRED", () => {
      clearAuthTokens();
      clearAllUserStorage();
      setUser(null);
      queryClient.clear();
    });
    return unsubscribe;
  }, [queryClient]);

  const setAuthUser = useCallback((userData: ProfileResponse | null) => {
    setUser(userData);
    if (userData) {
      persistUserData(userData);
    }
  }, []);

  const logoutLocal = useCallback(async () => {
    await clearAuthTokens();
    await clearAllUserStorage();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const updateUser = useCallback((userData: ProfileResponse) => {
    setUser(userData);
    persistUserData(userData);
  }, []);

  const refetchUser = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return;
    try {
      const userData = await queryClient.fetchQuery(getMyProfileQueryOptions());
      if (userData) {
        setUser(userData);
        await persistUserData(userData);
      }
    } catch (error) {
      parseApiError(error);
    }
  }, [queryClient]);

  const loginSuccess = useCallback(
    async (authResponse: AuthResponse) => {
      // Persist tokens
      await setAccessToken(authResponse.accessToken);
      if (authResponse.refreshToken) {
        await setRefreshToken(authResponse.refreshToken);
      }

      // Fetch profile and persist userInfo + profileInfo to SecureStore
      const userData = await queryClient.fetchQuery(getMyProfileQueryOptions());
      setUser(userData);
      await persistUserData(userData);

      return userData;
    },
    [queryClient],
  );

  const loginOffline = useCallback(async () => {
    try {
      const cachedProfile = await getProfileInfo();
      if (cachedProfile) {
        setUser(cachedProfile);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profileId,
        isAuthenticated: user !== null,
        isRestoringAuth,
        setAuthUser,
        logoutLocal,
        updateUser,
        refetchUser,
        loginSuccess,
        loginOffline,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
