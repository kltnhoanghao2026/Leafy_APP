import { apiClient } from "@/src/lib/axios";
import { API_ENDPOINTS } from "@/src/lib/routes";
import { type ApiResponse } from "@/src/shared/api";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import type {
  BackendVote,
  BackendComment,
  BackendPost,
  BackendProfileSummary,
  Comment,
  CommunityPage,
  Post,
  PostCreateRequest,
  VoteUser,
} from "../components/community.types";

export type VoteTargetType = "POST" | "COMMENT";
export type VoteType = "UPVOTE" | "DOWNVOTE";

const FALLBACK_AVATAR =
  "https://ui-avatars.com/api/?background=E5E7EB&color=334155&name=Leafy";

type ProfileSummary = {
  id: string;
  fullName?: string;
  profilePicture?: string;
  avatar?: string;
};

const toTimeMeta = (uploadedAt?: string | null): string => {
  if (!uploadedAt) {
    return "Vua dang";
  }

  const date = new Date(uploadedAt);
  if (Number.isNaN(date.getTime()) || date.getTime() > Date.now()) {
    return "Vua dang";
  }

  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: vi,
  });
};

const resolveAuthor = (
  authorId: string,
  authorInfo?: BackendProfileSummary | null,
): { name: string; avatar: string } => {
  const fallbackLabel = authorId?.slice(-6) ?? "an danh";
  const name = authorInfo?.fullName?.trim() || `Nguoi dung ${fallbackLabel}`;
  const avatar = authorInfo?.avatar?.trim() || FALLBACK_AVATAR;
  return { name, avatar };
};

const mapBackendPostToUiPost = (post: BackendPost): Post => {
  const safeStats = {
    upvoteCount: post.stats?.upvoteCount ?? 0,
    downvoteCount: post.stats?.downvoteCount ?? 0,
    commentCount: post.stats?.commentCount ?? 0,
    shareCount: post.stats?.shareCount ?? 0,
  };

  const { name, avatar } = resolveAuthor(post.authorId, post.authorInfo);

  let sharedPost: Post | null = null;
  if (post.sharedPostInfo) {
    sharedPost = mapBackendPostToUiPost(post.sharedPostInfo);
  }

  return {
    id: post.id,
    authorId: post.authorId,
    author: name,
    authorAvatar: avatar,
    meta: toTimeMeta(post.uploadedAt),
    content: {
      title: post.content?.title,
      caption: post.content?.caption,
      description: post.content?.description,
      hashtags: post.content?.hashtags,
    },
    media: post.media ?? [],
    postType: post.postType,
    sharedPostId: post.sharedPostId,
    originalAuthorId: post.originalAuthorId,
    sharedPost,
    uploadedAt: post.uploadedAt,
    updatedAt: post.updatedAt,
    userVote:
      post.currentUserVoteType === "UPVOTE"
        ? "up"
        : post.currentUserVoteType === "DOWNVOTE"
          ? "down"
          : undefined,
    stats: safeStats,
  };
};

const mapBackendCommentToUiComment = (comment: BackendComment): Comment => {
  const { name, avatar } = resolveAuthor(comment.authorId, comment.authorInfo);

  return {
    id: comment.id,
    postId: comment.postId,
    authorId: comment.authorId,
    author: name,
    authorAvatar: avatar,
    content: comment.content,
    createdAt: comment.createdAt,
    createdMeta: toTimeMeta(comment.createdAt),
    replyCount: comment.replyCount ?? 0,
    upvoteCount: comment.upvoteCount ?? 0,
    downvoteCount: comment.downvoteCount ?? 0,
    isEdited: comment.isEdited ?? false,
  };
};

const getProfilesByIds = async (
  profileIds: string[],
): Promise<Record<string, ProfileSummary>> => {
  if (profileIds.length === 0) {
    return {};
  }

  const requests = profileIds.map(async (profileId) => {
    try {
      const response = await apiClient.get<ApiResponse<ProfileSummary>>(
        API_ENDPOINTS.PROFILES.GET(profileId),
      );
      const profile = response.data?.data;
      if (!profile?.id) {
        return null;
      }
      return [profileId, profile] as const;
    } catch {
      return null;
    }
  });

  const results = await Promise.all(requests);
  return results.reduce<Record<string, ProfileSummary>>((acc, item) => {
    if (!item) {
      return acc;
    }
    const [profileId, profile] = item;
    acc[profileId] = profile;
    return acc;
  }, {});
};

