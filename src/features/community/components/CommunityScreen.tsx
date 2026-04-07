import { MessageCircle, Newspaper } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import { parseApiError } from "@/src/lib/error-handler";

import { CommunityMessagesPanel } from "./CommunityMessagesPanel";
import { experts, topics } from "./community.data";
import { ComposerCard } from "./ComposerCard";
import { ExpertsCard } from "./ExpertsCard";
import { HotTopicsCard } from "./HotTopicsCard";
import { PostCard } from "./PostCard";
import { getFeedPostsQueryOptions } from "../queries/options";

type CommunityTab = "feed" | "messages";

export function CommunityScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<CommunityTab>("feed");
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const palette = Colors[colorScheme];
  const {
    data: feedPage,
    isLoading,
    isError,
    error,
  } = useQuery({
    ...getFeedPostsQueryOptions(0, 20),
    enabled: activeTab === "feed",
  });

  const cardBg = colorScheme === "dark" ? "#1F2A20" : "#FFFFFF";
  const lineColor =
    colorScheme === "dark" ? "rgba(148,163,184,0.18)" : "rgba(47,127,52,0.12)";
  const tabContainerBg =
    colorScheme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.06)";
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
      <View
        className="flex-row overflow-hidden rounded-xl p-1"
        style={{ backgroundColor: tabContainerBg }}
      >
        <Pressable
          className="flex-1 flex-row items-center justify-center gap-2 rounded-lg py-2.5"
          style={{
            backgroundColor:
              activeTab === "feed" ? palette.primary : "transparent",
          }}
          onPress={() => setActiveTab("feed")}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "feed" }}
          accessibilityLabel={t("community.tabs.feed")}
        >
          <Newspaper
            size={16}
            color={activeTab === "feed" ? "#FFFFFF" : mutedText}
          />
          <Text
            className="text-[14px] font-semibold"
            style={{ color: activeTab === "feed" ? "#FFFFFF" : palette.text }}
          >
            {t("community.tabs.feed")}
          </Text>
        </Pressable>

        <Pressable
          className="flex-1 flex-row items-center justify-center gap-2 rounded-lg py-2.5"
          style={{
            backgroundColor:
              activeTab === "messages" ? palette.primary : "transparent",
          }}
          onPress={() => setActiveTab("messages")}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "messages" }}
          accessibilityLabel={t("community.tabs.messages")}
        >
          <MessageCircle
            size={16}
            color={activeTab === "messages" ? "#FFFFFF" : mutedText}
          />
          <Text
            className="text-[14px] font-semibold"
            style={{
              color: activeTab === "messages" ? "#FFFFFF" : palette.text,
            }}
          >
            {t("community.tabs.messages")}
          </Text>
        </Pressable>
      </View>

      {activeTab === "feed" ? (
        <>
          <ComposerCard
            palette={palette}
            cardBg={cardBg}
            lineColor={lineColor}
          />

          <View className="gap-6">
            {isLoading && (
              <Text
                className="text-center text-sm"
                style={{ color: mutedText }}
              >
                Dang tai bang tin...
              </Text>
            )}

            {isError && (
              <Text
                className="text-center text-sm"
                style={{ color: "#DC2626" }}
              >
                {parsedError?.message || "Khong the tai bang tin luc nay."}
              </Text>
            )}

            {!isLoading && !isError && posts.length === 0 && (
              <Text
                className="text-center text-sm"
                style={{ color: mutedText }}
              >
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
        </>
      ) : (
        <CommunityMessagesPanel
          palette={palette}
          cardBg={cardBg}
          lineColor={lineColor}
          mutedText={mutedText}
        />
      )}
    </ScrollView>
  );
}
