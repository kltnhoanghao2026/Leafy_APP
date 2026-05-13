import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react-native';
import { chatApi } from '../../../src/features/chat/api/chatApi';
import { apiClient } from '../../../src/lib/axios';
import { API_ENDPOINTS } from '../../../src/lib/routes';

interface Profile {
  id: string;
  userId: string;
  fullName: string;
  avatar: string;
  role: string;
}

import { SafeAreaView } from "react-native-safe-area-context";

export default function SafeNewDmScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <NewDmScreen />
    </SafeAreaView>
  );
}

function NewDmScreen() {
  const [query, setQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['profiles', 'search', query],
    queryFn: async () => {
      if (!query.trim()) return [];
      const res = await apiClient.get<any>(API_ENDPOINTS.PROFILES.SEARCH, {
        params: { searchTerm: query, page: 0, size: 20 }
      });
      return (res.data?.data?.content || res.data?.content || []) as Profile[];
    },
    enabled: query.trim().length > 0
  });

  const createMutation = useMutation({
    mutationFn: (userId: string) => chatApi.getOrCreateConversation(userId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      router.replace(`/chat/${res.id}`);
    }
  });

  const renderItem = ({ item }: { item: Profile }) => (
    <TouchableOpacity
      className="flex-row items-center p-4 border-b border-gray-50"
      onPress={() => createMutation.mutate(item.id)}
      disabled={createMutation.isPending}
    >
      <Image
        source={{ uri: item.avatar || `https://ui-avatars.com/api/?background=E5E7EB&color=334155&name=${encodeURIComponent(item.fullName)}` }}
        className="w-12 h-12 rounded-full bg-gray-200 border border-gray-100"
      />
      <View className="ml-4 flex-1">
        <Text className="text-base font-bold text-gray-900">{item.fullName}</Text>
        <Text className="text-sm text-gray-500 mt-0.5">{item.role}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-white">
      <View className="p-4 border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <Search size={20} color="#9ca3af" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm kiếm người dùng..."
            className="flex-1 ml-2 text-base text-gray-900"
            autoFocus
          />
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#16a34a" className="mt-8" />
      ) : searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
        />
      ) : query.trim() ? (
        <View className="flex-1 items-center py-12">
          <Text className="text-gray-500 text-base">Không tìm thấy người dùng.</Text>
        </View>
      ) : (
        <View className="flex-1 items-center py-12">
          <Text className="text-gray-400 text-base">Nhập tên để tìm kiếm...</Text>
        </View>
      )}
    </View>
  );
}
