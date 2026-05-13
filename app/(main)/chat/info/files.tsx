import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download } from 'lucide-react-native';

import { chatApi } from '@/src/features/chat/api/chatApi';

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

import { SafeAreaView } from "react-native-safe-area-context";

export default function SafeFilesScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <FilesScreen />
    </SafeAreaView>
  );
}

function FilesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['files-page', id],
    queryFn: () => chatApi.getFilesPage(id as string, 0, 50),
    enabled: !!id,
  });

  const fileItems = useMemo(() => {
    if (!data?.data) return [];
    const items: any[] = [];
    data.data.forEach(msg => {
      msg.attachments?.forEach(att => {
        if (!att.contentType.startsWith('image/') && !att.contentType.startsWith('video/')) {
          items.push({
            ...att,
            messageId: msg.id,
            senderName: msg.senderName,
            createdAt: msg.createdAt,
          });
        }
      });
    });
    return items;
  }, [data]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (fileItems.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <FileText size={48} color="#9ca3af" className="mb-4" />
        <Text className="text-gray-500 text-base">Chưa có tệp đính kèm nào</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={fileItems}
        keyExtractor={(item, index) => item.key || index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            className="flex-row items-center p-4 bg-white border-b border-gray-100"
            onPress={() => {
              // Handle file download/open
              console.log('Open file', item.url);
            }}
          >
            <View className="w-12 h-12 rounded-xl bg-blue-50 items-center justify-center mr-3">
              <FileText size={24} color="#3b82f6" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900 text-base" numberOfLines={1}>
                {item.originalFileName || item.fileName || 'Tài liệu'}
              </Text>
              <View className="flex-row items-center mt-1">
                <Text className="text-xs text-gray-500 mr-2">{formatBytes(item.size || 0)}</Text>
                <Text className="text-xs text-gray-400">• {new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
            </View>
            <View className="w-8 h-8 items-center justify-center rounded-full bg-gray-50">
              <Download size={16} color="#6b7280" />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
