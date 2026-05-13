import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Check, CheckSquare, Home, Plus, SlidersHorizontal, Trash2, X, LayoutGrid, List } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/src/components/ui/EmptyState";
import { SearchInput } from "@/src/components/ui/SearchInput";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { Pagination } from "@/src/components/ui/Pagination";
import { useFilteredList } from "@/src/hooks/useFilteredList";
import { useAuthContext } from "@/src/features/auth";
import { useFarmPlotsByOwner } from "@/src/features/farm";
import {
  getSpeciesLabel,
  PLANT_STATUS_VALUES,
  type PlantResponse,
  type PlantStatus,
} from "./plant.types";
import { PlantCard } from "./PlantCard";
import { PlantFilterSheet } from "./PlantFilterSheet";
import {
  useBulkDeletePlantsMutation,
  useBulkUpdatePlantStatusMutation,
  useDeletePlantMutation,
  usePlants,
  usePlantsByFarmPlot,
  useSpecies,
} from "../queries";

const toSingleParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const PAGE_SIZE = 20;

export function PlantScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profileId } = useAuthContext();

  const params = useLocalSearchParams<{
    farmPlotId?: string | string[];
    farmName?: string | string[];
  }>();

  const farmPlotId = toSingleParam(params.farmPlotId);
  const farmName = toSingleParam(params.farmName);

  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<PlantStatus | "">("");
  const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);
  const [filters, setFilters] = useState<import("./plant.types").PlantFilterParams>({});
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const pageParams = useMemo(
    () => ({
      page,
      size: PAGE_SIZE,
      sortBy: "createdAt",
      sortDir: "DESC" as const,
      ...filters,
    }),
    [page, filters],
  );

  const plantsQuery = usePlants(pageParams, !farmPlotId);
  const plantsByFarmQuery = usePlantsByFarmPlot(farmPlotId ?? "", pageParams);
  const activeQuery = farmPlotId ? plantsByFarmQuery : plantsQuery;

  const { data: speciesPage } = useSpecies({
    page: 0,
    size: 100,
    sortBy: "commonName",
    sortDir: "ASC",
  });

  const { data: farmPlots } = useFarmPlotsByOwner(profileId ?? "");

  const deletePlant = useDeletePlantMutation();
  const bulkUpdateStatus = useBulkUpdatePlantStatusMutation();
  const bulkDeletePlants = useBulkDeletePlantsMutation();

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = () => {
    setSelectedIds(new Set());
    setBulkStatus("");
  };

  const handleSelectAll = () => {
    if (filteredPlants.length === 0) return;
    
    // If all visible plants are already selected, deselect them
    const allSelected = filteredPlants.every(p => selectedIds.has(p.id));
    if (allSelected) {
      clearSelection();
    } else {
      // Select all visible plants
      setSelectedIds(new Set(filteredPlants.map((p) => p.id)));
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    try {
      await bulkUpdateStatus.mutateAsync({
        plantIds: Array.from(selectedIds),
        newStatus: bulkStatus,
      });
      clearSelection();
      setPage(0);
      void activeQuery.refetch();
    } catch {
      Alert.alert(
        t("plant.alerts.updateFailedTitle"),
        t("plant.alerts.updateFailedMessage")
      );
    }
  };

  const handleBulkDelete = () => {
    Alert.alert(
      t("plant.list.bulkDeleteTitle", { defaultValue: "Xóa nhiều cây trồng" }),
      t("plant.list.bulkDeleteMessage", {
        count: selectedIds.size,
        defaultValue: `Bạn có chắc muốn xóa ${selectedIds.size} cây trồng đã chọn?`,
      }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await bulkDeletePlants.mutateAsync({
                plantIds: Array.from(selectedIds),
              });
              clearSelection();
              setPage(0);
              void activeQuery.refetch();
            } catch {
              Alert.alert(
                t("plant.alerts.deleteFailedTitle"),
                t("plant.alerts.deleteFailedMessage")
              );
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    setPage(0);
  }, [farmPlotId]);

  const plantsCache = activeQuery.data?.content ?? [];

  const plantSearchFields = useCallback(
    () => [
      (p: PlantResponse) => p.plantNumber,
      (p: PlantResponse) => p.nickName,
      (p: PlantResponse) => p.tagCode,
      (p: PlantResponse) => p.plantStatus,
    ],
    [],
  );

  const filteredPlants = useFilteredList({
    items: plantsCache,
    searchQuery,
    fields: plantSearchFields(),
  });

  const speciesById = useMemo(
    () =>
      new Map(
        (speciesPage?.content ?? []).map((species) => [
          species.id,
          getSpeciesLabel(species),
        ]),
      ),
    [speciesPage?.content],
  );

  const farmPlotById = useMemo(
    () => new Map((farmPlots ?? []).map((plot) => [plot.id, plot.name])),
    [farmPlots]
  );

  const handleRefresh = () => {
    setPage(0);
    void activeQuery.refetch();
  };

  const handleOpenCreate = () => {
    const nextParams: Record<string, string> = {};

    if (farmPlotId) nextParams.farmPlotId = farmPlotId;
    if (farmName) nextParams.farmName = farmName;

    if (Object.keys(nextParams).length > 0) {
      router.push({
        pathname: "/(main)/plants/add",
        params: nextParams as any,
      });
      return;
    }

    router.push("/(main)/plants/add");
  };

  const handleOpenEdit = (plantId: string) => {
    const nextParams: Record<string, string> = { id: plantId };

    if (farmPlotId) nextParams.farmPlotId = farmPlotId;
    if (farmName) nextParams.farmName = farmName;

    router.push({
      pathname: "/(main)/plants/edit/[id]",
      params: nextParams as any,
    });
  };

  const handleDeletePlant = (plant: PlantResponse) => {
    Alert.alert(
      t("plant.list.deleteTitle"),
      t("plant.list.deleteMessage", { name: plant.plantNumber }),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deletePlant.mutateAsync(plant.id);
              setPage(0);
              void activeQuery.refetch();
            } catch {
              Alert.alert(
                t("plant.alerts.deleteFailedTitle"),
                t("plant.alerts.deleteFailedMessage"),
              );
            }
          },
        },
      ],
    );
  };



  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow p-4 pb-24"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={activeQuery.isRefetching}
          onRefresh={handleRefresh}
          tintColor="#10B981"
          colors={["#10B981"]}
        />
      }
    >

      <View className="mb-6 mt-2 flex-row items-center justify-between">
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t("plant.list.searchPlaceholder")}
        />

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={handleSelectAll}
            className={`items-center justify-center rounded-xl border p-2 shadow-sm ${
              filteredPlants.length > 0 && filteredPlants.every(p => selectedIds.has(p.id))
                ? "border-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-900/30"
                : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            }`}
          >
            <CheckSquare size={18} className="text-emerald-600 dark:text-emerald-500" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setViewMode((prev) => (prev === "list" ? "grid" : "list"))}
            className="items-center justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            {viewMode === "list" ? (
              <LayoutGrid size={18} className="text-emerald-600 dark:text-emerald-500" />
            ) : (
              <List size={18} className="text-emerald-600 dark:text-emerald-500" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsFilterSheetVisible(true)}
            className={`items-center justify-center rounded-xl border p-2 shadow-sm ${
              Object.keys(filters).some((k) => k !== "status" && filters[k as keyof typeof filters])
                ? "border-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-900/30"
                : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            }`}
          >
            <SlidersHorizontal size={18} className="text-emerald-600 dark:text-emerald-500" />
          </TouchableOpacity>
        </View>
      </View>



      {activeQuery.isLoading && page === 0 ? <LoadingView /> : null}

      {activeQuery.isError && page === 0 ? (
        <EmptyState
          icon={Home}
          title={t("plant.list.loadFailed")}
          actionLabel={t("common.retry")}
          onAction={() => void activeQuery.refetch()}
        />
      ) : null}

      {!activeQuery.isLoading &&
      !activeQuery.isError &&
      filteredPlants.length === 0 ? (
        <EmptyState
          icon={Home}
          title={
            searchQuery
              ? t("plant.list.emptySearchTitle")
              : farmPlotId
                ? t("plant.list.emptyByFarmTitle")
                : t("plant.list.emptyTitle")
          }
          subtitle={
            searchQuery
              ? t("plant.list.emptySearchMessage")
              : t("plant.list.emptyMessage")
          }
        />
      ) : null}

      {!activeQuery.isError ? (
        <View className={`mt-2 ${viewMode === "grid" ? "flex-row flex-wrap justify-between" : "flex-col gap-3"}`}>
          {filteredPlants.map((plant) => (
            <View key={plant.id} className={viewMode === "grid" ? "w-[48%] mb-3" : "w-full"}>
              <PlantCard
                plant={plant}
                speciesName={speciesById.get(plant.speciesId)}
                farmPlotName={farmPlotById.get(plant.farmPlotId)}
                onEdit={handleOpenEdit}
                onDelete={handleDeletePlant}
                selected={selectedIds.has(plant.id)}
                onToggleSelect={toggleSelect}
                selectionMode={selectedIds.size > 0}
                viewMode={viewMode}
              />
            </View>
          ))}
        </View>
      ) : null}

    </ScrollView>

    {activeQuery.isFetching && !activeQuery.isLoading && (
      <View className="pointer-events-none absolute bottom-0 left-0 right-0 top-0 z-50 items-center justify-center bg-slate-900/10 dark:bg-black/20">
        <View className="rounded-2xl bg-white p-4 shadow-xl dark:bg-slate-800">
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      </View>
    )}

    {/* Fixed Pagination Footer */}
    {!activeQuery.isError && (activeQuery.data?.totalPages ?? 0) > 1 ? (
      <View className="bg-white border-t border-slate-200 dark:bg-slate-950 dark:border-slate-800 pb-4">
        <Pagination
          page={page}
          totalPages={activeQuery.data?.totalPages ?? 0}
          totalElements={activeQuery.data?.totalElements}
          onPageChange={setPage}
          itemLabel={t("plant.list.itemLabel", { defaultValue: "cây" })}
        />
      </View>
    ) : null}

      {/* Floating Action Button */}
      {selectedIds.size === 0 && (
        <TouchableOpacity
          onPress={handleOpenCreate}
          className="absolute right-6 h-14 w-14 items-center justify-center rounded-full bg-emerald-600 shadow-lg dark:bg-emerald-500 shadow-emerald-600/30"
          style={{ bottom: (activeQuery.data?.totalPages ?? 0) > 1 ? 96 : 24 }}
        >
          <Plus size={24} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
      )}

      {/* Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <View 
          className="absolute left-4 right-4 rounded-2xl bg-emerald-800 px-4 py-3 shadow-xl dark:bg-emerald-900"
          style={{ bottom: (activeQuery.data?.totalPages ?? 0) > 1 ? 96 : 24 }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <View className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                <Check size={14} color="#fff" strokeWidth={3} />
              </View>
              <Text className="text-sm font-bold text-white">
                {selectedIds.size} {t("plant.list.selected", { defaultValue: "đã chọn" })}
              </Text>
            </View>
            <TouchableOpacity
              onPress={clearSelection}
              className="rounded-full bg-white/10 p-1.5"
            >
              <X size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center justify-between">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mr-3">
              <View className="flex-row gap-2">
                {PLANT_STATUS_VALUES.map((status) => (
                  <TouchableOpacity
                    key={status}
                    onPress={() => setBulkStatus(bulkStatus === status ? "" : status)}
                    className={`rounded-xl px-3 py-1.5 border border-white/20 ${
                      bulkStatus === status ? "bg-white" : "bg-transparent"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        bulkStatus === status ? "text-emerald-800" : "text-white"
                      }`}
                    >
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={handleBulkStatusUpdate}
                disabled={!bulkStatus || bulkUpdateStatus.isPending}
                className={`rounded-xl px-3 py-2 ${
                  !bulkStatus || bulkUpdateStatus.isPending
                    ? "bg-white/30"
                    : "bg-white"
                }`}
              >
                {bulkUpdateStatus.isPending ? (
                  <ActivityIndicator size="small" color="#065f46" />
                ) : (
                  <Text className="text-xs font-bold text-emerald-800">
                    {t("common.apply", { defaultValue: "Áp dụng" })}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleBulkDelete}
                disabled={bulkDeletePlants.isPending}
                className="rounded-xl bg-red-500 p-2"
              >
                <Trash2 size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <PlantFilterSheet
        visible={isFilterSheetVisible}
        initialFilters={filters}
        profileId={profileId ?? undefined}
        fixedFarmPlotId={farmPlotId ?? undefined}
        onApply={(newFilters) => {
          setFilters(newFilters);
          setIsFilterSheetVisible(false);
          setPage(0);
          void activeQuery.refetch();
        }}
        onClose={() => setIsFilterSheetVisible(false)}
      />
    </View>
  );
}
