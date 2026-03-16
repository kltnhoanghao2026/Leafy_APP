import {
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  View as RNView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller } from "react-hook-form";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { Eye, EyeOff } from "lucide-react-native";
import * as Tamagui from "tamagui";
import { useTranslation } from "react-i18next";
import type { UseSignupScreenResult } from "../hooks/useSignupScreen";

const { Button, Input, Separator, Spinner, Text, View, XStack, YStack } =
  Tamagui as any;

const BACKGROUND_IMAGE =
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1773284624/login-background_mwwssi.webp";
const SIGNUP_HERO_MIN_HEIGHT = 220;

function GoogleIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 640 640" fill="none">
      <Path
        fill={color}
        d="M564 325.8C564 467.3 467.1 568 324 568C186.8 568 76 457.2 76 320C76 182.8 186.8 72 324 72C390.8 72 447 96.5 490.3 136.9L422.8 201.8C334.5 116.6 170.3 180.6 170.3 320C170.3 406.5 239.4 476.6 324 476.6C422.2 476.6 459 406.2 464.8 369.7L324 369.7L324 284.4L560.1 284.4C562.4 297.1 564 309.3 564 325.8z"
      />
    </Svg>
  );
}

type SignupScreenViewProps = Pick<
  UseSignupScreenResult,
  | "palette"
  | "control"
  | "handleSubmit"
  | "errors"
  | "touchedFields"
  | "isLoading"
  | "isValid"
  | "isTermsAccepted"
  | "showPassword"
  | "showConfirmPassword"
  | "onSubmit"
  | "handleTogglePassword"
  | "handleToggleConfirmPassword"
  | "handleToggleTermsAccepted"
  | "handlePressSignin"
>;

