import React, { useCallback, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  SafeAreaView,
} from "react-native";
import { Camera, Image as ImageIcon, Video, X } from "lucide-react-native";
import { useTranslation } from "react-i18next";

export interface AttachmentItem {
  fileId: string;
  url: string;
  isVideo?: boolean;
}

export interface PendingAttachment {
  id: string;
  uri: string;
  fileName?: string | null;
  mimeType?: string;
  uploading: boolean;
  error?: boolean;
}

interface AttachmentGridProps {
  attachments?: AttachmentItem[];
  onAttachmentPress?: (attachment: AttachmentItem, index: number) => void;
  maxVisible?: number;
  editable?: boolean;
  onRemove?: (attachment: AttachmentItem, index: number) => void;
  pendingItems?: PendingAttachment[];
  onRemovePending?: (id: string) => void;
}

export function AttachmentGrid({
  attachments = [],
  onAttachmentPress,
  maxVisible,
  editable = false,
  onRemove,
  pendingItems = [],
  onRemovePending,
}: AttachmentGridProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [pendingPreviewIndex, setPendingPreviewIndex] = useState<number | null>(null);

  const visibleAttachments = maxVisible
    ? attachments.slice(0, maxVisible)
    : attachments;
  const hiddenCount = maxVisible
    ? Math.max(0, attachments.length - maxVisible)
    : 0;

  const isGrid = visibleAttachments.length + pendingItems.length > 1;
  const thumbnailSize = isGrid
    ? (width - 48 - (visibleAttachments.length % 2 === 0 ? 12 : 0)) / 2
    : Math.min(280, width - 48);

  const hasItems = (attachments?.length ?? 0) > 0 || (pendingItems?.length ?? 0) > 0;
  const totalCount = attachments.length + pendingItems.length;

  const handleClosePreview = useCallback(() => {
    setPreviewIndex(null);
    setPendingPreviewIndex(null);
  }, []);

  const renderUploadedThumbnail = useCallback(
    (item: AttachmentItem, index: number) => {
      const isVideo = item.isVideo || item.url?.match(/\.(mp4|mov|webm|m4v)$/i);

      return (
        <TouchableOpacity
          key={item.fileId}
          className="relative rounded-xl overflow-hidden"
          style={{ width: thumbnailSize, height: thumbnailSize }}
          onPress={() => {
            if (onAttachmentPress) {
              onAttachmentPress(item, index);
            } else {
              setPreviewIndex(index);
            }
          }}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: item.url }}
            className="w-full h-full"
            resizeMode="cover"
          />

          {isVideo && (
            <View className="absolute inset-0 items-center justify-center">
              <View className="w-12 h-12 rounded-full bg-black/50 items-center justify-center">
                <Video size={24} color="#ffffff" />
              </View>
            </View>
          )}

          {editable && onRemove && (
            <TouchableOpacity
              onPress={() => onRemove(item, index)}
              className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full items-center justify-center"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={14} color="#ffffff" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      );
    },
    [editable, onAttachmentPress, onRemove, thumbnailSize],
  );

  const renderPendingThumbnail = useCallback(
    (item: PendingAttachment, index: number) => {
      return (
        <TouchableOpacity
          key={item.id}
          className="relative rounded-xl overflow-hidden"
          style={{ width: thumbnailSize, height: thumbnailSize }}
          onPress={() => setPendingPreviewIndex(index)}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: item.uri }}
            className="w-full h-full"
            resizeMode="cover"
          />

          {item.uploading && !item.error && (
            <View className="absolute inset-0 bg-black/40 items-center justify-center">
              <View className="w-10 h-10 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
              <Text className="text-white text-xs mt-2 font-medium">
                {t("plantEvent.attachments.uploading")}
              </Text>
            </View>
          )}

          {item.error && (
            <View className="absolute inset-0 bg-black/60 items-center justify-center">
              <View className="w-10 h-10 rounded-full bg-red-500/80 items-center justify-center">
                <X size={20} color="#ffffff" />
              </View>
              <Text className="text-white text-xs mt-2 font-medium text-center px-2">
                {t("plantEvent.attachments.uploadFailed")}
              </Text>
            </View>
          )}

          {!item.uploading && !item.error && (
            <View className="absolute inset-0 bg-black/20 items-center justify-center">
              <View className="w-6 h-6 rounded-full bg-yellow-500/80 items-center justify-center">
                <Text className="text-white text-xs font-bold">⏳</Text>
              </View>
            </View>
          )}

          {editable && onRemovePending && !item.uploading && (
            <TouchableOpacity
              onPress={() => onRemovePending(item.id)}
              className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full items-center justify-center"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={14} color="#ffffff" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      );
    },
    [editable, onRemovePending, thumbnailSize, t],
  );

  if (!hasItems) return null;

  return (
    <View className="mt-3">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <ImageIcon size={14} className="text-slate-400" />
          <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t("plantEvent.attachments.title", { count: totalCount })}
          </Text>
        </View>
        {pendingItems.length > 0 && (
          <Text className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            {pendingItems.filter(p => p.uploading).length > 0
              ? t("plantEvent.attachments.uploadingCount", {
                  count: pendingItems.filter(p => p.uploading).length,
                  total: pendingItems.length,
                })
              : t("plantEvent.attachments.pendingCount", {
                  count: pendingItems.length,
                })}
          </Text>
        )}
      </View>

      <View className="flex-row flex-wrap gap-2">
        {visibleAttachments.map((item, index) =>
          renderUploadedThumbnail(item, index),
        )}

        {hiddenCount > 0 && (
          <View
            className="items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800"
            style={{ width: thumbnailSize, height: thumbnailSize }}
          >
            <Text className="text-lg font-bold text-slate-500 dark:text-slate-400">
              +{hiddenCount}
            </Text>
          </View>
        )}

        {pendingItems.map((item, index) =>
          renderPendingThumbnail(item, index),
        )}
      </View>

      {/* Full-screen preview for uploaded attachments */}
      <Modal
        visible={previewIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={handleClosePreview}
      >
        <View className="flex-1 bg-black">
          <SafeAreaView className="flex-1">
            <View className="flex-row items-center justify-between p-4 pt-12">
              <Text className="text-white text-sm font-medium">
                {previewIndex !== null
                  ? `${previewIndex + 1} / ${attachments.length}`
                  : ""}
              </Text>
              <TouchableOpacity
                onPress={handleClosePreview}
                className="w-10 h-10 items-center justify-center"
              >
                <X size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentOffset={{
                x: previewIndex !== null ? previewIndex * width : 0,
                y: 0,
              }}
              onMomentumScrollEnd={(e) => {
                const newIndex = Math.round(
                  e.nativeEvent.contentOffset.x / width,
                );
                setPreviewIndex(newIndex);
              }}
            >
              {attachments.map((item, index) => {
                const isVideo = item.isVideo || item.url?.match(/\.(mp4|mov|webm|m4v)$/i);
                return (
                  <View
                    key={item.fileId}
                    className="items-center justify-center"
                    style={{ width }}
                  >
                    {isVideo ? (
                      <View className="w-full h-full items-center justify-center bg-black/20">
                        <Video size={64} color="#ffffff" />
                        <Text className="text-white text-sm mt-2">
                          Video preview not available
                        </Text>
                      </View>
                    ) : (
                      <Image
                        source={{ uri: item.url }}
                        className="w-full h-full"
                        resizeMode="contain"
                      />
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Full-screen preview for pending attachments */}
      <Modal
        visible={pendingPreviewIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={handleClosePreview}
      >
        <View className="flex-1 bg-black">
          <SafeAreaView className="flex-1">
            <View className="flex-row items-center justify-between p-4 pt-12">
              <Text className="text-white text-sm font-medium">
                {pendingPreviewIndex !== null
                  ? `${pendingPreviewIndex + 1} / ${pendingItems.length} (Pending)`
                  : ""}
              </Text>
              <TouchableOpacity
                onPress={handleClosePreview}
                className="w-10 h-10 items-center justify-center"
              >
                <X size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentOffset={{
                x: pendingPreviewIndex !== null ? pendingPreviewIndex * width : 0,
                y: 0,
              }}
              onMomentumScrollEnd={(e) => {
                const newIndex = Math.round(
                  e.nativeEvent.contentOffset.x / width,
                );
                setPendingPreviewIndex(newIndex);
              }}
            >
              {pendingItems.map((item, index) => (
                <View
                  key={item.id}
                  className="items-center justify-center"
                  style={{ width }}
                >
                  <Image
                    source={{ uri: item.uri }}
                    className="w-full h-full"
                    resizeMode="contain"
                  />
                  {item.uploading && !item.error && (
                    <View className="absolute bottom-8 left-0 right-0 items-center">
                      <View className="px-4 py-2 bg-black/60 rounded-full">
                        <Text className="text-white text-sm font-medium">
                          {t("plantEvent.attachments.uploading")}
                        </Text>
                      </View>
                    </View>
                  )}
                  {item.error && (
                    <View className="absolute bottom-8 left-0 right-0 items-center">
                      <View className="px-4 py-2 bg-red-600/80 rounded-full">
                        <Text className="text-white text-sm font-medium">
                          {t("plantEvent.attachments.uploadFailed")}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

interface AttachmentPickerButtonProps {
  onPressGallery: () => void;
  onPressCamera?: () => void;
  disabled?: boolean;
}

export function AttachmentPickerButton({
  onPressGallery,
  onPressCamera,
  disabled,
}: AttachmentPickerButtonProps) {
  const { t } = useTranslation();
  const [showOptions, setShowOptions] = useState(false);

  return (
    <>
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() => setShowOptions(true)}
          disabled={disabled}
          className={`flex-1 flex-row items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-4 py-3 dark:border-slate-700 ${
            disabled ? "opacity-50" : ""
          }`}
          activeOpacity={0.7}
        >
          <ImageIcon size={18} className="text-slate-400" />
          <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {t("plantEvent.attachments.add")}
          </Text>
        </TouchableOpacity>

        {onPressCamera && (
          <TouchableOpacity
            onPress={onPressCamera}
            disabled={disabled}
            className={`w-14 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 ${
              disabled ? "opacity-50" : ""
            }`}
            activeOpacity={0.7}
          >
            <Camera size={18} className="text-slate-400" />
          </TouchableOpacity>
        )}
      </View>

      {/* Options modal */}
      <Modal
        visible={showOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowOptions(false)}
        >
          <Pressable
            className="bg-white dark:bg-slate-900 rounded-t-3xl p-4 pb-8"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />
            <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {t("plantEvent.attachments.addFrom")}
            </Text>

            <TouchableOpacity
              onPress={() => {
                setShowOptions(false);
                onPressGallery();
              }}
              className="flex-row items-center gap-4 p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <View className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center">
                <ImageIcon size={20} className="text-slate-600 dark:text-slate-400" />
              </View>
              <View>
                <Text className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t("plantEvent.attachments.fromGallery")}
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                  {t("plantEvent.attachments.fromGalleryDesc")}
                </Text>
              </View>
            </TouchableOpacity>

            {onPressCamera && (
              <TouchableOpacity
                onPress={() => {
                  setShowOptions(false);
                  onPressCamera();
                }}
                className="flex-row items-center gap-4 p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <View className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center">
                  <Camera size={20} className="text-slate-600 dark:text-slate-400" />
                </View>
                <View>
                  <Text className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t("plantEvent.attachments.fromCamera")}
                  </Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    {t("plantEvent.attachments.fromCameraDesc")}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
