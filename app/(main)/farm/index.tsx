import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SlidersHorizontal, Home, Plus } from "lucide-react-native";

import { EmptyState } from "@/src/components/ui/EmptyState";
import { SearchInput } from "@/src/components/ui/SearchInput";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { FarmZoneFormModal } from "@/src/features/farm/components/FarmZoneFormModal";
import { FarmPlotCard } from "@/src/features/farm/components/FarmPlotCard";
import { useFarmScreen } from "@/src/features/farm/hooks/useFarmScreen";

import { SafeAreaView } from "react-native-safe-area-context";

export default function SafeFarmScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <FarmScreen />
    </SafeAreaView>
  );
}

function FarmScreen() {
  const {
    t,
    router,
    isLoading,
    isError,
    refetch,
    isRefetching,
    searchQuery,
    setSearchQuery,
    zoneModalVisible,
    activePlotForZone,
    editingZone,
    formatArea,
    filteredPlots,
    handleDeletePlot,
    handleEditPlot,
    handleOpenCreateZone,
    handleOpenEditZone,
    handleOpenPlants,
    handleDeleteZone,
    handleCloseZoneModal,
    handleSubmitZone,
    isSubmittingZone,
  } = useFarmScreen();

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      contentContainerClassName="flex-grow p-4 pb-24"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={"#10B981"}
          colors={["#10B981"]}
        />
      }
    >
      {/* Header */}
      <View className="mb-6 mt-2 px-1">
        <Text className="text-[26px] font-bold text-slate-800 dark:text-slate-100">
          {t("farm.list.title")}
        </Text>
        <Text className="mt-1 text-[15px] leading-6 text-slate-500 dark:text-slate-400">
          {t("farm.list.subtitle")}
        </Text>
      </View>

      {/* Search & Action Row */}
      <View className="mb-6 flex-row items-center gap-3">
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t("farm.list.searchPlaceholder")}
        />
        <TouchableOpacity className="items-center justify-center rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <SlidersHorizontal
            size={20}
            className="text-emerald-600 dark:text-emerald-500"
          />
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {isLoading && <LoadingView />}

      {/* Error State */}
      {isError && !isLoading && (
        <View className="flex-1 items-center justify-center py-12">
          <Text className="mb-3 text-[15px] font-semibold text-red-500">
            {t("farm.list.loadFailed")}
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="mt-0 flex-row items-center justify-center rounded-xl bg-emerald-600 px-6 py-3.5 shadow-sm"
          >
            <Text className="text-sm font-bold text-white">
              {t("common.retry")}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredPlots.length === 0 && (
        <EmptyState
          icon={Home}
          title={
            searchQuery
              ? t("farm.list.emptySearchTitle")
              : t("farm.list.emptyTitle")
          }
          subtitle={
            searchQuery
              ? t("farm.list.emptySearchMessage")
              : t("farm.list.emptyMessage")
          }
        />
      )}

      {/* Farm Plots List */}
      {!isLoading && !isError && (
        <View className="mt-2">
          {filteredPlots.map((plot) => (
            <FarmPlotCard
              key={plot.id}
              plot={plot}
              formatArea={formatArea}
              onEditPlot={handleEditPlot}
              onDeletePlot={handleDeletePlot}
              onCreateZone={handleOpenCreateZone}
              onOpenPlants={handleOpenPlants}
              onEditZone={handleOpenEditZone}
              onDeleteZone={handleDeleteZone}
            />
          ))}
        </View>
      )}

      {/* Floating Add Farm Plot Button */}
      <View className="pt-2">
        <TouchableOpacity
          className="mt-0 flex-row items-center justify-center rounded-xl border-2 border-dashed border-emerald-600 bg-white py-3.5 dark:border-emerald-500 dark:bg-slate-900"
          onPress={() => router.push("/(main)/farm/add")}
        >
          <Plus
            size={18}
            className="text-emerald-600 dark:text-emerald-500"
            strokeWidth={3}
          />
          <Text className="ml-2 text-sm font-bold text-emerald-600 dark:text-emerald-500">
            {t("farm.list.createFarm")}
          </Text>
        </TouchableOpacity>
      </View>

      {zoneModalVisible ? (
        <FarmZoneFormModal
          visible={zoneModalVisible}
          mode={editingZone ? "edit" : "create"}
          plotName={activePlotForZone?.name}
          initialZone={editingZone}
          isSubmitting={isSubmittingZone}
          onClose={handleCloseZoneModal}
          onSubmit={handleSubmitZone}
        />
      ) : null}
    </ScrollView>
  );
}
