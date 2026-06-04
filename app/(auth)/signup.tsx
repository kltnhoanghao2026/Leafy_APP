import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  View as RNView,
} from "react-native";
import { Controller } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useSignupScreen } from "@/src/features/auth/hooks";
import {
  AuthHeroBanner,
  AuthInput,
  AuthSubmitButton,
  AuthDivider,
  AuthSocialButton,
  AuthFooter,
  AuthLegalFooter,
  AuthErrorBanner,
} from "@/src/features/auth/components/ui";
import { useAuthContext } from "@/src/features/auth/context/AuthContext";
import { useNetworkContext } from "@/src/providers/NetworkProvider";

const SIGNUP_HERO_MIN_HEIGHT = 220;

export default function SignupScreen() {
  const { t } = useTranslation();
  const {
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
  } = useSignupScreen();

  const { loginOffline } = useAuthContext();
  const { toggleForceOffline } = useNetworkContext();

  const handleContinueOffline = async () => {
    const success = await loginOffline();
    if (success) {
      await toggleForceOffline();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['bottom', 'left', 'right','top']}>
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
            icon="🌿"
            title="Leafy"
            tagline={t("auth.signup.tagline")}
            minHeight={SIGNUP_HERO_MIN_HEIGHT}
          />

          <View style={styles.formContainer}>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <AuthInput
                  label="Full Name"
                  error={touchedFields.fullName && errors.fullName ? errors.fullName.message : undefined}
                  palette={palette}
                  placeholder="John Doe"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  editable={!isLoading}
                  autoCapitalize="words"
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <AuthInput
                  label={t("auth.signup.email")}
                  error={touchedFields.email && errors.email ? errors.email.message : undefined}
                  palette={palette}
                  placeholder="example@email.com"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  editable={!isLoading}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              )}
            />

            <Controller
              control={control}
              name="phoneNumber"
              render={({ field: { onChange, onBlur, value } }) => (
                <AuthInput
                  label={t("auth.signup.phoneOptional")}
                  error={touchedFields.phoneNumber && errors.phoneNumber ? errors.phoneNumber.message : undefined}
                  palette={palette}
                  placeholder={t("auth.signup.phonePlaceholder")}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  editable={!isLoading}
                  keyboardType="phone-pad"
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <AuthInput
                  label={t("auth.signup.password")}
                  error={touchedFields.password && errors.password ? errors.password.message : undefined}
                  palette={palette}
                  placeholder={t("auth.signup.passwordPlaceholder")}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  editable={!isLoading}
                  secureTextEntry={!showPassword}
                  rightElement={
                    <TouchableOpacity
                      onPress={handleTogglePassword}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      {showPassword ? (
                        <Eye size={20} color={palette.textInputPlaceholder} />
                      ) : (
                        <EyeOff size={20} color={palette.textInputPlaceholder} />
                      )}
                    </TouchableOpacity>
                  }
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <AuthInput
                  label={t("auth.signup.confirmPassword")}
                  error={touchedFields.confirmPassword && errors.confirmPassword ? errors.confirmPassword.message : undefined}
                  palette={palette}
                  placeholder={t("auth.signup.confirmPasswordPlaceholder")}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  editable={!isLoading}
                  secureTextEntry={!showConfirmPassword}
                  rightElement={
                    <TouchableOpacity
                      onPress={handleToggleConfirmPassword}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      {showConfirmPassword ? (
                        <Eye size={20} color={palette.textInputPlaceholder} />
                      ) : (
                        <EyeOff size={20} color={palette.textInputPlaceholder} />
                      )}
                    </TouchableOpacity>
                  }
                />
              )}
            />

            {errors.root?.message && <AuthErrorBanner message={errors.root.message} />}

            {/* Terms checkbox */}
            <TouchableOpacity
              onPress={handleToggleTermsAccepted}
              activeOpacity={0.85}
            >
              <View style={styles.termsRow}>
                <RNView
                  style={[
                    styles.checkbox,
                    {
                      borderColor: isTermsAccepted
                        ? palette.green
                        : palette.textInputPlaceholder,
                      backgroundColor: isTermsAccepted
                        ? palette.green
                        : "transparent",
                    },
                  ]}
                >
                  {isTermsAccepted ? (
                    <Text style={styles.checkmark}>✓</Text>
                  ) : null}
                </RNView>
                <Text
                  style={[
                    styles.termsText,
                    { color: palette.textInputPlaceholder },
                  ]}
                >
                  {t("auth.signup.agreeTerms")}
                </Text>
              </View>
            </TouchableOpacity>

            <AuthSubmitButton
              title={t("auth.signup.submit")}
              isLoading={isLoading}
              disabled={!isValid || !isTermsAccepted}
              palette={palette}
              onPress={handleSubmit(onSubmit)}
            />

            <AuthDivider palette={palette} text={t("auth.signup.orSignupWith")} />

            <AuthSocialButton
              palette={palette}
              title={t("auth.signup.continueWithGoogle")}
              onPress={() => console.log("Google signup pressed")}
            />

            <AuthFooter
              palette={palette}
              message={t("auth.signup.haveAccount")}
              linkText={t("auth.signup.signin")}
              onPressLink={handlePressSignin}
            />

            <TouchableOpacity
              onPress={handleContinueOffline}
              style={[
                styles.offlineButton,
                { borderColor: palette.primary, backgroundColor: palette.background }
              ]}
            >
              <Text style={[styles.offlineButtonText, { color: palette.primary }]}>
                {t("offline.continueOffline", "Continue Offline")}
              </Text>
            </TouchableOpacity>

            <AuthLegalFooter palette={palette} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: "space-between",
  },
  formContainer: {
    gap: 12,
    paddingHorizontal: 8,
    paddingTop: 4,
    flex: 1,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkmark: {
    fontSize: 12,
    color: "white",
    fontWeight: "700",
  },
  termsText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  offlineButton: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  offlineButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
