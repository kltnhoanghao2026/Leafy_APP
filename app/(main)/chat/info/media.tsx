import React, { useMemo } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Image as ImageIcon, PlayCircle } from 'lucide-react-native';

import { chatApi } from '@/src/features/chat/api/chatApi';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 4;
const SPACING = 2;
const ITEM_SIZE = (width - (COLUMN_COUNT + 1) * SPACING) / COLUMN_COUNT;

import { SafeAreaView } from "react-native-safe-area-context";

export default function SafeMediaScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <MediaScreen />
    </SafeAreaView>
  );
}

function MediaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['media-page', id],
    queryFn: () => chatApi.getMediaPage(id as string, ['IMAGE', 'VIDEO'], 0, 50),
    enabled: !!id,
  });

  const mediaItems = useMemo(() => {
    if (!data?.data) return [];
    const items: any[] = [];
    data.data.forEach(msg => {
      msg.attachments?.forEach(att => {
        if (att.contentType.startsWith('image/') || att.contentType.startsWith('video/')) {
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
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (mediaItems.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ImageIcon size={48} color="#d1d5db" className="mb-4" />
        <Text className="text-gray-500 text-base">Chưa có ảnh hay video nào</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={mediaItems}
        keyExtractor={(item, index) => item.key || index.toString()}
        numColumns={COLUMN_COUNT}
        contentContainerStyle={{ padding: SPACING }}
        columnWrapperStyle={{ gap: SPACING, marginBottom: SPACING }}
        renderItem={({ item }) => {
          const isVideo = item.contentType.startsWith('video/');
          return (
            <TouchableOpacity 
              style={{ width: ITEM_SIZE, height: ITEM_SIZE, backgroundColor: '#f3f4f6' }}
              activeOpacity={0.8}
              onPress={() => {
                // Here we might navigate to a full-screen media viewer
                console.log('Open media', item.url);
              }}
            >
              <Image 
                source={{ uri: item.url }} 
                style={{ width: '100%', height: '100%' }} 
                resizeMode="cover"
              />
              {isVideo && (
                <View className="absolute inset-0 bg-black/20 items-center justify-center">
                  <PlayCircle size={24} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
