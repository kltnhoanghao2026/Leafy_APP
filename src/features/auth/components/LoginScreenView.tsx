import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import type { UseLoginScreenResult } from "../hooks/useLoginScreen";
import {
  AuthHeroBanner,
  AuthInput,
  AuthSubmitButton,
  AuthDivider,
  AuthSocialButton,
  AuthFooter,
  AuthLegalFooter,
  AuthLanguageToggle,
  AuthErrorBanner,
} from "./ui";

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
  const { t } = useTranslation();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
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
          <AuthLanguageToggle palette={palette} />

          <AuthHeroBanner
            palette={palette}
            icon="🌿"
            title="Leafy"
            tagline={t("auth.login.tagline")}
          />

          <View style={styles.formContainer}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <AuthInput
                  label={t("auth.login.email")}
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
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <AuthInput
                  label={t("auth.login.password")}
                  error={touchedFields.password && errors.password ? errors.password.message : undefined}
                  palette={palette}
                  placeholder={t("auth.login.passwordPlaceholder")}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  editable={!isLoading}
                  secureTextEntry={!showPassword}
                  headerRightElement={
                    <TouchableOpacity>
                      <Text style={[styles.forgotText, { color: palette.green }]}>
                        {t("auth.login.forgotPassword")}
                      </Text>
                    </TouchableOpacity>
                  }
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

            {errors.root?.message && <AuthErrorBanner message={errors.root.message} />}

            <AuthSubmitButton
              title={t("auth.login.submit")}
              isLoading={isLoading}
              disabled={!isValid}
              palette={palette}
              onPress={handleSubmit(onSubmit)}
            />

            <AuthDivider palette={palette} text={t("auth.login.orLoginWith")} />

            <AuthSocialButton
              palette={palette}
              title={t("auth.login.continueWithGoogle")}
              onPress={() => console.log("Google login pressed")}
            />

            <AuthFooter
              palette={palette}
              message={t("auth.login.noAccount")}
              linkText={t("auth.login.signupNow")}
              onPressLink={handlePressSignup}
            />
          </View>

          <AuthLegalFooter palette={palette} />
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
    gap: 20,
    paddingHorizontal: 8,
    paddingTop: 16,
    flex: 1,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
