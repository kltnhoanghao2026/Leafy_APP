import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Trash2, RefreshCw, AlertCircle, CheckCircle2, Clock, CloudUpload } from 'lucide-react-native';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import Colors from '@/src/constants/Colors';
import { getAllSyncItems, deleteSyncItem, type PendingSyncItem } from '../services/sync-queue.service';
import { formatDistanceToNow } from 'date-fns';
import { useFocusEffect } from 'expo-router';
import { useOfflineDataContext } from '../context/OfflineDataContext';
import { useNetworkContext } from '@/src/providers/NetworkProvider';
import { StyleSheet } from 'react-native';

export function OfflineSyncQueueTab() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  
  const { isOffline } = useNetworkContext();
  const { pendingCount, isSyncingUp, manualSyncUp } = useOfflineDataContext();
  
  const [items, setItems] = useState<PendingSyncItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllSyncItems();
      setItems(data);
    } catch (error) {
      console.error('Failed to load sync items', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  useEffect(() => {
    // Automatically reload the queue display when a sync finishes or pending count changes
    loadItems();
  }, [isSyncingUp, pendingCount, loadItems]);

  const handleDelete = (id: string) => {
    Alert.alert(
      t('offline.syncQueue.deleteTitle', 'Delete Sync Item'),
      t('offline.syncQueue.deleteConfirm', 'Are you sure you want to permanently delete this sync operation? This may cause data inconsistency.'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        { 
          text: t('common.delete', 'Delete'), 
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(id);
            try {
              await deleteSyncItem(id);
              await loadItems();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item');
            } finally {
              setIsDeleting(null);
            }
          }
        }
      ]
    );
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'done': return <CheckCircle2 size={16} color="#10b981" />;
      case 'failed': return <AlertCircle size={16} color="#ef4444" />;
      case 'pending': default: return <Clock size={16} color="#f59e0b" />;
    }
  };

  const renderItem = ({ item }: { item: PendingSyncItem }) => {
    return (
      <View className="mb-4 bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            {getStatusIcon(item.status)}
            <Text className="font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-xs">
              {item.tableName} • {item.operation}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => handleDelete(item.id)}
            disabled={isDeleting === item.id}
            className="p-1.5 rounded-full bg-red-50 dark:bg-red-900/20"
          >
            {isDeleting === item.id ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <Trash2 size={16} color="#ef4444" />
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between mb-3">
          <View>
            <Text className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Status</Text>
            <Text className={`text-xs font-bold ${
              item.status === 'done' ? 'text-emerald-600 dark:text-emerald-400' :
              item.status === 'failed' ? 'text-red-600 dark:text-red-400' :
              'text-amber-600 dark:text-amber-400'
            }`}>{item.status.toUpperCase()}</Text>
          </View>
          <View>
            <Text className="text-xs text-slate-500 dark:text-slate-400 mb-0.5 text-right">Retries</Text>
            <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 text-right">{item.retryCount}</Text>
          </View>
          <View>
            <Text className="text-xs text-slate-500 dark:text-slate-400 mb-0.5 text-right">Created</Text>
            <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 text-right">
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </Text>
          </View>
        </View>

        <View className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
          <Text className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-1">recordId: {item.recordId}</Text>
          <Text className="text-xs text-slate-700 dark:text-slate-300 font-mono">
            {item.payload}
          </Text>
        </View>

        {item.lastError && (
          <View className="mt-3 bg-red-50 dark:bg-red-900/10 rounded-xl p-3 border border-red-100 dark:border-red-900/30">
            <Text className="text-xs text-red-600 dark:text-red-400 font-medium">
              Error: {item.lastError}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900 pt-2">
      {/* ── Pending Changes Push Card ── */}
      {pendingCount > 0 && (
        <View
          style={[styles.pendingCard, { backgroundColor: isDark ? '#2a2010' : '#fffbeb', borderColor: isDark ? '#854d0e' : '#fde68a' }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.pendingTitle, { color: isDark ? '#fde68a' : '#92400e' }]}>
              {t('offline.pendingTitle', '{{count}} thay đổi chờ đồng bộ', { count: pendingCount })}
            </Text>
            <Text style={[styles.pendingSubtitle, { color: isDark ? '#ca8a04' : '#b45309' }]}>
              {t('offline.pendingHint', 'Sẽ tự đồng bộ khi có mạng hoặc nhấn Đẩy ngay.')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={manualSyncUp}
            disabled={isSyncingUp || isOffline}
            style={[
              styles.pushButton,
              { backgroundColor: isSyncingUp || isOffline ? '#94a3b8' : '#d97706' },
            ]}
          >
            {isSyncingUp
              ? <ActivityIndicator size="small" color="#fff" />
              : <CloudUpload size={16} color="#fff" />
            }
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <CheckCircle2 size={48} color="#10b981" className="mb-4 opacity-50" />
          <Text className="text-center text-slate-500 dark:text-slate-400">
            {t('offline.syncQueue.empty', 'Your sync queue is empty.')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={loadItems}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Pending push
  pendingCard: {
    marginHorizontal: 16, marginBottom: 12, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderWidth: 1,
  },
  pendingTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  pendingSubtitle: { fontSize: 11, fontWeight: '500' },
  pushButton: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
});
