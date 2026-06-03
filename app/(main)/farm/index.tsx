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
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']} className="bg-slate-50 dark:bg-slate-950">
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
    <View className="flex-1 bg-white dark:bg-slate-900">
      <ScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerClassName="px-4 pb-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#245A34"
            colors={["#245A34"]}
          />
        }
      >

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
            color="#245A34"
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
            className="mt-0 flex-row items-center justify-center rounded-xl bg-[#245A34] px-6 py-3.5 shadow-sm"
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

      {/* Create New Farm Button */}
      <TouchableOpacity
        onPress={() => router.push("/(main)/farm/add")}
        className="mt-8 mb-4 flex-row items-center justify-center rounded-xl bg-[#245A34] py-4 shadow-sm"
      >
        <Plus size={20} color="#ffffff" strokeWidth={2.5} className="mr-2" />
        <Text className="text-base font-bold text-white">
          {t("farm.form.titleCreate")}
        </Text>
      </TouchableOpacity>

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
    </View>
  );
}
