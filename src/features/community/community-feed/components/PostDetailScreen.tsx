import {
  ArrowBigDown,
  ArrowBigUp,
  ChevronDown,
  MessageCircle,
  MoreHorizontal,
  SendHorizonal,
  Share2,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import { parseApiError } from "@/src/lib/error-handler";

import type { Post, Comment as CommentType } from "./community.types";
import { formatStat } from "./community.utils";
import { CommentCard } from "./CommentCard";
import { PostVoteListModal } from "./PostVoteListModal";
import {
  useHandleVoteMutation,
  useCreateCommentMutation,
} from "../queries/mutations";
import {
  getPostByIdQueryOptions,
  getCommentsByPostQueryOptions,
} from "../queries/options";

const FALLBACK_AVATAR =
  "https://ui-avatars.com/api/?background=E5E7EB&color=334155&name=Leafy";

const SCREEN_WIDTH = Dimensions.get("window").width;

type PostDetailScreenProps = {
  postId: string;
};

export function PostDetailScreen({ postId }: PostDetailScreenProps) {
  const router = useRouter();
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const palette = Colors[colorScheme];
  const mutedText = palette.textGray;

  const {
    data: post,
    isLoading: isLoadingPost,
    isError: isPostError,
    error: postError,
    refetch: refetchPost,
  } = useQuery(getPostByIdQueryOptions(postId));

  const {
    data: commentsPage,
    isLoading: isLoadingComments,
    isError: isCommentsError,
    error: commentsError,
  } = useQuery(getCommentsByPostQueryOptions(postId, 0, 20));

  const comments = commentsPage?.content ?? [];
  const parsedPostError = isPostError ? parseApiError(postError) : null;
  const parsedCommentsError = isCommentsError
    ? parseApiError(commentsError)
    : null;

  if (!postId) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: palette.background }}
      >
        <Text style={{ color: "#EF4444" }}>Thiếu postId.</Text>
      </View>
    );
  }

  if (isLoadingPost) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: palette.background }}
      >
        <ActivityIndicator size="large" color={palette.primary} />
        <Text
          className="mt-3 text-[15px] font-medium"
          style={{ color: mutedText }}
        >
          Đang tải bài viết...
        </Text>
      </View>
    );
  }

  if (isPostError || !post) {
    return (
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: palette.background }}
      >
        <Text className="text-center text-[15px]" style={{ color: "#EF4444" }}>
          {parsedPostError?.message || "Không thể tải bài viết lúc này."}
        </Text>
        <Pressable
          className="mt-4 rounded-full px-6 py-2.5"
          style={{ backgroundColor: palette.primary }}
          onPress={() => refetchPost()}
        >
          <Text className="text-[14px] font-semibold text-white">Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <PostDetailContent
      post={post}
      postId={postId}
      comments={comments}
      commentsPage={commentsPage}
      isLoadingComments={isLoadingComments}
      isCommentsError={isCommentsError}
      parsedCommentsError={parsedCommentsError}
      palette={palette}
      colorScheme={colorScheme}
      mutedText={mutedText}
    />
  );
}

type PostDetailContentProps = {
  post: Post;
  postId: string;
  comments: CommentType[];
  commentsPage: { last?: boolean } | undefined;
  isLoadingComments: boolean;
  isCommentsError: boolean;
  parsedCommentsError: { message?: string } | null;
  palette: (typeof Colors)["light"];
  colorScheme: "light" | "dark";
  mutedText: string;
};

