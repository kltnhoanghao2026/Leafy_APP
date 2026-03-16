// useLogin is no longer needed — login logic lives directly in app/(auth)/login.tsx
// using react-hook-form + useLoginMutation + useAuthContext.
// This file is kept as a stub for backwards compatibility.
export { useAuthContext as useLogin } from "../context/AuthContext";
