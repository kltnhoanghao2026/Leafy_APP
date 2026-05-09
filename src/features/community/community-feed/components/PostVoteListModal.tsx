import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import { BottomSheet } from "@/src/components/ui/BottomSheet";
import { useQuery } from "@tanstack/react-query";
import { getVotesByPostTypeQueryOptions } from "../queries/options";
import { CommunityPalette, VoteUser } from "./community.types";

interface PostVoteListModalProps {
  postId: string;
  isVisible: boolean;
  onClose: () => void;
  initialTab?: "upvote" | "downvote";
  upvoteCount: number;
  downvoteCount: number;
  palette: CommunityPalette;
  mutedText: string;
}

export function PostVoteListModal({
  postId,
  isVisible,
  onClose,
  initialTab = "upvote",
  upvoteCount,
  downvoteCount,
  palette,
  mutedText,
}: PostVoteListModalProps) {
  const [activeTab, setActiveTab] = useState<"upvote" | "downvote">(initialTab);

  const { data: upvotersPage, isLoading: upvotersLoading } = useQuery({
    ...getVotesByPostTypeQueryOptions(postId, "UPVOTE"),
    enabled: isVisible && activeTab === "upvote",
  });

  const { data: downvotersPage, isLoading: downvotersLoading } = useQuery({
    ...getVotesByPostTypeQueryOptions(postId, "DOWNVOTE"),
    enabled: isVisible && activeTab === "downvote",
  });

  const visibleVoters: VoteUser[] =
    activeTab === "upvote"
      ? upvotersPage?.content || []
      : downvotersPage?.content || [];

  const isLoading =
    activeTab === "upvote" ? upvotersLoading : downvotersLoading;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <BottomSheet
        title="Danh sách lượt bình chọn"
        titleColor={palette.text}
        onClose={onClose}
      >
        <View className="px-5 pt-2 pb-6">
          {/* Custom Segmented Tabs */}
          <View className="mb-5 flex-row overflow-hidden rounded-xl bg-slate-100 p-1 dark:bg-white/10">
            <Pressable
              className="flex-1 items-center justify-center rounded-lg py-2.5"
              style={{
                backgroundColor:
                  activeTab === "upvote" ? palette.primary : "transparent",
              }}
              onPress={() => setActiveTab("upvote")}
            >
              <Text
                className="text-[14px] font-semibold"
                style={{
                  color: activeTab === "upvote" ? "#FFFFFF" : palette.text,
                }}
              >
                Upvotes ({upvoteCount})
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 items-center justify-center rounded-lg py-2.5"
              style={{
                backgroundColor:
                  activeTab === "downvote" ? "#EF4444" : "transparent", // Red color for downvotes
              }}
              onPress={() => setActiveTab("downvote")}
            >
              <Text
                className="text-[14px] font-semibold"
                style={{
                  color: activeTab === "downvote" ? "#FFFFFF" : palette.text,
                }}
              >
                Downvotes ({downvoteCount})
              </Text>
            </Pressable>
          </View>

          {/* List Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24, minHeight: 150 }}
          >
            {isLoading ? (
              <View className="flex-1 items-center justify-center pt-10">
                <ActivityIndicator size="small" color={palette.primary} />
                <Text
                  className="mt-3 text-[13px] font-medium"
                  style={{ color: mutedText }}
                >
                  Đang tải danh sách...
                </Text>
              </View>
            ) : visibleVoters.length === 0 ? (
              <View className="flex-1 items-center justify-center pt-8 pb-4">
                <Image
                  source={{
                    uri: "https://cdn3d.iconscout.com/3d/premium/thumb/empty-box-4333062-3598506.png",
                  }}
                  className="mb-3 h-20 w-20 opacity-60"
                  resizeMode="contain"
                />
                <Text
                  className="text-center text-[14px] font-medium"
                  style={{ color: mutedText }}
                >
                  Chưa có ai {activeTab === "upvote" ? "thích" : "không thích"}{" "}
                  bài viết này
                </Text>
              </View>
            ) : (
              <View className="gap-4">
                {visibleVoters.map((voteUser) => (
                  <View
                    key={voteUser.voteId}
                    className="flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center gap-3">
                      <Image
                        source={{ uri: voteUser.authorAvatar }}
                        className="h-10 w-10 rounded-full border border-slate-200/50 bg-slate-200 dark:border-white/10"
                        resizeMode="cover"
                      />
                      <View>
                        <Text
                          className="text-[15px] font-semibold"
                          style={{ color: palette.text }}
                          numberOfLines={1}
                        >
                          {voteUser.author}
                        </Text>
                        <Text
                          className="text-[12px] mt-0.5"
                          style={{ color: mutedText }}
                        >
                          {voteUser.createdMeta || "Gần đây"}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </BottomSheet>
    </Modal>
  );
}
