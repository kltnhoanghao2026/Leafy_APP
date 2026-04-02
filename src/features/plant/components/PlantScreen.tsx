import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Home, Plus, Search, SlidersHorizontal } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { getSpeciesLabel, type PlantResponse } from "./plant.types";
import { PlantCard } from "./PlantCard";
import {
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

  const params = useLocalSearchParams<{
    farmPlotId?: string | string[];
    farmName?: string | string[];
  }>();

  const farmPlotId = toSingleParam(params.farmPlotId);
  const farmName = toSingleParam(params.farmName);

  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [plantsCache, setPlantsCache] = useState<PlantResponse[]>([]);

  const pageParams = useMemo(
    () => ({
      page,
      size: PAGE_SIZE,
      sortBy: "createdAt",
      sortDir: "DESC" as const,
    }),
    [page],
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

  const deletePlant = useDeletePlantMutation();

  useEffect(() => {
    setPage(0);
    setPlantsCache([]);
  }, [farmPlotId]);

  useEffect(() => {
    const incomingPlants = activeQuery.data?.content ?? [];

    if (page === 0) {
      setPlantsCache(incomingPlants);
      return;
    }

    setPlantsCache((previousPlants) => {
      const mapById = new Map(previousPlants.map((plant) => [plant.id, plant]));

      for (const plant of incomingPlants) {
        mapById.set(plant.id, plant);
      }

      return Array.from(mapById.values());
    });
  }, [activeQuery.data, page]);

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

  const filteredPlants = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    if (!normalizedSearch) {
      return plantsCache;
    }

    return plantsCache.filter((plant) =>
      [plant.plantNumber, plant.nickName, plant.tagCode, plant.plantStatus]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(normalizedSearch),
        ),
    );
  }, [plantsCache, searchQuery]);

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
        params: nextParams,
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
      params: nextParams,
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
              setPlantsCache((previousPlants) =>
                previousPlants.filter((item) => item.id !== plant.id),
              );
              setPage(0);
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

  const handleLoadMore = () => {
    if (activeQuery.isFetching || activeQuery.data?.last) return;
    setPage((currentPage) => currentPage + 1);
  };

  const title = farmName
    ? t("plant.list.titleByFarm", { name: farmName })
    : t("plant.list.title");

  const subtitle = farmName
    ? t("plant.list.subtitleByFarm")
    : t("plant.list.subtitle");

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
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
      <View className="mb-6 mt-2 px-1">
        <Text className="text-[26px] font-bold text-slate-800 dark:text-slate-100">
          {title}
        </Text>
        <Text className="mt-1 text-[15px] leading-6 text-slate-500 dark:text-slate-400">
          {subtitle}
        </Text>
      </View>

      <View className="mb-6 flex-row items-center gap-3">
        <View className="mr-1 flex-1 flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Search size={20} className="text-slate-400 dark:text-slate-500" />
          <TextInput
            placeholder={t("plant.list.searchPlaceholder")}
            placeholderTextColor="#94A3B8"
            className="ml-2 flex-1 text-[15px] text-slate-800 dark:text-slate-100"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity className="items-center justify-center rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <SlidersHorizontal
            size={20}
            className="text-emerald-600 dark:text-emerald-500"
          />
        </TouchableOpacity>
      </View>

      {activeQuery.isLoading && page === 0 ? (
        <View className="flex-1 items-center justify-center py-12">
          <ActivityIndicator size="large" color="#10B981" />
          <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            {t("common.loading")}
          </Text>
        </View>
      ) : null}

      {activeQuery.isError && page === 0 ? (
        <View className="flex-1 items-center justify-center py-12">
          <Text className="mb-3 text-[15px] font-semibold text-red-500">
            {t("plant.list.loadFailed")}
          </Text>
          <TouchableOpacity
            onPress={() => void activeQuery.refetch()}
            className="mt-0 flex-row items-center justify-center rounded-xl bg-emerald-600 px-6 py-3.5 shadow-sm"
          >
            <Text className="text-sm font-bold text-white">
              {t("common.retry")}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!activeQuery.isLoading &&
      !activeQuery.isError &&
      filteredPlants.length === 0 ? (
        <View className="flex-1 items-center justify-center py-12">
          <Home
            size={48}
            className="text-slate-400 dark:text-slate-500"
            strokeWidth={1.5}
          />
          <Text className="mt-4 text-center text-[15px] font-semibold text-slate-500 dark:text-slate-400">
            {searchQuery
              ? t("plant.list.emptySearchTitle")
              : farmPlotId
                ? t("plant.list.emptyByFarmTitle")
                : t("plant.list.emptyTitle")}
          </Text>
          <Text className="mt-1 text-center text-[13px] text-slate-400 dark:text-slate-500">
            {searchQuery
              ? t("plant.list.emptySearchMessage")
              : t("plant.list.emptyMessage")}
          </Text>
        </View>
      ) : null}

      {!activeQuery.isError ? (
        <View className="mt-2">
          {filteredPlants.map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              speciesName={speciesById.get(plant.speciesId)}
              onEdit={handleOpenEdit}
              onDelete={handleDeletePlant}
            />
          ))}
        </View>
      ) : null}

      {!activeQuery.isError && !activeQuery.data?.last ? (
        <TouchableOpacity
          className="mt-1 flex-row items-center justify-center rounded-xl border border-emerald-600 bg-white py-3 dark:border-emerald-500 dark:bg-slate-900"
          onPress={handleLoadMore}
          disabled={activeQuery.isFetching}
        >
          {activeQuery.isFetching ? (
            <ActivityIndicator size="small" color="#10B981" />
          ) : (
            <Text className="text-sm font-bold text-emerald-600 dark:text-emerald-500">
              {t("plant.list.loadMore")}
            </Text>
          )}
        </TouchableOpacity>
      ) : null}

      <View className="pt-3">
        <TouchableOpacity
          className="mt-0 flex-row items-center justify-center rounded-xl border-2 border-dashed border-emerald-600 bg-white py-3.5 dark:border-emerald-500 dark:bg-slate-900"
          onPress={handleOpenCreate}
        >
          <Plus
            size={18}
            className="text-emerald-600 dark:text-emerald-500"
            strokeWidth={3}
          />
          <Text className="ml-2 text-sm font-bold text-emerald-600 dark:text-emerald-500">
            {farmPlotId
              ? t("plant.list.createPlantInFarm")
              : t("plant.list.createPlant")}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
