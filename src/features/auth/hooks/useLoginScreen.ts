import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useAuthContext } from "../context/AuthContext";
import { useLoginMutation } from "../queries/mutations";
import { loginSchema, type LoginFormValues } from "../schema";
import { ERROR_CODES, getErrorMessage } from "@/src/lib/routes";
import { parseApiError } from "@/src/lib/error-handler";
import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";

export function useLoginScreen() {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const palette = Colors[scheme];
  const router = useRouter();
  const { loginSuccess } = useAuthContext();
  const loginMutation = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isValid, touchedFields },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const response = await loginMutation.mutateAsync(data);
      await loginSuccess(response.data.data);
      router.replace("/");
    } catch (error) {
      const apiError = parseApiError(error);
      const code = apiError.code;

      if (
        code === ERROR_CODES.AUTH_INVALID_CREDENTIALS ||
        code === ERROR_CODES.ACC_WRONG_PASSWORD
      ) {
        setError("password", {
          type: "server",
          message: getErrorMessage(code),
        });
        return;
      }

      setError("root", {
        type: "server",
        message: apiError.message || getErrorMessage(ERROR_CODES.SYS_UNCATEGORIZED),
      });
    }
  };

  const isLoading = isSubmitting || loginMutation.isPending;

  const handleTogglePassword = () => setShowPassword((prev) => !prev);
  const handlePressSignup = () => {
    if (!isLoading) {
      router.push("signup" as any);
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
    showPassword,
    onSubmit,
    handleTogglePassword,
    handlePressSignup,
  };
}

export type UseLoginScreenResult = ReturnType<typeof useLoginScreen>;
