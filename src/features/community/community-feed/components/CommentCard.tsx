import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  MessageCircle,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Image, Pressable, Text, View, ActivityIndicator } from "react-native";

import type { Comment, CommunityPalette } from "./community.types";
import { getRepliesByCommentQueryOptions } from "../queries/options";
import { useHandleVoteMutation } from "../queries/mutations";

const FALLBACK_AVATAR =
  "https://ui-avatars.com/api/?background=E5E7EB&color=334155&name=Leafy";

type CommentCardProps = {
  comment: Comment;
  palette: CommunityPalette;
  mutedText: string;
  isReply?: boolean;
  onReply?: (commentId: string, authorName: string) => void;
};

export function CommentCard({
  comment,
  palette,
  mutedText,
  isReply = false,
  onReply,
}: CommentCardProps) {
  const [userVote, setUserVote] = useState<Comment["userVote"]>(
    comment.userVote,
  );
  const [upvoteCount, setUpvoteCount] = useState(comment.upvoteCount ?? 0);
  const [downvoteCount, setDownvoteCount] = useState(
    comment.downvoteCount ?? 0,
  );
  const { mutateAsync: handleVote, isPending: isVoting } =
    useHandleVoteMutation();

  useEffect(() => {
    setUserVote(comment.userVote);
    setUpvoteCount(comment.upvoteCount ?? 0);
    setDownvoteCount(comment.downvoteCount ?? 0);
  }, [
    comment.id,
    comment.userVote,
    comment.upvoteCount,
    comment.downvoteCount,
  ]);

  const upvoteActive = userVote === "up";
  const downvoteActive = userVote === "down";
  const [showReplies, setShowReplies] = useState(false);

  const { data, isLoading } = useQuery({
    ...getRepliesByCommentQueryOptions(comment.id, 0, 20),
    enabled: showReplies,
  });

  const replies = data?.content ?? [];

  const applyVoteTransition = (nextVote: "up" | "down") => {
    const prevVote = userVote;
    let nextUserVote: Comment["userVote"] = nextVote;
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
        targetType: "COMMENT",
        targetId: comment.id,
        voteType: nextVote === "up" ? "UPVOTE" : "DOWNVOTE",
      });
    } catch {
      setUserVote(prevState.userVote);
      setUpvoteCount(prevState.upvoteCount);
      setDownvoteCount(prevState.downvoteCount);
    }
  };

  return (
    <View className={`flex-row gap-3 py-3 px-1 ${isReply ? "mt-1 mb-2" : ""}`}>
      {/* Avatar column */}
      <View>
        <Image
          source={{ uri: comment.authorAvatar || FALLBACK_AVATAR }}
          className={`${isReply ? "h-8 w-8" : "h-10 w-10"} rounded-full bg-slate-200 border border-slate-100 dark:border-slate-800`}
        />
      </View>

      {/* Content column */}
      <View className="flex-1 space-y-2">
        {/* Header: Name, time, more options */}
        <View className="flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center gap-1.5 overflow-hidden">
            <Text
              className="text-[15px] font-bold shrink"
              style={{ color: palette.text }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {comment.author || `Người dùng ${comment.authorId.slice(-6)}`}
            </Text>
            <Text
              className="text-[11px] font-medium shrink-0"
              style={{ color: mutedText }}
            >
              •{" "}
              {comment.createdMeta
                ?.replace(" ago", "")
                .replace("với", "")
                .trim() || "now"}
            </Text>
          </View>
          <Pressable className="p-1 shrink-0">
            <MoreHorizontal size={18} color={mutedText} />
          </Pressable>
        </View>

        {/* Comment body */}
        <View className="mt-1 pr-4">
          <Text
            className="text-[15px] leading-[22px]"
            style={{ color: palette.text }}
          >
            {comment.content}
          </Text>
        </View>

        {/* Actions row */}
        <View className="mt-2.5 flex-row items-center gap-6">
          <View className="flex-row items-center gap-1.5">
            <Pressable
              className="p-1 -ml-1 flex-row items-center gap-1.5"
              hitSlop={8}
              onPress={() => onVote("up")}
              disabled={isVoting}
            >
              <ArrowUp
                size={16}
                color={upvoteActive ? palette.primary : mutedText}
                strokeWidth={2.5}
              />
              <Text
                className="text-[13px] font-medium"
                style={{ color: upvoteActive ? palette.primary : mutedText }}
              >
                {upvoteCount > 0 ? upvoteCount : "Thích"}
              </Text>
            </Pressable>
            <Pressable
              className="p-1 flex-row items-center"
              hitSlop={8}
              onPress={() => onVote("down")}
              disabled={isVoting}
            >
              <ArrowDown
                size={16}
                color={downvoteActive ? "#DC2626" : mutedText}
                strokeWidth={2.5}
              />
            </Pressable>
          </View>

          <Pressable
            className="flex-row items-center gap-1.5 p-1"
            hitSlop={8}
            onPress={() =>
              onReply?.(
                comment.id,
                comment.author || `Người dùng ${comment.authorId.slice(-6)}`
              )
            }
          >
            <MessageCircle size={16} color={mutedText} strokeWidth={2.5} />
            <Text
              className="text-[13px] font-medium"
              style={{ color: mutedText }}
            >
              {isReply
                ? "Trả lời"
                : comment.replyCount > 0
                  ? comment.replyCount
                  : "Trả lời"}
            </Text>
          </Pressable>

          {comment.isEdited && (
            <Text className="text-[12px] italic" style={{ color: mutedText }}>
              (Đã chỉnh sửa)
            </Text>
          )}
        </View>

        {/* Replies Section */}
        {!isReply && comment.replyCount > 0 && (
          <View className="mt-2">
            {!showReplies ? (
              <Pressable
                className="py-1 flex-row items-center gap-1"
                onPress={() => setShowReplies(true)}
              >
                <View className="h-[1px] w-6 bg-sky-600 mr-1" />
                <Text
                  className="text-[14px] font-semibold"
                  style={{ color: "#0284C7" }}
                >
                  Xem {comment.replyCount} câu trả lời
                </Text>
                <ChevronDown size={14} color="#0284C7" strokeWidth={2.5} />
              </Pressable>
            ) : (
              <View className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 ml-1 mt-2">
                {isLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={mutedText}
                    className="my-2"
                  />
                ) : (
                  <>
                    {replies.map((reply) => (
                      <CommentCard
                        key={reply.id}
                        comment={reply}
                        palette={palette}
                        mutedText={mutedText}
                        isReply={true}
                        onReply={onReply}
                      />
                    ))}
                    <Pressable
                      className="py-2 mt-1"
                      onPress={() => setShowReplies(false)}
                    >
                      <Text
                        className="text-[13px] font-medium"
                        style={{ color: mutedText }}
                      >
                        Ẩn câu trả lời
                      </Text>
                    </Pressable>
                  </>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
