import { MessageCircle, Search } from "lucide-react-native";
import React, { useLayoutEffect, useRef } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
  ActivityIndicator,
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
    markPostViewed,
    loadMore,
    hasNextPage,
    isFetchingNextPage,
  } = useCommunityScreen();

  const markPostViewedRef = useRef(markPostViewed);
  markPostViewedRef.current = markPostViewed;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    viewableItems.forEach((viewableItem) => {
      if (viewableItem.isViewable && viewableItem.item) {
        markPostViewedRef.current(viewableItem.item.id);
      }
    });
  }).current;

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
      <FlatList
        data={isRefetching ? [] : posts}
        keyExtractor={(item, index) => item.id ?? `post-${index}`}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            palette={palette}
            mutedText={mutedText}
            onOpenComments={openCommentsModal}
          />
        )}
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
        ListHeaderComponent={
          <View style={{ gap: 24 }}>
            <ComposerCard palette={palette} cardBg={cardBg} lineColor={lineColor} />

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
          </View>
        }
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              size="small"
              color={palette.primary}
              style={{ marginVertical: 16 }}
            />
          ) : null
        }
      />
      <ChatFAB />
    </View>
  );
}

