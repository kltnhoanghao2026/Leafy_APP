import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator, TextInput, Clipboard } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Users, FileImage, Paperclip, Pin, Settings, Ban, LogOut, Trash2, Edit2, Copy, Check, Clock, Shield } from 'lucide-react-native';

import { useConversations } from '@/src/features/chat/hooks/useChatQueries';
import { useAuthContext } from '@/src/features/auth';
import { chatApi } from '@/src/features/chat/api/chatApi';
import { fileApi } from '@/src/features/common/api/file.api';
import { NavRow } from '@/src/features/chat/components/info/NavRow';
import Colors from '@/src/constants/Colors';
import { useColorScheme } from '@/src/hooks/useColorScheme';

import { SafeAreaView } from "react-native-safe-area-context";

export default function SafeChatInfoScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <ChatInfoScreen />
    </SafeAreaView>
  );
}

function ChatInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const { data: conversations } = useConversations();
  const conversation = conversations?.find(c => c.id === id);
  const { profileId } = useAuthContext();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [copied, setCopied] = useState(false);

  if (!conversation) return null;

  const currentRole = conversation.members?.find(m => m.profileId === profileId)?.role ?? 'MEMBER';
  const isOwner = currentRole === 'OWNER';
  const canEditInfo = isOwner || currentRole === 'ADMIN' || (conversation.settings?.memberCanChangeInfo ?? false);

  const updateName = useMutation({
    mutationFn: (name: string) => chatApi.updateGroupName(conversation.id, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      setIsEditingName(false);
    }
  });

  const updateAvatar = useMutation({
    mutationFn: async (asset: ImagePicker.ImagePickerAsset) => {
      const url = await fileApi.uploadAvatar(asset);
      return chatApi.updateGroupAvatar(conversation.id, url);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] })
  });

  const leave = useMutation({
    mutationFn: () => chatApi.leaveGroup(conversation.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      router.replace('/(main)/chat');
    }
  });

  const disband = useMutation({
    mutationFn: () => chatApi.disbandGroup(conversation.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      router.replace('/(main)/chat');
    }
  });

  const deleteConv = useMutation({
    mutationFn: () => chatApi.deleteConversation(conversation.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      router.replace('/(main)/chat');
    }
  });

  const pinConv = useMutation({
    mutationFn: () => chatApi.pinConversation(conversation.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] })
  });

  const unpinConv = useMutation({
    mutationFn: () => chatApi.unpinConversation(conversation.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] })
  });

  const handlePickAvatar = async () => {
    if (!canEditInfo) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0]) {
      updateAvatar.mutate(result.assets[0]);
    }
  };

  const handleNameSave = () => {
    if (editNameValue.trim() && editNameValue !== conversation.name) {
      updateName.mutate(editNameValue);
    } else {
      setIsEditingName(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      let token = conversation.joinLinkToken;
      if (!token) {
        token = await chatApi.generateJoinLink(conversation.id);
      }
      Clipboard.setString(`leafy://chat/join/${token}`); // Or your deep link format
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const navigateTo = (path: string) => {
    router.push({ pathname: `/chat/info/${path}` as any, params: { id } });
  };

  const pendingCount = conversation.pendingJoinRequestCount ?? 0;
  const partner = conversation.members?.find(m => m.profileId !== profileId);

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      {/* HERO SECTION */}
      <View className="items-center pt-8 pb-6 bg-white border-b border-gray-100">
        <TouchableOpacity 
          onPress={conversation.isGroup ? handlePickAvatar : undefined} 
          disabled={!canEditInfo || !conversation.isGroup}
          className="relative mb-4"
        >
          <View className={`w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-sm ${conversation.isGroup ? 'bg-emerald-100' : 'bg-gray-100'}`}>
            {conversation.avatar ? (
              <Image source={{ uri: conversation.avatar }} className="w-full h-full" />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text className={`text-5xl font-bold ${conversation.isGroup ? 'text-emerald-700' : 'text-gray-400'}`}>
                  {conversation.name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            {updateAvatar.isPending && (
              <View className="absolute inset-0 bg-white/60 items-center justify-center">
                <ActivityIndicator color="#059669" />
              </View>
            )}
          </View>
          {conversation.isGroup && canEditInfo && (
            <View className="absolute bottom-1 right-1 bg-emerald-500 p-2 rounded-full border-[3px] border-white shadow-sm">
              <Edit2 size={14} color="#fff" strokeWidth={2.5} />
            </View>
          )}
        </TouchableOpacity>

        {isEditingName ? (
          <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-1">
            <TextInput
              value={editNameValue}
              onChangeText={setEditNameValue}
              autoFocus
              onSubmitEditing={handleNameSave}
              className="text-lg font-bold text-gray-900 min-w-[120px] text-center"
            />
            <TouchableOpacity onPress={handleNameSave} className="ml-2 bg-emerald-500 p-1.5 rounded-full">
              <Check size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-row items-center gap-2 px-6">
            <Text className="text-2xl font-bold text-gray-900 text-center">{conversation.name}</Text>
            {conversation.isGroup && canEditInfo && (
              <TouchableOpacity onPress={() => { setEditNameValue(conversation.name); setIsEditingName(true); }}>
                <Edit2 size={16} color={palette.textGray} />
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {conversation.isGroup && (
          <Text className="text-gray-500 mt-1">{conversation.members?.length || 0} thành viên</Text>
        )}

        {/* Quick Action Buttons */}
        <View className="flex-row items-center gap-8 mt-7">
          <TouchableOpacity 
            onPress={() => conversation.isPinned ? unpinConv.mutate() : pinConv.mutate()}
            disabled={pinConv.isPending || unpinConv.isPending}
            className="items-center gap-2"
          >
            <View className={`w-14 h-14 rounded-[20px] items-center justify-center ${conversation.isPinned ? 'bg-emerald-50' : 'bg-gray-100'}`}>
              <Pin size={24} color={conversation.isPinned ? '#059669' : '#4b5563'} strokeWidth={conversation.isPinned ? 2 : 1.5} />
            </View>
            <Text className={`text-[11px] font-bold tracking-wide uppercase ${conversation.isPinned ? 'text-emerald-700' : 'text-gray-500'}`}>
              {conversation.isPinned ? 'Bỏ ghim' : 'Ghim'}
            </Text>
          </TouchableOpacity>

          {!conversation.isGroup && partner && (
             <TouchableOpacity 
             onPress={() => router.push(`/profile/${partner.profileId}`)}
             className="items-center gap-2"
           >
             <View className="w-14 h-14 rounded-[20px] bg-gray-100 items-center justify-center">
               <Shield size={24} color="#4b5563" strokeWidth={1.5} />
             </View>
             <Text className="text-[11px] font-bold tracking-wide uppercase text-gray-500">Hồ sơ</Text>
           </TouchableOpacity>
          )}

          {conversation.isGroup && isOwner && (
            <TouchableOpacity 
              onPress={() => {
                Alert.alert("Giải tán nhóm", "Bạn có chắc muốn giải tán nhóm này?", [
                  { text: "Hủy", style: "cancel" },
                  { text: "Giải tán", style: "destructive", onPress: () => disband.mutate() }
                ]);
              }}
              className="items-center gap-2"
            >
              <View className="w-14 h-14 rounded-[20px] bg-red-50 items-center justify-center">
                <Trash2 size={24} color="#ef4444" strokeWidth={1.5} />
              </View>
              <Text className="text-[11px] font-bold tracking-wide uppercase text-red-600">Giải tán</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* JOIN LINK */}
      {conversation.isGroup && (
        <View className="px-4 pt-4 pb-2 bg-gray-50">
          <TouchableOpacity 
            onPress={handleCopyLink}
            className={`flex-row items-center justify-center py-3.5 rounded-[16px] border ${copied ? 'bg-emerald-50 border-emerald-200 shadow-sm shadow-emerald-100' : 'bg-white border-gray-200 shadow-sm shadow-gray-100'}`}
          >
            {copied ? (
              <>
                <Check size={18} color="#059669" className="mr-2" />
                <Text className="font-semibold text-emerald-700">Đã sao chép liên kết!</Text>
              </>
            ) : (
              <>
                <Copy size={18} color="#4b5563" className="mr-2" />
                <Text className="font-semibold text-gray-700">Sao chép liên kết mời</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* NAV LINKS */}
      <View className="mt-2 bg-white border-y border-gray-100">
        {conversation.isGroup && (
          <>
            <NavRow 
              icon={<Users size={22} color="#4b5563" />} 
              label="Thành viên" 
              badge={conversation.members?.length} 
              badgeType="count" 
              onClick={() => navigateTo('members')} 
            />
            {canEditInfo && (
              <NavRow 
                icon={<Clock size={22} color="#4b5563" />} 
                label="Yêu cầu tham gia" 
                badge={pendingCount} 
                badgeType="count" 
                onClick={() => navigateTo('join-requests')} 
              />
            )}
          </>
        )}
        
        <NavRow 
          icon={<FileImage size={22} color="#4b5563" />} 
          label="Ảnh & Video" 
          onClick={() => navigateTo('media')} 
        />
        <NavRow 
          icon={<Paperclip size={22} color="#4b5563" />} 
          label="Tệp đính kèm" 
          onClick={() => navigateTo('files')} 
        />
        <NavRow 
          icon={<Pin size={22} color="#4b5563" />} 
          label="Tin nhắn được ghim" 
          onClick={() => navigateTo('pinned')} 
        />
        
        {conversation.isGroup && canEditInfo && (
          <NavRow 
            icon={<Settings size={22} color="#4b5563" />} 
            label="Cài đặt nhóm" 
            onClick={() => navigateTo('settings')} 
          />
        )}
        
        {conversation.isGroup && isOwner && (
          <NavRow 
            icon={<Ban size={22} color="#4b5563" />} 
            label="Thành viên bị chặn" 
            onClick={() => navigateTo('blocked')} 
          />
        )}
      </View>

      {/* DANGER ZONE */}
      <View className="mt-4 mb-8 bg-white border-y border-gray-100">
        {conversation.isGroup ? (
          !isOwner && (
            <NavRow 
              icon={<LogOut size={22} color="#ea580c" />} 
              label="Rời khỏi nhóm" 
              onClick={() => {
                Alert.alert("Rời nhóm", "Bạn có chắc muốn rời khỏi nhóm này?", [
                  { text: "Hủy", style: "cancel" },
                  { text: "Rời", style: "destructive", onPress: () => leave.mutate() }
                ]);
              }} 
              destructive 
            />
          )
        ) : (
          <NavRow 
            icon={<Trash2 size={22} color="#dc2626" />} 
            label="Xóa cuộc trò chuyện" 
            onClick={() => {
              Alert.alert("Xóa hội thoại", "Bạn có chắc muốn xóa cuộc trò chuyện này?", [
                { text: "Hủy", style: "cancel" },
                { text: "Xóa", style: "destructive", onPress: () => deleteConv.mutate() }
              ]);
            }} 
            destructive 
          />
        )}
      </View>
    </ScrollView>
  );
}
