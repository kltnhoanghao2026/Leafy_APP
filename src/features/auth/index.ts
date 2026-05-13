// Public API for the auth feature

// Public context
export { AuthProvider, useAuthContext } from "./context/AuthContext";

// Public UI (now empty as screens are orchestrated in route files directly)


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
