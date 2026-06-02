import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SendHorizonal } from "lucide-react-native";

import { BottomSheet } from "@/src/components/ui/BottomSheet";
import { CommentCard } from "@/src/features/community/community-feed/components/CommentCard";
import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import { parseApiError } from "@/src/lib/error-handler";
import { getCommentsByPostQueryOptions } from "@/src/features/community/community-feed/queries/options";
import { useState } from "react";
import { useCreateCommentMutation } from "@/src/features/community/community-feed/queries/mutations";

export default function ModalScreen() {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId?: string }>();
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const palette = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const [commentText, setCommentText] = useState("");
  const [replyTarget, setReplyTarget] = useState<{
    commentId: string;
    authorName: string;
  } | null>(null);

  const safePostId = Array.isArray(postId)
    ? (postId[0] ?? "")
    : typeof postId === "string"
      ? postId
      : "";
  const { data, isLoading, isError, error } = useQuery(
    getCommentsByPostQueryOptions(safePostId, 0, 100),
  );

  const { mutateAsync: createComment, isPending: isCreatingComment } =
    useCreateCommentMutation();

  const onSubmitComment = async () => {
    const text = commentText.trim();
    if (!text || isCreatingComment || !safePostId) return;

    try {
      await createComment({
        postId: safePostId,
        content: text,
        parentId: replyTarget?.commentId,
      });
      setCommentText("");
      setReplyTarget(null);
    } catch {
      // Keep text in input on error so user can retry
    }
  };

  const comments = data?.content ?? [];
  const parsedError = isError ? parseApiError(error) : null;
  const mutedText = palette.textGray;

  return (
    <BottomSheet
      title="Bình luận"
      titleColor={palette.text}
      onClose={() => router.back()}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          {!safePostId ? (
            <View className="py-8 items-center">
              <Text
                className="text-center text-sm"
                style={{ color: "#EF4444" }}
              >
                Thiếu postId để tải bình luận.
              </Text>
            </View>
          ) : null}

          {isLoading ? (
            <View className="py-8 items-center">
              <Text
                className="text-center text-[15px] font-medium"
                style={{ color: mutedText }}
              >
                Đang tải bình luận...
              </Text>
            </View>
          ) : null}

          {isError ? (
            <View className="py-8 items-center">
              <Text
                className="text-center text-sm"
                style={{ color: "#EF4444" }}
              >
                {parsedError?.message || "Không thể tải bình luận lúc này."}
              </Text>
            </View>
          ) : null}

          {!isLoading && !isError && comments.length === 0 ? (
            <View className="py-12 items-center justify-center">
              <Text
                className="text-center text-[15px] font-medium"
                style={{ color: mutedText }}
              >
                Trở thành người đầu tiên bình luận
              </Text>
              <Text
                className="text-center text-[13px] mt-2"
                style={{ color: palette.textGray }}
              >
                Hãy chia sẻ suy nghĩ của bạn về bài viết này.
              </Text>
            </View>
          ) : null}

          <View className="mb-4">
            {comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                palette={palette}
                mutedText={mutedText}
                onReply={(commentId, authorName) =>
                  setReplyTarget({ commentId, authorName })
                }
              />
            ))}
          </View>
        </ScrollView>

        {/* Input Bar */}
        <View
          className="border-t px-4 py-3"
          style={{
            borderColor: colorScheme === "dark" ? "#334155" : "#E2E8F0",
            backgroundColor: colorScheme === "dark" ? "#0F172A" : "#FFFFFF",
            paddingBottom: Math.max(12, insets.bottom),
          }}
        >
          {replyTarget && (
            <View className="flex-row items-center mb-1.5 gap-2 px-1">
              <Text className="text-[12px]" style={{ color: palette.primary }}>
                Trả lời {replyTarget.authorName}
              </Text>
              <Pressable onPress={() => setReplyTarget(null)} hitSlop={8}>
                <Text
                  className="text-[12px] font-medium"
                  style={{ color: mutedText }}
                >
                  ✕
                </Text>
              </Pressable>
            </View>
          )}
          <View className="flex-row items-center">
            <TextInput
              className="flex-1 rounded-full px-5 py-3 text-[15px]"
              style={{
                backgroundColor: colorScheme === "dark" ? "#1E293B" : "#F1F5F9",
                color: palette.text,
              }}
              placeholder={
                replyTarget
                  ? `Trả lời ${replyTarget.authorName}...`
                  : "Thêm bình luận..."
              }
              placeholderTextColor={mutedText}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            <Pressable
              className="ml-3 p-2 rounded-full"
              style={{
                opacity: commentText.trim() && !isCreatingComment ? 1 : 0.5,
              }}
              disabled={!commentText.trim() || isCreatingComment}
              onPress={onSubmitComment}
            >
              {isCreatingComment ? (
                <ActivityIndicator
                  size="small"
                  color={colorScheme === "dark" ? "#38BDF8" : "#0284C7"}
                />
              ) : (
                <SendHorizonal
                  size={22}
                  color={colorScheme === "dark" ? "#38BDF8" : "#0284C7"}
                />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

