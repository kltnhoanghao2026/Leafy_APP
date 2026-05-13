export type CommunityPalette = {
  text: string;
  background: string;
  primary: string;
  textGray: string;
  textInputPlaceholder: string;
};

export type CommunityPage<T> = {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

export type BackendPostMedia = {
  url: string;
  type: string;
};

export type BackendPostContent = {
  title?: string;
  caption?: string;
  description?: string;
  hashtags?: string[];
};

export type BackendPostStats = {
  upvoteCount: number;
  downvoteCount: number;
  commentCount: number;
  shareCount: number;
};

export type BackendProfileSummary = {
  id: string;
  fullName?: string;
  avatar?: string;
  role?: string;
  isVerified?: boolean;
};

export type CommunityTreatmentStatus =
  | "PENDING"
  | "APPLYING"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED";

export interface CommunityPlanInfo {
  id: string;
  planName: string | null;
  diseaseName: string | null;
  severityLevel: string | null;
  urgency: string | null;
  status: CommunityTreatmentStatus;
  estimatedCost: string | null;
  confidenceScore: number | null;
  requiredInputs: string[] | null;
  safetyWarnings: string[] | null;
  successIndicators: string | null;
  applyCount: number | null;
  eventCount?: number | null;
  isPublic: boolean;
  createdAt: string | null;
}

export type BackendPost = {
  id: string;
  authorId: string;
  authorInfo?: BackendProfileSummary | null;
  content: BackendPostContent;
  media: BackendPostMedia[];
  postType: "FEED" | "STORY" | "SHARE" | "PLAN_SHARE";
  sharedPostId?: string | null;
  originalAuthorId?: string | null;
  sharedPostInfo?: BackendPost | null;
  planId?: string | null;
  planInfo?: CommunityPlanInfo | null;
  uploadedAt?: string | null;
  updatedAt?: string | null;
  stats: BackendPostStats;
  currentUserVoteType?: "UPVOTE" | "DOWNVOTE" | null;
};

export type BackendComment = {
  id: string;
  postId: string;
  authorId: string;
  authorInfo?: BackendProfileSummary | null;
  parentId?: string | null;
  content: string;
  media?: BackendPostMedia[];
  replyDepth: number;
  replyCount: number;
  upvoteCount: number;
  downvoteCount: number;
  isEdited: boolean;
  active: boolean;
  createdAt?: string | null;
  lastModifiedAt?: string | null;
};

export type BackendVote = {
  id: string;
  type: "UPVOTE" | "DOWNVOTE";
  authorId: string;
  targetId: string;
  targetType: "POST" | "COMMENT";
  active: boolean;
  createdAt?: string | null;
  lastModifiedAt?: string | null;
};

export type Post = {
  id: string;
  authorId?: string;
  author?: string;
  authorAvatar?: string;
  meta?: string;
  content: {
    title?: string;
    caption?: string;
    description?: string;
    hashtags?: string[];
  };
  media: {
    url: string;
    type: string;
  }[];
  postType: "FEED" | "STORY" | "SHARE" | "PLAN_SHARE";
  sharedPostId?: string | null;
  originalAuthorId?: string | null;
  sharedPost?: Post | null;
  planId?: string | null;
  planInfo?: CommunityPlanInfo | null;
  uploadedAt?: string | null;
  updatedAt?: string | null;
  urgent?: boolean;
  userVote?: "up" | "down";
  stats: {
    upvoteCount: number;
    downvoteCount: number;
    commentCount: number;
    shareCount: number;
  };
};

export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  author?: string;
  authorAvatar?: string;
  userVote?: "up" | "down";
  content: string;
  createdAt?: string | null;
  createdMeta?: string;
  replyCount: number;
  upvoteCount: number;
  downvoteCount: number;
  isEdited: boolean;
};

export type VoteUser = {
  voteId: string;
  authorId: string;
  author: string;
  authorAvatar: string;
  voteType: "UPVOTE" | "DOWNVOTE";
  createdAt?: string | null;
  createdMeta?: string;
};

export type Topic = {
  id: string;
  tag: string;
  title: string;
  audience: string;
};

export type Expert = {
  id: string;
  name: string;
  specialty: string;
  avatarUrl: string;
};

export type PostVisibility = "FRIEND" | "ALL" | "ONLY_ME";

export type LocationInfo = {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

export type PostCreateRequest = {
  groupId?: string;
  content: BackendPostContent;
  media?: BackendPostMedia[];
  postType: "FEED" | "SHARE" | "PLAN_SHARE";
  sharedPostId?: string;
  originalAuthorId?: string;
  sharedCaption?: BackendPostContent;
  rootPostId?: string;
  location?: LocationInfo;
  visibility: PostVisibility;
  planId?: string | null;
};
