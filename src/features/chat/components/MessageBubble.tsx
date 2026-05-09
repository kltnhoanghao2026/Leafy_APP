import React from 'react';
import { View, Text, Image, TouchableOpacity, Linking } from 'react-native';
import { Ban, AlertTriangle, Video } from 'lucide-react-native';
import { format } from 'date-fns';
import type { MessageResponse } from '../api/chatApi';

interface MessageBubbleProps {
  msg: MessageResponse;
  isMe: boolean;
  isFirstInGroup: boolean;
  showSenderInfo: boolean;
  onReply?: (msg: MessageResponse) => void;
  onEdit?: (msg: MessageResponse) => void;
  onLongPress?: (msg: MessageResponse) => void;
}

import { renderSystemMessage } from '../utils/systemMessageHelper';

export function SystemMessageBubble({ msg }: { msg: MessageResponse }) {
  if (!msg.metadata) return null;

  const content = renderSystemMessage(msg.metadata);

  return (
    <View className="items-center my-3 px-4 w-full">
      <View className="bg-gray-100 rounded-full px-3 py-1.5 border border-gray-200/80 max-w-[85%]">
        <Text className="text-[11px] text-gray-500 text-center leading-5">
          {content}
        </Text>
      </View>
    </View>
  );
}

function VideoAttachment({ url, content }: { url: string; content?: string | null }) {
  return (
    <TouchableOpacity 
      className={`mt-2 rounded-xl overflow-hidden bg-black items-center justify-center ${!content ? '-mx-2 -my-1' : ''}`}
      style={{ width: 192, height: 192 }}
      activeOpacity={0.8}
      onPress={() => Linking.openURL(url)}
    >
      <Video size={48} color="#ffffff" opacity={0.8} />
      <Text className="text-white text-xs mt-2 font-medium">Nhấn để xem Video</Text>
    </TouchableOpacity>
  );
}

export function MessageBubble({ msg, isMe, isFirstInGroup, showSenderInfo, onReply, onEdit, onLongPress }: MessageBubbleProps) {
  const time = format(new Date(msg.createdAt), 'HH:mm');

  const handleLongPress = () => {
    if (msg.status === 'REVOKED' || msg.status === 'DELETED_BY_ADMIN') return;
    onLongPress?.(msg);
  };

  // Handle deleted/revoked
  if (msg.status === 'REVOKED' || msg.status === 'DELETED_BY_ADMIN') {
    return (
      <View className={`flex-row ${isMe ? 'justify-end' : 'justify-start'} mb-1 px-4 w-full`}>
        {showSenderInfo && !isMe && <View className="w-8 mr-2" />}
        <View className={`rounded-2xl px-4 py-2.5 flex-row items-center gap-1.5 ${isMe ? 'bg-green-600' : 'bg-white border border-gray-200'}`}>
          {msg.status === 'REVOKED' ? (
            <>
              <Ban size={14} color={isMe ? '#d1fae5' : '#9ca3af'} />
              <Text className={`italic text-[13px] ${isMe ? 'text-green-100' : 'text-gray-500'}`}>
                Tin nhắn đã bị thu hồi
              </Text>
            </>
          ) : (
            <>
              <AlertTriangle size={14} color={isMe ? '#d1fae5' : '#9ca3af'} />
              <Text className={`italic text-[13px] ${isMe ? 'text-green-100' : 'text-gray-500'}`}>
                Tin nhắn đã bị xóa bởi quản trị viên
              </Text>
            </>
          )}
        </View>
      </View>
    );
  }

  return (
    <View className={`flex-row ${isMe ? 'justify-end' : 'justify-start'} mb-1 px-4 w-full`}>
      {/* Sender Avatar for Group Chats */}
      {!isMe && showSenderInfo && (
        <View className="w-8 mr-2 justify-end pb-4">
          {isFirstInGroup ? (
            <View className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
              {msg.senderAvatar ? (
                <Image source={{ uri: msg.senderAvatar }} className="w-full h-full" />
              ) : (
                <View className="flex-1 items-center justify-center bg-green-100">
                  <Text className="text-xs font-bold text-green-700">
                    {msg.senderName?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
            </View>
          ) : null}
        </View>
      )}

      {/* Bubble Container */}
      <View className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
        {!isMe && showSenderInfo && isFirstInGroup && (
          <Text className="text-xs text-gray-500 ml-1 mb-1 font-medium">{msg.senderName}</Text>
        )}

        <TouchableOpacity
          onLongPress={handleLongPress}
          delayLongPress={250}
          activeOpacity={0.8}
          className={`rounded-2xl px-4 py-2 relative
            ${isMe ? 'bg-green-600' : 'bg-gray-200'}
            ${isMe && isFirstInGroup ? 'rounded-tr-sm' : ''}
            ${!isMe && isFirstInGroup ? 'rounded-tl-sm' : ''}
          `}
        >
          {/* Replied Message Preview */}
          {msg.replyTo && (
            <View className={`mb-2 pl-2 border-l-2 ${isMe ? 'border-green-300' : 'border-gray-400'}`}>
              <Text className={`text-[10px] font-bold ${isMe ? 'text-green-100' : 'text-gray-600'}`}>
                {msg.replyTo.senderName || 'Người dùng'}
              </Text>
              <Text className={`text-xs ${isMe ? 'text-green-50' : 'text-gray-500'}`} numberOfLines={1}>
                {msg.replyTo.content || '[Đính kèm]'}
              </Text>
            </View>
          )}

          {/* Text Content */}
          {!!msg.content && (
            <Text className={`text-[15px] leading-5 ${isMe ? 'text-white' : 'text-gray-900'}`}>
              {msg.content}
            </Text>
          )}

          {/* Attachments */}
          {msg.attachments?.map((att, i) => {
            const isImage = att.contentType.startsWith('image/');
            const isVideo = att.contentType.startsWith('video/');
            if (isImage) {
              return (
                <View key={i} className={`mt-2 rounded-xl overflow-hidden ${!msg.content ? '-mx-2 -my-1' : ''}`}>
                  <Image source={{ uri: att.url }} className="w-48 h-48" resizeMode="cover" />
                </View>
              );
            }
            if (isVideo) {
              return <VideoAttachment key={i} url={att.url} content={msg.content} />;
            }
            return (
              <View key={i} className={`mt-2 flex-row items-center p-2 rounded bg-black/5`}>
                <Text className={`text-sm ${isMe ? 'text-white' : 'text-gray-900'} underline`} numberOfLines={1}>
                  {att.fileName}
                </Text>
              </View>
            );
          })}

          {/* Timestamp inside bubble */}
          <View className={`flex-row items-center mt-1 gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
            {msg.isEdited && <Text className={`italic text-[10px] ${isMe ? 'text-green-100' : 'text-gray-500'}`}>đã sửa ·</Text>}
            <Text className={`text-[10px] ${isMe ? 'text-green-100' : 'text-gray-500'}`}>{time}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
