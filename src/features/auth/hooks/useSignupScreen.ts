import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useInitiateRegistrationMutation } from "../queries/mutations";
import { signupStep1Schema, type SignupStep1Values } from "../schema";
import { ERROR_CODES, getErrorMessage } from "@/src/lib/routes";
import { parseApiError } from "@/src/lib/error-handler";
import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";

export function useSignupScreen() {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const palette = Colors[scheme];
  const router = useRouter();
  const initiateMutation = useInitiateRegistrationMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isValid, touchedFields },
  } = useForm<SignupStep1Values>({
    resolver: zodResolver(signupStep1Schema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupStep1Values) => {
    try {
      const response = await initiateMutation.mutateAsync({
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber || undefined,
        password: data.password,
      });
      const { expiresInSeconds } = response.data.data;
      router.push({
        pathname: "/(auth)/signup/verify-otp" as any,
        params: { email: data.email, expiresIn: String(expiresInSeconds) },
      });
    } catch (error) {
      const apiError = parseApiError(error);
      const code = apiError.code;
      const fieldErrors = apiError.fieldErrors;

      if (code === ERROR_CODES.ACC_EMAIL_ALREADY_USED) {
        setError("email", {
          type: "server",
          message: getErrorMessage(code),
        });
        return;
      }

      if (code === ERROR_CODES.ACC_PHONE_NUMBER_ALREADY_USED) {
        setError("phoneNumber", {
          type: "server",
          message: getErrorMessage(code),
        });
        return;
      }

      if (fieldErrors) {
        const emailError = fieldErrors.email;
        if (emailError) {
          setError("email", { type: "server", message: emailError });
        }

        const phoneError = fieldErrors.phoneNumber ?? fieldErrors.phone;
        if (phoneError) {
          setError("phoneNumber", { type: "server", message: phoneError });
        }

        const passwordError = fieldErrors.password;
        if (passwordError) {
          setError("password", { type: "server", message: passwordError });
        }

        const fullNameError = fieldErrors.fullName ?? fieldErrors.name;
        if (fullNameError) {
          setError("fullName", { type: "server", message: fullNameError });
        }

        if (emailError || phoneError || passwordError || fullNameError) {
          return;
        }
      }

      setError("root", {
        type: "server",
        message: apiError.message || getErrorMessage(ERROR_CODES.SYS_UNCATEGORIZED),
      });
    }
  };

  const isLoading = isSubmitting || initiateMutation.isPending;

  const handleTogglePassword = () => setShowPassword((prev) => !prev);
  const handleToggleConfirmPassword = () =>
    setShowConfirmPassword((prev) => !prev);
  const handleToggleTermsAccepted = () => setIsTermsAccepted((prev) => !prev);
  const handlePressSignin = () => {
    if (!isLoading) {
      router.push("login" as any);
    }
  };

  return {
    palette,
    control,
    handleSubmit,
    errors,
    touchedFields,
    isLoading,
    isValid,
    isTermsAccepted,
    showPassword,
    showConfirmPassword,
    onSubmit,
    handleTogglePassword,
    handleToggleConfirmPassword,
    handleToggleTermsAccepted,
    handlePressSignin,
  };
}

export type UseSignupScreenResult = ReturnType<typeof useSignupScreen>;
