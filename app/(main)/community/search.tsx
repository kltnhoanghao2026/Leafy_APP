import {
  Search,
  ArrowBigUp,
  MessageCircle,
  BadgeCheck,
  Sprout,
  GraduationCap,
  Leaf,
  MapPin,
} from "lucide-react-native";
import React, {
  useLayoutEffect,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  FlatList,
} from "react-native";
import { useNavigation, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInfiniteQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import BackButton from "@/src/components/ui/BackButton";
import {
  getInfiniteSearchPostsQueryOptions,
  getInfiniteSearchProfilesQueryOptions,
} from "@/src/features/community/community-feed/queries/options";
import type {
  PostSearchResult,
  ProfileSearchResult,
} from "@/src/features/community/community-feed/api/search.api";
import { formatStat } from "@/src/features/community/community-feed/components/community.utils";

const FALLBACK_AVATAR =
  "https://ui-avatars.com/api/?background=E5E7EB&color=334155&name=L";

type Tab = "posts" | "people";

export default function CommunitySearchScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const router = useRouter();
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const palette = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("posts");

  const bg = isDark ? palette.background : "#FFFFFF";
  const textCol = palette.text;
  const mutedText = palette.textGray;
  const inputBg = isDark ? "#1E293B" : "#F1F5F9";
  const cardBg = isDark ? "#1E293B" : "#F8FAFC";
  const borderCol = isDark ? "#334155" : "#E2E8F0";

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const postsQuery = useInfiniteQuery(
    getInfiniteSearchPostsQueryOptions(debouncedQuery),
  );
  const profilesQuery = useInfiniteQuery(
    getInfiniteSearchProfilesQueryOptions(debouncedQuery),
  );

  const isSearching = Boolean(debouncedQuery);
  const isLoading =
    activeTab === "posts" ? postsQuery.isLoading : profilesQuery.isLoading;
  const isError =
    activeTab === "posts" ? postsQuery.isError : profilesQuery.isError;

  // ---- Renderers ----

  const renderPostItem = useCallback(
    ({ item }: { item: PostSearchResult }) => {
      const timeAgo = item.uploadedAt
        ? formatDistanceToNow(new Date(item.uploadedAt), {
            addSuffix: true,
            locale: vi,
          })
        : "";

      return (
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/(main)/community/post/[postId]",
              params: { postId: item.id },
            })
          }
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          <View
            style={[
              styles.card,
              { backgroundColor: cardBg, borderColor: borderCol },
            ]}
          >
            <View style={styles.cardHeader}>
              <Image
                source={{ uri: item.authorInfo?.avatar || FALLBACK_AVATAR }}
                style={styles.avatar}
              />
              <View style={{ flex: 1 }}>
                <View style={styles.authorRow}>
                  <Text
                    style={[styles.authorName, { color: textCol }]}
                    numberOfLines={1}
                  >
                    {item.authorInfo?.fullName}
                  </Text>
                  {item.authorInfo?.isVerified && (
                    <BadgeCheck size={14} color={palette.primary} />
                  )}
                </View>
                {timeAgo ? (
                  <Text style={[styles.meta, { color: mutedText }]}>
                    {timeAgo}
                  </Text>
                ) : null}
              </View>
            </View>

            {item.title ? (
              <Text
                style={[styles.postTitle, { color: textCol }]}
                numberOfLines={2}
              >
                {item.title}
              </Text>
            ) : null}

            {item.caption ? (
              <Text
                style={[styles.postCaption, { color: mutedText }]}
                numberOfLines={3}
              >
                {item.caption}
              </Text>
            ) : null}

            {item.hashtags && item.hashtags.length > 0 && (
              <Text
                style={[styles.hashtags, { color: palette.primary }]}
                numberOfLines={1}
              >
                {item.hashtags.map((h) => `#${h}`).join(" ")}
              </Text>
            )}

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <ArrowBigUp size={16} color={mutedText} />
                <Text style={[styles.statText, { color: mutedText }]}>
                  {formatStat(item.upvoteCount ?? 0)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <MessageCircle size={16} color={mutedText} />
                <Text style={[styles.statText, { color: mutedText }]}>
                  {formatStat(item.commentCount ?? 0)}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      );
    },
    [cardBg, borderCol, textCol, mutedText, palette.primary, router],
  );

  const getRoleInfo = (role: string) => {
    const r = role?.toUpperCase();
    if (r === "EXPERT") {
      return {
        label: t("profile.roles.expert", "Expert"),
        icon: GraduationCap,
        color: "#7C3AED",
        bg: isDark ? "#2E1065" : "#F3E8FF",
      };
    }
    return {
      label: t("profile.roles.farmer", "Farmer"),
      icon: Sprout,
      color: palette.primary,
      bg: isDark ? "#052E16" : "#ECFDF5",
    };
  };

  const renderProfileItem = useCallback(
    ({ item }: { item: ProfileSearchResult }) => {
      const roleInfo = getRoleInfo(item.role);
      const RoleIcon = roleInfo.icon;

      return (
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/(main)/profile/[profileId]",
              params: { profileId: item.id },
            })
          }
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          <View
            style={[
              styles.card,
              { backgroundColor: cardBg, borderColor: borderCol },
            ]}
          >
            <View style={styles.profileRow}>
              <Image
                source={{
                  uri: item.avatar || item.profilePicture || FALLBACK_AVATAR,
                }}
                style={styles.profileAvatar}
              />
              <View style={{ flex: 1 }}>
                <View style={styles.authorRow}>
                  <Text
                    style={[styles.profileName, { color: textCol }]}
                    numberOfLines={1}
                  >
                    {item.fullName}
                  </Text>
                  {item.isVerified && (
                    <BadgeCheck size={15} color={palette.primary} />
                  )}
                </View>

                <View style={styles.profileTagsRow}>
                  <View
                    style={[styles.roleBadge, { backgroundColor: roleInfo.bg }]}
                  >
                    <RoleIcon size={12} color={roleInfo.color} />
                    <Text
                      style={[styles.roleBadgeText, { color: roleInfo.color }]}
                    >
                      {roleInfo.label}
                    </Text>
                  </View>
                  {item.specialty ? (
                    <View
                      style={[
                        styles.roleBadge,
                        { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" },
                      ]}
                    >
                      <Leaf size={12} color={mutedText} />
                      <Text
                        style={[styles.roleBadgeText, { color: mutedText }]}
                      >
                        {item.specialty}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {item.bio ? (
                  <Text
                    style={[styles.bio, { color: mutedText }]}
                    numberOfLines={2}
                  >
                    {item.bio}
                  </Text>
                ) : null}

                {item.addressLine ? (
                  <View style={styles.locationRow}>
                    <MapPin size={12} color={mutedText} />
                    <Text
                      style={[styles.locationText, { color: mutedText }]}
                      numberOfLines={1}
                    >
                      {item.addressLine}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </Pressable>
      );
    },
    [cardBg, borderCol, textCol, mutedText, palette.primary, isDark, t, router],
  );

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

  const postResults = postsQuery.data?.pages.flatMap((p) => p.content) ?? [];
  const profileResults =
    profilesQuery.data?.pages.flatMap((p) => p.content) ?? [];

  const totalPostCount = postsQuery.data?.pages[0]?.totalElements;
  const totalProfileCount = profilesQuery.data?.pages[0]?.totalElements;

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
          renderItem={renderPostItem}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={() => renderLoadMoreFooter("posts")}
        />
      ) : (
        <FlatList
          data={isSearching ? profileResults : []}
          keyExtractor={(item) => item.id}
          renderItem={renderProfileItem}
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
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E5E7EB",
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  authorName: {
    fontSize: 14,
    fontWeight: "600",
  },
  meta: {
    fontSize: 12,
    marginTop: 1,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  postCaption: {
    fontSize: 14,
    lineHeight: 20,
  },
  hashtags: {
    fontSize: 13,
    marginTop: 6,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 10,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 13,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E5E7EB",
  },
  profileName: {
    fontSize: 15,
    fontWeight: "600",
  },
  profileTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 5,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  bio: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
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
