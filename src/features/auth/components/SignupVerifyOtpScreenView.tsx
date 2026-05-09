import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  View as RNView,
} from "react-native";
import { useTranslation } from "react-i18next";
import type { UseSignupVerifyOtpScreenResult } from "../hooks/useSignupVerifyOtpScreen";
import {
  AuthHeroBanner,
  AuthSubmitButton,
  AuthErrorBanner,
} from "./ui";

type SignupVerifyOtpScreenViewProps = Pick<
  UseSignupVerifyOtpScreenResult,
  | "palette"
  | "inputRefs"
  | "otpDigits"
  | "errors"
  | "resendMessage"
  | "secondsLeft"
  | "resendCooldownLeft"
  | "isLoading"
  | "otpComplete"
  | "maskedEmail"
  | "resendIsPending"
  | "handleSubmit"
  | "onSubmit"
  | "handleResend"
  | "handleDigitChange"
  | "handleKeyPress"
  | "formatTime"
>;

export function SignupVerifyOtpScreenView({
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
  resendIsPending,
  handleSubmit,
  onSubmit,
  handleResend,
  handleDigitChange,
  handleKeyPress,
  formatTime,
}: SignupVerifyOtpScreenViewProps) {
  const { t } = useTranslation();

  return (
    <RNView style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.outerContainer,
            { backgroundColor: palette.background },
          ]}
        >
          <AuthHeroBanner
            palette={palette}
            icon="✉️"
            title={t("auth.verifyOtp.title")}
            tagline={t("auth.verifyOtp.sentTo", { email: maskedEmail })}
          />

          <View style={styles.formContainer}>
            {/* OTP digit boxes */}
            <View style={styles.otpRow}>
              {otpDigits.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={{
                    width: 44,
                    height: 54,
                    borderWidth: 2,
                    borderRadius: 12,
                    textAlign: "center",
                    fontSize: 22,
                    fontWeight: "700",
                    color: palette.text,
                    backgroundColor: palette.textInputBackground,
                    borderColor: errors.otp
                      ? "#ef4444"
                      : digit
                        ? palette.green
                        : palette.textInputPlaceholder,
                  }}
                  value={digit}
                  onChangeText={(v) => handleDigitChange(index, v)}
                  onKeyPress={({ nativeEvent }) =>
                    handleKeyPress(index, nativeEvent.key)
                  }
                  keyboardType="numeric"
                  maxLength={1}
                  editable={!isLoading}
                  selectTextOnFocus
                />
              ))}
            </View>

            {/* OTP error */}
            {errors.otp && (
              <Text style={[styles.errorText, { textAlign: "center" }]}>
                {errors.otp.message}
              </Text>
            )}

            {/* Root error banner */}
            {errors.root?.message && <AuthErrorBanner message={errors.root.message} />}

            {/* Resend success banner */}
            {resendMessage && !errors.root && (
              <View
                style={[
                  styles.infoBanner,
                  { backgroundColor: "#dcfce7", borderLeftColor: "#16a34a" },
                ]}
              >
                <Text style={[styles.bannerText, { color: "#15803d" }]}>
                  {resendMessage}
                </Text>
              </View>
            )}

            {/* Timer & resend */}
            <View style={styles.timerSection}>
              <Text style={[styles.timerText, { color: palette.textGray }]}>
                {t("auth.verifyOtp.expiresIn")}
                <Text style={[styles.timerBold, { color: palette.text }]}>
                  {` ${formatTime(secondsLeft)}`}
                </Text>
              </Text>

              <View style={styles.resendRow}>
                <Text style={[styles.timerText, { color: palette.textGray }]}>
                  {t("auth.verifyOtp.notReceived")}
                </Text>
                {resendIsPending ? (
                  <ActivityIndicator size="small" color={palette.green} />
                ) : (
                  <TouchableOpacity
                    disabled={isLoading || resendCooldownLeft > 0}
                    onPress={() =>
                      !isLoading && resendCooldownLeft <= 0 && handleResend()
                    }
                  >
                    <Text
                      style={[
                        styles.resendText,
                        {
                          color:
                            isLoading || resendCooldownLeft > 0
                              ? palette.textInputPlaceholder
                              : palette.green,
                        },
                      ]}
                    >
                      {resendCooldownLeft > 0
                        ? t("auth.verifyOtp.resendWithTimer", {
                            time: formatTime(resendCooldownLeft),
                          })
                        : t("auth.verifyOtp.resend")}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <AuthSubmitButton
              title={t("auth.verifyOtp.submit")}
              isLoading={isLoading}
              disabled={!otpComplete}
              palette={palette}
              onPress={handleSubmit(onSubmit)}
            />
          </View>
        </View>
      </ScrollView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    justifyContent: "space-between",
  },
  formContainer: {
    gap: 16,
    paddingHorizontal: 8,
    paddingTop: 8,
    flex: 1,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 13,
  },
  infoBanner: {
    borderLeftWidth: 4,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bannerText: {
    fontSize: 13,
  },
  timerSection: {
    gap: 6,
    alignItems: "center",
  },
  timerText: {
    fontSize: 14,
  },
  timerBold: {
    fontWeight: "600",
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  resendText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
