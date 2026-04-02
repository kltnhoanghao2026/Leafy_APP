import { queryOptions } from "@tanstack/react-query";
import { communityApi, type VoteType } from "../api/community.api";

export const communityKeys = {
  all: () => ["community"] as const,
  feed: (page: number, size: number) =>
    [...communityKeys.all(), "feed", page, size] as const,
  commentsByPost: (postId: string, page: number, size: number) =>
    [...communityKeys.all(), "comments", postId, page, size] as const,
  repliesByComment: (commentId: string, page: number, size: number) =>
    [...communityKeys.all(), "replies", commentId, page, size] as const,
  votesByPostType: (
    postId: string,
    voteType: VoteType,
    page: number,
    size: number,
  ) => [...communityKeys.all(), "votes", postId, voteType, page, size] as const,
};

export const getFeedPostsQueryOptions = (page = 0, size = 20) =>
  queryOptions({
    queryKey: communityKeys.feed(page, size),
    queryFn: () => communityApi.getFeedPosts(page, size),
  });

export const getCommentsByPostQueryOptions = (
  postId: string,
  page = 0,
  size = 50,
) =>
  queryOptions({
    queryKey: communityKeys.commentsByPost(postId, page, size),
    queryFn: () => communityApi.getCommentsByPostId(postId, page, size),
    enabled: Boolean(postId),
  });

export const getRepliesByCommentQueryOptions = (
  commentId: string,
  page = 0,
  size = 20,
) =>
  queryOptions({
    queryKey: communityKeys.repliesByComment(commentId, page, size),
    queryFn: () => communityApi.getRepliesByCommentId(commentId, page, size),
    enabled: Boolean(commentId),
  });

export const getVotesByPostTypeQueryOptions = (
  postId: string,
  voteType: VoteType,
  page = 0,
  size = 20,
) =>
  queryOptions({
    queryKey: communityKeys.votesByPostType(postId, voteType, page, size),
    queryFn: () =>
      communityApi.getVotesByPostAndType(postId, voteType, page, size),
    enabled: Boolean(postId),
  });
