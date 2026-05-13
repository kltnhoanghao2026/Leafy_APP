import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ban, ShieldCheck } from 'lucide-react-native';

import { chatApi } from '@/src/features/chat/api/chatApi';

import { SafeAreaView } from "react-native-safe-area-context";

export default function SafeBlockedMembersScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <BlockedMembersScreen />
    </SafeAreaView>
  );
}

function BlockedMembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: blockedMembers, isLoading } = useQuery({
    queryKey: ['blocked-members', id],
    queryFn: () => chatApi.getBlockedMembers(id as string, 0, 50),
    enabled: !!id,
  });

  const unblock = useMutation({
    mutationFn: (targetId: string) => chatApi.unblockMemberFromGroup(id as string, targetId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blocked-members', id] });
    }
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (!blockedMembers || blockedMembers.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Ban size={48} color="#9ca3af" className="mb-4" />
        <Text className="text-gray-500 text-base">Không có thành viên nào bị chặn</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={blockedMembers}
        keyExtractor={(item) => item.profileId}
        renderItem={({ item }) => (
          <View className="p-4 bg-white border-b border-gray-100 flex-row items-center">
            <View className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 mr-3">
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} className="w-full h-full" />
              ) : (
                <View className="flex-1 items-center justify-center bg-gray-300">
                  <Text className="text-lg font-bold text-gray-700">{item.fullName?.charAt(0)?.toUpperCase() || 'U'}</Text>
                </View>
              )}
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900 text-base">{item.fullName}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => {
                Alert.alert("Bỏ chặn", `Bỏ chặn ${item.fullName} khỏi nhóm?`, [
                  { text: "Hủy", style: "cancel" },
                  { text: "Bỏ chặn", onPress: () => unblock.mutate(item.profileId) }
                ]);
              }}
              disabled={unblock.isPending}
              className="bg-emerald-50 px-3 py-1.5 rounded-lg flex-row items-center"
            >
              <ShieldCheck size={16} color="#059669" className="mr-1" />
              <Text className="text-sm font-medium text-emerald-700">Bỏ chặn</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}
