import React, { useLayoutEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  FlatList,
} from "react-native";
import { Search } from "lucide-react-native";
import { useNavigation } from "expo-router";
import BackButton from "@/src/components/ui/BackButton";
import {
  useCommunitySearchScreen,
  type Tab,
} from "@/src/features/community/community-feed/hooks/useCommunitySearchScreen";
import { SearchResultPostCard } from "@/src/features/community/community-feed/components/search/SearchResultPostCard";
import { SearchResultProfileCard } from "@/src/features/community/community-feed/components/search/SearchResultProfileCard";

import { SafeAreaView } from "react-native-safe-area-context";

export default function SafeCommunitySearchScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
      <CommunitySearchScreen />
    </SafeAreaView>
  );
}

function CommunitySearchScreen() {
  const navigation = useNavigation();
  const {
    t,
    palette,
    isDark,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    bg,
    textCol,
    mutedText,
    inputBg,
    cardBg,
    borderCol,
    isSearching,
    isLoading,
    isError,
    postsQuery,
    profilesQuery,
    postResults,
    profileResults,
    totalPostCount,
    totalProfileCount,
  } = useCommunitySearchScreen();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.centerContainer}>
          <Text style={{ color: mutedText, fontSize: 15, textAlign: "center" }}>
            {t(
              "community.searchError",
              "Something went wrong. Please try again.",
            )}
          </Text>
        </View>
      );
    }

    if (!isSearching) {
      return (
        <View style={styles.centerContainer}>
          <Search
            size={48}
            color={mutedText}
            style={{ opacity: 0.5, marginBottom: 16 }}
          />
          <Text style={{ color: mutedText, fontSize: 16, textAlign: "center" }}>
            {t("community.searchEmpty", "Search for posts, topics, or experts")}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: mutedText, fontSize: 15, textAlign: "center" }}>
          {t("community.noResults", "No results found")}
        </Text>
      </View>
    );
  };

  const renderLoadMoreFooter = (tab: "posts" | "people") => {
    const query = tab === "posts" ? postsQuery : profilesQuery;
    if (!query.hasNextPage) return null;
    return (
      <Pressable
        onPress={() => query.fetchNextPage()}
        disabled={query.isFetchingNextPage}
        style={[styles.loadMoreBtn, { borderColor: palette.primary }]}
      >
        {query.isFetchingNextPage ? (
          <ActivityIndicator size="small" color={palette.primary} />
        ) : (
          <Text style={[styles.loadMoreText, { color: palette.primary }]}>
            {t("common.loadMore", "Load more")}
          </Text>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      {/* Search bar */}
      <View
        style={[styles.searchBar, { borderBottomColor: borderCol, gap: 12 }]}
      >
        <BackButton unstyled size={24} fallback="/(main)/community" />
        <View style={[styles.inputContainer, { backgroundColor: inputBg }]}>
          <Search size={18} color={mutedText} />
          <TextInput
            style={[styles.input, { color: textCol }]}
            placeholderTextColor={mutedText}
            placeholder={t(
              "community.searchPlaceholder",
              "Search posts, topics...",
            )}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Tabs */}
      {isSearching && (
        <View style={[styles.tabBar, { borderBottomColor: borderCol }]}>
          {(["posts", "people"] as Tab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tab,
                  isActive && {
                    borderBottomColor: palette.primary,
                    borderBottomWidth: 2,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: isActive ? palette.primary : mutedText },
                  ]}
                >
                  {tab === "posts"
                    ? t("community.tabPosts", "Posts")
                    : t("community.tabPeople", "People")}
                  {tab === "posts" && totalPostCount != null
                    ? ` (${totalPostCount})`
                    : ""}
                  {tab === "people" && totalProfileCount != null
                    ? ` (${totalProfileCount})`
                    : ""}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Results */}
      {activeTab === "posts" ? (
        <FlatList
          data={isSearching ? postResults : []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SearchResultPostCard
              item={item}
              cardBg={cardBg}
              borderCol={borderCol}
              textCol={textCol}
              mutedText={mutedText}
              primaryColor={palette.primary}
            />
          )}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={() => renderLoadMoreFooter("posts")}
        />
      ) : (
        <FlatList
          data={isSearching ? profileResults : []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SearchResultProfileCard
              item={item}
              cardBg={cardBg}
              borderCol={borderCol}
              textCol={textCol}
              mutedText={mutedText}
              primaryColor={palette.primary}
              isDark={isDark}
            />
          )}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={() => renderLoadMoreFooter("people")}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 40,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadMoreBtn: {
    alignSelf: "center",
    marginVertical: 16,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    minWidth: 120,
    alignItems: "center",
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
