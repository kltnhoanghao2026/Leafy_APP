import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pin, PinOff } from 'lucide-react-native';

import { chatApi } from '@/src/features/chat/api/chatApi';
import { useAuthContext } from '@/src/features/auth';
import { useConversations } from '@/src/features/chat/hooks/useChatQueries';

import { SafeAreaView } from "react-native-safe-area-context";

export default function SafePinnedMessagesScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <PinnedMessagesScreen />
    </SafeAreaView>
  );
}

function PinnedMessagesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const { profileId } = useAuthContext();

  const { data: conversations } = useConversations();
  const conversation = conversations?.find(c => c.id === id);
  const currentRole = conversation?.members?.find(m => m.profileId === profileId)?.role ?? 'MEMBER';
  
  const canPin = currentRole === 'OWNER' || currentRole === 'ADMIN' || (conversation?.settings?.memberCanPinMessages ?? false) || !conversation?.isGroup;

  const { data: pins, isLoading } = useQuery({
    queryKey: ['pinned-messages', id],
    queryFn: () => chatApi.getPins(id as string),
    enabled: !!id,
  });

  const unpin = useMutation({
    mutationFn: (messageId: string) => chatApi.unpinMessage(id as string, messageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pinned-messages', id] });
    }
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (!pins || pins.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Pin size={48} color="#9ca3af" className="mb-4" />
        <Text className="text-gray-500 text-base">Chưa có tin nhắn nào được ghim</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={pins}
        keyExtractor={(item) => item.messageId}
        renderItem={({ item }) => (
          <View className="p-4 bg-white border-b border-gray-100 flex-row">
            <View className="w-10 h-10 rounded-full bg-emerald-50 items-center justify-center mr-3 mt-1">
              <Pin size={18} color="#059669" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-semibold text-emerald-700">Được ghim bởi {item.pinnedByName || 'Người dùng'}</Text>
                {canPin && (
                  <TouchableOpacity 
                    onPress={() => unpin.mutate(item.messageId)}
                    disabled={unpin.isPending}
                    className="p-1"
                  >
                    <PinOff size={16} color="#6b7280" />
                  </TouchableOpacity>
                )}
              </View>
              <Text className="text-gray-800 text-base mt-1" numberOfLines={3}>
                {item.contentSnapshot || (item.messageType === 'IMAGE' ? '[Hình ảnh]' : item.messageType === 'FILE' ? '[Tệp]' : '[Tin nhắn]')}
              </Text>
              <Text className="text-xs text-gray-400 mt-2">
                {item.pinnedAt ? new Date(item.pinnedAt).toLocaleString() : ''}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}
