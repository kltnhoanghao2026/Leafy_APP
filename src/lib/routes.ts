/**
 * Centralized routing configuration
 * Define all app routes and backend API endpoints here
 *
 * Backend: Spring Boot microservices with API Gateway at /api
 * Auth Service: /auth (handles login, signup, token refresh)
 * User Service: /users (user management - requires JWT)
 */

// ============================================================================
// APP ROUTES (Navigation)
// ============================================================================

export const ROUTES = {
  // Auth routes (no JWT required)
  AUTH: {
    LOGIN: "/login",
    SIGNUP: "/signup",
    VERIFY_OTP: "/signup/verify-otp",
  },

  // Main app routes (JWT required)
  MAIN: {
    HOME: "/",
    PROFILE: "/profile",
    IOT: "/iot",
    IOT_DEVICE_DETAIL: (deviceId: string) => `/iot/devices/${deviceId}`,
  },

  // Modal routes
  MODAL: "/modal",

  // Not found
  NOT_FOUND: "+not-found",
} as const;

const normalizePath = (pathname: string): string => {
  if (!pathname.startsWith("/")) {
    return `/${pathname}`;
  }

  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
};

// ============================================================================
// API ENDPOINTS (Backend)
// ============================================================================

/**
 * Auth Service endpoints
 * All endpoints return ApiResponse<T> format
 */
export const API_ENDPOINTS = {
  AUTH: {
    // 2-step registration flow with OTP
    REGISTER_INIT: "/auth/register/init",
    REGISTER_VERIFY: "/auth/register/verify",
    REGISTER_RESEND_OTP: "/auth/register/resend-otp",

    // Login
    LOGIN: "/auth/login",

    // Token refresh
    REFRESH: "/auth/refresh",
    REFRESH_MOBILE: "/auth/refresh/mobile",

    // Logout
    LOGOUT: "/auth/logout",
    LOGOUT_MOBILE: "/auth/logout/mobile",
    LOGOUT_DEVICE: "/auth/logout-device",
    LOGOUT_OTHER: "/auth/logout-other",
  },

  PROFILES: {
    ME: "/profiles/me",
    GET: (profileId: string) => `/profiles/${profileId}`,
    GET_BY_USER: (userId: string) => `/profiles/user/${userId}`,
  },

  USERS: {
    ME: "/users/me",
    CREATE: "/users",
    GET: (userId: string) => `/users/${userId}`,
    GET_DETAILS: (userId: string) => `/users/${userId}/details`,
    UPDATE: (userId: string) => `/users/${userId}`,
    DELETE: (userId: string) => `/users/${userId}`,
    LIST: "/users",
    ACTIVE: "/users/active",
    SEARCH: "/users/search",
    CHECK_EMAIL: "/users/check-email",
    CHECK_PHONE: "/users/check-phone",
    ACTIVATE: (userId: string) => `/users/${userId}/activate`,
    DEACTIVATE: (userId: string) => `/users/${userId}/deactivate`,
  },

  IOT: {
    DEVICES: {
      ME: "/iot/devices/me",
      DETAIL: (deviceId: string) => `/iot/devices/${deviceId}/detail`,
      LATEST_READINGS: (deviceId: string) =>
        `/iot/devices/${deviceId}/latest-readings`,
      PROVISION: "/iot/devices/provision",
      CLAIM_CODE: (deviceId: string) => `/iot/devices/${deviceId}/claim-code`,
      CLAIM: "/iot/devices/claim",
      CHARTS: (deviceId: string) => `/iot/devices/${deviceId}/charts`,
      CONFIG: (deviceId: string) => `/iot/devices/${deviceId}/config`,
      PUSH_CONFIG: (deviceId: string) => `/iot/devices/${deviceId}/config/push`,
    },
    DASHBOARD_OVERVIEW: "/iot/dashboard/overview",
    FARM_ZONE_OVERVIEW: (zoneId: string) => `/iot/farm-zones/${zoneId}/overview`,
    FARM_ZONE_CHARTS: (zoneId: string) => `/iot/farm-zones/${zoneId}/charts`,
    ALERT_EVENTS: "/iot/alert-events",
    ALERT_EVENT: (alertId: string) => `/iot/alert-events/${alertId}`,
    ALERT_EVENT_ACKNOWLEDGE: (alertId: string) =>
      `/iot/alert-events/${alertId}/acknowledge`,
    ALERT_EVENT_RESOLVE: (alertId: string) =>
      `/iot/alert-events/${alertId}/resolve`,
  },

  FARMS: {
    PLOTS: "/farms/plots",
    PLOT_ZONES: (plotId: string) => `/farms/plots/${plotId}/zones`,
    PLOT: (plotId: string) => `/farms/plots/${plotId}`,
    ZONE: (zoneId: string) => `/farms/zones/${zoneId}`,
  },
} as const;