export const communityApi = {
  getFeedPosts: async (page = 0, size = 20): Promise<CommunityPage<Post>> => {
    const response = await apiClient.get<
      ApiResponse<CommunityPage<BackendPost>>
    >(API_ENDPOINTS.COMMUNITY.FEED_POSTS, { params: { page, size } });

    const payload = response.data.data;

    return {
      ...payload,
      content: (payload.content ?? []).map(mapBackendPostToUiPost),
    };
  },

  getPostsByUserId: async (
    userId: string,
    page = 0,
    size = 20,
  ): Promise<CommunityPage<Post>> => {
    const response = await apiClient.get<
      ApiResponse<CommunityPage<BackendPost>>
    >(API_ENDPOINTS.COMMUNITY.POSTS_BY_USER(userId), {
      params: { page, size },
    });

    const payload = response.data.data;

    return {
      ...payload,
      content: (payload.content ?? []).map(mapBackendPostToUiPost),
    };
  },

  getCommentsByPostId: async (
    postId: string,
    page = 0,
    size = 50,
  ): Promise<CommunityPage<Comment>> => {
    const response = await apiClient.get<
      ApiResponse<CommunityPage<BackendComment>>
    >(API_ENDPOINTS.COMMUNITY.COMMENTS_BY_POST(postId), {
      params: { page, size },
    });

    const payload = response.data.data;

    return {
      ...payload,
      content: (payload.content ?? []).map(mapBackendCommentToUiComment),
    };
  },

  getRepliesByCommentId: async (
    commentId: string,
    page = 0,
    size = 20,
  ): Promise<CommunityPage<Comment>> => {
    const response = await apiClient.get<
      ApiResponse<CommunityPage<BackendComment>>
    >(API_ENDPOINTS.COMMUNITY.REPLIES_BY_COMMENT(commentId), {
      params: { page, size },
    });

    const payload = response.data.data;

    return {
      ...payload,
      content: (payload.content ?? []).map(mapBackendCommentToUiComment),
    };
  },

  getVotesByPostAndType: async (
    postId: string,
    voteType: VoteType,
    page = 0,
    size = 20,
  ): Promise<CommunityPage<VoteUser>> => {
    const response = await apiClient.get<
      ApiResponse<CommunityPage<BackendVote>>
    >(API_ENDPOINTS.COMMUNITY.VOTES_BY_POST(postId), {
      params: { type: voteType, page, size },
    });

    const payload = response.data.data;
    const authorIds = Array.from(
      new Set(
        (payload.content ?? []).map((vote) => vote.authorId).filter(Boolean),
      ),
    );
    const profilesById = await getProfilesByIds(authorIds);

    return {
      ...payload,
      content: (payload.content ?? []).map((vote) => {
        const profile = profilesById[vote.authorId];
        const profileName = profile?.fullName?.trim();
        const profileAvatar =
          profile?.profilePicture?.trim() || profile?.avatar?.trim();
        const fallbackLabel = vote.authorId?.slice(-6) ?? "an danh";

        return {
          voteId: vote.id,
          authorId: vote.authorId,
          author: profileName || `Nguoi dung ${fallbackLabel}`,
          authorAvatar: profileAvatar || FALLBACK_AVATAR,
          voteType: vote.type,
          createdAt: vote.createdAt,
          createdMeta: toTimeMeta(vote.createdAt),
        };
      }),
    };
  },

  getPostById: async (postId: string): Promise<Post> => {
    const response = await apiClient.get<ApiResponse<BackendPost>>(
      API_ENDPOINTS.COMMUNITY.POST_BY_ID(postId),
    );

    return mapBackendPostToUiPost(response.data.data);
  },

  createComment: async (
    postId: string,
    content: string,
    parentId?: string,
  ): Promise<Comment> => {
    const response = await apiClient.post<ApiResponse<BackendComment>>(
      API_ENDPOINTS.COMMUNITY.CREATE_COMMENT,
      { postId, content, ...(parentId ? { parentId } : {}) },
    );

    return mapBackendCommentToUiComment(response.data.data);
  },

  handleVote: async (
    targetType: VoteTargetType,
    targetId: string,
    voteType: VoteType,
  ): Promise<void> => {
    await apiClient.post<ApiResponse<void>>(
      API_ENDPOINTS.COMMUNITY.VOTE(targetType, targetId),
      null,
      {
        params: { type: voteType },
      },
    );
  },

  createPost: async (request: PostCreateRequest): Promise<Post> => {
    const response = await apiClient.post<ApiResponse<BackendPost>>(
      API_ENDPOINTS.COMMUNITY.CREATE_POST,
      request,
    );

    return mapBackendPostToUiPost(response.data.data);
  },
};
