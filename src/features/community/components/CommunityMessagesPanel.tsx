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
          <View className="flex-row items-center gap-2">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200 dark:bg-slate-800 dark:active:bg-slate-700">
              <UserPlus2 size={18} color={palette.text} />
            </View>
            <View className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200 dark:bg-slate-800 dark:active:bg-slate-700">
              <MessageCircleMore size={18} color={palette.text} />
            </View>
          </View>
        </View>

        <View
          className="mt-4 flex-row items-center gap-2 rounded-2xl bg-white px-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:bg-slate-900 border"
          style={{
            borderColor: lineColor,
            height: 44,
          }}
        >
          <Search size={18} color={mutedText} />
          <TextInput
            className="flex-1 text-[15px] font-medium"
            style={{ color: palette.text }}
            placeholder={t(
              "community.messages.searchPlaceholder",
              "Search messages",
            )}
            placeholderTextColor={mutedText}
            value={searchKeyword}
            onChangeText={setSearchKeyword}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>

        <View className="mt-4 flex-row gap-3">
          <Pressable
            className="flex-1 flex-row items-center justify-center gap-2 rounded-[20px] py-3 shadow-[0_2px_4px_rgba(47,127,52,0.15)] active:opacity-90"
            style={{ backgroundColor: palette.primary }}
          >
            <Text className="text-[14.5px] font-semibold text-white">
              {t("community.messages.newMessage", "New Message")}
            </Text>
            <PenSquare size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {isSyncing ? (
        <View className="gap-3 mt-2">
          {SKELETON_ROWS.map((rowId) => (
            <View
              key={rowId}
              className="rounded-2xl border p-4 shadow-sm"
              style={{
                backgroundColor: cardBg,
                borderColor: lineColor,
              }}
            >
              <View className="flex-row items-center gap-4">
                <View className="h-14 w-14 rounded-full bg-slate-200/70 dark:bg-slate-700/50" />
                <View className="flex-1 gap-2.5">
                  <View className="h-4 w-1/3 rounded bg-slate-200/70 dark:bg-slate-700/50" />
                  <View className="h-3.5 w-2/3 rounded bg-slate-200/60 dark:bg-slate-700/40" />
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
        <View className="gap-3 mt-2">
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
                className="flex-row items-center gap-4 rounded-[20px] bg-white px-4 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] active:opacity-75 dark:bg-slate-900 border"
                style={{
                  borderColor: lineColor,
                }}
                onPress={() => openConversation(thread.id)}
              >
                <View className="relative">
                  <Image
                    source={{ uri: thread.avatar }}
                    className="h-[56px] w-[56px] rounded-full bg-slate-200 dark:bg-slate-700"
                    resizeMode="cover"
                  />
                  {thread.isOnline && (
                    <View className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-green-500 dark:border-slate-900" />
                  )}
                </View>

                <View className="flex-1">
                  <View className="flex-row items-center justify-between gap-3">
                    <View className="flex-row items-center gap-2">
                      <Text
                        className="max-w-[160px] text-[16px] font-bold tracking-tight"
                        style={{ color: palette.text }}
                        numberOfLines={1}
                      >
                        {thread.name}
                      </Text>
                      {thread.isPinned ? (
                        <View className="rounded-md bg-emerald-100 px-1.5 py-0.5 dark:bg-emerald-900/40">
                          <Text className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                            {t("community.messages.pinned")}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <Text
                      className="text-[12px] font-medium"
                      style={{
                        color:
                          thread.unreadCount > 0 ? palette.primary : mutedText,
                      }}
                    >
                      {thread.lastMessageAt}
                    </Text>
                  </View>

                  {thread.roleLabel ? (
                    <Text
                      className="mt-0.5 text-[12px]"
                      style={{ color: mutedText }}
                      numberOfLines={1}
                    >
                      {thread.roleLabel}
                    </Text>
                  ) : null}

                  <View className="mt-1.5 flex-row items-center justify-between gap-3">
                    <Text
                      className={`flex-1 text-[14px] leading-5 ${
                        thread.unreadCount > 0
                          ? "font-semibold text-slate-900 dark:text-white"
                          : ""
                      }`}
                      style={{
                        color: thread.isTyping
                          ? palette.primary
                          : thread.unreadCount > 0
                            ? undefined
                            : mutedText,
                        fontWeight: thread.unreadCount > 0 ? "600" : "400",
                      }}
                      numberOfLines={1}
                    >
                      {fromSelfPrefix}
                      <Text
                        className={
                          thread.isTyping
                            ? "font-medium italic text-emerald-600 dark:text-emerald-400"
                            : ""
                        }
                      >
                        {previewText}
                      </Text>
                    </Text>

                    {thread.unreadCount > 0 && (
                      <View
                        className="h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
                        style={{ backgroundColor: palette.primary }}
                      >
                        <Text className="text-[11px] font-bold text-white">
                          {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
                        </Text>
                      </View>
                    )}
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
