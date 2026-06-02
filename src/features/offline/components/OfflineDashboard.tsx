import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Calendar, Map, Sprout, ScanLine, ChevronRight, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useOfflineDataContext } from '../context/OfflineDataContext';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import Colors from '@/src/constants/Colors';
import { formatDistanceToNow } from 'date-fns';
import { MotiView } from 'moti';
import { StatsGrid } from '../../home/components/StatsGrid';
import { OverviewCompletionCard } from '../../home/components/OverviewCompletionCard';
import { OfflineTodayTasksSection } from './OfflineTodayTasksSection';
import { useOfflineAgricultureStats } from '../hooks/useOfflineQueries';

export function OfflineDashboard() {
  const { t } = useTranslation();
  const { syncStatus, isInitialized } = useOfflineDataContext();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { data: stats, isLoading: statsLoading } = useOfflineAgricultureStats();
  const queryClient = useQueryClient();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['offline'] });
    setTimeout(() => {
      setRefreshing(false);
    }, 500); // small delay for UX
  }, [queryClient]);

  if (!isInitialized) {
    return (
      <View className="flex-1 items-center justify-center bg-background-light dark:bg-background-dark">
        <ActivityIndicator size="large" color={palette.primary} />
        <Text className="mt-4 text-slate-500 dark:text-slate-400 font-medium">{t('offline.loadingData', 'Loading offline workspace...')}</Text>
      </View>
    );
  }

  const renderStatusCard = (title: string, tableName: string, icon: React.ReactNode, index: number) => {
    const status = syncStatus[tableName];
    const lastSynced = status?.lastSyncedAt 
      ? formatDistanceToNow(new Date(status.lastSyncedAt), { addSuffix: true })
      : null;

    return (
      <MotiView 
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 200 + (index * 100) }}
        className="mb-4 flex-row items-center rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-800/80"
      >
        <View className="mr-5 h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary/20">
          {icon}
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">{title}</Text>
          <View className="flex-row items-center">
            <View className={`h-2 w-2 rounded-full mr-2 ${lastSynced ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
            <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {lastSynced 
                ? t('offline.lastSynced', { time: lastSynced }) 
                : t('offline.neverSynced', 'Never synced')}
            </Text>
          </View>
        </View>
      </MotiView>
    );
  };

  const hasData = Object.values(syncStatus).some(s => s.lastSyncedAt !== null);

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[palette.primary]}
            tintColor={palette.primary}
          />
        }
      >
        
        {/* Modern Header / Greeting Area */}
        <View className="px-5 pt-4 pb-6 mt-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500 mb-1">
                {t("plantManagement.overview.welcomeTitle", "Dashboard")}
              </Text>
              <Text className="text-2xl font-black text-slate-900 dark:text-white">
                {t("plantManagement.overview.appTitle", "Leafy Overview")}
              </Text>
            </View>
            <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
              <Sparkles size={20} color="#059669" />
            </View>
          </View>
        </View>

        <StatsGrid stats={stats} isLoading={statsLoading} />
        
        {stats && (
          <View className="px-5 mt-2 flex-col gap-6">
            <OverviewCompletionCard
              completed={stats.totalCompletedEvents}
              pending={stats.totalPendingEvents}
            />
          </View>
        )}

        <View className="mt-6 mb-2">
          <OfflineTodayTasksSection />
        </View>

        <View className="px-4 mt-2">
          <Text className="mb-4 ml-1 text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {t('offline.aiDiagnosticsTitle', 'AI Diagnostics')}
          </Text>

          <TouchableOpacity
            onPress={() => router.push('/(offline)/predict')}
            activeOpacity={0.8}
            className="mb-6 flex-row items-center rounded-2xl bg-emerald-600 p-5 shadow-sm"
          >
            <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <ScanLine size={24} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-white mb-1">
                {t('offline.aiPredictTitle', 'Scan Plant Disease')}
              </Text>
              <Text className="text-xs text-emerald-100 font-medium">
                {t('offline.aiPredictSubtitle', 'Use local AI to detect issues offline')}
              </Text>
            </View>
            <ChevronRight size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <Text className="mb-4 ml-1 text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {t('offline.syncStatus', 'Local Data Status')}
          </Text>

          {!hasData && (
            <MotiView 
              from={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mb-6 items-center rounded-3xl border border-gray-200 border-dashed bg-white/50 p-8 dark:border-slate-700 dark:bg-slate-800/50"
            >
              <AlertCircle size={40} color={palette.primary} className="mb-4 opacity-80" />
              <Text className="text-center text-base font-semibold text-slate-800 dark:text-slate-200 mb-2">
                {t('offline.noDataTitle', 'Workspace Empty')}
              </Text>
              <Text className="text-center text-sm text-slate-500 dark:text-slate-400">
                {t('offline.noData', 'Please connect to the internet and sync your data first.')}
              </Text>
            </MotiView>
          )}

          {renderStatusCard(
            t('offline.farms', 'Farms & Zones'), 
            'farm_plots', 
            <Map size={24} color={palette.primary} />, 
            0
          )}
          
          {renderStatusCard(
            t('offline.plants', 'Plants & Species'), 
            'plants', 
            <Sprout size={24} color={palette.primary} />, 
            1
          )}
          
          {renderStatusCard(
            t('offline.events', 'Plant Events'), 
            'plant_events', 
            <Calendar size={24} color={palette.primary} />, 
            2
          )}
        </View>
      </ScrollView>
    </View>
  );
}
