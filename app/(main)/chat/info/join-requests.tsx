import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Users } from 'lucide-react-native';

import { chatApi } from '@/src/features/chat/api/chatApi';

import { SafeAreaView } from "react-native-safe-area-context";

export default function SafeJoinRequestsScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <JoinRequestsScreen />
    </SafeAreaView>
  );
}

function JoinRequestsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['join-requests', id],
    queryFn: () => chatApi.getJoinRequests(id as string),
    enabled: !!id,
  });

  const approve = useMutation({
    mutationFn: (requestId: string) => chatApi.approveJoinRequest(id as string, requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['join-requests', id] });
      qc.invalidateQueries({ queryKey: ['group-members', id] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  const reject = useMutation({
    mutationFn: (requestId: string) => chatApi.rejectJoinRequest(id as string, requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['join-requests', id] });
    }
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  const pendingRequests = requests?.filter(r => r.status === 'PENDING') || [];

  if (pendingRequests.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Users size={48} color="#9ca3af" className="mb-4" />
        <Text className="text-gray-500 text-base">Không có yêu cầu tham gia nào</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={pendingRequests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="p-4 bg-white border-b border-gray-100">
            <View className="flex-row items-center mb-3">
              <View className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 mr-3">
                {item.avatar ? (
                  <Image source={{ uri: item.avatar }} className="w-full h-full" />
                ) : (
                  <View className="flex-1 items-center justify-center bg-emerald-100">
                    <Text className="text-lg font-bold text-emerald-700">{item.fullName?.charAt(0)?.toUpperCase() || 'U'}</Text>
                  </View>
                )}
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900 text-base">{item.fullName}</Text>
                <Text className="text-xs text-gray-500">{new Date(item.requestedAt).toLocaleDateString()}</Text>
              </View>
            </View>
            
            {item.joinAnswer && (
              <View className="mb-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <Text className="text-sm text-gray-700 italic">{"\""}{item.joinAnswer}{"\""}</Text>
              </View>
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => reject.mutate(item.id)}
                disabled={reject.isPending || approve.isPending}
                className="flex-1 py-2 rounded-lg bg-gray-100 flex-row items-center justify-center"
              >
                <X size={18} color="#4b5563" className="mr-1" />
                <Text className="font-medium text-gray-700">Từ chối</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => approve.mutate(item.id)}
                disabled={reject.isPending || approve.isPending}
                className="flex-1 py-2 rounded-lg bg-emerald-600 flex-row items-center justify-center"
              >
                <Check size={18} color="#fff" className="mr-1" />
                <Text className="font-medium text-white">Phê duyệt</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}
