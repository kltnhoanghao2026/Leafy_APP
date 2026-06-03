import React from "react";
import { View, ScrollView, Text, Switch } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { Globe, Moon, Database, Wifi } from "lucide-react-native";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";

import { changeAppLanguage, getCurrentLanguage } from "@/src/i18n";
import { ProfileRow } from "@/src/features/user-profile/components/ProfileRow";
import { useNetworkContext } from "@/src/providers/NetworkProvider";

export function OfflineSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colorScheme: nativeWindColorScheme, setColorScheme } = useNativeWindColorScheme();
  const currentLanguage = getCurrentLanguage();
  const { toggleForceOffline } = useNetworkContext();

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View className="mx-4 mt-6">
          <Text className="mb-3 ml-1 text-base font-bold tracking-wide text-slate-900 dark:text-slate-100">
            {t("offline.settings", "Cài đặt")}
          </Text>
          <View className="overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-800/80">
            <ProfileRow
              icon={<Globe color="#A855F7" size={20} />}
              iconBgClass="bg-purple-500/10"
              title={t("profile.language", "Ngôn ngữ")}
              divider
              colorClass="text-slate-900 dark:text-slate-100"
              onPress={() => {
                void changeAppLanguage(currentLanguage === "vi" ? "en" : "vi");
              }}
              rightElement={
                <Text className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {currentLanguage === "vi" ? t("profile.languageVi", "Tiếng Việt") : t("profile.languageEn", "English")}
                </Text>
              }
            />
            <ProfileRow
              icon={<Moon color="#10B981" size={20} />}
              iconBgClass="bg-emerald-500/10"
              title={t("profile.darkMode", "Chế độ tối")}
              colorClass="text-slate-900 dark:text-slate-100"
              divider
              rightElement={
                <Switch
                  value={nativeWindColorScheme === "dark"}
                  onValueChange={(val) => setColorScheme(val ? "dark" : "light")}
                  trackColor={{ false: "#CBD5E1", true: "#10B981" }}
                  thumbColor="#FFFFFF"
                />
              }
            />
            <ProfileRow
              icon={<Database color="#F59E0B" size={20} />}
              iconBgClass="bg-amber-500/10"
              title={"Debug SQLite (Sync Screen)"}
              colorClass="text-slate-900 dark:text-slate-100"
              divider
              onPress={() => router.push("/(offline)/sync")}
            />
            <ProfileRow
              icon={<Wifi color="#3B82F6" size={20} />}
              iconBgClass="bg-blue-500/10"
              title={t("offline.goOnline", "Go Online")}
              colorClass="text-slate-900 dark:text-slate-100"
              onPress={() => toggleForceOffline()}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
