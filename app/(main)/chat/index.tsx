import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, ActivityIndicator, TouchableOpacity, Text, RefreshControl, Alert, Modal, Animated } from 'react-native';
import { router } from 'expo-router';
import { Plus, X, MessageSquare, Users, Pin, PinOff, Trash2 } from 'lucide-react-native';
import { BottomSheet } from '../../../src/components/ui/BottomSheet';
import { useConversations } from '../../../src/features/chat/hooks/useChatQueries';
import { ConversationListItem } from '../../../src/features/chat/components/ConversationListItem';
import { useAuthContext } from '../../../src/features/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../../../src/features/chat/api/chatApi';

import { SafeAreaView } from "react-native-safe-area-context";

export default function SafeChatListScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <ChatListScreen />
    </SafeAreaView>
  );
}

function ChatListScreen() {
  const qc = useQueryClient();
  const { data: conversations = [], isLoading, refetch, isRefetching } = useConversations();
  const { user } = useAuthContext();
  const currentUserId = user?.userId || ''; // Use userId or profileId based on what you need
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [actionConv, setActionConv] = useState<{ id: string, isPinned: boolean, name: string } | null>(null);

  const fabAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(fabAnim, {
      toValue: isFabOpen ? 1 : 0,
      useNativeDriver: true,
      friction: 5,
      tension: 60,
    }).start();
  }, [isFabOpen, fabAnim]);

  const fabTranslateY = fabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0]
  });

  const fabScale = fabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1]
  });

  const fabOpacity = fabAnim;

  const { data: fetchedPinned = [] } = useQuery({
    queryKey: ['pinnedConversations'],
    queryFn: chatApi.getPinnedConversations,
  });

  const pinMutation = useMutation({
    mutationFn: (id: string) => chatApi.pinConversation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pinnedConversations'] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  const unpinMutation = useMutation({
    mutationFn: (id: string) => chatApi.unpinConversation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pinnedConversations'] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => chatApi.deleteConversation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  const pinnedIds = new Set(fetchedPinned.map(c => c.id));
  const normalList = conversations.filter(c => !pinnedIds.has(c.id));
  const displayConversations = [
    ...fetchedPinned.map(c => ({ ...c, isPinned: true })), 
    ...normalList
  ];

  const handleLongPress = (id: string, isPinned: boolean, name: string) => {
    setActionConv({ id, isPinned, name });
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={displayConversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationListItem
            conversation={item}
            currentUserId={currentUserId}
            isPinned={item.isPinned}
            onPress={(id) => router.push(`/chat/${id}`)}
            onLongPress={(id) => handleLongPress(id, !!item.isPinned, item.name || 'Hội thoại')}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={['#16a34a']}
            tintColor="#16a34a"
          />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-8 mt-20">
            <Text className="text-gray-500 text-center mb-2">Chưa có cuộc trò chuyện nào</Text>
            <Text className="text-gray-400 text-center text-sm">Bắt đầu trò chuyện với bạn bè hoặc tạo nhóm mới</Text>
          </View>
        }
      />

      {/* Overlay to close FAB when clicking outside */}
      {isFabOpen && (
        <TouchableOpacity 
          className="absolute inset-0 bg-black/20 z-40"
          activeOpacity={1}
          onPress={() => setIsFabOpen(false)}
        />
      )}

      {/* FAB Container */}
      <View className="absolute bottom-6 right-6 z-50 items-end">
        <Animated.View
          className="items-end mb-4"
          style={{
            opacity: fabOpacity,
            transform: [{ translateY: fabTranslateY }, { scale: fabScale }],
          }}
          pointerEvents={isFabOpen ? 'auto' : 'none'}
        >
          <TouchableOpacity
            className="flex-row items-center mb-4"
            onPress={() => {
              setIsFabOpen(false);
              router.push('/chat/new-group');
            }}
          >
            <Text className="bg-white px-3 py-1.5 rounded-lg shadow-sm mr-3 font-semibold text-gray-700">Tạo nhóm</Text>
            <View className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-md border border-gray-100">
              <Users size={20} color="#16a34a" />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="flex-row items-center mb-2"
            onPress={() => {
              setIsFabOpen(false);
              router.push('/chat/new-dm');
            }}
          >
            <Text className="bg-white px-3 py-1.5 rounded-lg shadow-sm mr-3 font-semibold text-gray-700">Nhắn tin</Text>
            <View className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-md border border-gray-100">
              <MessageSquare size={20} color="#16a34a" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          onPress={() => setIsFabOpen(!isFabOpen)}
          className="w-14 h-14 bg-green-600 rounded-full items-center justify-center shadow-lg"
          style={{ elevation: 5 }}
        >
          {isFabOpen ? (
            <X size={24} color="white" />
          ) : (
            <Plus size={24} color="white" />
          )}
        </TouchableOpacity>
      </View>

      {/* Action Menu Modal */}
      <Modal
        visible={!!actionConv}
        transparent
        animationType="fade"
        onRequestClose={() => setActionConv(null)}
      >
        {actionConv && (
          <BottomSheet
            title={actionConv.name}
            titleColor="#1e293b"
            heightPct={240}
            onClose={() => setActionConv(null)}
          >
            <View className="px-4 py-3">
              <TouchableOpacity
                activeOpacity={0.7}
                className="flex-row items-center py-3.5 px-3 rounded-xl bg-white active:bg-slate-50 mb-2 border border-slate-100 shadow-sm"
                onPress={() => {
                  if (actionConv.isPinned) unpinMutation.mutate(actionConv.id);
                  else pinMutation.mutate(actionConv.id);
                  setActionConv(null);
                }}
              >
                <View className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center mr-3">
                  {actionConv.isPinned ? (
                    <PinOff size={20} color="#475569" />
                  ) : (
                    <Pin size={20} color="#475569" />
                  )}
                </View>
                <View>
                  <Text className="text-[15px] text-slate-800 font-bold">
                    {actionConv.isPinned ? 'Bỏ ghim hội thoại' : 'Ghim hội thoại'}
                  </Text>
                  <Text className="text-[12px] text-slate-500 mt-0.5">
                    {actionConv.isPinned ? 'Xóa khỏi đầu danh sách' : 'Ghim lên đầu danh sách tin nhắn'}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                className="flex-row items-center py-3.5 px-3 rounded-xl bg-white active:bg-red-50 border border-red-50 shadow-sm"
                onPress={() => {
                  setActionConv(null);
                  Alert.alert('Xác nhận xóa', `Bạn có chắc muốn xóa cuộc trò chuyện "${actionConv.name}"?`, [
                    { text: 'Hủy', style: 'cancel' },
                    { text: 'Xóa', style: 'destructive', onPress: () => deleteMutation.mutate(actionConv.id) }
                  ]);
                }}
              >
                <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3">
                  <Trash2 size={20} color="#ef4444" />
                </View>
                <View>
                  <Text className="text-[15px] text-red-600 font-bold">Xóa hội thoại</Text>
                  <Text className="text-[12px] text-red-400 mt-0.5">Hành động này không thể hoàn tác</Text>
                </View>
              </TouchableOpacity>
            </View>
          </BottomSheet>
        )}
      </Modal>
    </View>
  );
}
