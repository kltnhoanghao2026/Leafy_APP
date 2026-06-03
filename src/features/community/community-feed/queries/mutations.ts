import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  communityApi,
  type VoteTargetType,
  type VoteType,
} from "../api/community.api";
import type { PostCreateRequest } from "../components/community.types";
import { communityKeys } from "./options";

type HandleVoteInput = {
  targetType: VoteTargetType;
  targetId: string;
  voteType: VoteType;
};

export const useHandleVoteMutation = () =>
  useMutation({
    mutationKey: [...communityKeys.all(), "vote"],
    mutationFn: ({ targetType, targetId, voteType }: HandleVoteInput) =>
      communityApi.handleVote(targetType, targetId, voteType),
  });

type CreateCommentInput = {
  postId: string;
  content: string;
  parentId?: string;
};

export const useCreateCommentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...communityKeys.all(), "createComment"],
    mutationFn: ({ postId, content, parentId }: CreateCommentInput) =>
      communityApi.createComment(postId, content, parentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...communityKeys.all(), "comments", variables.postId],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: communityKeys.postDetail(variables.postId),
      });
      if (variables.parentId) {
        queryClient.invalidateQueries({
          queryKey: [...communityKeys.all(), "replies", variables.parentId],
          exact: false,
        });
      }
    },
  });
};

export const useCreatePostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...communityKeys.all(), "createPost"],
    mutationFn: (request: PostCreateRequest) =>
      communityApi.createPost(request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: communityKeys.all(),
        exact: false,
      });
    },
  });
};

export const useMarkPostViewedMutation = () =>
  useMutation({
    mutationKey: [...communityKeys.all(), "markViewed"],
    mutationFn: (postId: string) => communityApi.markPostViewed(postId),
  });

