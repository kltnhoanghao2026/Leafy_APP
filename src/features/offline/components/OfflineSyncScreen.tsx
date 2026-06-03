import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from 'react-i18next';
import {
  RefreshCw,
  Map,
  Sprout,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader,
  Leaf,
  CloudDownload,
  WifiOff,
  List,
  Database,
} from 'lucide-react-native';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import Colors from '@/src/constants/Colors';
import { useNetworkContext } from '@/src/providers/NetworkProvider';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useOfflineDataContext } from '../context/OfflineDataContext';
import type { SyncTableKey, SyncTableStatus } from '../services/offline-sync.service';
import { formatDistanceToNow } from 'date-fns';
import { OfflineSyncQueueTab } from './OfflineSyncQueueTab';
import { OfflineDatabaseSchemaTab } from './OfflineDatabaseSchemaTab';

// ── Table metadata ─────────────────────────────────────────────────────────

type TableMeta = {
  key: SyncTableKey;
  labelKey: string;
  icon: React.ReactNode;
  countKey?: string; // key in recordCounts
};

// Small, compact row for the status tab.
function CompactRow({
  meta,
  palette,
  isDark,
  progress,
  syncStatus,
  recordCounts,
  t,
}: {
  meta: TableMeta;
  palette: any;
  isDark: boolean;
  progress: Record<SyncTableKey, { status: SyncTableStatus; count: number; error?: string }>;
  syncStatus: Record<string, { lastSyncedAt: string | null }>;
  recordCounts: Record<string, number>;
  t: (key: string, defaultValue?: string, options?: any) => string;
}) {
  const tableProgress = progress[meta.key];
  const tableSync = syncStatus[meta.key];
  const cachedCount = recordCounts[meta.countKey ?? meta.key] ?? 0;
  const lastSynced = tableSync?.lastSyncedAt
    ? formatDistanceToNow(new Date(tableSync.lastSyncedAt), { addSuffix: true })
    : null;

  const statusText =
    tableProgress.status === "syncing"
      ? t("offline.sync.syncing", "Syncing...")
      : tableProgress.status === "done"
        ? t("offline.sync.recordsCached", "{{count}} synced", {
            count: tableProgress.count,
          })
        : tableProgress.status === "error"
          ? tableProgress.error ?? t("offline.sync.syncFailed", "Failed")
          : lastSynced
            ? t("offline.lastSynced", "Last synced: {{time}}", {
                time: lastSynced,
              })
            : t("offline.neverSynced", "Never synced");

  const statusColor =
    tableProgress.status === "error"
      ? "#ef4444"
      : isDark
        ? "#94a3b8"
        : "#64748b";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 14,
        backgroundColor: isDark ? "#0b1220" : "#ffffff",
        borderWidth: 1,
        borderColor: isDark ? "#1f2a44" : "#e2e8f0",
        marginBottom: 8,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${palette.primary}18`,
        }}
      >
        {meta.icon}
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: "800",
            color: isDark ? "#e2e8f0" : "#0f172a",
          }}
        >
          {t(meta.labelKey, meta.key)}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            marginTop: 2,
            fontSize: 11,
            fontWeight: "600",
            color: statusColor,
          }}
        >
          {statusText}
        </Text>
      </View>

      <View style={{ alignItems: "flex-end" }}>
        {tableProgress.status === "syncing" ? (
          <Loader size={18} color={palette.primary} />
        ) : tableProgress.status === "done" ? (
          <CheckCircle2 size={18} color="#10b981" />
        ) : tableProgress.status === "error" ? (
          <XCircle size={18} color="#ef4444" />
        ) : (
          <View style={{ width: 18, height: 18 }} />
        )}

        {cachedCount > 0 && tableProgress.status === "idle" ? (
          <Text
            style={{
              marginTop: 2,
              fontSize: 11,
              fontWeight: "800",
              color: palette.primary,
            }}
          >
            {cachedCount}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

  // ── Status helpers ─────────────────────────────────────────────────────────

  const StatusDot = ({
    status,
    color,
  }: {
    status: SyncTableStatus;
    color: string;
  }) => {
    if (status === "syncing") {
      return (
        <MotiView
          from={{ opacity: 1 }}
          animate={{ opacity: 0.2 }}
          transition={{
            type: "timing",
            duration: 700,
            loop: true,
            easing: Easing.inOut(Easing.ease),
          }}
          style={[styles.statusDot, { backgroundColor: color }]}
        />
      );
    }
    return (
      <View
        style={[
          styles.statusDot,
          {
            backgroundColor:
              status === "done"
                ? "#10b981"
                : status === "error"
                  ? "#ef4444"
                  : "#94a3b8",
          },
        ]}
      />
    );
  };

const StatusIcon = ({ status, size, color }: { status: SyncTableStatus; size: number; color: string }) => {
  if (status === 'syncing') return <Loader size={size} color={color} />;
  if (status === 'done') return <CheckCircle2 size={size} color="#10b981" />;
  if (status === 'error') return <XCircle size={size} color="#ef4444" />;
  return null;
};

// ── Main Component ─────────────────────────────────────────────────────────

export function OfflineSyncScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const { isOffline } = useNetworkContext();
  const { syncStatus, recordCounts, pendingCount } = useOfflineDataContext();
  const {
    isSyncing,
    syncState,
    progress,
    syncResult,
    lastError,
    overallProgress,
    triggerSync,
    resetSync,
  } = useOfflineSync();

  const [activeTab, setActiveTab] = useState<"status" | "queue" | "schema">("status");

  const tables: TableMeta[] = [
    {
      key: 'farm_plots',
      labelKey: 'offline.sync.farmData',
      icon: <Map size={22} color={palette.primary} />,
      countKey: 'farm_plots',
    },
    {
      key: 'farm_zones',
      labelKey: 'offline.sync.zoneData',
      icon: <Map size={22} color={palette.primary} />,
      countKey: 'farm_zones',
    },
    {
      key: 'species',
      labelKey: 'offline.sync.speciesData',
      icon: <Leaf size={22} color={palette.primary} />,
      countKey: 'species',
    },
    {
      key: 'plants',
      labelKey: 'offline.sync.plantData',
      icon: <Sprout size={22} color={palette.primary} />,
      countKey: 'plants',
    },
    {
      key: 'plant_events',
      labelKey: 'offline.sync.eventData',
      icon: <Calendar size={22} color={palette.primary} />,
      countKey: 'plant_events',
    },
  ];

  const handlePress = useCallback(() => {
    if (syncState === 'success' || syncState === 'error') {
      resetSync();
    } else {
      triggerSync();
    }
  }, [syncState, triggerSync, resetSync]);

  const buttonLabel = (() => {
    if (isSyncing) return t('offline.sync.syncing', 'Syncing...');
    if (syncState === 'success') return t('offline.sync.syncAgain', 'Sync Again');
    if (syncState === 'error') return t('offline.sync.retry', 'Retry Sync');
    return t('offline.sync.syncNow', 'Sync Now');
  })();

  const buttonDisabled = isSyncing || isOffline;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: palette.background }]}
      edges={["top", "bottom"]}
    >
      <View style={[styles.container, { backgroundColor: palette.background }]}>
      {/* ── Tab Switcher ── */}
      <View style={[styles.tabContainer, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'status' && [styles.activeTab, { backgroundColor: palette.primary }]]}
          onPress={() => setActiveTab('status')}
        >
          <RefreshCw size={16} color={activeTab === 'status' ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} />
          <Text style={[styles.tabText, activeTab === 'status' ? styles.activeTabText : { color: isDark ? '#94a3b8' : '#64748b' }]}>
            {t('offline.sync.statusTab', 'Trạng thái')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'queue' && [styles.activeTab, { backgroundColor: palette.primary }]]}
          onPress={() => setActiveTab('queue')}
        >
          <List size={16} color={activeTab === 'queue' ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.tabText, activeTab === 'queue' ? styles.activeTabText : { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {t('offline.sync.queueTab', 'Hàng đợi')}
            </Text>
            {pendingCount > 0 && (
              <View style={[styles.badge, { backgroundColor: activeTab === 'queue' ? '#fff' : palette.primary }]}>
                <Text style={[styles.badgeText, { color: activeTab === 'queue' ? palette.primary : '#fff' }]}>
                  {pendingCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'schema' && [styles.activeTab, { backgroundColor: palette.primary }]]}
          onPress={() => setActiveTab('schema')}
        >
          <Database size={16} color={activeTab === 'schema' ? '#fff' : (isDark ? '#94a3b8' : '#64748b')} />
          <Text style={[styles.tabText, activeTab === 'schema' ? styles.activeTabText : { color: isDark ? '#94a3b8' : '#64748b' }]}>
            {t('offline.sync.schemaTab', 'Cấu trúc')}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "status" ? (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: 24 }]}
          showsVerticalScrollIndicator={false}
        >

        {/* (Hero removed) */}

        {/* No network warning */}
        {isOffline && (
          <MotiView
            from={{ opacity: 0, translateY: 6 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={[styles.noNetworkRow, { marginTop: 12, marginHorizontal: 16 }]}
          >
            <WifiOff size={14} color="#f59e0b" />
            <Text style={styles.noNetworkText}>
              {t('offline.sync.noNetwork', 'No internet connection. Connect to sync.')}
            </Text>
          </MotiView>
        )}

        {/* Sync result summary */}
        {syncState === 'success' && syncResult && (
          <MotiView
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={[styles.resultCard, { marginTop: 12, marginHorizontal: 16 }]}
          >
            <CheckCircle2 size={16} color="#10b981" />
            <Text style={styles.resultText}>
              {t('offline.sync.totalCached', '{{count}} total records', { count: syncResult.totalCount })}
              {'  ·  '}
              {t('offline.sync.lastSyncDuration', 'Completed in {{seconds}}s', {
                seconds: (syncResult.durationMs / 1000).toFixed(1),
              })}
            </Text>
          </MotiView>
        )}

        {syncState === 'error' && lastError && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={[
              styles.resultCard,
              styles.resultCardError,
              { marginTop: 12, marginHorizontal: 16 },
            ]}
          >
            <XCircle size={16} color="#ef4444" />
            <Text style={[styles.resultText, { color: "#ef4444" }]}>
              {lastError}
            </Text>
          </MotiView>
        )}

        {/* ── Local data status (compact) ── */}
        <Text
          style={[
            styles.sectionLabel,
            { color: isDark ? "#64748b" : "#94a3b8", marginBottom: 8 },
          ]}
        >
          {t("offline.syncStatus", "LOCAL DATA STATUS")}
        </Text>

        <View style={{ paddingHorizontal: 16 }}>
          {tables.map((meta) => (
            <CompactRow
              key={meta.key}
              meta={meta}
              palette={palette}
              isDark={isDark}
              progress={progress}
              syncStatus={syncStatus}
              recordCounts={recordCounts}
              t={t}
            />
          ))}
        </View>

        {/* ── Sync Button ── */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 500 }}
          style={styles.buttonWrap}
        >
          <TouchableOpacity
            id="sync-now-button"
            onPress={handlePress}
            disabled={buttonDisabled}
            activeOpacity={0.82}
            style={[
              styles.syncButton,
              { backgroundColor: palette.primary },
              buttonDisabled && styles.syncButtonDisabled,
            ]}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#fff" style={{ marginRight: 10 }} />
            ) : (
              <RefreshCw size={18} color="#fff" style={{ marginRight: 10 }} />
            )}
            <Text style={styles.syncButtonText}>{buttonLabel}</Text>
          </TouchableOpacity>
        </MotiView>

      </ScrollView>
      ) : activeTab === 'queue' ? (
        <OfflineSyncQueueTab />
      ) : (
        <OfflineDatabaseSchemaTab />
      )}

    </View>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 40 },

  // Tabs
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 10,
    padding: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 9,
    gap: 6,
  },
  activeTab: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '700',
  },
  badge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

  // Hero
  heroCompact: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 14,
    borderRadius: 20,
    padding: 16,
  },
  heroLight: { backgroundColor: '#f0fdf4' },
  heroDark: { backgroundColor: '#1a2e1f' },
  heroIconRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  heroIconBadge: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  spinnerBadge: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3, marginBottom: 6 },
  heroSubtitle: { fontSize: 13, lineHeight: 20 },

  // Progress bar
  progressBarWrap: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBarBg: { flex: 1, height: 6, borderRadius: 99, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 99 },
  progressPct: { fontSize: 12, fontWeight: '700', minWidth: 36, textAlign: 'right' },

  // No network
  noNetworkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  noNetworkText: { fontSize: 12, color: '#f59e0b', fontWeight: '600', flex: 1 },

  // Result
  resultCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 14, padding: 10, borderRadius: 12,
    backgroundColor: 'rgba(16,185,129,0.10)',
  },
  resultCardError: { backgroundColor: 'rgba(239,68,68,0.08)' },
  resultText: { fontSize: 12, fontWeight: '600', color: '#10b981', flex: 1 },

  // Section label
  sectionLabel: {
    marginHorizontal: 16,
    marginBottom: 8,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },

  // Table cards
  tableCard: {
    marginHorizontal: 16, marginBottom: 10, borderRadius: 18,
    flexDirection: 'row', alignItems: 'center',
    padding: 16, gap: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  tableIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  tableInfo: { flex: 1 },
  tableLabel: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  tableStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 99 },
  tableStatusText: { fontSize: 12, fontWeight: '500', flex: 1 },
  cachedBadge: { fontSize: 11, fontWeight: '600', marginTop: 3 },

  // Button
  buttonWrap: { marginHorizontal: 16, marginTop: 20 },
  syncButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 18,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, elevation: 5,
  },
  syncButtonDisabled: { opacity: 0.45 },
  syncButtonText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
});
