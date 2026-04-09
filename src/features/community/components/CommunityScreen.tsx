import { MessageCircle, Search } from "lucide-react-native";
import React, { useLayoutEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import { parseApiError } from "@/src/lib/error-handler";

import { experts, topics } from "./community.data";
import { ComposerCard } from "./ComposerCard";
import { ExpertsCard } from "./ExpertsCard";
import { HotTopicsCard } from "./HotTopicsCard";
import { PostCard } from "./PostCard";
import { PostCardSkeleton } from "./PostCardSkeleton";
import { getFeedPostsQueryOptions } from "../queries/options";

export function CommunityScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const palette = Colors[colorScheme];

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View className="flex-1 flex-row items-center w-full">
          <Pressable
            className="flex-1 flex-row items-center rounded-full bg-slate-100 px-4 py-2 dark:bg-slate-800"
            style={{ height: 40 }}
            onPress={() => router.push("/(main)/community-search")}
          >
            <Search size={18} color={palette.textGray} />
            <Text
              className="ml-2.5 flex-1 text-[15px] font-medium"
              style={{ color: palette.textGray }}
              numberOfLines={1}
            >
              {t("community.searchPlaceholder", "Search posts...")}
            </Text>
          </Pressable>
        </View>
      ),
      headerTitleContainerStyle: {
        flex: 1,
        marginHorizontal: 0,
        paddingLeft: 16,
      },
      headerLeftContainerStyle: { display: "none" },
      headerRightContainerStyle: { paddingRight: 16 },
      headerTitleAlign: "left",
      headerShadowVisible: false,
      headerLeft: () => null,
      headerRight: () => (
        <Pressable
          className="ml-3 h-10 w-10 items-center justify-center rounded-full bg-slate-100 active:opacity-80 dark:bg-slate-800"
          onPress={() => router.push("/(main)/community-messages")}
        >
          <MessageCircle size={20} color={palette.text} />
          {/* Optional unread badge here later */}
        </Pressable>
      ),
    });
  }, [navigation, router, t, palette]);

  const {
    data: feedPage,
    isLoading,
    isError,
    error,
  } = useQuery({
    ...getFeedPostsQueryOptions(0, 20),
  });

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
          <View className="gap-6">
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </View>
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
