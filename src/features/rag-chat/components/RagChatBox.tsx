import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
} from "react-native";
import { SendHorizontal, Sprout } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { streamRagChat } from "../api/rag-chat.stream";
import { RagChatMessage, MessagePops } from "./RagChatMessage";
import { MotiView } from "moti";

const EmptyState = ({
  t,
}: {
  t: (key: string, defaultText: string) => string;
}) => (
  <MotiView
    from={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ type: "spring", delay: 150 }}
    className="flex-1 items-center justify-center mt-24 px-8"
  >
    <View className="w-20 h-20 bg-green-50 rounded-full items-center justify-center mb-6 shadow-sm border border-green-100">
      <Sprout size={40} color="#059669" />
    </View>
    <Text className="text-xl font-bold text-gray-800 mb-3 text-center">
      {t("ragChat.welcomeTitle", "Trợ lý nông nghiệp Leafy")}
    </Text>
    <Text className="text-[15px] text-gray-500 text-center leading-6">
      {t(
        "ragChat.welcomeSubtitle",
        "Hãy hỏi tôi về cách chăm sóc cây, chẩn đoán bệnh tật hoặc lên lịch bón phân nhé.",
      )}
    </Text>
  </MotiView>
);

export function RagChatBox() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<MessagePops[]>([]);
  const [inputText, setInputText] = useState("");
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  const [isStreaming, setIsStreaming] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const streamAbortRef = useRef<AbortController | null>(null);
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Scroll to bottom dynamically
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      streamAbortRef.current?.abort();
    };
  }, []);

  const updateMessageById = (
    messageId: string,
    updater: (message: MessagePops) => MessagePops,
  ) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === messageId ? updater(message) : message,
      ),
    );
  };

  const handleSend = async () => {
    if (!inputText.trim() || isStreaming) {
      return;
    }

    const question = inputText.trim();
    const timestamp = Date.now();
    const userMessageId = `${timestamp}_user`;
    const botMessageId = `${timestamp}_bot`;

    const userMessage: MessagePops = {
      id: userMessageId,
      role: "user",
      content: question,
    };

    const botPlaceholder: MessagePops = {
      id: botMessageId,
      role: "bot",
      content: "",
      sourceQuestion: question,
      ragState: "started",
      currentNode: "START",
      step: 0,
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, botPlaceholder]);
    setInputText("");

    const abortController = new AbortController();
    streamAbortRef.current = abortController;
    setIsStreaming(true);

    try {
      const finalData = await streamRagChat(
        {
          question,
          threadId,
          language: "vi",
        },
        {
          onState: (state) => {
            updateMessageById(botMessageId, (message) => ({
              ...message,
              ragState: state.ragState ?? message.ragState,
              step: state.step ?? message.step,
              currentNode: state.currentNode ?? message.currentNode,
              isStreaming: true,
            }));
          },
          onChunk: (chunk, payload) => {
            updateMessageById(botMessageId, (message) => ({
              ...message,
              content: `${message.content ?? ""}${chunk ?? ""}`,
              ragState: payload.ragState ?? message.ragState,
              step: payload.step ?? message.step,
              currentNode: payload.currentNode ?? message.currentNode,
              isStreaming: true,
            }));
          },
        },
        {
          signal: abortController.signal,
        },
      );

      if (finalData.threadId) {
        setThreadId(finalData.threadId);
      }

      updateMessageById(botMessageId, (message) => ({
        ...message,
        content:
          finalData.answer?.trim()?.length > 0
            ? finalData.answer
            : message.content,
        plan: finalData.plan,
        plantId: finalData.plantId,
        savedPlanId: finalData.savedPlanId,
        ragState: "completed",
        currentNode: "END",
        isStreaming: false,
      }));
    } catch (error) {
      if (abortController.signal.aborted) {
        return;
      }

      updateMessageById(botMessageId, (message) => ({
        ...message,
        content:
          message.content?.trim()?.length > 0
            ? message.content
            : t(
                "ragChat.errorProcessing",
                "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.",
              ),
        ragState: "error",
        currentNode: "ERROR",
        isStreaming: false,
      }));
    } finally {
      if (streamAbortRef.current === abortController) {
        streamAbortRef.current = null;
      }
      setIsStreaming(false);
    }
  };

  const renderEmptyState = () => <EmptyState t={t} />;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#FAFAFA]"
      behavior={Platform.OS === "ios" ? "padding" : "padding"}
      keyboardVerticalOffset={headerHeight}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RagChatMessage
            id={item.id}
            role={item.role}
            content={item.content}
            plan={item.plan}
            plantId={item.plantId}
            savedPlanId={item.savedPlanId}
            sourceQuestion={item.sourceQuestion}
            ragState={item.ragState}
            currentNode={item.currentNode}
            step={item.step}
            isStreaming={item.isStreaming}
          />
        )}
        contentContainerStyle={{ paddingVertical: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      <View
        className="w-full flex-row px-4 py-3 bg-white border-t border-gray-100 items-end"
        style={{
          paddingBottom: 12,
        }}
      >
        <View className="flex-1 bg-gray-50 rounded-3xl flex-row items-center px-4 py-1 mr-3 border border-gray-200">
          <TextInput
            className="flex-1 text-[15px] text-gray-800 max-h-24 min-h-[40px]"
            placeholder={t(
              "ragChat.inputPlaceholder",
              "Hỏi AI về cây trồng...",
            )}
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
        </View>

        <MotiView
          animate={{
            scale: inputText.trim() && !isStreaming ? 1 : 0.9,
            opacity: inputText.trim() && !isStreaming ? 1 : 0.6,
          }}
          transition={{ type: "spring" }}
        >
          <TouchableOpacity
            className="w-[48px] h-[48px] rounded-full bg-[#2F7F34] justify-center items-center shadow-md mb-1"
            onPress={() => {
              void handleSend();
            }}
            disabled={!inputText.trim() || isStreaming}
          >
            <SendHorizontal size={22} color="#FFFFFF" className="ml-1" />
          </TouchableOpacity>
        </MotiView>
      </View>
    </KeyboardAvoidingView>
  );
}