// ============================================================================
// TYPES
// ============================================================================

export type RootRoutes = typeof ROUTES;
export type ApiEndpoints = typeof API_ENDPOINTS;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if pathname is a protected route (requires JWT)
 */
export const isProtectedRoute = (pathname?: string): boolean => {
  if (!pathname) return false;
  const normalizedPath = normalizePath(pathname);

  if (normalizedPath === ROUTES.MAIN.HOME) {
    return true;
  }

  return [ROUTES.MAIN.PROFILE, ROUTES.MAIN.IOT].some(
    (route) =>
      normalizedPath === route || normalizedPath.startsWith(`${route}/`),
  );
};

/**
 * Check if pathname is an auth route
 */
export const isAuthRoute = (pathname?: string): boolean => {
  if (!pathname) return false;
  const normalizedPath = normalizePath(pathname);
  const authRoutes = [
    ROUTES.AUTH.LOGIN,
    ROUTES.AUTH.SIGNUP,
    ROUTES.AUTH.VERIFY_OTP,
  ];
  return authRoutes.some(
    (route) =>
      normalizedPath === route || normalizedPath.startsWith(`${route}/`),
  );
};

/**
 * Error codes from backend (ErrorCode.java)
 * https://backend/common/exception/ErrorCode.java
 */
export const ERROR_CODES = {
  SUCCESS: 1000,
  AUTH_UNAUTHENTICATED: 1001,
  AUTH_UNAUTHORIZED: 1002,
  JWT_INVALID_TOKEN: 1003,
  JWT_EXPIRED_TOKEN: 1004,
  JWT_SIGNATURE_INVALID: 1005,
  AUTH_INVALID_CREDENTIALS: 1006,
  AUTH_DEVICE_ID_REQUIRED: 1007,
  AUTH_DEVICE_MISMATCH: 1008,
  AUTH_SESSION_KICKED: 1009,
  TOKEN_REVOKED: 1010,
  TOKEN_REPLAY_DETECTED: 1011,
  RATE_LIMIT_EXCEEDED: 1012,
  REFRESH_TOKEN_NOT_FOUND: 1013,
  REFRESH_TOKEN_INVALID: 1014,
  TOKEN_FAMILY_REVOKED: 1015,
  ACC_PHONE_NUMBER_ALREADY_USED: 2001,
  ACC_EMAIL_ALREADY_USED: 2002,
  ACC_ACCOUNT_NOT_FOUND: 2003,
  USER_NOT_FOUND: 2004,
  INVALID_OTP: 2005,
  ACC_WRONG_PASSWORD: 2006,
  ACC_IS_OAUTH: 2007,
  CIC_IS_EXIST: 2008,
  OTP_COOLDOWN_ACTIVE: 2009,
  OTP_MAX_ATTEMPTS_EXCEEDED: 2010,
  OTP_EXPIRED: 2011,
  OTP_INVALID: 2012,
  OTP_PURPOSE_MISMATCH: 2013,
  OTP_NOT_FOUND: 2014,
  REGISTRATION_DATA_EXPIRED: 2015,
  VALIDATION_ERROR: 2200,
  ACC_PASSWORD_MISMATCH: 2207,
  SYS_UNCATEGORIZED: 9999,
} as const;

