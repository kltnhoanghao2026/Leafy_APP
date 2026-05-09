import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Users, Pin } from 'lucide-react-native';
import { format, isToday, isYesterday } from 'date-fns';
import type { ConversationResponse } from '../api/chatApi';

interface ConversationListItemProps {
  conversation: ConversationResponse;
  currentUserId: string;
  isPinned?: boolean;
  onPress: (id: string) => void;
  onLongPress?: (id: string) => void;
}

// Format the timestamp nicely
function formatTime(timestampStr?: string | null) {
  if (!timestampStr) return '';
  const date = new Date(timestampStr);
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Hôm qua';
  return format(date, 'dd/MM/yyyy');
}

import { formatSystemMessageAsText } from '../utils/systemMessageHelper';

export function ConversationListItem({
  conversation,
  currentUserId,
  isPinned,
  onPress,
  onLongPress,
}: ConversationListItemProps) {
  const { id, name, avatar, isGroup, isDisbanded, unreadCount, lastMessage } = conversation;
  
  const displayTime = formatTime(lastMessage?.timestamp);
  
  let previewText = lastMessage?.content || '';
  if (lastMessage?.type === 'IMAGE') previewText = '[Hình ảnh]';
  else if (lastMessage?.type === 'VIDEO') previewText = '[Video]';
  else if (lastMessage?.type === 'FILE') previewText = '[Tệp]';
  else if (lastMessage?.type === 'SYSTEM') previewText = formatSystemMessageAsText(lastMessage.metadata);
  
  const prefix = lastMessage?.type === 'SYSTEM' ? '' : (lastMessage?.isFromMe ? 'Bạn: ' : (isGroup && lastMessage?.senderName ? `${lastMessage.senderName}: ` : ''));

  return (
    <TouchableOpacity 
      className={`flex-row items-center px-4 py-3 border-b border-gray-100 ${isPinned ? 'bg-emerald-50 active:bg-emerald-100' : 'bg-white active:bg-gray-50'}`}
      onPress={() => onPress(id)}
      onLongPress={() => onLongPress?.(id)}
    >
      {/* Avatar */}
      <View className="relative w-14 h-14 rounded-full bg-gray-200 mr-3">
        {avatar ? (
          <Image source={{ uri: avatar }} className="w-full h-full rounded-full" />
        ) : (
          <View className="flex-1 items-center justify-center bg-green-100 rounded-full">
            <Text className="text-xl font-bold text-green-700">{name?.charAt(0)?.toUpperCase() || 'U'}</Text>
          </View>
        )}
        {/* Group Indicator Overlay */}
        {isGroup && (
          <View className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-600 rounded-full border-2 border-white items-center justify-center shadow-sm">
            <Users size={10} color="white" />
          </View>
        )}
      </View>

      {/* Content */}
      <View className="flex-1 justify-center">
        <View className="flex-row justify-between items-center mb-1">
          <View className="flex-1 mr-2">
            <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>{name}</Text>
          </View>
          <View className="flex-row items-center shrink-0">
            {isPinned && (
              <View className="mr-1.5">
                <Pin size={14} color="#64748b" style={{ transform: [{ rotate: '45deg' }] }} />
              </View>
            )}
            {!!displayTime && (
              <Text className={`text-xs ${unreadCount > 0 ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                {displayTime}
              </Text>
            )}
          </View>
        </View>

        <View className="flex-row justify-between items-center">
          <Text 
            className={`flex-1 text-sm ${unreadCount > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}
            numberOfLines={1}
          >
            {isDisbanded ? 'Nhóm đã giải tán' : `${prefix}${previewText}`}
          </Text>

          {unreadCount > 0 && (
            <View className="bg-green-600 rounded-full min-w-[20px] h-5 items-center justify-center px-1 ml-2">
              <Text className="text-[11px] font-bold text-white">{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
