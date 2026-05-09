import React from "react";
import { View } from "react-native";

export function PostCardSkeleton() {
  return (
    <View className="bg-white pb-2 dark:bg-black">
      {/* Top Separator */}
      <View
        className="h-[6px] w-full"
        style={{ backgroundColor: "rgba(148,163,184,0.1)" }}
      />

      {/* Header Skeleton */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <View className="justify-center gap-2">
            <View className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <View className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </View>
        </View>
        <View className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </View>

      {/* Body Skeleton */}
      <View className="px-4 py-2 gap-2">
        <View className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <View className="h-4 w-full rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <View className="h-4 w-5/6 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </View>

      {/* Image Skeleton (Optional, but good for variation) */}
      <View className="mt-2 h-48 w-full bg-slate-200 dark:bg-slate-800 animate-pulse" />

      {/* Footer Actions Skeleton */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center gap-4">
          <View className="h-8 w-16 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <View className="h-8 w-16 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <View className="h-8 w-16 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </View>
        <View className="h-8 w-16 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </View>
    </View>
  );
}
