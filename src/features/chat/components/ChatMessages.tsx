import React, { useRef, useMemo, useEffect, useState } from 'react';
import { FlatList, View, ActivityIndicator, Modal, TouchableOpacity, Text, Alert } from 'react-native';
import { Reply, Pencil, Trash2 } from 'lucide-react-native';
import { BottomSheet } from '../../../components/ui/BottomSheet';
import { useInfiniteMessages } from '../hooks/useChatQueries';
import { MessageBubble, SystemMessageBubble } from './MessageBubble';
import { chatApi } from '../api/chatApi';
import { useQueryClient } from '@tanstack/react-query';
import type { MessageResponse } from '../api/chatApi';

interface ChatMessagesProps {
  conversationId: string;
  currentUserId: string;
  isGroup: boolean;
  unreadCount: number;
  wsConnected: boolean;
  liveMessages: MessageResponse[];
  onReply?: (msg: MessageResponse) => void;
  onEdit?: (msg: MessageResponse) => void;
}

export function ChatMessages({
  conversationId,
  currentUserId,
  isGroup,
  unreadCount,
  wsConnected,
  liveMessages,
  onReply,
  onEdit,
}: ChatMessagesProps) {
  const queryClient = useQueryClient();
  const flatListRef = useRef<FlatList>(null);
  const [actionMessage, setActionMessage] = useState<MessageResponse | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteMessages(conversationId, wsConnected);

  // Flatten pages: pages[0] = most-recent page, data within each page is DESC (newest first).
  // FlatList inverted=true renders data[0] at the visual bottom, so newest-first = correct.
  const historicalMessages = useMemo(() => {
    if (!data) return [];
    const all: MessageResponse[] = [];
    for (const page of data.pages) {
      all.push(...page.data);
    }
    return all;
  }, [data]);

  // Merge live messages — live messages are newest.
  // The WS cache is in arrival order (oldest first), so we must reverse them 
  // to make them descending (newest first) to match historical messages for the inverted FlatList.
  const allMessages = useMemo(() => {
    const seen = new Set(historicalMessages.map(m => m.id));
    const newLive = liveMessages.filter(m => !seen.has(m.id));
    const reversedLive = [...newLive].reverse();
    return [...reversedLive, ...historicalMessages];
  }, [historicalMessages, liveMessages]);

  // Auto-scroll to bottom (offset 0 in inverted FlatList = visual bottom) when new live messages arrive
  const prevLiveLengthRef = useRef(0);
  useEffect(() => {
    if (liveMessages.length > prevLiveLengthRef.current) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
    prevLiveLengthRef.current = liveMessages.length;
  }, [liveMessages]);

  // Mark conversation as read once per conversation entry (intentionally omit unreadCount
  // from deps so it doesn't re-fire every time the count changes — same as Leafy_FE)
  const hasMarkedRead = useRef(false);
  useEffect(() => {
    hasMarkedRead.current = false;
  }, [conversationId]);
  useEffect(() => {
    if (conversationId && unreadCount > 0 && !hasMarkedRead.current) {
      hasMarkedRead.current = true;
      chatApi.markAsRead(conversationId).then(() => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      });
    }
  }, [conversationId, queryClient, unreadCount]);

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
        ref={flatListRef}
        inverted
        data={allMessages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 16 }}
        renderItem={({ item, index }) => {
          if (item.type === 'SYSTEM') return <SystemMessageBubble msg={item} />;
          
          const isMe = item.senderId === currentUserId;
          const prevMsg = allMessages[index + 1];
          const isFirstInGroup = !prevMsg || prevMsg.senderId !== item.senderId || prevMsg.type === 'SYSTEM';

          return (
            <MessageBubble
              msg={item}
              isMe={isMe}
              isFirstInGroup={isFirstInGroup}
              showSenderInfo={isGroup}
              onReply={onReply}
              onEdit={onEdit}
              onLongPress={(msg) => setActionMessage(msg)}
            />
          );
        }}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color="#16a34a" />
            </View>
          ) : null
        }
      />

      <Modal
        visible={!!actionMessage}
        transparent
        animationType="fade"
        onRequestClose={() => setActionMessage(null)}
      >
        {actionMessage && (
          <BottomSheet
            title="Tùy chọn tin nhắn"
            titleColor="#1e293b"
            heightPct={actionMessage.senderId === currentUserId ? 300 : 180}
            onClose={() => setActionMessage(null)}
          >
            <View className="px-4 py-3">
              <TouchableOpacity
                activeOpacity={0.7}
                className="flex-row items-center py-3.5 px-3 rounded-xl bg-white active:bg-slate-50 mb-2 border border-slate-100 shadow-sm"
                onPress={() => {
                  setActionMessage(null);
                  onReply?.(actionMessage);
                }}
              >
                <View className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center mr-3">
                  <Reply size={20} color="#475569" />
                </View>
                <View>
                  <Text className="text-[15px] text-slate-800 font-bold">Trả lời</Text>
                  <Text className="text-[12px] text-slate-500 mt-0.5">Trích dẫn tin nhắn này để trả lời</Text>
                </View>
              </TouchableOpacity>

              {actionMessage.senderId === currentUserId && (
                <>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    className="flex-row items-center py-3.5 px-3 rounded-xl bg-white active:bg-slate-50 mb-2 border border-slate-100 shadow-sm"
                    onPress={() => {
                      setActionMessage(null);
                      onEdit?.(actionMessage);
                    }}
                  >
                    <View className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center mr-3">
                      <Pencil size={20} color="#475569" />
                    </View>
                    <View>
                      <Text className="text-[15px] text-slate-800 font-bold">Chỉnh sửa</Text>
                      <Text className="text-[12px] text-slate-500 mt-0.5">Sửa lại nội dung tin nhắn</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    className="flex-row items-center py-3.5 px-3 rounded-xl bg-white active:bg-red-50 border border-red-50 shadow-sm"
                    onPress={() => {
                      setActionMessage(null);
                      Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn thu hồi tin nhắn này?', [
                        { text: 'Hủy', style: 'cancel' },
                        { text: 'Thu hồi', style: 'destructive', onPress: () => chatApi.revokeMessage(actionMessage.id) }
                      ]);
                    }}
                  >
                    <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3">
                      <Trash2 size={20} color="#ef4444" />
                    </View>
                    <View>
                      <Text className="text-[15px] text-red-600 font-bold">Thu hồi</Text>
                      <Text className="text-[12px] text-red-400 mt-0.5">Gỡ bỏ tin nhắn này đối với mọi người</Text>
                    </View>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </BottomSheet>
        )}
      </Modal>
    </View>
  );
}
