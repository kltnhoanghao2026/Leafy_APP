import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
} from "react";
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
import { ArrowUp, Paperclip, Smile } from "lucide-react-native";

import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import BackButton from "@/src/components/ui/BackButton";

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
  const navigation = useNavigation();
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

  const onlineLabel = thread?.isOnline
    ? t("common.status.online", "Online")
    : t("common.status.offline", "Offline");

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => {
        if (!thread) return null;
        return (
          <View className="flex-row items-center justify-center -ml-4 gap-2.5">
            <View className="relative">
              <Image
                source={{ uri: thread.avatar }}
                className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700"
                resizeMode="cover"
              />
              {thread.isOnline && (
                <View className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500 dark:border-slate-900" />
              )}
            </View>
            <View className="justify-center">
              <Text
                className="text-[16px] font-bold tracking-tight"
                style={{ color: palette.text }}
              >
                {thread.name}
              </Text>
              <Text
                className="text-[12px] font-medium"
                style={{ color: palette.primary }}
              >
                {thread.roleLabel
                  ? `${thread.roleLabel} • ${onlineLabel}`
                  : onlineLabel}
              </Text>
            </View>
          </View>
        );
      },
      headerLeft: () => <BackButton />,
      headerLeftContainerStyle: { paddingLeft: 12 },
      headerStyle: {
        backgroundColor: palette.background,
      },
      headerShadowVisible: true,
    });
  }, [navigation, thread, palette, router, onlineLabel, t]);

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

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: palette.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 60 : 0}
    >
      <View className="flex-1">
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 24,
            gap: 16,
          }}
        >
          <View className="mb-4 self-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1">
            <Text
              className="text-[11px] font-medium"
              style={{ color: mutedText }}
            >
              {t(
                "community.conversation.startHint",
                "This is the start of your conversation",
              )}
            </Text>
          </View>

          {messages.map((message) => {
            const isMine = message.sender === "me";

            return (
              <View
                key={message.id}
                className={isMine ? "items-end" : "items-start"}
              >
                <View
                  className="max-w-[75%] rounded-[20px] px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                  style={{
                    backgroundColor: isMine ? palette.primary : surfaceColor,
                    borderWidth: isMine ? 0 : 1,
                    borderColor: lineColor,
                    borderBottomRightRadius: isMine ? 4 : 20,
                    borderBottomLeftRadius: !isMine ? 4 : 20,
                  }}
                >
                  <Text
                    className="text-[15px] leading-6"
                    style={{ color: isMine ? "#FFFFFF" : palette.text }}
                  >
                    {message.text}
                  </Text>
                </View>
                <Text
                  className="mt-1 text-[11px] font-medium"
                  style={{ color: mutedText }}
                >
                  {message.sentAt}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        <View
          className="border-t px-2 pt-2 shadow-lg"
          style={{
            borderColor: lineColor,
            backgroundColor: surfaceColor,
            paddingBottom:
              Math.max(insets.bottom, 12) +
              (Platform.OS === "android" ? androidKeyboardOffset : 0),
          }}
        >
          <View className="flex-row items-end gap-1">
            <View className="mb-1 flex-row">
              <Pressable className="h-10 w-10 items-center justify-center rounded-full active:bg-slate-100 dark:active:bg-slate-800">
                <Paperclip size={20} color={mutedText} strokeWidth={2.5} />
              </Pressable>
              {draftText.length === 0 && (
                <Pressable className="h-10 w-10 items-center justify-center rounded-full active:bg-slate-100 dark:active:bg-slate-800">
                  <Smile size={20} color={mutedText} strokeWidth={2.5} />
                </Pressable>
              )}
            </View>

            <View
              className="max-h-[120px] min-h-[44px] flex-1 flex-row items-center rounded-3xl border border-transparent px-4 py-1 pb-1 mb-1 shadow-sm"
              style={{
                backgroundColor: colorScheme === "dark" ? "#1A2421" : "#F4F6F5",
              }}
            >
              <TextInput
                className="max-h-24 flex-1 py-1.5 text-[15px] leading-5"
                style={{ color: palette.text, textAlignVertical: "center" }}
                value={draftText}
                onChangeText={setDraftText}
                onFocus={() => {
                  setTimeout(() => {
                    scrollRef.current?.scrollToEnd({ animated: true });
                  }, 80);
                }}
                placeholder={t(
                  "community.conversation.placeholder",
                  "Message...",
                )}
                placeholderTextColor={mutedText}
                multiline
                autoCorrect
                autoCapitalize="sentences"
              />
            </View>

            <Pressable
              className="mb-1.5 ml-1 h-[38px] w-[38px] items-center justify-center rounded-full shadow-sm active:opacity-80"
              style={{
                backgroundColor: draftText.trim()
                  ? palette.primary
                  : "transparent",
              }}
              onPress={handleSendMessage}
              accessibilityRole="button"
              accessibilityLabel={t("community.conversation.send", "Send")}
              disabled={!draftText.trim()}
            >
              <ArrowUp
                size={22}
                color={draftText.trim() ? "#FFFFFF" : mutedText}
                strokeWidth={3}
              />
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
