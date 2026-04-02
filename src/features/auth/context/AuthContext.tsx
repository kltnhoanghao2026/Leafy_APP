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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<ProfileResponse | null>(null);
  const [isRestoringAuth, setIsRestoringAuth] = useState(true);
  const queryClient = useQueryClient();
  const profileId = user?.id ?? null;

  // On mount: check for an existing token and restore the user session
  useEffect(() => {
    const restore = async () => {
      try {
        const token = await getAccessToken();
        if (token) {
          const userData = await queryClient.fetchQuery(
            getMyProfileQueryOptions(),
          );
          setUser(userData);
        }
      } catch {
        await clearAuthTokens();
        setUser(null);
      } finally {
        setIsRestoringAuth(false);
      }
    };

    restore();
  }, [queryClient]);

  const setAuthUser = useCallback((userData: ProfileResponse | null) => {
    setUser(userData);
  }, []);

  const logoutLocal = useCallback(async () => {
    await clearAuthTokens();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const updateUser = useCallback((userData: ProfileResponse) => {
    setUser(userData);
  }, []);

  const refetchUser = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return;
    try {
      const userData = await queryClient.fetchQuery(getMyProfileQueryOptions());
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      parseApiError(error);
    }
  }, [queryClient]);

  const loginSuccess = useCallback(
    async (authResponse: AuthResponse) => {
      await setAccessToken(authResponse.accessToken);
      if (authResponse.refreshToken) {
        await setRefreshToken(authResponse.refreshToken);
      }
      const userData = await queryClient.fetchQuery(getMyProfileQueryOptions());
      setUser(userData);
      return userData;
    },
    [queryClient],
  );

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
