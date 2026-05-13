import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/chatApi';
import { uploadFile } from '../../common/api/file.api';
import type { AttachmentRequest, MessageResponse, ReplyMetadata } from '../api/chatApi';
import { Camera, Image as ImageIcon, Send, X } from 'lucide-react-native';

interface ChatInputProps {
  conversationId: string;
  isDisbanded: boolean;
  canSendMessages?: boolean;
  wsConnected: boolean;
  replyTarget?: MessageResponse | null;
  onCancelReply?: () => void;
  editTarget?: MessageResponse | null;
  onCancelEdit?: () => void;
}

interface PendingFile {
  asset: ImagePicker.ImagePickerAsset;
  uploading: boolean;
  error: boolean;
  result?: { fileId: string; url: string };
}

export function ChatInput({
  conversationId,
  isDisbanded,
  canSendMessages = true,
  wsConnected,
  replyTarget,
  onCancelReply,
  editTarget,
  onCancelEdit
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (editTarget) {
      setInput(editTarget.content || '');
    }
  }, [editTarget]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    
    if (!result.canceled) {
      handleFilesSelected(result.assets);
    }
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Cần quyền truy cập máy ảnh để chụp ảnh');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      handleFilesSelected(result.assets);
    }
  };

  const handleFilesSelected = async (assets: ImagePicker.ImagePickerAsset[]) => {
    const newEntries: PendingFile[] = assets.map(asset => ({
      asset,
      uploading: true,
      error: false,
    }));
    
    setPendingFiles(prev => [...prev, ...newEntries]);
    const startIdx = pendingFiles.length;

    const settled = await Promise.allSettled(assets.map(asset => uploadFile(asset)));
    
    setPendingFiles(prev => {
      const updated = [...prev];
      settled.forEach((result, i) => {
        const idx = startIdx + i;
        if (result.status === 'fulfilled') {
          updated[idx] = { ...updated[idx], uploading: false, result: { fileId: result.value.fileId, url: result.value.url } };
        } else {
          updated[idx] = { ...updated[idx], uploading: false, error: true };
        }
      });
      return updated;
    });
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const sendMutation = useMutation({
    mutationFn: async ({ content, attachments, replyTo }: { content: string; attachments: AttachmentRequest[], replyTo?: ReplyMetadata }) => {
      if (editTarget) {
        await chatApi.editMessage(editTarget.id, content);
      } else {
        await chatApi.sendMessage({ conversationId, content: content || undefined, attachments, replyTo });
      }
    },
    onSuccess: () => {
      // Always invalidate the paginated history so the sent message appears immediately,
      // regardless of whether the WS push has arrived yet.
      // When WS IS working, the push will arrive and deduplicate via message id — no double rendering.
      queryClient.invalidateQueries({ queryKey: ['chat-messages-v2', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setInput('');
      setPendingFiles([]);
      if (onCancelReply) onCancelReply();
      if (onCancelEdit) onCancelEdit();
    },
  });

  const handleSend = () => {
    if (isDisbanded) return;
    const hasText = input.trim().length > 0;
    const uploadedFiles = pendingFiles.filter(pf => !pf.uploading && !pf.error && pf.result);
    if (!hasText && uploadedFiles.length === 0) return;
    if (pendingFiles.some(pf => pf.uploading)) return;

    const attachments: AttachmentRequest[] = uploadedFiles.map(pf => ({
      key: pf.result!.fileId,
      url: pf.result!.url,
      fileName: pf.asset.fileName || 'upload.jpg',
      originalFileName: pf.asset.fileName || 'upload.jpg',
      contentType: pf.asset.mimeType || 'image/jpeg',
      size: pf.asset.fileSize || 0,
    }));

    let replyTo: ReplyMetadata | undefined = undefined;
    if (replyTarget) {
      replyTo = {
        messageId: replyTarget.id,
        senderId: replyTarget.senderId,
        senderName: replyTarget.senderName,
        content: replyTarget.content,
        type: replyTarget.type,
      };
    }

    sendMutation.mutate({ content: input.trim(), attachments, replyTo });
  };

  const isUploading = pendingFiles.some(pf => pf.uploading);
  const canSend = !sendMutation.isPending && !isDisbanded && !isUploading &&
    (input.trim().length > 0 || pendingFiles.some(pf => !pf.uploading && !pf.error && pf.result));

  if (!canSendMessages && !isDisbanded) {
    return (
      <View className="bg-white border-t border-gray-100 px-6 py-4 items-center justify-center">
        <Text className="text-sm text-gray-500 font-medium text-center">
          Trưởng nhóm đã tắt quyền nhắn tin của thành viên
        </Text>
      </View>
    );
  }

  return (
    <View className={`bg-white border-t border-gray-100 pb-2 ${isDisbanded ? 'opacity-50' : ''}`}>
      {replyTarget && (
        <View className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex-row items-center justify-between">
          <View className="flex-1 mr-2">
            <Text className="text-[11px] font-semibold text-green-600">Trả lời {replyTarget.senderName || 'Người dùng'}</Text>
            <Text className="text-xs text-gray-500" numberOfLines={1}>{replyTarget.content || '[Đính kèm]'}</Text>
          </View>
          <TouchableOpacity onPress={onCancelReply} className="p-1">
            <X size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      )}

      {editTarget && (
        <View className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex-row items-center justify-between">
          <View className="flex-1 mr-2">
            <Text className="text-[11px] font-semibold text-blue-600">Đang chỉnh sửa tin nhắn</Text>
          </View>
          <TouchableOpacity onPress={onCancelEdit} className="p-1">
            <X size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      )}

      {pendingFiles.length > 0 && (
        <View className="flex-row flex-wrap px-4 pt-2 gap-2">
          {pendingFiles.map((pf, i) => (
            <View key={i} className="relative w-16 h-16 rounded-xl border border-gray-200 overflow-hidden">
              <Image source={{ uri: pf.asset.uri }} className="w-full h-full" />
              {pf.uploading && (
                <View className="absolute inset-0 bg-white/60 items-center justify-center">
                  <ActivityIndicator size="small" color="#16a34a" />
                </View>
              )}
              {pf.error && (
                <View className="absolute inset-0 bg-red-500/20 items-center justify-center">
                  <Text className="text-red-600 font-bold">!</Text>
                </View>
              )}
              {!pf.uploading && (
                <TouchableOpacity 
                  onPress={() => removePendingFile(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full items-center justify-center"
                >
                  <X size={12} color="#ffffff" strokeWidth={3} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      <View className="flex-row items-end px-4 py-2 gap-2">
        <View className={`flex-row pb-1 ${editTarget ? 'opacity-30' : ''}`}>
          <TouchableOpacity onPress={handleCamera} disabled={!!editTarget} className="p-2">
            <Camera size={24} color="#16a34a" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePickImage} disabled={!!editTarget} className="p-2">
            <ImageIcon size={24} color="#16a34a" />
          </TouchableOpacity>
        </View>

        <View className="flex-1 bg-gray-100 rounded-3xl min-h-[40px] max-h-[120px] justify-center px-4 py-2 border border-transparent">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={isDisbanded ? 'Nhóm đã giải tán' : 'Nhập tin nhắn…'}
            placeholderTextColor="#9ca3af"
            editable={!isDisbanded}
            multiline
            className="text-[15px] text-gray-900 leading-5 pt-0 pb-0"
          />
        </View>

        <View className="pb-1">
          <TouchableOpacity 
            onPress={handleSend}
            disabled={!canSend}
            className={`w-10 h-10 rounded-full items-center justify-center ${canSend ? 'bg-green-600' : 'bg-gray-200'}`}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Send size={18} color={canSend ? '#ffffff' : '#9ca3af'} style={{ marginLeft: 2, marginTop: 2 }} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
