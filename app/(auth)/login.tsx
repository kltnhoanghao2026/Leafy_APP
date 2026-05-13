import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import { Controller } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useLoginScreen } from "@/src/features/auth/hooks";
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
} from "@/src/features/auth/components/ui";
import { useAuthContext } from "@/src/features/auth/context/AuthContext";
import { getProfileInfo } from "@/src/lib/secure-user-storage";
import { getOfflineSyncStatus } from "@/src/lib/offline-query.service";
import { initOfflineDatabase } from "@/src/lib/offline-database";
import { useNetworkContext } from "@/src/providers/NetworkProvider";
import { useEffect, useState } from "react";

import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const { t } = useTranslation();
  const {
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
  } = useLoginScreen();

  const { loginOffline } = useAuthContext();
  const { toggleForceOffline } = useNetworkContext();
  const [canOffline, setCanOffline] = useState(false);
  const [checkingOffline, setCheckingOffline] = useState(true);

  useEffect(() => {
    const checkOfflineCapability = async () => {
      try {
        const cachedProfile = await getProfileInfo();
        if (cachedProfile) {
          await initOfflineDatabase();
          const syncStatus = await getOfflineSyncStatus();
          const hasData = Object.values(syncStatus).some(s => s.lastSyncedAt !== null);
          if (hasData) {
            setCanOffline(true);
          }
        }
      } catch (e) {
        console.error("Failed to check offline capability", e);
      } finally {
        setCheckingOffline(false);
      }
    };
    checkOfflineCapability();
  }, []);

  const handleContinueOffline = async () => {
    const success = await loginOffline();
    if (success) {
      await toggleForceOffline();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['bottom', 'left', 'right', 'top']}>
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

            {!checkingOffline && canOffline && (
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
            )}
            {checkingOffline && (
              <ActivityIndicator color={palette.primary} style={{ marginTop: 16 }} />
            )}
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
  offlineButton: {
    marginTop: 16,
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
