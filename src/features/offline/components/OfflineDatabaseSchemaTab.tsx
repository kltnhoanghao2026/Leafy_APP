import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import Colors from '@/src/constants/Colors';
import { getDbAsync } from '../services/offline-database';
import { Database } from 'lucide-react-native';

type TableData = {
  name: string;
  data: any[];
};

export function OfflineDatabaseSchemaTab() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  
  const [tablesData, setTablesData] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const db = await getDbAsync();
        const rows = await db.getAllAsync(`SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`);
        
        const loadedData: TableData[] = [];
        for (const row of rows as any[]) {
          const tableName = row.name;
          const tableRows = await db.getAllAsync(`SELECT * FROM ${tableName} LIMIT 50`);
          loadedData.push({
            name: tableName,
            data: tableRows as any[],
          });
        }
        
        setTablesData(loadedData);
      } catch (e) {
        console.error('Failed to load DB data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[styles.header, { color: isDark ? '#f1f5f9' : '#0f172a' }]}>
        <Database size={20} color={palette.primary} style={{ marginRight: 8 }} />
        Database Schema
      </Text>
      
      {tablesData.map((t) => (
        <View key={t.name} style={[styles.card, { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[styles.tableName, { color: palette.primary, marginBottom: 0 }]}>{t.name}</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#94a3b8' : '#64748b' }}>
              {t.data.length} records (limit 50)
            </Text>
          </View>
          <View style={[styles.sqlBox, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
            <Text style={[styles.sqlText, { color: isDark ? '#94a3b8' : '#475569' }]}>
              {t.data.length === 0 ? 'No data' : JSON.stringify(t.data, null, 2)}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  tableName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  sqlBox: {
    padding: 12,
    borderRadius: 8,
  },
  sqlText: {
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 18,
  },
});
