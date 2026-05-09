import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Check, Users } from 'lucide-react-native';

import { chatApi } from '@/src/features/chat/api/chatApi';

export default function AddMemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Search members (debounced implicitly by user typing, though ideally we'd debounce)
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['search-members-to-add', id, searchQuery],
    queryFn: () => chatApi.searchMembersToAdd(searchQuery, id as string),
    enabled: !!id && searchQuery.length > 0,
  });

  // Friends directory as fallback when not searching
  const { data: friendsDirectory, isLoading: isFriendsLoading } = useQuery({
    queryKey: ['friends-directory', id],
    queryFn: () => chatApi.getFriendsDirectory(id as string),
    enabled: !!id && searchQuery.length === 0,
  });

  const addMembers = useMutation({
    mutationFn: () => chatApi.addMembers(id as string, Array.from(selectedIds)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group-members', id] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
      router.back();
    }
  });

  const toggleSelect = (profileId: string) => {
    const next = new Set(selectedIds);
    if (next.has(profileId)) {
      next.delete(profileId);
    } else {
      next.add(profileId);
    }
    setSelectedIds(next);
  };

  const renderMember = ({ item }: { item: any }) => {
    const isSelected = selectedIds.has(item.profileId);
    
    return (
      <TouchableOpacity 
        disabled={item.isAlreadyMember}
        onPress={() => toggleSelect(item.profileId)}
        className={`flex-row items-center p-3 border-b border-gray-50 ${item.isAlreadyMember ? 'opacity-50' : ''}`}
      >
        <View className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 mr-3 relative">
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} className="w-full h-full" />
          ) : (
            <View className="flex-1 items-center justify-center bg-emerald-100">
              <Text className="text-lg font-bold text-emerald-700">{item.fullName?.charAt(0)?.toUpperCase() || 'U'}</Text>
            </View>
          )}
          {isSelected && (
            <View className="absolute inset-0 bg-emerald-500/50 items-center justify-center">
              <Check size={20} color="#fff" />
            </View>
          )}
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-gray-900">{item.fullName}</Text>
          {item.isAlreadyMember && <Text className="text-xs text-gray-500">Đã tham gia</Text>}
        </View>
        <View className={`w-6 h-6 rounded-full border items-center justify-center ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
          {isSelected && <Check size={14} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  };

  const displayData = searchQuery.length > 0 
    ? searchResults 
    : Object.values(friendsDirectory || {}).flat();

  return (
    <View className="flex-1 bg-white">
      <View className="p-4 border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 h-10">
          <Search size={20} color="#6b7280" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Tìm kiếm bạn bè..."
            className="flex-1 ml-2 text-base text-gray-900"
            autoCapitalize="none"
          />
        </View>
      </View>

      {(isSearching || isFriendsLoading) ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : displayData?.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Users size={48} color="#9ca3af" className="mb-4" />
          <Text className="text-gray-500 text-base">Không tìm thấy người dùng nào</Text>
        </View>
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={(item) => item.profileId}
          renderItem={renderMember}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {selectedIds.size > 0 && (
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg">
          <TouchableOpacity 
            onPress={() => addMembers.mutate()}
            disabled={addMembers.isPending}
            className="bg-emerald-600 rounded-xl py-3.5 items-center flex-row justify-center"
          >
            {addMembers.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text className="text-white font-bold text-base mr-2">Thêm {selectedIds.size} thành viên</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
