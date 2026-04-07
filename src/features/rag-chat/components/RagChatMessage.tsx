import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Bot, User, Cpu } from "lucide-react-native";
import { MotiView } from "moti";
import { RagTreatmentPlanCard } from "./RagTreatmentPlanCard";

export type MessageRole = "user" | "bot";

export interface MessagePops {
  id: string;
  role: MessageRole;
  content: string;
  treatmentPlan?: unknown;
  plantId?: string;
  savedPlanId?: string;
  sourceQuestion?: string;
  ragState?: string;
  currentNode?: string;
  step?: number;
  isStreaming?: boolean;
}

export function RagChatMessage({
  role,
  content,
  treatmentPlan,
  plantId,
  savedPlanId,
  sourceQuestion,
  ragState,
  currentNode,
  step,
  isStreaming,
}: MessagePops) {
  const isUser = role === "user";

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10, scale: 0.95 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: "timing", duration: 250 }}
      className={`px-4 my-[6px] flex-row w-full ${
        isUser ? "justify-end" : "justify-start"
      } items-end`}
    >
      {!isUser && (
        <View className="w-8 h-8 rounded-full bg-green-100 justify-center items-center mr-2 shadow-sm border border-green-200 z-10">
          <Bot size={18} color="#059669" />
        </View>
      )}

      <View
        className={`max-w-[78%] px-4 py-3 rounded-2xl shadow-sm ${
          isUser
            ? "bg-[#2F7F34] rounded-br-[4px]"
            : "bg-white border border-gray-100 rounded-bl-[4px]"
        }`}
      >
        {!!content && (
          <Text
            className={`text-[15px] leading-6 ${
              isUser ? "text-white" : "text-gray-800"
            }`}
          >
            {content}
          </Text>
        )}

        {!isUser && isStreaming && !content && (
          <View className="flex-row items-center py-1">
            <MotiView
              from={{ opacity: 0.5, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1.1 }}
              transition={{ type: "timing", duration: 800, loop: true }}
              className="w-2 h-2 rounded-full bg-emerald-400 mr-2"
            />
            <MotiView
              from={{ opacity: 0.5, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1.1 }}
              transition={{
                type: "timing",
                duration: 800,
                delay: 200,
                loop: true,
              }}
              className="w-2 h-2 rounded-full bg-emerald-400 mr-2"
            />
            <MotiView
              from={{ opacity: 0.5, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1.1 }}
              transition={{
                type: "timing",
                duration: 800,
                delay: 400,
                loop: true,
              }}
              className="w-2 h-2 rounded-full bg-emerald-400"
            />
          </View>
        )}

        {!isUser && isStreaming && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 pt-2 border-t border-emerald-50 flex-row items-start shrink"
          >
            <View className="mt-[2px] mr-1.5">
              <Cpu size={12} color="#059669" />
            </View>
            <Text
              className="text-[11px] font-medium text-emerald-700 shrink leading-4"
              style={{ flexShrink: 1, paddingRight: 4 }}
            >
              {step ? `Bước ${step}:` : "Đang xử lý:"}{" "}
              {currentNode ? String(currentNode).toUpperCase() : "Phân tích..."}
            </Text>
            <View className="ml-auto" style={{ marginTop: -2 }}>
              <ActivityIndicator
                size="small"
                color="#059669"
                style={{ transform: [{ scale: 0.7 }] }}
              />
            </View>
          </MotiView>
        )}

        {!isUser && Boolean(treatmentPlan) && (
          <RagTreatmentPlanCard
            treatmentPlan={treatmentPlan}
            plantId={plantId}
            savedPlanId={savedPlanId}
            sourceQuestion={sourceQuestion}
          />
        )}
      </View>

      {isUser && (
        <View className="w-8 h-8 rounded-full bg-[#2F7F34] justify-center items-center ml-2 shadow-sm border border-green-800 z-10">
          <User size={18} color="#FFFFFF" />
        </View>
      )}
    </MotiView>
  );
}
