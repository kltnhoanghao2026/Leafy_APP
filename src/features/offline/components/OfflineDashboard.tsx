import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CloudOff, RefreshCw, AlertCircle, Calendar, Map, Sprout } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOfflineDataContext } from '../context/OfflineDataContext';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import Colors from '@/src/constants/Colors';
import { formatDistanceToNow } from 'date-fns';
import { MotiView } from 'moti';

export function OfflineDashboard() {
  const { t } = useTranslation();
  const { syncStatus, isInitialized } = useOfflineDataContext();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        
        {/* Premium Hero Section */}
        <MotiView 
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          className="mx-4 mt-6 mb-8 overflow-hidden rounded-3xl bg-primary/10 px-6 py-8 shadow-sm dark:bg-[#1E2923]"
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-sm">
              <CloudOff size={24} color="#FFF" />
            </View>
            <View className="rounded-full bg-primary/20 px-3 py-1 dark:bg-primary/30">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-primary dark:text-primary-light">
                {t('offline.readOnly', 'Read Only Mode')}
              </Text>
            </View>
          </View>
          
          <Text className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 mb-2">
            {t('offline.dashboardTitle', 'Offline Workspace')}
          </Text>
          <Text className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {t('offline.dashboardDesc', 'You are currently disconnected from the main server. Your cached farms, plants, and events are available here for reference.')}
          </Text>

          <TouchableOpacity
            onPress={() => router.push('/(main)/sync' as any)}
            activeOpacity={0.8}
            className="mt-5 flex-row items-center justify-center rounded-2xl bg-primary px-5 py-3 shadow-sm"
          >
            <RefreshCw size={15} color="#fff" style={{ marginRight: 8 }} />
            <Text className="text-sm font-bold text-white">
              {t('offline.sync.syncNow', 'Sync Data')}
            </Text>
          </TouchableOpacity>
        </MotiView>

        <View className="px-4">
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
