import {
  ArrowBigDown,
  ArrowBigUp,
  ChevronDown,
  ClipboardList,
  MessageCircle,
  MoreHorizontal,
  Share2,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Post, CommunityPalette } from "./community.types";
import { formatStat } from "./community.utils";
import { useHandleVoteMutation } from "../queries/mutations";
import { PostVoteListModal } from "./PostVoteListModal";

const FALLBACK_AVATAR =
  "https://ui-avatars.com/api/?background=E5E7EB&color=334155&name=Leafy";

type PostCardProps = {
  post: Post;
  palette: CommunityPalette;
  mutedText: string;
  onOpenComments?: (postId: string) => void;
};

export function PostCard({
  post,
  palette,
  mutedText,
  onOpenComments,
}: PostCardProps) {
  const router = useRouter();
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
    post.stats.downvoteCount,
    post.stats.upvoteCount,
  ]);

  const upvoteActive = userVote === "up";
  const downvoteActive = userVote === "down";
  const score = upvoteCount - downvoteCount;
  const authorLabel = post.author || "Nguoi dung";
  const avatarUri =
    post.authorAvatar ||
    "https://ui-avatars.com/api/?background=E5E7EB&color=334155&name=Leafy";
  const bodyText = post.content?.caption || post.content?.description || "";
  const titleText = post.content?.title?.trim();
  const sharedPost = post.postType === "SHARE" ? post.sharedPost : null;
  const planId = post.postType === "PLAN_SHARE" ? (post.planId ?? null) : null;

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

  const navigateToDetail = () => {
    router.push({
      pathname: "/(main)/community/post/[postId]",
      params: { postId: post.id },
    });
  };

  const onVote = async (nextVote: "up" | "down") => {
    if (isVoting) {
      return;
    }

    const prevState = {
      userVote,
      upvoteCount,
      downvoteCount,
    };

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

  return (
    <>
      <View className="bg-white pb-2 dark:bg-black">
        {/* Top Separator */}
        <View
          className="h-[6px] w-full"
          style={{ backgroundColor: "rgba(148,163,184,0.1)" }}
        />

        {/* Header */}
        <Pressable
          onPress={navigateToDetail}
          className="flex-row items-start justify-between px-4 pt-4 pb-2"
        >
          <View className="flex-row items-center gap-3">
            <Image
              source={{ uri: avatarUri }}
              className="h-10 w-10 rounded-full bg-gray-200"
              resizeMode="cover"
            />
            <View className="justify-center">
              <Text
                className="text-[15px] font-bold tracking-tight"
                style={{ color: palette.text }}
              >
                {authorLabel}
              </Text>
              <Text className="mt-0.5 text-[13px]" style={{ color: mutedText }}>
                {post.meta || `Tac gia: ${post.authorId || "an danh"}`}
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
        </Pressable>

        {/* Text Content */}
        <Pressable onPress={navigateToDetail} className="px-4 pb-3 pt-1">
          {titleText ? (
            <Text
              className="mb-1 text-[16px] font-semibold leading-[22px]"
              style={{ color: palette.text }}
            >
              {titleText}
            </Text>
          ) : null}

          <Text
            className="text-[15px] leading-[22px]"
            style={{ color: palette.text }}
          >
            {bodyText}
          </Text>

          {post.content?.hashtags && post.content.hashtags.length > 0 ? (
            <Text
              className="mt-2 text-[13px]"
              style={{ color: palette.primary }}
            >
              {post.content.hashtags.join(" ")}
            </Text>
          ) : null}
        </Pressable>

        {/* Shared Post Embed */}
        {sharedPost && (
          <View className="mx-4 mb-3 rounded-xl border border-slate-200/60 dark:border-white/10 overflow-hidden">            <View className="px-3 pt-3 pb-2">
              <View className="flex-row items-center gap-2 mb-2">
                <Image
                  source={{ uri: sharedPost.authorAvatar || FALLBACK_AVATAR }}
                  className="h-6 w-6 rounded-full bg-gray-200"
                  resizeMode="cover"
                />
                <Text
                  className="text-[13px] font-semibold"
                  style={{ color: palette.text }}
                >
                  {sharedPost.author || "Nguoi dung"}
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
                  numberOfLines={3}
                >
                  {sharedPost.content?.caption ||
                    sharedPost.content?.description}
                </Text>
              ) : null}
            </View>
            {sharedPost.media && sharedPost.media.length > 0 && (
              <Image
                source={{ uri: sharedPost.media[0].url }}
                className="h-[180px] w-full bg-slate-100 dark:bg-zinc-900"
                resizeMode="cover"
              />
            )}
          </View>
        )}

        {/* Plan Reference Embed */}
        {planId && (
          <View className="mx-4 mb-3 flex-row items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950">
            <ClipboardList size={18} color="#245A34" />
            <View className="flex-1">
              <Text className="text-[11px] font-black uppercase tracking-widest text-[#245A34]">
                Kế hoạch điều trị
              </Text>
              <Text className="mt-0.5 text-[13px] text-slate-500">
                ID: {planId.slice(0, 12)}...
              </Text>
            </View>
          </View>
        )}

        {/* Media Content */}
        {post.media && post.media.length > 0 && (
          <Pressable onPress={navigateToDetail}>
            <Image
              source={{ uri: post.media[0].url }}
              className="h-[280px] w-full bg-slate-100 dark:bg-zinc-900"
              resizeMode="cover"
            />
          </Pressable>
        )}

        {/* Action Footer */}
        <View className="px-4 pt-3 pb-1">
          <View className="flex-row items-center justify-between">
            {/* Vote Capsule */}
            <View className="flex-row items-center rounded-full bg-slate-100 px-1 py-0.5 dark:bg-white/10">
              <Pressable
                className="h-8 w-10 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/5"
                onPress={() => onVote("up")}
                disabled={isVoting}
              >
                <ArrowBigUp
                  size={22}
                  color={upvoteActive ? palette.primary : mutedText}
                  fill={upvoteActive ? palette.primary : "transparent"}
                />
              </Pressable>
              <Text
                className="min-w-[32px] text-center text-[13px] font-bold tracking-tight"
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
                className="h-8 w-10 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/5"
                onPress={() => onVote("down")}
                disabled={isVoting}
              >
                <ArrowBigDown
                  size={22}
                  color={downvoteActive ? "#DC2626" : mutedText}
                  fill={downvoteActive ? "#DC2626" : "transparent"}
                />
              </Pressable>
            </View>

            {/* Score Meta */}
            <Pressable
              className="flex-row items-center gap-1.5"
              onPress={() => {
                setShowVotersSheet(true);
              }}
            >
              <Text
                className="text-[13px] font-medium"
                style={{ color: mutedText }}
              >
                {formatStat(upvoteCount)} up · {formatStat(downvoteCount)} down
              </Text>
              <ChevronDown size={16} color={mutedText} />
            </Pressable>
          </View>

          {/* Secondary Actions */}
          <View className="mt-3 flex-row items-center justify-between border-t border-slate-200/50 pt-3 dark:border-white/5">
            <View className="flex-row items-center gap-6">
              <Pressable
                className="flex-row items-center gap-2 active:opacity-70"
                onPress={() => onOpenComments?.(post.id)}
              >
                <MessageCircle size={20} color={mutedText} />
                <Text
                  className="text-[13px] font-medium"
                  style={{ color: mutedText }}
                >
                  {formatStat(post.stats.commentCount)}
                </Text>
              </Pressable>
              <Pressable className="flex-row items-center gap-2 active:opacity-70">
                <Share2 size={20} color={mutedText} />
                <Text
                  className="text-[13px] font-medium"
                  style={{ color: mutedText }}
                >
                  {formatStat(post.stats.shareCount)}
                </Text>
              </Pressable>
            </View>

            {post.urgent && (
              <Pressable
                className="active:opacity-70"
                onPress={navigateToDetail}
              >
                <Text
                  className="text-[13px] font-semibold"
                  style={{ color: palette.primary }}
                >
                  Xem chi tiết
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      <PostVoteListModal
        postId={post.id}
        isVisible={showVotersSheet}
        onClose={() => setShowVotersSheet(false)}
        upvoteCount={upvoteCount}
        downvoteCount={downvoteCount}
        palette={palette}
        mutedText={mutedText}
      />
    </>
  );
}
