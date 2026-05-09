// Public API for the auth feature

// Public context
export { AuthProvider, useAuthContext } from "./context/AuthContext";

// Public UI
export {
  LoginScreen,
  LoginScreenView,
  SignupScreen,
  SignupScreenView,
  SignupVerifyOtpScreen,
  SignupVerifyOtpScreenView,
} from "./components";

// Public hooks
export {
  useLogin,
  useLoginScreen,
  useSignupScreen,
  useSignupVerifyOtpScreen,
} from "./hooks";

// Public query hooks & keys
export {
  authKeys,
  useLoginMutation,
  useInitiateRegistrationMutation,
  useVerifyOtpAndRegisterMutation,
  useResendOtpMutation,
  useRefreshAccessTokenMutation,
  useLogoutMobileMutation,
  useLogoutDeviceMutation,
  useLogoutOtherDevicesMutation,
} from "./queries";

// Public schemas
export { loginSchema, type LoginFormValues } from "./schema";