/**
 * Get human-readable error message from error code
 */
export const getErrorMessage = (code: number): string => {
  const messages: Record<number, string> = {
    [ERROR_CODES.SUCCESS]: "Success",
    [ERROR_CODES.AUTH_UNAUTHENTICATED]: "Session expired. Please log in again.",
    [ERROR_CODES.AUTH_UNAUTHORIZED]:
      "You do not have permission to perform this action.",
    [ERROR_CODES.JWT_INVALID_TOKEN]: "Invalid session. Please log in again.",
    [ERROR_CODES.JWT_EXPIRED_TOKEN]:
      "Your session has expired. Please log in again.",
    [ERROR_CODES.JWT_SIGNATURE_INVALID]:
      "Invalid session. Please log in again.",
    [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: "Invalid email or password.",
    [ERROR_CODES.AUTH_DEVICE_ID_REQUIRED]: "Device ID is required.",
    [ERROR_CODES.AUTH_DEVICE_MISMATCH]:
      "This session does not belong to this device.",
    [ERROR_CODES.AUTH_SESSION_KICKED]: "This session has been terminated.",
    [ERROR_CODES.TOKEN_REVOKED]:
      "Your session was revoked. Please log in again.",
    [ERROR_CODES.TOKEN_REPLAY_DETECTED]:
      "A security issue was detected. Please log in again.",
    [ERROR_CODES.RATE_LIMIT_EXCEEDED]:
      "Too many requests. Please try again later.",
    [ERROR_CODES.REFRESH_TOKEN_NOT_FOUND]:
      "Refresh token not found. Please log in again.",
    [ERROR_CODES.REFRESH_TOKEN_INVALID]:
      "Refresh token is invalid. Please log in again.",
    [ERROR_CODES.TOKEN_FAMILY_REVOKED]:
      "Your session family was revoked. Please log in again.",
    [ERROR_CODES.ACC_PHONE_NUMBER_ALREADY_USED]:
      "This phone number is already registered.",
    [ERROR_CODES.ACC_EMAIL_ALREADY_USED]: "This email is already registered.",
    [ERROR_CODES.ACC_ACCOUNT_NOT_FOUND]: "Account not found.",
    [ERROR_CODES.USER_NOT_FOUND]: "User not found.",
    [ERROR_CODES.INVALID_OTP]: "Invalid or expired OTP. Please try again.",
    [ERROR_CODES.ACC_WRONG_PASSWORD]: "Incorrect password.",
    [ERROR_CODES.ACC_IS_OAUTH]: "This account uses OAuth sign-in.",
    [ERROR_CODES.CIC_IS_EXIST]: "This identifier already exists.",
    [ERROR_CODES.OTP_COOLDOWN_ACTIVE]:
      "Please wait before requesting another OTP.",
    [ERROR_CODES.OTP_MAX_ATTEMPTS_EXCEEDED]:
      "Too many OTP attempts. Please request a new OTP.",
    [ERROR_CODES.OTP_EXPIRED]: "OTP expired. Please request a new code.",
    [ERROR_CODES.OTP_INVALID]: "OTP is invalid.",
    [ERROR_CODES.OTP_PURPOSE_MISMATCH]: "OTP purpose mismatch.",
    [ERROR_CODES.OTP_NOT_FOUND]: "OTP not found.",
    [ERROR_CODES.REGISTRATION_DATA_EXPIRED]:
      "Registration data expired. Start again.",
    [ERROR_CODES.VALIDATION_ERROR]: "Please review the highlighted fields.",
    [ERROR_CODES.ACC_PASSWORD_MISMATCH]: "Passwords do not match.",
    [ERROR_CODES.SYS_UNCATEGORIZED]: "An unexpected error occurred.",
  };

  return messages[code] || "An error occurred.";
};