function PostDetailContent({
  post,
  postId,
  comments,
  commentsPage,
  isLoadingComments,
  isCommentsError,
  parsedCommentsError,
  palette,
  colorScheme,
  mutedText,
}: PostDetailContentProps) {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  // ── Vote state (optimistic, same pattern as PostCard) ──
  const [userVote, setUserVote] = useState<Post["userVote"]>(post.userVote);
  const [upvoteCount, setUpvoteCount] = useState(post.stats.upvoteCount);
  const [downvoteCount, setDownvoteCount] = useState(post.stats.downvoteCount);
  const [showVotersSheet, setShowVotersSheet] = useState(false);
  const { mutateAsync: handleVote, isPending: isVoting } =
    useHandleVoteMutation();

  useEffect(() => {
    setUserVote(post.userVote);
    setUpvoteCount(post.stats.upvoteCount);
    setDownvoteCount(post.stats.downvoteCount);
  }, [
    post.id,
    post.userVote,
    post.stats.upvoteCount,
    post.stats.downvoteCount,
  ]);

  const upvoteActive = userVote === "up";
  const downvoteActive = userVote === "down";
  const score = upvoteCount - downvoteCount;

  const applyVoteTransition = (nextVote: "up" | "down") => {
    const prevVote = userVote;
    let nextUserVote: Post["userVote"] = nextVote;
    let nextUpvoteCount = upvoteCount;
    let nextDownvoteCount = downvoteCount;

    if (prevVote === nextVote) {
      nextUserVote = undefined;
      if (nextVote === "up") {
        nextUpvoteCount = Math.max(0, nextUpvoteCount - 1);
      } else {
        nextDownvoteCount = Math.max(0, nextDownvoteCount - 1);
      }
    } else if (nextVote === "up") {
      nextUpvoteCount += 1;
      if (prevVote === "down") {
        nextDownvoteCount = Math.max(0, nextDownvoteCount - 1);
      }
    } else {
      nextDownvoteCount += 1;
      if (prevVote === "up") {
        nextUpvoteCount = Math.max(0, nextUpvoteCount - 1);
      }
    }

    return { nextUserVote, nextUpvoteCount, nextDownvoteCount };
  };

  const onVote = async (nextVote: "up" | "down") => {
    if (isVoting) return;

    const prevState = { userVote, upvoteCount, downvoteCount };
    const { nextUserVote, nextUpvoteCount, nextDownvoteCount } =
      applyVoteTransition(nextVote);

    setUserVote(nextUserVote);
    setUpvoteCount(nextUpvoteCount);
    setDownvoteCount(nextDownvoteCount);

    try {
      await handleVote({
        targetType: "POST",
        targetId: post.id,
        voteType: nextVote === "up" ? "UPVOTE" : "DOWNVOTE",
      });
    } catch {
      setUserVote(prevState.userVote);
      setUpvoteCount(prevState.upvoteCount);
      setDownvoteCount(prevState.downvoteCount);
    }
  };

  // ── Comment input state ──
  const [commentText, setCommentText] = useState("");
  const [replyTarget, setReplyTarget] = useState<{
    commentId: string;
    authorName: string;
  } | null>(null);
  const inputRef = useRef<TextInput>(null);
  const { mutateAsync: createComment, isPending: isCreatingComment } =
    useCreateCommentMutation();

  const onSubmitComment = async () => {
    const text = commentText.trim();
    if (!text || isCreatingComment) return;

    try {
      await createComment({
        postId,
        content: text,
        parentId: replyTarget?.commentId,
      });
      setCommentText("");
      setReplyTarget(null);
    } catch {
      // Keep text in input on error so user can retry
    }
  };

  const onReplyToComment = (commentId: string, authorName: string) => {
    setReplyTarget({ commentId, authorName });
    inputRef.current?.focus();
  };

  // ── Derived values ──
  const authorLabel = post.author || "Người dùng";
  const avatarUri = post.authorAvatar || FALLBACK_AVATAR;
  const bodyText = post.content?.caption || post.content?.description || "";
  const titleText = post.content?.title?.trim();
  const sharedPost = post.postType === "SHARE" ? post.sharedPost : null;
  const hasMultipleMedia = post.media && post.media.length > 1;

  // ── Media carousel state ──
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        style={{ backgroundColor: palette.background }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="bg-white dark:bg-black">
          {/* ── Author Header ── */}
          <View className="flex-row items-start justify-between px-4 pt-5 pb-3">
            <View className="flex-row items-center gap-3">
              <Image
                source={{ uri: avatarUri }}
                className="h-12 w-12 rounded-full bg-gray-200"
                resizeMode="cover"
              />
              <View className="justify-center">
                <Text
                  className="text-[16px] font-bold tracking-tight"
                  style={{ color: palette.text }}
                >
                  {authorLabel}
                </Text>
                <Text
                  className="mt-0.5 text-[13px]"
                  style={{ color: mutedText }}
                >
                  {post.meta || `Tác giả: ${post.authorId || "ẩn danh"}`}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2 pt-1">
              {post.urgent && (
                <View className="rounded-md bg-red-50 px-2 py-1 dark:bg-red-500/10">
                  <Text className="text-[11px] font-bold uppercase tracking-widest text-[#DC2626]">
                    Khẩn cấp
                  </Text>
                </View>
              )}
              <Pressable className="p-1">
                <MoreHorizontal size={20} color={mutedText} />
              </Pressable>
            </View>
          </View>

          {/* ── Content Body ── */}
          <View className="px-4 pb-3 pt-1">
            {titleText ? (
              <Text
                className="mb-1.5 text-[18px] font-semibold leading-[26px]"
                style={{ color: palette.text }}
              >
                {titleText}
              </Text>
            ) : null}

            {bodyText ? (
              <Text
                className="text-[15px] leading-[23px]"
                style={{ color: palette.text }}
              >
                {bodyText}
              </Text>
            ) : null}

            {post.content?.hashtags && post.content.hashtags.length > 0 ? (
              <Text
                className="mt-2.5 text-[13px]"
                style={{ color: palette.primary }}
              >
                {post.content.hashtags.join(" ")}
              </Text>
            ) : null}
          </View>

          {/* ── Shared Post Embed ── */}
          {sharedPost && (
            <View className="mx-4 mb-3 rounded-xl border border-slate-200/60 dark:border-white/10 overflow-hidden">
              <View className="px-3 pt-3 pb-2">
                <View className="flex-row items-center gap-2 mb-2">
                  <Image
                    source={{
                      uri: sharedPost.authorAvatar || FALLBACK_AVATAR,
                    }}
                    className="h-7 w-7 rounded-full bg-gray-200"
                    resizeMode="cover"
                  />
                  <Text
                    className="text-[13px] font-semibold"
                    style={{ color: palette.text }}
                  >
                    {sharedPost.author || "Người dùng"}
                  </Text>
                  <Text className="text-[11px]" style={{ color: mutedText }}>
                    · {sharedPost.meta}
                  </Text>
                </View>
                {sharedPost.content?.title?.trim() ? (
                  <Text
                    className="mb-1 text-[14px] font-semibold leading-[20px]"
                    style={{ color: palette.text }}
                  >
                    {sharedPost.content.title}
                  </Text>
                ) : null}
                {sharedPost.content?.caption ||
                sharedPost.content?.description ? (
                  <Text
                    className="text-[14px] leading-[20px]"
                    style={{ color: palette.text }}
                    numberOfLines={5}
                  >
                    {sharedPost.content?.caption ||
                      sharedPost.content?.description}
                  </Text>
                ) : null}
              </View>
              {sharedPost.media && sharedPost.media.length > 0 && (
                <Image
                  source={{ uri: sharedPost.media[0].url }}
                  className="h-[200px] w-full bg-slate-100 dark:bg-zinc-900"
                  resizeMode="cover"
                />
              )}
            </View>
          )}

          {/* ── Media Gallery ── */}
          {post.media && post.media.length > 0 && (
            <View>
              {hasMultipleMedia ? (
                <View>
                  <FlatList
                    data={post.media}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(_, index) => `media-${index}`}
                    onMomentumScrollEnd={(e) => {
                      const idx = Math.round(
                        e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
                      );
                      setActiveMediaIndex(idx);
                    }}
                    renderItem={({ item }) => (
                      <Image
                        source={{ uri: item.url }}
                        style={{ width: SCREEN_WIDTH, height: 320 }}
                        className="bg-slate-100 dark:bg-zinc-900"
                        resizeMode="cover"
                      />
                    )}
                  />
                  {/* Dot indicators */}
                  <View className="flex-row items-center justify-center gap-1.5 py-3">
                    {post.media.map((_, index) => (
                      <View
                        key={`dot-${index}`}
                        className="rounded-full"
                        style={{
                          width: index === activeMediaIndex ? 8 : 6,
                          height: index === activeMediaIndex ? 8 : 6,
                          backgroundColor:
                            index === activeMediaIndex
                              ? palette.primary
                              : colorScheme === "dark"
                                ? "rgba(255,255,255,0.3)"
                                : "rgba(0,0,0,0.2)",
                        }}
                      />
                    ))}
                  </View>
                </View>
              ) : (
                <Image
                  source={{ uri: post.media[0].url }}
                  className="h-[320px] w-full bg-slate-100 dark:bg-zinc-900"
                  resizeMode="cover"
                />
              )}
            </View>
          )}

          {/* ── Vote Section ── */}
          <View className="px-4 pt-4 pb-2">
            <View className="flex-row items-center justify-between">
              {/* Vote Capsule */}
              <View className="flex-row items-center rounded-full bg-slate-100 px-1 py-0.5 dark:bg-white/10">
                <Pressable
                  className="h-9 w-11 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/5"
                  onPress={() => onVote("up")}
                  disabled={isVoting}
                >
                  <ArrowBigUp
                    size={24}
                    color={upvoteActive ? palette.primary : mutedText}
                    fill={upvoteActive ? palette.primary : "transparent"}
                  />
                </Pressable>
                <Text
                  className="min-w-[36px] text-center text-[14px] font-bold tracking-tight"
                  style={{
                    color:
                      score > 0
                        ? palette.primary
                        : score < 0
                          ? "#DC2626"
                          : palette.text,
                  }}
                >
                  {score > 0 ? `+${formatStat(score)}` : formatStat(score)}
                </Text>
                <Pressable
                  className="h-9 w-11 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/5"
                  onPress={() => onVote("down")}
                  disabled={isVoting}
                >
                  <ArrowBigDown
                    size={24}
                    color={downvoteActive ? "#DC2626" : mutedText}
                    fill={downvoteActive ? "#DC2626" : "transparent"}
                  />
                </Pressable>
              </View>

              {/* Voter count link */}
              <Pressable
                className="flex-row items-center gap-1.5"
                onPress={() => setShowVotersSheet(true)}
              >
                <Text
                  className="text-[13px] font-medium"
                  style={{ color: mutedText }}
                >
                  {formatStat(upvoteCount)} up · {formatStat(downvoteCount)}{" "}
                  down
                </Text>
                <ChevronDown size={16} color={mutedText} />
              </Pressable>
            </View>

            {/* Stats & Actions */}
            <View className="mt-3 flex-row items-center justify-between border-t border-slate-200/50 pt-3 dark:border-white/5">
              <View className="flex-row items-center gap-6">
                <View className="flex-row items-center gap-2">
                  <MessageCircle size={20} color={mutedText} />
                  <Text
                    className="text-[13px] font-medium"
                    style={{ color: mutedText }}
                  >
                    {formatStat(post.stats.commentCount)}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Share2 size={20} color={mutedText} />
                  <Text
                    className="text-[13px] font-medium"
                    style={{ color: mutedText }}
                  >
                    {formatStat(post.stats.shareCount)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Comments Section ── */}
          <View className="mt-2 border-t-[6px] border-slate-100 dark:border-white/5">
            {/* Section Header */}
            <View className="px-4 pt-4 pb-2">
              <Text
                className="text-[16px] font-bold"
                style={{ color: palette.text }}
              >
                Bình luận ({formatStat(post.stats.commentCount)})
              </Text>
            </View>

            {/* Loading */}
            {isLoadingComments && (
              <View className="items-center py-8">
                <ActivityIndicator size="small" color={mutedText} />
                <Text
                  className="mt-2 text-center text-[14px]"
                  style={{ color: mutedText }}
                >
                  Đang tải bình luận...
                </Text>
              </View>
            )}

            {/* Error */}
            {isCommentsError && (
              <View className="items-center py-8">
                <Text
                  className="text-center text-sm"
                  style={{ color: "#EF4444" }}
                >
                  {parsedCommentsError?.message ||
                    "Không thể tải bình luận lúc này."}
                </Text>
              </View>
            )}

            {/* Empty */}
            {!isLoadingComments &&
              !isCommentsError &&
              comments.length === 0 && (
                <View className="items-center justify-center py-12">
                  <Text
                    className="text-center text-[15px] font-medium"
                    style={{ color: mutedText }}
                  >
                    Trở thành người đầu tiên bình luận
                  </Text>
                  <Text
                    className="mt-2 text-center text-[13px]"
                    style={{ color: palette.textGray }}
                  >
                    Hãy chia sẻ suy nghĩ của bạn về bài viết này.
                  </Text>
                </View>
              )}

            {/* Comment list */}
            {!isLoadingComments && comments.length > 0 && (
              <View className="px-4 pb-4">
                {comments.map((comment) => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    palette={palette}
                    mutedText={mutedText}
                  />
                ))}

                {/* Load more */}
                {commentsPage && !commentsPage.last && (
                  <Pressable className="items-center py-3">
                    <Text
                      className="text-[14px] font-semibold"
                      style={{ color: palette.primary }}
                    >
                      Xem thêm bình luận
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ── Sticky Comment Input Bar ── */}
      <View
        className="flex-row items-center border-t px-4 py-3 pb-8"
        style={{
          borderColor: colorScheme === "dark" ? "#334155" : "#E2E8F0",
          backgroundColor: colorScheme === "dark" ? "#0F172A" : "#FFFFFF",
        }}
      >
        <View className="flex-1">
          {replyTarget && (
            <View className="flex-row items-center mb-1.5 gap-2">
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
          <TextInput
            ref={inputRef}
            className="rounded-full px-5 py-3 text-[15px]"
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
        </View>
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

      {/* ── Vote List Modal (reuse existing) ── */}
      <PostVoteListModal
        postId={post.id}
        isVisible={showVotersSheet}
        onClose={() => setShowVotersSheet(false)}
        upvoteCount={upvoteCount}
        downvoteCount={downvoteCount}
        palette={palette}
        mutedText={mutedText}
      />
    </KeyboardAvoidingView>
  );
}
