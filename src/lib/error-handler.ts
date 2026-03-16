import { AxiosError } from "axios";
import { type ApiResponse } from "../shared/api";
import { ERROR_CODES, getErrorMessage } from "./routes";

/**
 * Parsed API error with type-safe code and message
 */
export interface ParsedApiError {
  code: number;
  message: string;
  fieldErrors?: Record<string, string>;
  isNetworkError: boolean;
  isAuthError: boolean;
  status?: number;
}

/**
 * Parse Axios/API errors into a consistent format
 * Handles:
 * - ApiResponse wrapper errors (from backend)
 * - Network/connection errors
 * - Unexpected response formats
 */
export const parseApiError = (error: unknown): ParsedApiError => {
  // Network/Axios error
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as ApiResponse | undefined;

    // Has ApiResponse wrapper
    if (apiError?.code) {
      const isAuthError =
        apiError.code === ERROR_CODES.AUTH_UNAUTHENTICATED ||
        apiError.code === ERROR_CODES.JWT_EXPIRED_TOKEN ||
        apiError.code === ERROR_CODES.JWT_SIGNATURE_INVALID ||
        apiError.code === ERROR_CODES.TOKEN_REVOKED;

      return {
        code: apiError.code,
        message: apiError.message || getErrorMessage(apiError.code),
        fieldErrors: apiError.errors,
        isNetworkError: false,
        isAuthError,
        status: error.response?.status,
      };
    }

    // No ApiResponse wrapper, but Axios error
    return {
      code: error.response?.status || 0,
      message: error.message || getErrorMessage(ERROR_CODES.SYS_UNCATEGORIZED),
      isNetworkError: !error.response,
      isAuthError: error.response?.status === 401,
      status: error.response?.status,
    };
  }

  // Unknown error type
  if (error instanceof Error) {
    return {
      code: 0,
      message: error.message,
      isNetworkError: true,
      isAuthError: false,
    };
  }

  // Completely unknown
  return {
    code: ERROR_CODES.SYS_UNCATEGORIZED,
    message: getErrorMessage(ERROR_CODES.SYS_UNCATEGORIZED),
    isNetworkError: true,
    isAuthError: false,
  };
};

/**
 * Type guard to check if error is a ParsedApiError
 */
export const isParsedApiError = (error: unknown): error is ParsedApiError => {
  return (
    error instanceof Object &&
    "code" in error &&
    "message" in error &&
    "isNetworkError" in error &&
    "isAuthError" in error
  );
};

/**
 * Handle auth errors globally (token expired, revoked, etc.)
 * Clears stored tokens and triggers login redirect
 *
 * TODO: Call this from a useEffect hook in root layout with router.replace("/login")
 */
export const handleAuthError = async (
  code: number,
  clearTokens?: () => Promise<void>,
): Promise<void> => {
  const isAuthError =
    code === ERROR_CODES.AUTH_UNAUTHENTICATED ||
    code === ERROR_CODES.JWT_EXPIRED_TOKEN ||
    code === ERROR_CODES.JWT_SIGNATURE_INVALID ||
    code === ERROR_CODES.TOKEN_REVOKED;

  if (isAuthError && clearTokens) {
    console.warn(
      `Auth error (code: ${code}). Clearing tokens and logging out.`,
    );
    await clearTokens();
    // TODO: Navigate to login
    // router.replace("/login");
  }
};
