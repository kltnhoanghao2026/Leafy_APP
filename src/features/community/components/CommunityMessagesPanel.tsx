import {
  Inbox,
  MessageCircleMore,
  PenSquare,
  Search,
  UserPlus2,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Image, Pressable, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import { CommunityPalette } from "./community.types";
import { messageThreadsMock } from "./community.messages.data";

type CommunityMessagesPanelProps = {
  palette: CommunityPalette;
  cardBg: string;
  lineColor: string;
  mutedText: string;
};

const SKELETON_ROWS = ["skeleton-1", "skeleton-2", "skeleton-3", "skeleton-4"];

export function CommunityMessagesPanel({
  palette,
  cardBg,
  lineColor,
  mutedText,
}: CommunityMessagesPanelProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isSyncing, setIsSyncing] = useState(true);

  const openConversation = (threadId: string) => {
    router.push(`/(main)/conversation/${threadId}` as never);
  };

  useEffect(() => {
    const timerId = setTimeout(() => {
      setIsSyncing(false);
    }, 520);

    return () => clearTimeout(timerId);
  }, []);

  const filteredThreads = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase();

    if (!normalizedKeyword) {
      return messageThreadsMock;
    }

    return messageThreadsMock.filter((thread) => {
      return (
        thread.name.toLowerCase().includes(normalizedKeyword) ||
        thread.lastMessage.toLowerCase().includes(normalizedKeyword) ||
        (thread.roleLabel ?? "").toLowerCase().includes(normalizedKeyword)
      );
    });
  }, [searchKeyword]);

  return (
    <View className="gap-4">
      <View
        className="rounded-2xl border px-4 py-4"
        style={{
          backgroundColor: cardBg,
          borderColor: lineColor,
        }}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text
              className="text-[20px] font-bold"
              style={{ color: palette.text }}
            >
              {t("community.messages.title")}
            </Text>
            <Text className="mt-1 text-[13px]" style={{ color: mutedText }}>
              {t("community.messages.subtitle")}
            </Text>
          </View>
          <View
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(47,127,52,0.14)" }}
          >
            <MessageCircleMore size={18} color={palette.primary} />
          </View>
        </View>

        <View
          className="mt-4 flex-row items-center gap-2 rounded-xl border px-3"
          style={{
            borderColor: lineColor,
            backgroundColor: "rgba(148,163,184,0.08)",
          }}
        >
          <Search size={18} color={mutedText} />
          <TextInput
            className="h-11 flex-1 text-[14px]"
            style={{ color: palette.text }}
            placeholder={t("community.messages.searchPlaceholder")}
            placeholderTextColor={mutedText}
            value={searchKeyword}
            onChangeText={setSearchKeyword}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>

        <View className="mt-3 flex-row gap-2">
          <Pressable
            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl py-2.5"
            style={{ backgroundColor: palette.primary }}
          >
            <PenSquare size={16} color="#FFFFFF" />
            <Text className="text-[13px] font-semibold text-white">
              {t("community.messages.newMessage")}
            </Text>
          </Pressable>

          <Pressable
            className="flex-row items-center justify-center gap-2 rounded-xl border px-4 py-2.5"
            style={{ borderColor: lineColor }}
          >
            <UserPlus2 size={16} color={palette.primary} />
            <Text
              className="text-[13px] font-semibold"
              style={{ color: palette.text }}
            >
              {t("community.messages.requests")}
            </Text>
          </Pressable>
        </View>
      </View>

      {isSyncing ? (
        <View className="gap-3">
          <Text
            className="text-[13px] font-medium"
            style={{ color: mutedText }}
          >
            {t("community.messages.loading")}
          </Text>
          {SKELETON_ROWS.map((rowId) => (
            <View
              key={rowId}
              className="rounded-2xl border p-4"
              style={{
                backgroundColor: cardBg,
                borderColor: lineColor,
              }}
            >
              <View className="flex-row items-center gap-3">
                <View className="h-12 w-12 rounded-full bg-slate-200/70 dark:bg-slate-700/50" />
                <View className="flex-1 gap-2">
                  <View className="h-3.5 w-1/3 rounded bg-slate-200/70 dark:bg-slate-700/50" />
                  <View className="h-3 w-2/3 rounded bg-slate-200/60 dark:bg-slate-700/40" />
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : filteredThreads.length === 0 ? (
        <View
          className="items-center rounded-2xl border px-6 py-10"
          style={{
            backgroundColor: cardBg,
            borderColor: lineColor,
          }}
        >
          <View
            className="mb-4 h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(47,127,52,0.12)" }}
          >
            <Inbox size={24} color={palette.primary} />
          </View>
          <Text
            className="text-center text-[16px] font-semibold"
            style={{ color: palette.text }}
          >
            {t("community.messages.emptyTitle")}
          </Text>
          <Text
            className="mt-1 text-center text-[13px] leading-[20px]"
            style={{ color: mutedText }}
          >
            {t("community.messages.emptyDescription")}
          </Text>
          <Pressable
            className="mt-5 rounded-full px-4 py-2.5"
            style={{ backgroundColor: palette.primary }}
          >
            <Text className="text-[13px] font-semibold text-white">
              {t("community.messages.emptyAction")}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View className="gap-3">
          {filteredThreads.map((thread) => {
            const previewText = thread.isTyping
              ? t("community.messages.typing")
              : thread.lastMessage;
            const fromSelfPrefix = thread.sentByMe
              ? `${t("community.messages.you")}: `
              : "";

            return (
              <Pressable
                key={thread.id}
                className="rounded-2xl border px-4 py-3"
                style={{
                  backgroundColor: cardBg,
                  borderColor: lineColor,
                }}
                onPress={() => openConversation(thread.id)}
              >
                <View className="flex-row items-center gap-3">
                  <View className="relative">
                    <Image
                      source={{ uri: thread.avatar }}
                      className="h-12 w-12 rounded-full bg-slate-200"
                      resizeMode="cover"
                    />
                    {thread.isOnline ? (
                      <View className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
                    ) : null}
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center justify-between gap-3">
                      <View className="flex-row items-center gap-2">
                        <Text
                          className="max-w-[180px] text-[15px] font-semibold"
                          style={{ color: palette.text }}
                          numberOfLines={1}
                        >
                          {thread.name}
                        </Text>
                        {thread.isPinned ? (
                          <View className="rounded-full bg-primary/15 px-2 py-0.5">
                            <Text
                              className="text-[10px] font-semibold uppercase"
                              style={{ color: palette.primary }}
                            >
                              {t("community.messages.pinned")}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <Text
                        className="text-[11px]"
                        style={{ color: mutedText }}
                      >
                        {thread.lastMessageAt}
                      </Text>
                    </View>

                    {thread.roleLabel ? (
                      <Text
                        className="mt-0.5 text-[11px]"
                        style={{ color: mutedText }}
                        numberOfLines={1}
                      >
                        {thread.roleLabel}
                      </Text>
                    ) : null}

                    <View className="mt-1 flex-row items-center justify-between gap-3">
                      <Text
                        className="flex-1 text-[13px]"
                        style={{
                          color: thread.isTyping ? palette.primary : mutedText,
                          fontWeight: thread.unreadCount > 0 ? "600" : "400",
                        }}
                        numberOfLines={1}
                      >
                        {fromSelfPrefix}
                        {previewText}
                      </Text>

                      {thread.unreadCount > 0 ? (
                        <View className="min-w-6 items-center rounded-full bg-primary px-1.5 py-0.5">
                          <Text className="text-[11px] font-bold text-white">
                            {thread.unreadCount > 9 ? "9+" : thread.unreadCount}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
