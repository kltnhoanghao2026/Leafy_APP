import { useEffect, useRef, useState } from "react";
import type { TextInput as TextInputType } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AxiosError } from "axios";
import { useAuthContext } from "../context/AuthContext";
import {
  useResendOtpMutation,
  useVerifyOtpAndRegisterMutation,
} from "../queries/mutations";
import { signupOtpSchema, type SignupOtpValues } from "../schema";
import { ERROR_CODES, getErrorMessage } from "@/src/lib/routes";
import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";

const RESEND_COOLDOWN_SECONDS = 30;

export function useSignupVerifyOtpScreen() {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const palette = Colors[scheme];
  const router = useRouter();
  const { email, expiresIn } = useLocalSearchParams<{
    email?: string | string[];
    expiresIn?: string | string[];
  }>();
  const { loginSuccess } = useAuthContext();
  const verifyMutation = useVerifyOtpAndRegisterMutation();
  const resendMutation = useResendOtpMutation();

  const resolvedEmail = Array.isArray(email) ? email[0] : email;
  const resolvedExpiresIn = Array.isArray(expiresIn) ? expiresIn[0] : expiresIn;
  const parsedExpiresIn = Number.parseInt(resolvedExpiresIn ?? "120", 10);
  const initialSeconds = Number.isFinite(parsedExpiresIn)
    ? parsedExpiresIn
    : 120;
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [resendCooldownLeft, setResendCooldownLeft] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const inputRefs = useRef<(TextInputType | null)[]>([]);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));

  const {
    setValue,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<SignupOtpValues>({
    resolver: zodResolver(signupOtpSchema),
    defaultValues: { otp: "" },
  });

  useEffect(() => {
    if (secondsLeft <= 0 && resendCooldownLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
      setResendCooldownLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, resendCooldownLeft]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, "").slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    const joined = newDigits.join("");
    setValue("otp", joined, { shouldValidate: joined.length === 6 });
    clearErrors("otp");

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const onSubmit = async (_data: SignupOtpValues) => {
    if (!resolvedEmail) {
      setError("root", {
        type: "manual",
        message: getErrorMessage(ERROR_CODES.REGISTRATION_DATA_EXPIRED),
      });
      return;
    }
    try {
      const response = await verifyMutation.mutateAsync({
        email: resolvedEmail,
        otp: otpDigits.join(""),
      });
      await loginSuccess(response.data.data);
      router.replace("/");
    } catch (error) {
      if (error instanceof AxiosError) {
        const code = error.response?.data?.code;
        if (
          code === ERROR_CODES.OTP_INVALID ||
          code === ERROR_CODES.INVALID_OTP ||
          code === ERROR_CODES.OTP_EXPIRED ||
          code === ERROR_CODES.OTP_MAX_ATTEMPTS_EXCEEDED
        ) {
          setError("otp", {
            type: "server",
            message: getErrorMessage(code),
          });
          return;
        }
        if (code === ERROR_CODES.REGISTRATION_DATA_EXPIRED) {
          setError("root", {
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

  const handleResend = async () => {
    if (!resolvedEmail) {
      setError("root", {
        type: "manual",
        message: getErrorMessage(ERROR_CODES.REGISTRATION_DATA_EXPIRED),
      });
      return;
    }
    setResendMessage(null);
    try {
      const response = await resendMutation.mutateAsync({
        email: resolvedEmail,
      });
      const msg =
        typeof response.data.data === "string"
          ? response.data.data
          : "OTP resent successfully.";
      setResendMessage(msg);
      setSecondsLeft(initialSeconds);
      setResendCooldownLeft(RESEND_COOLDOWN_SECONDS);
      setOtpDigits(Array(6).fill(""));
      setValue("otp", "");
      clearErrors();
      inputRefs.current[0]?.focus();
    } catch (error) {
      if (error instanceof AxiosError) {
        const code = error.response?.data?.code;
        if (code === ERROR_CODES.REGISTRATION_DATA_EXPIRED) {
          setError("root", {
            type: "server",
            message: getErrorMessage(code),
          });
          return;
        }
        setResendMessage(
          getErrorMessage(code ?? ERROR_CODES.SYS_UNCATEGORIZED),
        );
      }
    }
  };

  const isLoading = isSubmitting || verifyMutation.isPending;
  const otpComplete = otpDigits.join("").length === 6;
  const maskedEmail = resolvedEmail
    ? resolvedEmail.replace(/(.{2})(.+?)(@)/, (_, a, _b, at) => `${a}***${at}`)
    : "";

  return {
    palette,
    inputRefs,
    otpDigits,
    errors,
    resendMessage,
    secondsLeft,
    resendCooldownLeft,
    isLoading,
    otpComplete,
    maskedEmail,
    resendIsPending: resendMutation.isPending,
    handleSubmit,
    onSubmit,
    handleResend,
    handleDigitChange,
    handleKeyPress,
    formatTime,
  };
}

export type UseSignupVerifyOtpScreenResult = ReturnType<
  typeof useSignupVerifyOtpScreen
>;
