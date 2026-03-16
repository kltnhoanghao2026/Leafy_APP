import {
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  View as RNView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller } from "react-hook-form";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { Eye, EyeOff, Languages } from "lucide-react-native";
import * as Tamagui from "tamagui";
import { useTranslation } from "react-i18next";
import type { UseLoginScreenResult } from "../hooks/useLoginScreen";

const { Button, Input, Separator, Spinner, Text, View, XStack, YStack } =
  Tamagui as any;

const BACKGROUND_IMAGE =
  "https://res.cloudinary.com/dbmtxumro/image/upload/v1773284624/login-background_mwwssi.webp";

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

type LoginScreenViewProps = Pick<
  UseLoginScreenResult,
  | "palette"
  | "control"
  | "handleSubmit"
  | "errors"
  | "touchedFields"
  | "isLoading"
  | "isValid"
  | "showPassword"
  | "onSubmit"
  | "handleTogglePassword"
  | "handlePressSignup"
>;

export function LoginScreenView({
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
}: LoginScreenViewProps) {
  const { t, i18n } = useTranslation();

  const handleToggleLanguage = async () => {
    const currentLanguage = i18n.resolvedLanguage ?? i18n.language;
    await i18n.changeLanguage(currentLanguage === "vi" ? "en" : "vi");
  };

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
          <XStack position="absolute" top="$2" right="$6" zIndex={10}>
            <TouchableOpacity
              onPress={handleToggleLanguage}
              activeOpacity={0.8}
            >
              <XStack
                alignItems="center"
                gap="$1.5"
                paddingHorizontal="$3"
                paddingVertical="$1.5"
                borderRadius="$8"
                borderWidth={1}
                borderColor={palette.textInputPlaceholder}
                backgroundColor={palette.textInputBackground}
              >
                <Languages size={16} color={palette.textInputPlaceholder} />
                <Text
                  fontSize={12}
                  fontWeight="700"
                  color={palette.textInputPlaceholder}
                >
                  {(i18n.resolvedLanguage ?? i18n.language) === "vi"
                    ? "EN"
                    : "VI"}
                </Text>
              </XStack>
            </TouchableOpacity>
          </XStack>

          <ImageBackground
            source={{ uri: BACKGROUND_IMAGE }}
            style={{
              width: "auto",
              marginHorizontal: -40,
              marginTop: -32,
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
                    id="headerOverlay"
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
                  fill="url(#headerOverlay)"
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
                <Text fontSize={46} color={palette.green} fontWeight="bold">
                  🌿
                </Text>
              </RNView>

              <Text
                fontSize={32}
                fontWeight="700"
                color={palette.text}
                letterSpacing={-0.5}
              >
                Leafy
              </Text>

              <Text
                fontSize={14}
                color={palette.textGray}
                textAlign="center"
                fontWeight="400"
                lineHeight={21}
              >
                {t("auth.login.tagline")}
              </Text>
            </YStack>
          </ImageBackground>

          <YStack gap="$5" paddingHorizontal="$2" paddingTop="$4" flex={1}>
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
                          {t("auth.login.email")}
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
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <YStack gap="$2">
                  {(() => {
                    const hasPasswordError =
                      touchedFields.password && errors.password;

                    return (
                      <>
                        <XStack
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Text
                            fontSize={16}
                            fontWeight="600"
                            color={palette.text}
                          >
                            {t("auth.login.password")}
                          </Text>
                          <TouchableOpacity>
                            <Text
                              fontSize={14}
                              color={palette.green}
                              fontWeight="500"
                            >
                              {t("auth.login.forgotPassword")}
                            </Text>
                          </TouchableOpacity>
                        </XStack>
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
                            placeholder={t("auth.login.passwordPlaceholder")}
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

            <Button
              size="$5"
              backgroundColor={palette.green}
              color="white"
              borderRadius="$8"
              fontWeight="600"
              fontSize={18}
              pressStyle={{ opacity: 0.9 }}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading || !isValid}
              opacity={isLoading || !isValid ? 0.6 : 1}
              icon={isLoading ? <Spinner color="white" /> : undefined}
            >
              {isLoading ? null : t("auth.login.submit")}
            </Button>

            <XStack alignItems="center" gap="$3">
              <Separator flex={1} borderColor={palette.textInputPlaceholder} />
              <Text
                fontSize={12}
                color={palette.textInputPlaceholder}
                letterSpacing={0.5}
                fontWeight="600"
              >
                {t("auth.login.orLoginWith")}
              </Text>
              <Separator flex={1} borderColor={palette.textInputPlaceholder} />
            </XStack>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => console.log("Google login pressed")}
            >
              <XStack
                borderRadius="$8"
                borderWidth={1}
                borderColor={palette.textInputPlaceholder}
                paddingVertical="$3"
                paddingHorizontal="$4"
                backgroundColor={palette.textInputBackground}
                alignItems="center"
                justifyContent="center"
                gap="$2"
              >
                <GoogleIcon color={palette.text} />
                <Text fontSize={16} fontWeight="600" color={palette.text}>
                  {t("auth.login.continueWithGoogle")}
                </Text>
              </XStack>
            </TouchableOpacity>

            <XStack justifyContent="center" gap="$1">
              <Text fontSize={14} color={palette.textGray}>
                {t("auth.login.noAccount")}
              </Text>
              <TouchableOpacity onPress={handlePressSignup}>
                <Text fontSize={14} color={palette.green} fontWeight="600">
                  {t("auth.login.signupNow")}
                </Text>
              </TouchableOpacity>
            </XStack>
          </YStack>

          <YStack
            gap="$3"
            paddingTop="$5"
            paddingBottom="$2"
            alignItems="center"
          >
            <XStack gap="$3" justifyContent="center">
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
