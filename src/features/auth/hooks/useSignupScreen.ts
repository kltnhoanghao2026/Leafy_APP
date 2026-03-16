import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { AxiosError } from "axios";
import { useInitiateRegistrationMutation } from "../queries/mutations";
import { signupStep1Schema, type SignupStep1Values } from "../schema";
import { ERROR_CODES, getErrorMessage } from "@/src/lib/routes";
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
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupStep1Values) => {
    try {
      const response = await initiateMutation.mutateAsync({
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
      if (error instanceof AxiosError) {
        const code = error.response?.data?.code;
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
        const message =
          error.response?.data?.message ??
          getErrorMessage(ERROR_CODES.SYS_UNCATEGORIZED);
        setError("root", { type: "server", message });
      }
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
