import { MessageCircle, Search } from "lucide-react-native";
import React, { useLayoutEffect } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useNavigation } from "expo-router";
import { ChatFAB } from "@/src/features/chat/components/ChatFAB";

import { useCommunityScreen } from "@/src/features/community/community-feed/hooks/useCommunityScreen";
import { ComposerCard } from "@/src/features/community/community-feed/components/ComposerCard";
import { PostCard } from "@/src/features/community/community-feed/components/PostCard";
import { PostCardSkeleton } from "@/src/features/community/community-feed/components/PostCardSkeleton";

import { SafeAreaView } from "react-native-safe-area-context";

export default function SafeCommunityScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <CommunityScreen />
    </SafeAreaView>
  );
}

function CommunityScreen() {
  const navigation = useNavigation();
  const {
    t,
    router,
    palette,
    isLoading,
    isError,
    isRefetching,
    onRefresh,
    cardBg,
    lineColor,
    mutedText,
    posts,
    parsedError,
    openCommentsModal,
  } = useCommunityScreen();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View className="flex-1 flex-row items-center w-full">
          <Pressable
            className="flex-1 flex-row items-center rounded-full bg-slate-100 px-4 py-2 dark:bg-slate-800"
            style={{ height: 40 }}
            onPress={() => router.push("/(main)/community/search")}
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
          onPress={() => router.push("/(main)/chat")}
        >
          <MessageCircle size={20} color={palette.text} />
        </Pressable>
      ),
    });
  }, [navigation, router, t, palette]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView
        className="flex-1"
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            colors={[palette.primary]}
            tintColor={palette.primary}
          />
        }
      >
        <ComposerCard palette={palette} cardBg={cardBg} lineColor={lineColor} />

        <View className="gap-6">
          {(isLoading || isRefetching) && (
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

          {!isLoading && !isRefetching && !isError && posts.length === 0 && (
            <Text className="text-center text-sm" style={{ color: mutedText }}>
              Chua co bai viet feed/share nao.
            </Text>
          )}

          {!isRefetching &&
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                palette={palette}
                mutedText={mutedText}
                onOpenComments={openCommentsModal}
              />
            ))}
        </View>
    
      </ScrollView>
      <ChatFAB />
    </View>
  );
}
