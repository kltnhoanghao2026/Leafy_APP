import React, { useState, useEffect } from 'react';
import { View, Text, Switch, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { chatApi } from '@/src/features/chat/api/chatApi';
import { useConversations } from '@/src/features/chat/hooks/useChatQueries';

import { SafeAreaView } from "react-native-safe-area-context";

export default function SafeGroupSettingsScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <GroupSettingsScreen />
    </SafeAreaView>
  );
}

function GroupSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: conversations } = useConversations();
  const conversation = conversations?.find(c => c.id === id);

  const [settings, setSettings] = useState({
    memberCanChangeInfo: false,
    memberCanPinMessages: false,
    memberCanSendMessages: false,
    membershipApprovalEnabled: false,
    joinByLinkEnabled: false,
  });

  useEffect(() => {
    if (conversation?.settings) {
      setSettings({
        memberCanChangeInfo: conversation.settings.memberCanChangeInfo,
        memberCanPinMessages: conversation.settings.memberCanPinMessages,
        memberCanSendMessages: conversation.settings.memberCanSendMessages,
        membershipApprovalEnabled: conversation.settings.membershipApprovalEnabled,
        joinByLinkEnabled: conversation.settings.joinByLinkEnabled,
      });
    }
  }, [conversation?.settings]);

  const updateSettings = useMutation({
    mutationFn: (newSettings: Partial<typeof settings>) => chatApi.updateGroupSettings(id as string, newSettings),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  const toggleSetting = (key: keyof typeof settings) => {
    const newValue = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newValue }));
    updateSettings.mutate({ [key]: newValue });
  };

  if (!conversation) return null;

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="mt-4 bg-white border-y border-gray-100">
        
        <View className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quyền của thành viên</Text>
        </View>

        <View className="flex-row items-center justify-between p-4 border-b border-gray-50">
          <View className="flex-1 mr-4">
            <Text className="font-semibold text-gray-900 text-base">Sửa thông tin nhóm</Text>
            <Text className="text-sm text-gray-500 mt-0.5">Cho phép thành viên đổi tên và ảnh đại diện</Text>
          </View>
          <Switch 
            value={settings.memberCanChangeInfo} 
            onValueChange={() => toggleSetting('memberCanChangeInfo')} 
            trackColor={{ false: '#d1d5db', true: '#10b981' }}
          />
        </View>

        <View className="flex-row items-center justify-between p-4 border-b border-gray-50">
          <View className="flex-1 mr-4">
            <Text className="font-semibold text-gray-900 text-base">Ghim tin nhắn</Text>
            <Text className="text-sm text-gray-500 mt-0.5">Cho phép thành viên ghim và bỏ ghim tin nhắn</Text>
          </View>
          <Switch 
            value={settings.memberCanPinMessages} 
            onValueChange={() => toggleSetting('memberCanPinMessages')} 
            trackColor={{ false: '#d1d5db', true: '#10b981' }}
          />
        </View>

        <View className="flex-row items-center justify-between p-4 border-b border-gray-50">
          <View className="flex-1 mr-4">
            <Text className="font-semibold text-gray-900 text-base">Gửi tin nhắn</Text>
            <Text className="text-sm text-gray-500 mt-0.5">Cho phép thành viên gửi tin nhắn vào nhóm</Text>
          </View>
          <Switch 
            value={settings.memberCanSendMessages} 
            onValueChange={() => toggleSetting('memberCanSendMessages')} 
            trackColor={{ false: '#d1d5db', true: '#10b981' }}
          />
        </View>

        <View className="px-4 py-3 bg-gray-50 border-y border-gray-100 mt-4">
          <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tham gia nhóm</Text>
        </View>

        <View className="flex-row items-center justify-between p-4 border-b border-gray-50">
          <View className="flex-1 mr-4">
            <Text className="font-semibold text-gray-900 text-base">Phê duyệt thành viên mới</Text>
            <Text className="text-sm text-gray-500 mt-0.5">Người tham gia phải được quản trị viên duyệt</Text>
          </View>
          <Switch 
            value={settings.membershipApprovalEnabled} 
            onValueChange={() => toggleSetting('membershipApprovalEnabled')} 
            trackColor={{ false: '#d1d5db', true: '#10b981' }}
          />
        </View>

        <View className="flex-row items-center justify-between p-4">
          <View className="flex-1 mr-4">
            <Text className="font-semibold text-gray-900 text-base">Tham gia bằng liên kết</Text>
            <Text className="text-sm text-gray-500 mt-0.5">Bật tính năng mời tham gia nhóm bằng link</Text>
          </View>
          <Switch 
            value={settings.joinByLinkEnabled} 
            onValueChange={() => toggleSetting('joinByLinkEnabled')} 
            trackColor={{ false: '#d1d5db', true: '#10b981' }}
          />
        </View>

      </View>
    </ScrollView>
  );
}