export function SignupScreenView({
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
}: SignupScreenViewProps) {
  const { t } = useTranslation();

  const fieldContainerStyle = {
    borderRadius: "$12",
    borderWidth: 1,
    paddingHorizontal: "$4",
    backgroundColor: palette.textInputBackground,
    alignItems: "center",
    gap: "$2",
  };

  const fieldInputStyle = {
    flex: 1,
    size: "$4",
    borderWidth: 0,
    backgroundColor: "transparent",
    fontSize: 16,
    color: palette.text,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <YStack
          flex={1}
          paddingHorizontal="$4"
          paddingVertical="$4"
          justifyContent="space-between"
          style={{ backgroundColor: palette.background }}
        >
          <ImageBackground
            source={{ uri: BACKGROUND_IMAGE }}
            style={{
              width: "auto",
              marginHorizontal: -40,
              marginTop: -32,
              minHeight: SIGNUP_HERO_MIN_HEIGHT,
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
                  <LinearGradient
                    id="signupOverlay"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <Stop
                      offset="0%"
                      stopColor={palette.background}
                      stopOpacity={0}
                    />
                    <Stop
                      offset="58%"
                      stopColor={palette.background}
                      stopOpacity={0.24}
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
                  fill="url(#signupOverlay)"
                />
              </Svg>
            </RNView>

            <YStack
              alignItems="center"
              gap="$2"
              paddingTop="$5"
              paddingBottom="$2"
            >
              <RNView
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: palette.textInputBackground,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text fontSize={38} color={palette.green} fontWeight="bold">
                  🌿
                </Text>
              </RNView>

              <Text
                fontSize={28}
                fontWeight="700"
                color={palette.text}
                letterSpacing={-0.5}
              >
                Leafy
              </Text>

              <Text
                fontSize={13}
                color={palette.textGray}
                textAlign="center"
                fontWeight="400"
                lineHeight={19}
              >
                {t("auth.signup.tagline")}
              </Text>
            </YStack>
          </ImageBackground>

          <YStack gap="$3" paddingHorizontal="$2" paddingTop="$1" flex={1}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <YStack gap="$2">
                  {(() => {
                    const hasEmailError = touchedFields.email && errors.email;

                    return (
                      <>
                        <Text
                          fontSize={16}
                          fontWeight="600"
                          color={palette.text}
                        >
                          {t("auth.signup.email")}
                        </Text>
                        <XStack
                          {...fieldContainerStyle}
                          borderColor={
                            hasEmailError
                              ? "$red9"
                              : palette.textInputPlaceholder
                          }
                        >
                          <Input
                            {...fieldInputStyle}
                            placeholder="example@email.com"
                            placeholderTextColor={palette.textInputPlaceholder}
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            editable={!isLoading}
                            autoCapitalize="none"
                            keyboardType="email-address"
                          />
                        </XStack>
                        {hasEmailError && (
                          <Text color="$red10" fontSize="$2">
                            {errors.email?.message}
                          </Text>
                        )}
                      </>
                    );
                  })()}
                </YStack>
              )}
            />

            <Controller
              control={control}
              name="phoneNumber"
              render={({ field: { onChange, onBlur, value } }) => (
                <YStack gap="$2">
                  {(() => {
                    const hasPhoneError =
                      touchedFields.phoneNumber && errors.phoneNumber;

                    return (
                      <>
                        <Text
                          fontSize={16}
                          fontWeight="600"
                          color={palette.text}
                        >
                          {t("auth.signup.phoneOptional")}
                        </Text>
                        <XStack
                          {...fieldContainerStyle}
                          borderColor={
                            hasPhoneError
                              ? "$red9"
                              : palette.textInputPlaceholder
                          }
                        >
                          <Input
                            {...fieldInputStyle}
                            placeholder={t("auth.signup.phonePlaceholder")}
                            placeholderTextColor={palette.textInputPlaceholder}
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            editable={!isLoading}
                            keyboardType="phone-pad"
                          />
                        </XStack>
                        {hasPhoneError && (
                          <Text color="$red10" fontSize="$2">
                            {errors.phoneNumber?.message}
                          </Text>
                        )}
                      </>
                    );
                  })()}
                </YStack>
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <YStack gap="$2">
                  {(() => {
                    const hasPasswordError =
                      touchedFields.password && errors.password;

                    return (
                      <>
                        <Text
                          fontSize={16}
                          fontWeight="600"
                          color={palette.text}
                        >
                          {t("auth.signup.password")}
                        </Text>
                        <XStack
                          {...fieldContainerStyle}
                          borderColor={
                            hasPasswordError
                              ? "$red9"
                              : palette.textInputPlaceholder
                          }
                        >
                          <Input
                            {...fieldInputStyle}
                            placeholder={t("auth.signup.passwordPlaceholder")}
                            placeholderTextColor={palette.textInputPlaceholder}
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            editable={!isLoading}
                            secureTextEntry={!showPassword}
                          />
                          <TouchableOpacity
                            onPress={handleTogglePassword}
                            hitSlop={{
                              top: 10,
                              bottom: 10,
                              left: 10,
                              right: 10,
                            }}
                          >
                            {showPassword ? (
                              <Eye
                                size={20}
                                color={palette.textInputPlaceholder}
                              />
                            ) : (
                              <EyeOff
                                size={20}
                                color={palette.textInputPlaceholder}
                              />
                            )}
                          </TouchableOpacity>
                        </XStack>
                        {hasPasswordError && (
                          <Text color="$red10" fontSize="$2">
                            {errors.password?.message}
                          </Text>
                        )}
                      </>
                    );
                  })()}
                </YStack>
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <YStack gap="$2">
                  {(() => {
                    const hasConfirmError =
                      touchedFields.confirmPassword && errors.confirmPassword;

                    return (
                      <>
                        <Text
                          fontSize={16}
                          fontWeight="600"
                          color={palette.text}
                        >
                          {t("auth.signup.confirmPassword")}
                        </Text>
                        <XStack
                          {...fieldContainerStyle}
                          borderColor={
                            hasConfirmError
                              ? "$red9"
                              : palette.textInputPlaceholder
                          }
                        >
                          <Input
                            {...fieldInputStyle}
                            placeholder={t(
                              "auth.signup.confirmPasswordPlaceholder",
                            )}
                            placeholderTextColor={palette.textInputPlaceholder}
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            editable={!isLoading}
                            secureTextEntry={!showConfirmPassword}
                          />
                          <TouchableOpacity
                            onPress={handleToggleConfirmPassword}
                            hitSlop={{
                              top: 10,
                              bottom: 10,
                              left: 10,
                              right: 10,
                            }}
                          >
                            {showConfirmPassword ? (
                              <Eye
                                size={20}
                                color={palette.textInputPlaceholder}
                              />
                            ) : (
                              <EyeOff
                                size={20}
                                color={palette.textInputPlaceholder}
                              />
                            )}
                          </TouchableOpacity>
                        </XStack>
                        {hasConfirmError && (
                          <Text color="$red10" fontSize="$2">
                            {errors.confirmPassword?.message}
                          </Text>
                        )}
                      </>
                    );
                  })()}
                </YStack>
              )}
            />

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

            <TouchableOpacity
              onPress={handleToggleTermsAccepted}
              activeOpacity={0.85}
            >
              <XStack alignItems="flex-start" gap="$2">
                <RNView
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    borderWidth: 1.5,
                    borderColor: isTermsAccepted
                      ? palette.green
                      : palette.textInputPlaceholder,
                    backgroundColor: isTermsAccepted
                      ? palette.green
                      : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 1,
                  }}
                >
                  {isTermsAccepted ? (
                    <Text fontSize={12} color="white" fontWeight="700">
                      ✓
                    </Text>
                  ) : null}
                </RNView>
                <Text
                  fontSize={12}
                  color={palette.textInputPlaceholder}
                  lineHeight={18}
                  flex={1}
                >
                  {t("auth.signup.agreeTerms")}
                </Text>
              </XStack>
            </TouchableOpacity>

            <Button
              size="$4"
              backgroundColor={palette.green}
              color="white"
              borderRadius="$8"
              fontWeight="600"
              fontSize={16}
              pressStyle={{ opacity: 0.9 }}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading || !isValid || !isTermsAccepted}
              opacity={isLoading || !isValid || !isTermsAccepted ? 0.6 : 1}
              icon={isLoading ? <Spinner color="white" /> : undefined}
            >
              {isLoading ? null : t("auth.signup.submit")}
            </Button>

            <XStack alignItems="center" gap="$3">
              <Separator flex={1} borderColor={palette.textInputPlaceholder} />
              <Text
                fontSize={12}
                color={palette.textInputPlaceholder}
                letterSpacing={0.5}
                fontWeight="600"
              >
                {t("auth.signup.orSignupWith")}
              </Text>
              <Separator flex={1} borderColor={palette.textInputPlaceholder} />
            </XStack>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => console.log("Google signup pressed")}
            >
              <XStack
                borderRadius="$8"
                borderWidth={1}
                borderColor={palette.textInputPlaceholder}
                paddingVertical="$2.5"
                paddingHorizontal="$4"
                backgroundColor={palette.textInputBackground}
                alignItems="center"
                justifyContent="center"
                gap="$2"
              >
                <GoogleIcon color={palette.text} />
                <Text fontSize={15} fontWeight="600" color={palette.text}>
                  {t("auth.signup.continueWithGoogle")}
                </Text>
              </XStack>
            </TouchableOpacity>

            <XStack justifyContent="center" gap="$1">
              <Text fontSize={14} color={palette.textGray}>
                {t("auth.signup.haveAccount")}
              </Text>
              <TouchableOpacity onPress={handlePressSignin}>
                <Text fontSize={14} color={palette.green} fontWeight="600">
                  {t("auth.signup.signin")}
                </Text>
              </TouchableOpacity>
            </XStack>

            <XStack gap="$3" justifyContent="center" paddingTop="$1">
              <TouchableOpacity>
                <Text
                  fontSize={12}
                  color={palette.textInputPlaceholder}
                  textDecorationLine="underline"
                >
                  {t("auth.legal.terms")}
                </Text>
              </TouchableOpacity>
              <Text fontSize={12} color={palette.textInputPlaceholder}>
                •
              </Text>
              <TouchableOpacity>
                <Text
                  fontSize={12}
                  color={palette.textInputPlaceholder}
                  textDecorationLine="underline"
                >
                  {t("auth.legal.privacy")}
                </Text>
              </TouchableOpacity>
            </XStack>
          </YStack>
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}
