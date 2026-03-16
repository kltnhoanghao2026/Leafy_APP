import { useEffect, useState } from "react";
import { getAccessToken } from "@/src/lib/axios";
import { useAuthStore } from "../store/auth";

/**
 * Hook to restore auth state from secure storage
 * Loads persisted tokens on app startup
 */
export const useAuthRestoration = () => {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const { setAuthResponse, logout } = useAuthStore();

  useEffect(() => {
    const restoreAuth = async () => {
      try {
        const savedToken = await getAccessToken();

        if (savedToken) {
          // Found a saved access token, keep user logged in
          setAuthResponse(
            {
              accessToken: savedToken,
              tokenType: "Bearer",
              expiresIn: 3600,
            },
            undefined,
          );
        } else {
          // No saved token, logout to clear state
          await logout();
        }
      } catch (error) {
        console.error("Error restoring auth:", error);
        await logout();
      } finally {
        setIsCheckingAuth(false);
      }
    };

    restoreAuth();
  }, [setAuthResponse, logout]);

  return { isCheckingAuth };
};
