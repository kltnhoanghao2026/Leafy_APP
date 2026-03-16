import {
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  TextInput,
  View as RNView,
} from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import * as Tamagui from "tamagui";
import { useTranslation } from "react-i18next";
import type { UseSignupVerifyOtpScreenResult } from "../hooks/useSignupVerifyOtpScreen";

const { Button, Spinner, Text, View, XStack, YStack } = Tamagui as any;

const BACKGROUND_IMAGE =
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1773284624/login-background_mwwssi.webp";

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
        <YStack
          flex={1}
          paddingHorizontal="$4"
          paddingVertical="$6"
          justifyContent="space-between"
          style={{ backgroundColor: palette.background }}
        >
          <ImageBackground
            source={{ uri: BACKGROUND_IMAGE }}
            style={{
              width: "auto",
              marginHorizontal: -40,
              marginTop: -40,
              paddingHorizontal: 0,
            }}
            imageStyle={{ opacity: 0.6 }}
          >
            <RNView
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                left: 0,
                bottom: 0,
                width: "100%",
              }}
            >
              <Svg width="100%" height="100%" preserveAspectRatio="none">
                <Defs>
                  <LinearGradient id="otpOverlay" x1="0" y1="0" x2="0" y2="1">
                    <Stop
                      offset="0%"
                      stopColor={palette.background}
                      stopOpacity={0}
                    />
                    <Stop
                      offset="65%"
                      stopColor={palette.background}
                      stopOpacity={0.28}
                    />
                    <Stop
                      offset="100%"
                      stopColor={palette.background}
                      stopOpacity={1}
                    />
                  </LinearGradient>
                </Defs>
                <Rect
                  x="0"
                  y="0"
                  width="100%"
                  height="100%"
                  fill="url(#otpOverlay)"
                />
              </Svg>
            </RNView>

            <YStack
              alignItems="center"
              gap="$3"
              paddingTop="$6"
              paddingBottom="$3"
            >
              <RNView
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 44,
                  backgroundColor: palette.textInputBackground,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text fontSize={44} color={palette.green} fontWeight="bold">
                  ✉️
                </Text>
              </RNView>

              <Text
                fontSize={30}
                fontWeight="700"
                color={palette.text}
                letterSpacing={-0.5}
              >
                {t("auth.verifyOtp.title")}
              </Text>

              <Text
                fontSize={14}
                color={palette.textGray}
                textAlign="center"
                fontWeight="400"
                lineHeight={21}
              >
                {t("auth.verifyOtp.sentTo", { email: maskedEmail })}
              </Text>
            </YStack>
          </ImageBackground>

          <YStack gap="$4" paddingHorizontal="$2" paddingTop="$2" flex={1}>
            <XStack justifyContent="center" gap="$2" marginTop="$2">
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
            </XStack>

            {errors.otp && (
              <Text color="$red10" fontSize="$2" textAlign="center">
                {errors.otp.message}
              </Text>
            )}

            {errors.root && (
              <View
                background="$red2"
                borderLeftWidth={4}
                borderLeftColor="$red9"
                borderRadius="$3"
                paddingHorizontal="$3"
                paddingVertical="$2"
              >
                <Text color="$red10" fontSize="$2">
                  {errors.root.message}
                </Text>
              </View>
            )}

            {resendMessage && !errors.root && (
              <View
                background="$green2"
                borderLeftWidth={4}
                borderLeftColor="$green9"
                borderRadius="$3"
                paddingHorizontal="$3"
                paddingVertical="$2"
              >
                <Text color="$green10" fontSize="$2">
                  {resendMessage}
                </Text>
              </View>
            )}

            <YStack gap="$1.5" alignItems="center">
              <Text fontSize="$3" color={palette.textGray}>
                {t("auth.verifyOtp.expiresIn")}
                <Text fontWeight="600" color={palette.text}>
                  {` ${formatTime(secondsLeft)}`}
                </Text>
              </Text>

              <XStack justifyContent="center" alignItems="center" gap="$1">
                <Text fontSize="$3" color={palette.textGray}>
                  {t("auth.verifyOtp.notReceived")}
                </Text>
                {resendIsPending ? (
                  <Spinner size="small" color={palette.green} />
                ) : (
                  <TouchableOpacity
                    disabled={isLoading || resendCooldownLeft > 0}
                    onPress={() =>
                      !isLoading && resendCooldownLeft <= 0 && handleResend()
                    }
                  >
                    <Text
                      fontSize="$3"
                      color={
                        isLoading || resendCooldownLeft > 0
                          ? palette.textInputPlaceholder
                          : palette.green
                      }
                      fontWeight="600"
                    >
                      {resendCooldownLeft > 0
                        ? t("auth.verifyOtp.resendWithTimer", {
                            time: formatTime(resendCooldownLeft),
                          })
                        : t("auth.verifyOtp.resend")}
                    </Text>
                  </TouchableOpacity>
                )}
              </XStack>
            </YStack>

            <Button
              size="$5"
              backgroundColor={palette.green}
              color="white"
              borderRadius="$8"
              fontWeight="600"
              fontSize={18}
              pressStyle={{ opacity: 0.9 }}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading || !otpComplete}
              opacity={isLoading || !otpComplete ? 0.6 : 1}
              icon={isLoading ? <Spinner color="white" /> : undefined}
            >
              {isLoading ? null : t("auth.verifyOtp.submit")}
            </Button>
          </YStack>
        </YStack>
      </ScrollView>
    </RNView>
  );
}
