import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, Text, TouchableOpacity, Image } from 'react-native';
import { Users } from 'lucide-react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useWebSocketClient } from '@/src/providers/WebSocketProvider';
import { useConversations, useLiveMessages } from '../../../src/features/chat/hooks/useChatQueries';
import { ChatMessages } from '../../../src/features/chat/components/ChatMessages';
import { ChatInput } from '../../../src/features/chat/components/ChatInput';
import { useAuthContext } from '../../../src/features/auth';
import type { MessageResponse } from '../../../src/features/chat/api/chatApi';
import { useHeaderHeight } from '@react-navigation/elements';

import { SafeAreaView } from "react-native-safe-area-context";

export default function SafeChatScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <ChatScreen />
    </SafeAreaView>
  );
}

function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = id as string;
  const headerHeight = useHeaderHeight();

  const { connected } = useWebSocketClient();
  const { data: conversations } = useConversations();
  const conversation = conversations?.find(c => c.id === conversationId);

  // useAuthContext holds the full ProfileResponse — user.id IS the profileId,
  // which matches msg.senderId from the backend.
  const { user } = useAuthContext();
  const currentUserId = user?.id || '';

  const liveMessages = useLiveMessages(conversationId);
  const [replyTarget, setReplyTarget] = useState<MessageResponse | null>(null);
  const [editTarget, setEditTarget] = useState<MessageResponse | null>(null);

  if (!conversation) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-500">Đang tải...</Text>
      </View>
    );
  }

  const { name, avatar, isGroup, isDisbanded, settings, members } = conversation;
  
  const currentMember = members?.find(m => m.profileId === currentUserId);
  const currentRole = currentMember?.role ?? 'MEMBER';
  const isAdminOrOwner = currentRole === 'OWNER' || currentRole === 'ADMIN';
  const memberCanSendMessages = settings?.memberCanSendMessages ?? true;
  const canSendMessages = isAdminOrOwner || memberCanSendMessages;
  const memberCount = members?.length ?? 0;
  const subtitle = isDisbanded
    ? '🔒 Nhóm đã giải tán'
    : isGroup ? `${memberCount} thành viên` : 'Nhắn tin';
  const subtitleColor = isDisbanded ? 'text-red-500' : isGroup ? 'text-blue-600' : 'text-gray-500';

  return (
    <>
      <Stack.Screen 
        options={{
          headerTitle: () => (
            <TouchableOpacity 
              className="flex-row items-center ml-2" 
              onPress={() => router.push(`/chat/info?id=${conversationId}`)}
            >
              <View className="relative mr-3">
                <View className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden border border-gray-200">
                  {avatar ? (
                    <Image source={{ uri: avatar }} className="w-full h-full" />
                  ) : (
                    <View className="flex-1 items-center justify-center bg-green-100">
                      <Text className="text-sm font-bold text-green-700">{name?.charAt(0)?.toUpperCase() || 'U'}</Text>
                    </View>
                  )}
                </View>
                {isGroup && (
                  <View className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-600 rounded-full border border-white items-center justify-center shadow-sm">
                    <Users size={8} color="white" />
                  </View>
                )}
              </View>
              <View>
                <Text className="text-base font-bold text-gray-900 leading-tight" numberOfLines={1}>{name}</Text>
                <Text className={`text-xs font-medium tracking-wide ${subtitleColor}`}>{subtitle}</Text>
              </View>
            </TouchableOpacity>
          ),
          headerTitleAlign: 'left',
          headerRight: () => (
            <View className={`w-2 h-2 rounded-full mr-4 ${connected ? 'bg-green-500' : 'bg-gray-300'}`} />
          )
        }} 
      />

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={headerHeight}
      >
        <View className="flex-1 bg-white">
          {/* Disbanded Banner */}
          {isDisbanded && (
            <View className="px-4 py-2.5 bg-red-50 border-b border-red-100 items-center justify-center">
              <Text className="text-sm text-red-600 font-medium text-center">
                🔒 Nhóm này đã bị giải tán và không thể gửi tin nhắn mới.
              </Text>
            </View>
          )}

          <ChatMessages
            conversationId={conversationId}
            currentUserId={currentUserId}
            isGroup={isGroup}
            unreadCount={conversation.unreadCount ?? 0}
            wsConnected={connected}
            liveMessages={liveMessages}
            onReply={setReplyTarget}
            onEdit={setEditTarget}
          />
          <ChatInput
            conversationId={conversationId}
            isDisbanded={isDisbanded}
            canSendMessages={canSendMessages}
            wsConnected={connected}
            replyTarget={replyTarget}
            onCancelReply={() => setReplyTarget(null)}
            editTarget={editTarget}
            onCancelEdit={() => setEditTarget(null)}
          />
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
