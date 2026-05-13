import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import { parseApiError } from "@/src/lib/error-handler";

import type { Post } from "../components/community.types";
import {
  useHandleVoteMutation,
  useCreateCommentMutation,
} from "../queries/mutations";
import {
  getPostByIdQueryOptions,
  getCommentsByPostQueryOptions,
} from "../queries/options";

export function usePostDetailScreen(postId: string) {
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

  // ── Vote state (optimistic) ──
  const [userVote, setUserVote] = useState<Post["userVote"]>(post?.userVote);
  const [upvoteCount, setUpvoteCount] = useState(post?.stats.upvoteCount ?? 0);
  const [downvoteCount, setDownvoteCount] = useState(post?.stats.downvoteCount ?? 0);
  const [showVotersSheet, setShowVotersSheet] = useState(false);
  const { mutateAsync: handleVote, isPending: isVoting } =
    useHandleVoteMutation();

  useEffect(() => {
    if (post) {
      setUserVote(post.userVote);
      setUpvoteCount(post.stats.upvoteCount);
      setDownvoteCount(post.stats.downvoteCount);
    }
  }, [
    post?.id,
    post?.userVote,
    post?.stats.upvoteCount,
    post?.stats.downvoteCount,
  ]);

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
    if (isVoting || !post) return;

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

  const upvoteActive = userVote === "up";
  const downvoteActive = userVote === "down";
  const score = upvoteCount - downvoteCount;

  // ── Comment input state ──
  const [commentText, setCommentText] = useState("");
  const [replyTarget, setReplyTarget] = useState<{
    commentId: string;
    authorName: string;
  } | null>(null);
  const { mutateAsync: createComment, isPending: isCreatingComment } =
    useCreateCommentMutation();

  const onSubmitComment = async () => {
    const text = commentText.trim();
    if (!text || isCreatingComment || !postId) return;

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

  // ── Media carousel state ──
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  return {
    colorScheme,
    palette,
    mutedText,
    post,
    isLoadingPost,
    isPostError,
    parsedPostError,
    refetchPost,
    comments,
    commentsPage,
    isLoadingComments,
    isCommentsError,
    parsedCommentsError,
    userVote,
    upvoteCount,
    downvoteCount,
    showVotersSheet,
    setShowVotersSheet,
    upvoteActive,
    downvoteActive,
    score,
    onVote,
    isVoting,
    commentText,
    setCommentText,
    replyTarget,
    setReplyTarget,
    onSubmitComment,
    isCreatingComment,
    activeMediaIndex,
    setActiveMediaIndex,
  };
}
