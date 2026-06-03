import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, X, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { apiClient } from '../../../src/lib/axios';
import { API_ENDPOINTS } from '../../../src/lib/routes';
import { useHeaderHeight } from '@react-navigation/elements';
import { SafeAreaView } from "react-native-safe-area-context";

interface Profile {
  id: string;
  userId: string;
  fullName: string;
  avatar: string;
  role: string;
}


export default function SafeNewGroupScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <NewGroupScreen />
    </SafeAreaView>
  );
}

function NewGroupScreen() {
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Profile[]>([]);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarAsset, setAvatarAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();
  const headerHeight = useHeaderHeight();

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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri);
      setAvatarAsset(result.assets[0]);
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      let avatarKey: string | undefined;
      if (avatarAsset) {
        setIsUploading(true);
        try {
          const uploaded = await uploadFile(avatarAsset);
          avatarKey = uploaded.fileId;
        } finally {
          setIsUploading(false);
        }
      }

      return chatApi.createGroup({
        name: name.trim(),
        avatar: avatarKey,
        memberIds: selectedMembers.map((m) => m.id),
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      router.replace(`/chat/${res.id}`);
    }
  });

  const toggleMember = (profile: Profile) => {
    setSelectedMembers((prev) => {
      if (prev.some((m) => m.id === profile.id)) {
        return prev.filter((m) => m.id !== profile.id);
      }
      return [...prev, profile];
    });
  };

  const isSelected = (id: string) => selectedMembers.some((m) => m.id === id);

  const canCreate = name.trim().length >= 2 && selectedMembers.length >= 2;

  const renderItem = ({ item }: { item: Profile }) => {
    const selected = isSelected(item.id);
    return (
      <TouchableOpacity
        className={`flex-row items-center p-3 rounded-xl mb-1 ${selected ? 'bg-green-50' : 'bg-transparent'}`}
        onPress={() => toggleMember(item)}
      >
        <Image
          source={{ uri: item.avatar || `https://ui-avatars.com/api/?background=E5E7EB&color=334155&name=${encodeURIComponent(item.fullName)}` }}
          className="w-10 h-10 rounded-full border border-gray-100 bg-gray-200"
        />
        <View className="ml-3 flex-1">
          <Text className="text-sm font-bold text-gray-900">{item.fullName}</Text>
          <Text className="text-xs text-gray-500">{item.role}</Text>
        </View>
        <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${selected ? 'border-green-600 bg-green-600' : 'border-gray-300'}`}>
          {selected && <Text className="text-white text-xs font-bold">✓</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#f9fafb' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
    >
      <ScrollView className="flex-1" stickyHeaderIndices={[2]}>
        {/* Header Details */}
        <View className="bg-white p-4 border-b border-gray-100 flex-row items-center">
          <TouchableOpacity onPress={pickImage} className="relative">
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} className="w-16 h-16 rounded-full bg-gray-200" />
            ) : (
              <View className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 items-center justify-center">
                <Camera size={24} color="#9ca3af" />
              </View>
            )}
          </TouchableOpacity>
          <View className="flex-1 ml-4">
            <Text className="text-xs font-bold text-gray-500 uppercase mb-1">Tên nhóm</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="VD: Nhóm trồng rau..."
              className="text-base font-semibold text-gray-900 py-2 border-b border-green-500"
              maxLength={50}
            />
          </View>
        </View>

        {/* Selected Members Chips */}
        {selectedMembers.length > 0 && (
          <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row flex-wrap gap-2">
            {selectedMembers.map((m) => (
              <View key={m.id} className="flex-row items-center bg-green-50 border border-green-200 rounded-full pl-1 pr-2 py-1">
                <Image source={{ uri: m.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.fullName)}` }} className="w-5 h-5 rounded-full mr-1.5" />
                <Text className="text-xs font-semibold text-green-800">{m.fullName}</Text>
                <TouchableOpacity onPress={() => toggleMember(m)} className="ml-1.5 p-0.5">
                  <X size={12} color="#16a34a" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Search Input (Sticky) */}
        <View className="bg-white px-4 py-3 border-b border-gray-100 shadow-sm z-10">
          <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2.5">
            <Search size={18} color="#9ca3af" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Tìm người dùng để thêm vào nhóm..."
              className="flex-1 ml-2 text-sm text-gray-900"
            />
          </View>
        </View>

        {/* Search Results */}
        <View className="bg-white px-4 pt-2 pb-6 min-h-[300px]">
          {isLoading ? (
            <ActivityIndicator size="small" color="#16a34a" className="mt-8" />
          ) : searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              scrollEnabled={false}
              keyboardShouldPersistTaps="handled"
            />
          ) : query.trim() ? (
            <View className="items-center py-12">
              <Text className="text-gray-500 text-sm">Không tìm thấy người dùng.</Text>
            </View>
          ) : (
            <View className="items-center py-12">
              <Text className="text-gray-400 text-sm">Nhập tên để tìm kiếm...</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button for Create */}
      <View className="p-4 bg-white border-t border-gray-100">
        <TouchableOpacity
          className={`py-3.5 rounded-xl items-center flex-row justify-center ${canCreate ? 'bg-green-600' : 'bg-gray-200'}`}
          disabled={!canCreate || createMutation.isPending || isUploading}
          onPress={() => createMutation.mutate()}
        >
          {createMutation.isPending || isUploading ? (
            <ActivityIndicator color={canCreate ? 'white' : '#9ca3af'} />
          ) : (
            <Text className={`font-bold text-base ${canCreate ? 'text-white' : 'text-gray-400'}`}>
              Tạo nhóm {selectedMembers.length >= 2 && `(${selectedMembers.length + 1})`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
