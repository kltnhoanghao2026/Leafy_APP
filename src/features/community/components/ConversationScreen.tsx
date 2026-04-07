import { ArrowUp, Paperclip, Smile } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";

import {
  type ConversationMessage,
  getConversationMessagesMock,
  messageThreadsMock,
} from "./community.messages.data";

const buildClockTime = () => {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function ConversationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { threadId: routeThreadId } = useLocalSearchParams<{
    threadId?: string | string[];
  }>();

  const threadId = useMemo(() => {
    if (Array.isArray(routeThreadId)) {
      return routeThreadId[0];
    }

    return routeThreadId;
  }, [routeThreadId]);

  const thread = useMemo(() => {
    if (!threadId) {
      return null;
    }

    return messageThreadsMock.find((item) => item.id === threadId) ?? null;
  }, [threadId]);

  const initialMessages = useMemo(() => {
    if (!threadId) {
      return [];
    }

    return getConversationMessagesMock(threadId);
  }, [threadId]);

  const [messages, setMessages] =
    useState<ConversationMessage[]>(initialMessages);
  const [draftText, setDraftText] = useState("");
  const [androidKeyboardOffset, setAndroidKeyboardOffset] = useState(0);

  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const palette = Colors[colorScheme];
  const surfaceColor = colorScheme === "dark" ? "#1F2A20" : "#FFFFFF";
  const lineColor =
    colorScheme === "dark" ? "rgba(148,163,184,0.18)" : "rgba(47,127,52,0.12)";
  const mutedText = palette.textGray;

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 24);

    return () => clearTimeout(timerId);
  }, [messages.length]);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const showSubscription = Keyboard.addListener(
      "keyboardDidShow",
      (event) => {
        setAndroidKeyboardOffset(event.endCoordinates.height);
        setTimeout(() => {
          scrollRef.current?.scrollToEnd({ animated: true });
        }, 60);
      },
    );

    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setAndroidKeyboardOffset(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleSendMessage = () => {
    const trimmed = draftText.trim();

    if (!trimmed || !threadId) {
      return;
    }

    const nextMessage: ConversationMessage = {
      id: `local-${Date.now()}`,
      threadId,
      sender: "me",
      text: trimmed,
      sentAt: buildClockTime(),
    };

    setMessages((prev) => [...prev, nextMessage]);
    setDraftText("");
  };

  if (!thread) {
    return (
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: palette.background }}
      >
        <Text
          className="text-center text-lg font-semibold"
          style={{ color: palette.text }}
        >
          {t("community.conversation.noThreadTitle")}
        </Text>
        <Text className="mt-2 text-center text-sm" style={{ color: mutedText }}>
          {t("community.conversation.noThreadDescription")}
        </Text>
        <Pressable
          className="mt-5 rounded-full px-4 py-2.5"
          style={{ backgroundColor: palette.primary }}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
              return;
            }

            router.replace("/(main)/community");
          }}
        >
          <Text className="text-sm font-semibold text-white">
            {t("community.conversation.backToMessages")}
          </Text>
        </Pressable>
      </View>
    );
  }

  const onlineLabel = thread.isOnline
    ? t("common.status.online")
    : t("common.status.offline");

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: palette.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 60 : 0}
    >
      <View className="flex-1">
        <View
          className="mx-4 mt-4 rounded-2xl border px-4 py-3"
          style={{ backgroundColor: surfaceColor, borderColor: lineColor }}
        >
          <View className="flex-row items-center gap-3">
            <View className="relative">
              <Image
                source={{ uri: thread.avatar }}
                className="h-11 w-11 rounded-full bg-slate-200"
                resizeMode="cover"
              />
              {thread.isOnline ? (
                <View className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
              ) : null}
            </View>

            <View className="flex-1">
              <Text
                className="text-[15px] font-semibold"
                style={{ color: palette.text }}
              >
                {thread.name}
              </Text>
              <Text className="text-[12px]" style={{ color: mutedText }}>
                {thread.roleLabel
                  ? `${thread.roleLabel} · ${onlineLabel}`
                  : onlineLabel}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          className="mt-4 flex-1 px-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          contentContainerStyle={{ paddingBottom: 18, gap: 10 }}
        >
          <Text
            className="self-center rounded-full px-3 py-1 text-[11px]"
            style={{
              color: mutedText,
              backgroundColor: "rgba(148,163,184,0.12)",
            }}
          >
            {t("community.conversation.startHint")}
          </Text>

          {messages.map((message) => {
            const isMine = message.sender === "me";

            return (
              <View
                key={message.id}
                className={isMine ? "items-end" : "items-start"}
              >
                <View
                  className="max-w-[85%] rounded-2xl px-3.5 py-2.5"
                  style={{
                    backgroundColor: isMine
                      ? palette.primary
                      : colorScheme === "dark"
                        ? "rgba(148,163,184,0.14)"
                        : "#FFFFFF",
                    borderWidth: isMine ? 0 : 1,
                    borderColor: isMine ? "transparent" : lineColor,
                  }}
                >
                  <Text
                    className="text-[14px] leading-[20px]"
                    style={{ color: isMine ? "#FFFFFF" : palette.text }}
                  >
                    {message.text}
                  </Text>
                </View>
                <Text
                  className="mt-1 px-1 text-[11px]"
                  style={{ color: mutedText }}
                >
                  {message.sentAt}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        <View
          className="border-t px-4 pt-3 pb-5"
          style={{
            borderTopColor: lineColor,
            backgroundColor: palette.background,
            paddingBottom:
              Math.max(insets.bottom, 12) +
              (Platform.OS === "android" ? androidKeyboardOffset : 0),
          }}
        >
          <View className="flex-row items-end gap-2">
            <Pressable
              className="h-11 w-11 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(148,163,184,0.12)" }}
            >
              <Paperclip size={18} color={mutedText} />
            </Pressable>

            <View
              className="flex-1 flex-row items-end rounded-2xl border px-3"
              style={{ borderColor: lineColor, backgroundColor: surfaceColor }}
            >
              <TextInput
                className="max-h-[110px] min-h-[44px] flex-1 py-2.5 text-[14px]"
                style={{ color: palette.text, textAlignVertical: "top" }}
                value={draftText}
                onChangeText={setDraftText}
                onFocus={() => {
                  setTimeout(() => {
                    scrollRef.current?.scrollToEnd({ animated: true });
                  }, 80);
                }}
                placeholder={t("community.conversation.placeholder")}
                placeholderTextColor={mutedText}
                multiline
                autoCorrect
                autoCapitalize="sentences"
              />
              <Pressable className="h-10 w-10 items-center justify-center">
                <Smile size={18} color={mutedText} />
              </Pressable>
            </View>

            <Pressable
              className="h-11 w-11 items-center justify-center rounded-full"
              style={{
                backgroundColor: draftText.trim()
                  ? palette.primary
                  : "rgba(148,163,184,0.28)",
              }}
              onPress={handleSendMessage}
              accessibilityRole="button"
              accessibilityLabel={t("community.conversation.send")}
            >
              <ArrowUp
                size={18}
                color={draftText.trim() ? "#FFFFFF" : "#FFFFFF"}
              />
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
