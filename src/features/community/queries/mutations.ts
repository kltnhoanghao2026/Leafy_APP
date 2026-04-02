import { useMutation } from "@tanstack/react-query";
import {
  communityApi,
  type VoteTargetType,
  type VoteType,
} from "../api/community.api";
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
