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
import type { UserProfile } from "@/src/features/user-profile/schema/user.schema";

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isRestoringAuth: boolean;
  setAuthUser: (user: UserProfile | null) => void;
  logoutLocal: () => Promise<void>;
  updateUser: (user: UserProfile) => void;
  refetchUser: () => Promise<void>;
  loginSuccess: (authResponse: AuthResponse) => Promise<UserProfile>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isRestoringAuth, setIsRestoringAuth] = useState(true);
  const queryClient = useQueryClient();

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

  const setAuthUser = useCallback((userData: UserProfile | null) => {
    setUser(userData);
  }, []);

  const logoutLocal = useCallback(async () => {
    await clearAuthTokens();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const updateUser = useCallback((userData: UserProfile) => {
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
