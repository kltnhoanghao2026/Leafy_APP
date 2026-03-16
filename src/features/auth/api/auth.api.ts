import { apiClient } from "@/src/lib/axios";
import { type ApiResponse } from "@/src/shared/api";
import { API_ENDPOINTS } from "@/src/lib/routes";
import type {
  LoginRequest,
  InitRegisterRequest,
  VerifyOtpRequest,
  ResendOtpRequest,
  RefreshTokenRequest,
  LogoutDeviceRequest,
} from "../schema/requests";
import type {
  AuthResponse,
  RegistrationInitResponse,
} from "../schema/responses";

export const authApi = {
  login: (body: LoginRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>(API_ENDPOINTS.AUTH.LOGIN, body),

  initiateRegistration: (body: InitRegisterRequest) =>
    apiClient.post<ApiResponse<RegistrationInitResponse>>(
      API_ENDPOINTS.AUTH.REGISTER_INIT,
      body,
    ),

  verifyOtpAndRegister: (body: VerifyOtpRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>(
      API_ENDPOINTS.AUTH.REGISTER_VERIFY,
      body,
    ),

  resendOtp: (body: ResendOtpRequest) =>
    apiClient.post<ApiResponse<string>>(
      API_ENDPOINTS.AUTH.REGISTER_RESEND_OTP,
      body,
    ),

  refreshAccessToken: (body: RefreshTokenRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>(
      API_ENDPOINTS.AUTH.REFRESH_MOBILE,
      body,
    ),

  logoutMobile: (body: RefreshTokenRequest) =>
    apiClient.post<ApiResponse<void>>(API_ENDPOINTS.AUTH.LOGOUT_MOBILE, body),

  logoutDevice: (body: LogoutDeviceRequest) =>
    apiClient.post<ApiResponse<void>>(API_ENDPOINTS.AUTH.LOGOUT_DEVICE, body),

  logoutOtherDevices: () =>
    apiClient.post<ApiResponse<void>>(API_ENDPOINTS.AUTH.LOGOUT_OTHER),
};
