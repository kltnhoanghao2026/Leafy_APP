import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Shield, Crown } from 'lucide-react-native';

import { chatApi } from '@/src/features/chat/api/chatApi';
import { useAuthContext } from '@/src/features/auth';
import { useConversations } from '@/src/features/chat/hooks/useChatQueries';

import { SafeAreaView } from "react-native-safe-area-context";

export default function SafeChatMembersScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <ChatMembersScreen />
    </SafeAreaView>
  );
}

function ChatMembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { profileId } = useAuthContext();

  const { data: conversations } = useConversations();
  const conversation = conversations?.find(c => c.id === id);
  const currentRole = conversation?.members?.find(m => m.profileId === profileId)?.role ?? 'MEMBER';
  const isOwner = currentRole === 'OWNER';
  const isAdmin = currentRole === 'ADMIN';
  const canManage = isOwner || isAdmin;

  const { data: members, isLoading } = useQuery({
    queryKey: ['group-members', id],
    queryFn: () => chatApi.getGroupMembers(id as string),
    enabled: !!id,
  });

  const removeMember = useMutation({
    mutationFn: (targetId: string) => chatApi.removeMember(id as string, targetId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group-members', id] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  const promoteAdmin = useMutation({
    mutationFn: (targetId: string) => chatApi.promoteToAdmin(id as string, targetId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group-members', id] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  const demoteAdmin = useMutation({
    mutationFn: (targetId: string) => chatApi.demoteFromAdmin(id as string, targetId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group-members', id] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  const handleAction = (member: any) => {
    if (!canManage || member.profileId === profileId) return;
    
    // Admins can't manage Owner
    if (member.role === 'OWNER') return;
    // Admins can't manage other Admins
    if (isAdmin && member.role === 'ADMIN') return;

    const options: AlertButton[] = [];

    if (isOwner) {
      if (member.role === 'MEMBER') {
        options.push({ text: "Thêm phó nhóm", onPress: () => promoteAdmin.mutate(member.profileId) });
      } else if (member.role === 'ADMIN') {
        options.push({ text: "Gỡ phó nhóm", style: "destructive", onPress: () => demoteAdmin.mutate(member.profileId) });
      }
    }

    options.push({ 
      text: "Xóa khỏi nhóm", 
      style: "destructive", 
      onPress: () => {
        Alert.alert("Xóa thành viên", `Bạn có chắc muốn xóa ${member.fullName} khỏi nhóm?`, [
          { text: "Hủy", style: "cancel" },
          { text: "Xóa", style: "destructive", onPress: () => removeMember.mutate(member.profileId) }
        ]);
      }
    });

    options.push({ text: "Hủy", style: "cancel" });

    Alert.alert("Quản lý thành viên", `Tùy chọn cho ${member.fullName}`, options);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {canManage && (
        <TouchableOpacity 
          className="flex-row items-center p-4 bg-white border-b border-gray-100"
          onPress={() => router.push({ pathname: '/chat/info/add-member', params: { id } })}
        >
          <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center mr-3">
            <UserPlus size={20} color="#059669" />
          </View>
          <Text className="font-semibold text-emerald-700 text-base">Thêm thành viên</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={members}
        keyExtractor={(item) => item.profileId}
        renderItem={({ item }) => {
          const isMe = item.profileId === profileId;
          const showAction = canManage && !isMe && !(isAdmin && item.role === 'OWNER') && !(isAdmin && item.role === 'ADMIN');
          
          return (
            <TouchableOpacity 
              disabled={!showAction}
              onPress={() => handleAction(item)}
              className="flex-row items-center p-4 bg-white border-b border-gray-50"
            >
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
                <View className="flex-row items-center">
                  <Text className="font-semibold text-gray-900 text-base">
                    {item.fullName} {isMe ? '(Bạn)' : ''}
                  </Text>
                </View>
                {item.role === 'OWNER' && (
                  <View className="flex-row items-center mt-0.5">
                    <Crown size={12} color="#eab308" className="mr-1" />
                    <Text className="text-xs text-yellow-600 font-medium">Trưởng nhóm</Text>
                  </View>
                )}
                {item.role === 'ADMIN' && (
                  <View className="flex-row items-center mt-0.5">
                    <Shield size={12} color="#0284c7" className="mr-1" />
                    <Text className="text-xs text-sky-600 font-medium">Phó nhóm</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
