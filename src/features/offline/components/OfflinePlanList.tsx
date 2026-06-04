import React, { useState } from 'react';
import { View, FlatList, ActivityIndicator, Text, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useOfflinePlans, useOfflinePlanApplies, useOfflinePendingCount } from '../hooks/useOfflineQueries';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import Colors from '@/src/constants/Colors';
import { PlanCard } from '@/src/features/plan/components/PlanCard';
import { PlanApplyCard } from '@/src/features/plan/components/PlanApplyCard';
import { ClipboardList, Play, Lock } from 'lucide-react-native';
import { MotiView } from 'moti';
import type { PlanResponse, PlanApplyResponse } from '@/src/features/plan/schemas/plan.schema';

type PlanTab = "my" | "applied";

export function OfflinePlanList() {
  const { t } = useTranslation();
  const { data: plansPage, isLoading: plansLoading } = useOfflinePlans({ page: 0, size: 100 });
  const { data: appliesPage, isLoading: appliesLoading } = useOfflinePlanApplies({ page: 0, size: 100 });
  const { data: pendingCount } = useOfflinePendingCount();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const [activeTab, setActiveTab] = useState<PlanTab>("my");

  const plans = plansPage?.content || [];
  const applies = appliesPage?.content || [];
  const isLoading = activeTab === "my" ? plansLoading : appliesLoading;

  const handlePlanPress = (plan: PlanResponse) => {
    Alert.alert(
      plan.planName || plan.diseaseName || t('plan.card.unnamed', 'Unnamed Plan'),
      `${t('plan.card.severity', 'Severity')}: ${t(`plan.card.${(plan.severityLevel || 'LOW').toLowerCase()}`, plan.severityLevel || 'LOW')}\n` +
      `${t('plan.card.cost', 'Cost')}: ${plan.estimatedCost || '—'}\n` +
      `${t('plan.detail.confidence', 'Confidence')}: ${plan.confidenceScore ? Math.round(plan.confidenceScore * 100) + '%' : '—'}\n\n` +
      `${t('offline.readOnlyNotice', 'You are in offline mode. Data is read-only.')}`,
      [{ text: t('common.back', 'Back'), style: 'cancel' }]
    );
  };

  const handleApplyPress = (apply: PlanApplyResponse) => {
    Alert.alert(
      apply.planName || apply.diseaseName || t('plan.card.unnamed', 'Unnamed Apply'),
      `${t('plan.apply.status', 'Status')}: ${t(`plan.status.${apply.status}`, apply.status)}\n` +
      `${t('plan.apply.scope', 'Scope')}: ${apply.targetName || t('plan.apply.scopeUnknown', 'Unknown')}\n` +
      `${t('plan.apply.startDate', 'Start Date')}: ${apply.startDate || '—'}\n\n` +
      `${t('offline.readOnlyNotice', 'You are in offline mode. Data is read-only.')}`,
      [{ text: t('common.back', 'Back'), style: 'cancel' }]
    );
  };

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      {/* ── Tab Switcher ── */}
      <View className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <View className="flex-row rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <TouchableOpacity
            onPress={() => setActiveTab("my")}
            style={[
              styles.tabButton,
              activeTab === "my" ? { backgroundColor: isDark ? "#334155" : "#ffffff", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 } : undefined,
            ]}
          >
            <Lock size={16} color={activeTab === "my" ? palette.primary : "#64748b"} />
            <Text
              style={[styles.tabText, { color: activeTab === "my" ? palette.primary : "#64748b" }]}
              numberOfLines={1}
            >
              {t("plan.tabs.my", "My Plans")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("applied")}
            style={[
              styles.tabButton,
              activeTab === "applied" ? { backgroundColor: isDark ? "#334155" : "#ffffff", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 } : undefined,
            ]}
          >
            <Play size={16} color={activeTab === "applied" ? palette.primary : "#64748b"} />
            <Text
              style={[styles.tabText, { color: activeTab === "applied" ? palette.primary : "#64748b" }]}
              numberOfLines={1}
            >
              {t("plan.tabs.applied", "Applied Plans")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Pending sync badge */}
      {(pendingCount ?? 0) > 0 && (
        <View className="mx-4 mt-3 flex-row items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 px-4 py-2.5">
          <View className="h-2 w-2 rounded-full bg-amber-500" />
          <Text className="text-xs font-semibold text-amber-700 dark:text-amber-400">
            {t('offline.pendingChanges', { count: pendingCount, defaultValue: `${pendingCount} changes waiting to sync` })}
          </Text>
        </View>
      )}

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : (activeTab === "my" ? plans.length : applies.length) === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="items-center justify-center"
          >
            <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
              <ClipboardList size={40} color={palette.primary} />
            </View>
            <Text className="text-center text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
              {activeTab === "my" 
                ? t('plan.empty.myTitle', 'No plans found') 
                : t('plan.empty.appliedTitle', 'No applied plans')}
            </Text>
            <Text className="text-center text-sm text-slate-500 dark:text-slate-400 px-4">
              {activeTab === "my"
                ? t('plan.empty.myMessage', 'Connect to the internet to create or sync your cultivation plans.')
                : t('plan.empty.appliedMessage', 'Connect to the internet to apply plans to your plants or zones.')}
            </Text>
          </MotiView>
        </View>
      ) : activeTab === "my" ? (
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <PlanCard
              plan={item}
              onPress={handlePlanPress}
              variant="list"
            />
          )}
        />
      ) : (
        <FlatList
          data={applies}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <PlanApplyCard
              apply={item}
              onPress={handleApplyPress}
              variant="list"
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 8,
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
