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
    FARM: "/farm",
    PLANTS: "/plants",
    IOT: "/iot",
    IOT_DEVICE_DETAIL: (deviceId: string) => `/iot/devices/${deviceId}`,
    IOT_ALERT_DETAIL: (alertId: string) => `/iot/alerts/${alertId}`,
    IOT_CAMERA_SCHEDULES: "/iot/camera-schedules",
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
    SEARCH: "/profiles/search",
    EXPERTS: "/profiles/experts",
    SEARCH_EXPERTS: "/profiles/search/experts",
    EXPERT_CONSULT_REQUEST: (expertProfileId: string) =>
      `/profiles/experts/${expertProfileId}/consult/request`,
    EXPERT_CONSULT_CANCEL: (expertProfileId: string) =>
      `/profiles/experts/${expertProfileId}/consult/cancel`,
    FOLLOW: (profileId: string) => `/profiles/users/${profileId}/follow`,
    UNFOLLOW: (profileId: string) => `/profiles/users/${profileId}/unfollow`,
    APPROVAL_REQUESTS: (profileId: string) =>
      `/profiles/${profileId}/approval-requests`,
  },

  FILES: {
    UPLOAD: "/files/upload",
    PRESIGNED_URL: (fileId: string) => `/files/presigned-url/${fileId}`,
    BY_S3_KEY: (s3Key: string) => `/files/s3-key/${encodeURIComponent(s3Key)}`,
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

  COMMUNITY: {
    CREATE_POST: "/posts",
    FEED_POSTS: "/posts/feed",
    POST_BY_ID: (postId: string) => `/posts/${postId}`,
    POSTS_BY_USER: (userId: string) => `/posts/user/${userId}`,
    CREATE_COMMENT: "/comments",
    COMMENTS_BY_POST: (postId: string) => `/comments/posts/${postId}`,
    REPLIES_BY_COMMENT: (commentId: string) => `/comments/${commentId}/replies`,
    VOTES_BY_POST: (postId: string) => `/votes/posts/${postId}`,
    VOTE: (targetType: "POST" | "COMMENT", targetId: string) =>
      `/votes/${targetType}/${targetId}`,
  },

  FEED: {
    MARK_POST_VIEWED: (postId: string) => `/feed/posts/${postId}/viewed`,
  },


  IOT: {
    DEVICES: {
      ME: "/iot/devices/me",
      ITEM: (deviceId: string) => `/iot/devices/${deviceId}`,
      RELEASE: (deviceId: string) => `/iot/devices/${deviceId}/release`,
      DETAIL: (deviceId: string) => `/iot/devices/${deviceId}/detail`,
      LATEST_READINGS: (deviceId: string) =>
        `/iot/devices/${deviceId}/latest-readings`,
      PROVISION: "/iot/devices/provision",
      CONNECT: "/iot/devices/connect",
      CLAIM_CODE: (deviceId: string) => `/iot/devices/${deviceId}/claim-code`,
      CLAIM: "/iot/devices/claim",
      CHARTS: (deviceId: string) => `/iot/devices/${deviceId}/charts`,
      CONFIG: (deviceId: string) => `/iot/devices/${deviceId}/config`,
      PUSH_CONFIG: (deviceId: string) => `/iot/devices/${deviceId}/config/push`,
      CAMERA_CAPTURE: (deviceId: string) =>
        `/iot/devices/${deviceId}/camera/capture`,
      CAMERA_DETECT: (deviceUid: string) =>
        `/iot/devices/${deviceUid}/camera/detect`,
      MEDIA: (deviceId: string) => `/iot/devices/${deviceId}/media`,
      CAMERA_SCHEDULES: (deviceUid: string) =>
        `/iot/devices/${deviceUid}/camera/capture-schedule`,
      CAMERA_SCHEDULE: (deviceUid: string, scheduleId: string) =>
        `/iot/devices/${deviceUid}/camera/capture-schedule/${scheduleId}`,
      CAMERA_SCHEDULE_RUN_NOW: (deviceUid: string, scheduleId: string) =>
        `/iot/devices/${deviceUid}/camera/run-scheduled/${scheduleId}`,
      CAMERA_CAPTURE_SCHEDULE: (deviceUid: string) =>
        `/iot/devices/${deviceUid}/camera/capture-schedule`,
    },
    CAMERA_SCHEDULES: "/iot/camera-schedules",
    CAMERA_SCHEDULE: (scheduleId: string) => `/iot/camera-schedules/${scheduleId}`,
    CAMERA_SCHEDULE_RUN_NOW: (scheduleId: string) =>
      `/iot/camera-schedules/${scheduleId}/run-now`,
    ADMIN_CAMERA_RUN_SCHEDULED: (deviceUid: string) =>
      `/admin/camera/run-scheduled/${deviceUid}`,
    DASHBOARD_OVERVIEW: "/iot/dashboard/overview",
    FARM_ZONE_OVERVIEW: (zoneId: string) => `/iot/farm-zones/${zoneId}/overview`,
    FARM_ZONE_CHARTS: (zoneId: string) => `/iot/farm-zones/${zoneId}/charts`,
    ALERT_EVENTS: "/iot/alert-events",
    ALERT_EVENT: (alertId: string) => `/iot/alert-events/${alertId}`,
    MEDIA_EVENT: (mediaEventId: string) => `/iot/media-events/${mediaEventId}`,
    ALERT_RULES: "/iot/alert-rules",
    ALERT_RULE: (ruleId: string) => `/iot/alert-rules/${ruleId}`,
    ALERT_EVENT_ACKNOWLEDGE: (alertId: string) =>
      `/iot/alert-events/${alertId}/acknowledge`,
    ALERT_EVENT_RESOLVE: (alertId: string) =>
      `/iot/alert-events/${alertId}/resolve`,
  },

  FARMS: {
    PLOTS: "/farms/plots",
    PLOT: (id: string) => `/farms/plots/${id}`,
    PLOT_ZONES: (plotId: string) => `/farms/plots/${plotId}/zones`,
    ZONE: (id: string) => `/farms/zones/${id}`,
  },

  PLANTS: {
    LIST: "/plants",
    ME: "/plants/me",
    ITEM: (id: string) => `/plants/${id}`,
    BY_FARM_PLOT: (farmPlotId: string) => `/plants/farm-plot/${farmPlotId}`,
    BY_SPECIES: (speciesId: string) => `/plants/species/${speciesId}`,
    BULK_STATUS: "/plants/bulk/status",
    BULK_DELETE: "/plants/bulk",
  },

  SPECIES: {
    LIST: "/species",
    ITEM: (id: string) => `/species/${id}`,
  },

  PLANT_EVENTS: {
    CREATE: "/plant-events",
    BULK_CREATE: "/plant-events/bulk",
    ITEM: (eventId: string) => `/plant-events/${eventId}`,
    BY_PLANT: (plantId: string) => `/plant-events/plant/${plantId}`,
    BY_PLANT_TYPE: (plantId: string, eventType: string) =>
      `/plant-events/plant/${plantId}/type/${eventType}`,
    BY_PLANT_PLANNED: (plantId: string) =>
      `/plant-events/plant/${plantId}/planned`,
    BY_PLAN: (sourcePlanId: string) => `/plant-events/plan/${sourcePlanId}`,
    BY_PLAN_APPLY: (planApplyId: string) => `/plant-events/plan-apply/${planApplyId}`,
    BY_FARM_PLOT: (farmPlotId: string) =>
      `/plant-events/farm-plot/${farmPlotId}`,
    BY_FARM_ZONE: (farmZoneId: string) =>
      `/plant-events/farm-zone/${farmZoneId}`,
    CALENDAR: "/plant-events/calendar",
    PROGRESS: (eventId: string) => `/plant-events/${eventId}/progress`,
    PROGRESS_ITEM: (eventId: string, progressId: string) =>
      `/plant-events/${eventId}/progress/${progressId}`,
    PROGRESS_GENERATE: (eventId: string) =>
      `/plant-events/${eventId}/progress/generate`,
  },

  SYNC: {
    PUSH: "/plant-management/sync/push",
    PULL: "/plant-management/sync/pull",
  },

  PLANS: {
    CREATE: "/plans",
    ITEM: (planId: string) => `/plans/${planId}`,
    VISIBILITY: (planId: string) => `/plans/${planId}/visibility/toggle`,
    MY: "/plans/me",
    PUBLIC: "/plans/public",
    MY_APPLIES: "/plans/applies/me",
    BY_PLANT: (planId: string) => `/plans/plant/${planId}`,
    BY_FARM_PLOT: (farmPlotId: string) =>
      `/plans/farm-plot/${farmPlotId}`,
    BY_FARM_ZONE: (farmZoneId: string) =>
      `/plans/farm-zone/${farmZoneId}`,
    APPLY: (planId: string) => `/plans/${planId}/apply`,
    APPLIES: (planId: string) => `/plans/${planId}/applies`,
    APPLY_DETAIL: (applyId: string) => `/plans/applies/${applyId}`,
    APPLY_STATUS: (applyId: string) => `/plans/applies/${applyId}/status`,
    CANCEL_APPLY: (applyId: string) => `/plans/applies/${applyId}/cancel`,
    COMPLETE_APPLY: (applyId: string) => `/plans/applies/${applyId}/complete`,
  },

  STATS: {
    AGRICULTURE: "/stats/agriculture",
  },

  SEARCH: {
    POSTS: "/search/posts/search",
    PROFILES: "/search/profiles/search",
  },

  RAG: {
    CHAT: "/rag/v1/chat",
    CHAT_STREAM: "/rag/v1/chat/stream",
  },

  DISEASES: {
    DETECT_LEAF: "/diseases/detect-leaf",
    PREDICT: "/diseases/predict",
    DIAGNOSE_REQUESTS: "/diseases/diagnose/requests",
    DIAGNOSE_RESULTS: "/diseases/diagnose/results",
    DIAGNOSE_RESULT_BY_REQUEST: (requestId: string) =>
      `/diseases/diagnose/results/by-request/${requestId}`,
  },

  NOTIFICATIONS: {
    HISTORY: "/notifications/history",
    HISTORY_UNREAD: "/notifications/history/unread",
    STATE: "/notifications/state",
    CHECKED: "/notifications/checked",
    READ: (id: string) => `/notifications/${id}/read`,
    READ_ALL: "/notifications/read-all",
  },

  PUSH_TOKENS: {
    REGISTER: "/push-tokens",
    DEACTIVATE: "/push-tokens/deactivate",
  },

  MESSAGES: {
    ROOT: "/conversations",
    CONVERSATIONS: "/conversations",
    CONVERSATION: (id: string) => `/conversations/${id}`,
    MESSAGES: (conversationId: string) =>
      `/conversations/${conversationId}/messages`,
    MESSAGES_V2: (conversationId: string) =>
      `/v2/conversations/${conversationId}/messages`,
    MEDIA: (conversationId: string) =>
      `/conversations/${conversationId}/media`,
    FILES: (conversationId: string) =>
      `/conversations/${conversationId}/files`,
    SEND: (conversationId: string) => `/conversations/${conversationId}/messages`,
    MESSAGE_EDIT: (messageId: string) => `/messages/${messageId}`,
    MESSAGE_REVOKE: (messageId: string) => `/messages/${messageId}/revoke`,
    MESSAGE_DELETE_ME: (messageId: string) => `/messages/${messageId}/me`,
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

  return [ROUTES.MAIN.PROFILE, ROUTES.MAIN.FARM, ROUTES.MAIN.PLANTS, ROUTES.MAIN.IOT].some(
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
