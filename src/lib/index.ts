// Third-party client configurations (e.g. Supabase, TanStack Query client, Axios instance)

export { apiClient } from "./axios";
export type { ApiResponse } from "../shared/api";
export {
  AUTH_REDIRECT_ROUTE,
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  type AuthResponse,
} from "./axios";
export { queryClient } from "./query-client";
export { setMutationSuccessHandler } from "./query-client";
export {
  ROUTES,
  API_ENDPOINTS,
  ERROR_CODES,
  isProtectedRoute,
  isAuthRoute,
  getErrorMessage,
} from "./routes";
export {
  parseApiError,
  isParsedApiError,
  handleAuthError,
  type ParsedApiError,
} from "./error-handler";
export type { RootRoutes, ApiEndpoints } from "./routes";
