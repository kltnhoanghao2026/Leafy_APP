import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowBigUp, MessageCircle, BadgeCheck } from "lucide-react-native";
import { useRouter } from "expo-router";

import type { PostSearchResult } from "@/src/features/community/community-feed/api/search.api";
import { formatStat } from "@/src/features/community/community-feed/components/community.utils";

const FALLBACK_AVATAR = "https://ui-avatars.com/api/?background=E5E7EB&color=334155&name=L";

type SearchResultPostCardProps = {
  item: PostSearchResult;
  cardBg: string;
  borderCol: string;
  textCol: string;
  mutedText: string;
  primaryColor: string;
};

export function SearchResultPostCard({
  item,
  cardBg,
  borderCol,
  textCol,
  mutedText,
  primaryColor,
}: SearchResultPostCardProps) {
  const router = useRouter();
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
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
        <View style={styles.cardHeader}>
          <Image
            source={{ uri: item.authorInfo?.avatar || FALLBACK_AVATAR }}
            style={styles.avatar}
          />
          <View style={{ flex: 1 }}>
            <View style={styles.authorRow}>
              <Text style={[styles.authorName, { color: textCol }]} numberOfLines={1}>
                {item.authorInfo?.fullName}
              </Text>
              {item.authorInfo?.isVerified && (
                <BadgeCheck size={14} color={primaryColor} />
              )}
            </View>
            {timeAgo ? (
              <Text style={[styles.meta, { color: mutedText }]}>{timeAgo}</Text>
            ) : null}
          </View>
        </View>

        {item.title ? (
          <Text style={[styles.postTitle, { color: textCol }]} numberOfLines={2}>
            {item.title}
          </Text>
        ) : null}

        {item.caption ? (
          <Text style={[styles.postCaption, { color: mutedText }]} numberOfLines={3}>
            {item.caption}
          </Text>
        ) : null}

        {item.hashtags && item.hashtags.length > 0 && (
          <Text style={[styles.hashtags, { color: primaryColor }]} numberOfLines={1}>
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
}

const styles = StyleSheet.create({
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
});
