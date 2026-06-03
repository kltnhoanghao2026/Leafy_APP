import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { communityApi, type VoteType } from "../api/community.api";
import { searchApi } from "../api/search.api";

export const communityKeys = {
  all: () => ["community"] as const,
  postDetail: (postId: string) =>
    [...communityKeys.all(), "postDetail", postId] as const,
  feed: (page: number, size: number) =>
    [...communityKeys.all(), "feed", page, size] as const,
  userPosts: (userId: string, page: number, size: number) =>
    [...communityKeys.all(), "userPosts", userId, page, size] as const,
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
  searchPosts: (term: string, page: number, size: number) =>
    [...communityKeys.all(), "searchPosts", term, page, size] as const,
  searchProfiles: (term: string, page: number, size: number) =>
    [...communityKeys.all(), "searchProfiles", term, page, size] as const,
};

export const getPostByIdQueryOptions = (postId: string) =>
  queryOptions({
    queryKey: communityKeys.postDetail(postId),
    queryFn: () => communityApi.getPostById(postId),
    enabled: Boolean(postId),
  });

export const getFeedPostsQueryOptions = (page = 0, size = 20) =>
  queryOptions({
    queryKey: communityKeys.feed(page, size),
    queryFn: () => communityApi.getFeedPosts(page, size),
  });

export const getInfiniteFeedPostsQueryOptions = (size = 20) =>
  infiniteQueryOptions({
    queryKey: [...communityKeys.all(), "feedInfinite", size] as const,
    queryFn: ({ pageParam }) =>
      communityApi.getFeedPosts(pageParam as number, size),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.number + 1,
  });

export const getUserPostsQueryOptions = (userId: string, page = 0, size = 20) =>
  queryOptions({
    queryKey: communityKeys.userPosts(userId, page, size),
    queryFn: () => communityApi.getPostsByUserId(userId, page, size),
    enabled: Boolean(userId),
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

export const getSearchPostsQueryOptions = (
  searchTerm: string,
  page = 0,
  size = 20,
) =>
  queryOptions({
    queryKey: communityKeys.searchPosts(searchTerm, page, size),
    queryFn: () => searchApi.searchPosts(searchTerm, page, size),
    enabled: Boolean(searchTerm.trim()),
  });

export const getSearchProfilesQueryOptions = (
  searchTerm: string,
  page = 0,
  size = 20,
) =>
  queryOptions({
    queryKey: communityKeys.searchProfiles(searchTerm, page, size),
    queryFn: () => searchApi.searchProfiles(searchTerm, page, size),
    enabled: Boolean(searchTerm.trim()),
  });

const PAGE_SIZE = 20;

export const getInfiniteSearchPostsQueryOptions = (searchTerm: string) =>
  infiniteQueryOptions({
    queryKey: [
      ...communityKeys.all(),
      "searchPostsInfinite",
      searchTerm,
    ] as const,
    queryFn: ({ pageParam }) =>
      searchApi.searchPosts(searchTerm, pageParam as number, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.number + 1,
    enabled: Boolean(searchTerm.trim()),
  });

export const getInfiniteSearchProfilesQueryOptions = (searchTerm: string) =>
  infiniteQueryOptions({
    queryKey: [
      ...communityKeys.all(),
      "searchProfilesInfinite",
      searchTerm,
    ] as const,
    queryFn: ({ pageParam }) =>
      searchApi.searchProfiles(searchTerm, pageParam as number, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.number + 1,
    enabled: Boolean(searchTerm.trim()),
  });
