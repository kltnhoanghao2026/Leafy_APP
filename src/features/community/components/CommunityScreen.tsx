import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import { parseApiError } from "@/src/lib/error-handler";

import { experts, topics } from "./community.data";
import { ComposerCard } from "./ComposerCard";
import { ExpertsCard } from "./ExpertsCard";
import { HotTopicsCard } from "./HotTopicsCard";
import { PostCard } from "./PostCard";
import { getFeedPostsQueryOptions } from "../queries/options";

export function CommunityScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const palette = Colors[colorScheme];
  const {
    data: feedPage,
    isLoading,
    isError,
    error,
  } = useQuery(getFeedPostsQueryOptions(0, 20));

  const cardBg = colorScheme === "dark" ? "#1F2A20" : "#FFFFFF";
  const lineColor =
    colorScheme === "dark" ? "rgba(148,163,184,0.18)" : "rgba(47,127,52,0.12)";
  const mutedText = palette.textGray;
  const posts = feedPage?.content ?? [];
  const parsedError = isError ? parseApiError(error) : null;

  const openCommentsModal = (postId: string) => {
    router.push({
      pathname: "/modal",
      params: {
        postId,
      },
    });
  };

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: palette.background }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 24 }}
    >
      <ComposerCard palette={palette} cardBg={cardBg} lineColor={lineColor} />

      <View className="gap-6">
        {isLoading && (
          <Text className="text-center text-sm" style={{ color: mutedText }}>
            Dang tai bang tin...
          </Text>
        )}

        {isError && (
          <Text className="text-center text-sm" style={{ color: "#DC2626" }}>
            {parsedError?.message || "Khong the tai bang tin luc nay."}
          </Text>
        )}

        {!isLoading && !isError && posts.length === 0 && (
          <Text className="text-center text-sm" style={{ color: mutedText }}>
            Chua co bai viet feed/share nao.
          </Text>
        )}

        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            palette={palette}
            mutedText={mutedText}
            onOpenComments={openCommentsModal}
          />
        ))}
      </View>

      <HotTopicsCard
        topics={topics}
        palette={palette}
        cardBg={cardBg}
        lineColor={lineColor}
        mutedText={mutedText}
      />

      <ExpertsCard
        experts={experts}
        palette={palette}
        cardBg={cardBg}
        lineColor={lineColor}
        mutedText={mutedText}
      />
    </ScrollView>
  );
}
