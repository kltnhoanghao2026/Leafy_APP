import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  ArrowLeftRight,
  CalendarDays,
  Grid2x2,
  Leaf,
  MapPin,
  Plus,
  Search,
} from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/src/components/ui/EmptyState";
import { SearchInput } from "@/src/components/ui/SearchInput";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { usePaginatedList } from "@/src/hooks/usePaginatedList";
import { useFilteredList } from "@/src/hooks/useFilteredList";
import type { EventTargetType, PlantEventResponse } from "./plant-event.types";
import { PlantEventCard } from "./PlantEventCard";
import {
  PlantEventHubFilterBar,
  type FilterState,
} from "./PlantEventHubFilterBar";
import {
  useDeletePlantEventMutation,
  usePlantEventsByPlant,
  usePlantEventsByFarmPlot,
  usePlantEventsByFarmZone,
} from "../queries";
import type { PlantEventPageParams } from "../queries/queries";
import { usePlants } from "../../plant/queries";
import type { PlantResponse } from "../../plant/components/plant.types";
import { useFarmPlotsByOwner, useFarmZonesByPlot } from "../../farm/queries";
import type {
  FarmPlotResponse,
  FarmZoneResponse,
} from "../../farm/components/farm.types";
import { useAuthContext } from "@/src/features/auth/context/AuthContext";
import { useMyApplies } from "../../plan/queries/plan.queries";
import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";

const toSingleParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const PAGE_SIZE = 20;

export function PlantEventScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profileId } = useAuthContext();
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];

  const params = useLocalSearchParams<{
    plantId?: string | string[];
    plantName?: string | string[];
    farmPlotId?: string | string[];
    farmPlotName?: string | string[];
    farmZoneId?: string | string[];
    farmZoneName?: string | string[];
    targetType?: string | string[];
  }>();

  const routePlantId = toSingleParam(params.plantId) ?? "";
  const routePlantName = toSingleParam(params.plantName);
  const routeFarmPlotId = toSingleParam(params.farmPlotId) ?? "";
  const routeFarmPlotName = toSingleParam(params.farmPlotName);
  const routeFarmZoneId = toSingleParam(params.farmZoneId) ?? "";
  const routeFarmZoneName = toSingleParam(params.farmZoneName);
  const routeTargetType = (toSingleParam(params.targetType) ?? "") as
    | EventTargetType
    | "";

  // Determine initial target type from route params
  const initialTargetType: EventTargetType =
    routeTargetType === "FARM_PLOT" || routeTargetType === "FARM_ZONE"
      ? routeTargetType
      : "PLANT";

  const [targetType, setTargetType] =
    useState<EventTargetType>(initialTargetType);
  const [selectedId, setSelectedId] = useState(
    initialTargetType === "FARM_PLOT"
      ? routeFarmPlotId
      : initialTargetType === "FARM_ZONE"
        ? routeFarmZoneId
        : routePlantId,
  );
  const [selectedName, setSelectedName] = useState(
    initialTargetType === "FARM_PLOT"
      ? (routeFarmPlotName ?? "")
      : initialTargetType === "FARM_ZONE"
        ? (routeFarmZoneName ?? "")
        : (routePlantName ?? ""),
  );
  const [pickerSearchQuery, setPickerSearchQuery] = useState("");
  const [selectedPlotIdForZones, setSelectedPlotIdForZones] = useState("");

  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Filter state ──────────────────────────────────────────────────────
  const [activeFilter, setActiveFilter] = useState<FilterState>({
    farmPlotId: "",
    farmZoneId: "",
    plantId: "",
    targetType: "",
    eventType: "",
    selectedApplyId: "",
  });

  const pageParams = useMemo<PlantEventPageParams>(
    () => ({
      page,
      size: PAGE_SIZE,
      sortBy: "calculatedStartDate",
      sortDir: "ASC",
      eventType: activeFilter.eventType || undefined,
      planApplyId: activeFilter.selectedApplyId || undefined,
    }),
    [page, activeFilter.eventType, activeFilter.selectedApplyId],
  );

  // Query events based on target type
  const plantEventsQuery = usePlantEventsByPlant(
    targetType === "PLANT" ? selectedId : "",
    pageParams,
  );
  const farmPlotEventsQuery = usePlantEventsByFarmPlot(
    targetType === "FARM_PLOT" ? selectedId : "",
    pageParams,
  );
  const farmZoneEventsQuery = usePlantEventsByFarmZone(
    targetType === "FARM_ZONE" ? selectedId : "",
    pageParams,
  );

  const eventsQuery =
    targetType === "FARM_PLOT"
      ? farmPlotEventsQuery
      : targetType === "FARM_ZONE"
        ? farmZoneEventsQuery
        : plantEventsQuery;

  const deleteEvent = useDeletePlantEventMutation();

  const {
    items: eventsCache,
    setCache: setEventsCache,
    resetCache,
  } = usePaginatedList({
    data: eventsQuery.data?.content,
    page,
  });

  // Reset page and cache when filters change
  useEffect(() => {
    setPage(0);
    resetCache();
  }, [selectedId, targetType, activeFilter.eventType, activeFilter.selectedApplyId, resetCache]);

  const eventSearchFields = useCallback(
    () => [
      (e: PlantEventResponse) => e.note,
      (e: PlantEventResponse) => e.eventType,
      (e: PlantEventResponse) => e.description,
    ],
    [],
  );

  const filteredEvents = useFilteredList({
    items: eventsCache,
    searchQuery,
    fields: eventSearchFields(),
  });

  const handleRefresh = () => {
    setPage(0);
    void eventsQuery.refetch();
  };

  const handleOpenCreate = () => {
    const nextParams: Record<string, string> = { targetType };
    if (targetType === "PLANT" && selectedId) {
      nextParams.plantId = selectedId;
      if (selectedName) nextParams.plantName = selectedName;
    } else if (targetType === "FARM_PLOT" && selectedId) {
      nextParams.farmPlotId = selectedId;
      if (selectedName) nextParams.farmPlotName = selectedName;
    } else if (targetType === "FARM_ZONE" && selectedId) {
      nextParams.farmZoneId = selectedId;
      if (selectedName) nextParams.farmZoneName = selectedName;
    }

    router.push({
      pathname: "/(main)/plant-events/add",
      params: nextParams,
    });
  };

  const handleOpenEdit = (eventId: string) => {
    const nextParams: Record<string, string> = { id: eventId, targetType };
    if (targetType === "PLANT" && selectedId) {
      nextParams.plantId = selectedId;
      if (selectedName) nextParams.plantName = selectedName;
    } else if (targetType === "FARM_PLOT" && selectedId) {
      nextParams.farmPlotId = selectedId;
      if (selectedName) nextParams.farmPlotName = selectedName;
    } else if (targetType === "FARM_ZONE" && selectedId) {
      nextParams.farmZoneId = selectedId;
      if (selectedName) nextParams.farmZoneName = selectedName;
    }

    router.push({
      pathname: "/(main)/plant-events/edit/[id]",
      params: nextParams as any,
    });
  };

  const handleDeleteEvent = (event: PlantEventResponse) => {
    Alert.alert(
      t("plantEvent.list.deleteTitle"),
      t("plantEvent.list.deleteMessage", { name: event.note }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteEvent.mutateAsync(event.id);
              setEventsCache((previous) =>
                previous.filter((item) => item.id !== event.id),
              );
              setPage(0);
            } catch {
              Alert.alert(
                t("plantEvent.alerts.deleteFailedTitle"),
                t("plantEvent.alerts.deleteFailedMessage"),
              );
            }
          },
        },
      ],
    );
  };

  const handleLoadMore = () => {
    if (eventsQuery.isFetching || eventsQuery.data?.last) return;
    setPage((currentPage) => currentPage + 1);
  };

  const handleChangeTarget = () => {
    setSelectedId("");
    setSelectedName("");
    setSelectedPlotIdForZones("");
    setPage(0);
    resetCache();
    setSearchQuery("");
    setPickerSearchQuery("");
  };

  const handleSwitchTargetType = (newType: EventTargetType) => {
    if (newType === targetType) return;
    setTargetType(newType);
    setSelectedId("");
    setSelectedName("");
    setSelectedPlotIdForZones("");
    setPage(0);
    resetCache();
    setSearchQuery("");
    setPickerSearchQuery("");
  };

  const title = selectedName
    ? t("plantEvent.list.titleByTarget", { name: selectedName })
    : t("plantEvent.list.title");

  const subtitle = selectedName
    ? t("plantEvent.list.subtitleByTarget")
    : t("plantEvent.list.subtitle");

  // ── Pickers data ──────────────────────────────────────────────────────
  const plantsQuery = usePlants(
    { page: 0, size: 100, sortBy: "createdAt", sortDir: "DESC" },
    targetType === "PLANT" && !selectedId,
  );

  const ownerProfileId = profileId ?? "";
  const farmPlotsQuery = useFarmPlotsByOwner(
    (targetType === "FARM_PLOT" || targetType === "FARM_ZONE") && !selectedId
      ? ownerProfileId
      : "",
  );

  const farmZonesQuery = useFarmZonesByPlot(
    targetType === "FARM_ZONE" && !selectedId && selectedPlotIdForZones
      ? selectedPlotIdForZones
      : "",
  );

  // For filter sheet
  const farmZonesQueryForFilter = useFarmZonesByPlot(activeFilter.farmPlotId || selectedId);
  const appliesQuery = useMyApplies({ size: 100 });

  const filteredPlants = useMemo(() => {
    const plants = plantsQuery.data?.content ?? [];
    const q = pickerSearchQuery.trim().toLowerCase();
    if (!q) return plants;
    return plants.filter((p: PlantResponse) =>
      [p.plantNumber, p.nickName, p.tagCode]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [plantsQuery.data?.content, pickerSearchQuery]);

  const filteredFarmPlots = useMemo(() => {
    const plots = farmPlotsQuery.data ?? [];
    const q = pickerSearchQuery.trim().toLowerCase();
    if (!q) return plots;
    return plots.filter((p: FarmPlotResponse) =>
      [p.name, p.code, p.addressLine]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [farmPlotsQuery.data, pickerSearchQuery]);

  const filteredFarmZones = useMemo(() => {
    const zones = farmZonesQuery.data ?? [];
    const q = pickerSearchQuery.trim().toLowerCase();
    if (!q) return zones;
    return zones.filter((z: FarmZoneResponse) =>
      [z.zoneName, z.zoneCode, z.cropType]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [farmZonesQuery.data, pickerSearchQuery]);

  const handleSelectPlant = (plant: PlantResponse) => {
    setSelectedId(plant.id);
    setSelectedName(plant.nickName || plant.plantNumber);
    setPage(0);
    setEventsCache([]);
    setSearchQuery("");
  };

  const handleSelectFarmPlot = (plot: FarmPlotResponse) => {
    setSelectedId(plot.id);
    setSelectedName(plot.name);
    setPage(0);
    setEventsCache([]);
    setSearchQuery("");
  };

  const handleSelectPlotForZones = (plot: FarmPlotResponse) => {
    setSelectedPlotIdForZones(plot.id);
    setPickerSearchQuery("");
  };

  const handleSelectFarmZone = (zone: FarmZoneResponse) => {
    setSelectedId(zone.id);
    setSelectedName(zone.zoneName);
    setPage(0);
    setEventsCache([]);
    setSearchQuery("");
  };

  // ── Target type tab bar ───────────────────────────────────────────────
  const targetTabs: {
    type: EventTargetType;
    label: string;
    icon: typeof Leaf;
  }[] = [
    { type: "PLANT", label: t("plantEvent.list.targetPlant"), icon: Leaf },
    {
      type: "FARM_PLOT",
      label: t("plantEvent.list.targetFarmPlot"),
      icon: MapPin,
    },
    {
      type: "FARM_ZONE",
      label: t("plantEvent.list.targetFarmZone"),
      icon: Grid2x2,
    },
  ];

  // If no target selected, show target type tabs + picker
  if (!selectedId) {
    // Select appropriate query based on target type
    if (targetType === "PLANT") {
      // use plantsQuery
    } else if (targetType === "FARM_ZONE" && selectedPlotIdForZones) {
      // use farmZonesQuery
    } else {
      // use farmPlotsQuery
    }

    return (
      <ScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerClassName="flex-grow p-4 pb-24"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-5 mt-2 px-1">
          <Text className="text-[26px] font-bold text-slate-800 dark:text-slate-100">
            {t("plantEvent.list.title")}
          </Text>
          <Text className="mt-1 text-[15px] leading-6 text-slate-500 dark:text-slate-400">
            {t("plantEvent.list.selectTargetPrompt")}
          </Text>
        </View>

        {/* Target type tabs */}
        <View className="mb-4 flex-row gap-2">
          {targetTabs.map((tab) => {
            const isActive = tab.type === targetType;
            const Icon = tab.icon;
            return (
              <TouchableOpacity
                key={tab.type}
                className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 ${
                  isActive
                    ? "bg-emerald-600 dark:bg-emerald-700"
                    : "border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                }`}
                onPress={() => handleSwitchTargetType(tab.type)}
              >
                <Icon
                  size={16}
                  className={
                    isActive
                      ? "text-white"
                      : "text-slate-500 dark:text-slate-400"
                  }
                  strokeWidth={2.2}
                />
                <Text
                  className={`text-xs font-bold ${isActive ? "text-white" : "text-slate-600 dark:text-slate-300"}`}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Farm Zone: plot selector step */}
        {targetType === "FARM_ZONE" && !selectedPlotIdForZones ? (
          <>
            <Text className="mb-2 px-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
              {t("plantEvent.list.selectPlotForZone")}
            </Text>
            <View className="mb-4 flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Search
                size={20}
                className="text-slate-400 dark:text-slate-500"
              />
              <TextInput
                placeholder={t("plantEvent.list.searchFarmPlotsPlaceholder")}
                placeholderTextColor="#94A3B8"
                className="ml-2 flex-1 text-[15px] text-slate-800 dark:text-slate-100"
                value={pickerSearchQuery}
                onChangeText={setPickerSearchQuery}
              />
            </View>
            {farmPlotsQuery.isLoading ? (
              <View className="items-center py-12">
                <ActivityIndicator size="large" color="#10B981" />
              </View>
            ) : (
              <View className="gap-2">
                {filteredFarmPlots.map((plot: FarmPlotResponse) => (
                  <TouchableOpacity
                    key={plot.id}
                    className="flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    onPress={() => handleSelectPlotForZones(plot)}
                  >
                    <View className="items-center justify-center rounded-xl bg-blue-50 p-2 dark:bg-blue-400/15">
                      <MapPin
                        size={22}
                        className="text-blue-700 dark:text-blue-400"
                        strokeWidth={2.4}
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-base font-bold text-slate-800 dark:text-slate-100"
                        numberOfLines={1}
                      >
                        {plot.name}
                      </Text>
                      <Text
                        className="text-xs text-slate-500 dark:text-slate-400"
                        numberOfLines={1}
                      >
                        {plot.code}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {filteredFarmPlots.length === 0 && !farmPlotsQuery.isLoading ? (
                  <View className="items-center py-12">
                    <MapPin
                      size={48}
                      className="text-slate-400 dark:text-slate-500"
                      strokeWidth={1.5}
                    />
                    <Text className="mt-4 text-center text-[15px] font-semibold text-slate-500 dark:text-slate-400">
                      {t("plantEvent.list.noFarmPlotsTitle")}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
          </>
        ) : null}

        {/* Farm Zone: zone selector step (after plot selected) */}
        {targetType === "FARM_ZONE" && selectedPlotIdForZones ? (
          <>
            <View className="mb-2 flex-row items-center justify-between px-1">
              <Text className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {t("plantEvent.list.selectZone")}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setSelectedPlotIdForZones("");
                  setPickerSearchQuery("");
                }}
              >
                <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {t("plantEvent.list.backToPlots")}
                </Text>
              </TouchableOpacity>
            </View>
            <View className="mb-4 flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Search
                size={20}
                className="text-slate-400 dark:text-slate-500"
              />
              <TextInput
                placeholder={t("plantEvent.list.searchFarmZonesPlaceholder")}
                placeholderTextColor="#94A3B8"
                className="ml-2 flex-1 text-[15px] text-slate-800 dark:text-slate-100"
                value={pickerSearchQuery}
                onChangeText={setPickerSearchQuery}
              />
            </View>
            {farmZonesQuery.isLoading ? (
              <View className="items-center py-12">
                <ActivityIndicator size="large" color="#10B981" />
              </View>
            ) : (
              <View className="gap-2">
                {filteredFarmZones.map((zone: FarmZoneResponse) => (
                  <TouchableOpacity
                    key={zone.id}
                    className="flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    onPress={() => handleSelectFarmZone(zone)}
                  >
                    <View className="items-center justify-center rounded-xl bg-violet-50 p-2 dark:bg-violet-400/15">
                      <Grid2x2
                        size={22}
                        className="text-violet-700 dark:text-violet-400"
                        strokeWidth={2.4}
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-base font-bold text-slate-800 dark:text-slate-100"
                        numberOfLines={1}
                      >
                        {zone.zoneName}
                      </Text>
                      <Text
                        className="text-xs text-slate-500 dark:text-slate-400"
                        numberOfLines={1}
                      >
                        {zone.zoneCode}{" "}
                        {zone.cropType ? `• ${zone.cropType}` : ""}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {filteredFarmZones.length === 0 && !farmZonesQuery.isLoading ? (
                  <View className="items-center py-12">
                    <Grid2x2
                      size={48}
                      className="text-slate-400 dark:text-slate-500"
                      strokeWidth={1.5}
                    />
                    <Text className="mt-4 text-center text-[15px] font-semibold text-slate-500 dark:text-slate-400">
                      {t("plantEvent.list.noFarmZonesTitle")}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
          </>
        ) : null}

        {/* Plant picker */}
        {targetType === "PLANT" ? (
          <>
            <View className="mb-4 flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Search
                size={20}
                className="text-slate-400 dark:text-slate-500"
              />
              <TextInput
                placeholder={t("plantEvent.list.searchPlantsPlaceholder")}
                placeholderTextColor="#94A3B8"
                className="ml-2 flex-1 text-[15px] text-slate-800 dark:text-slate-100"
                value={pickerSearchQuery}
                onChangeText={setPickerSearchQuery}
              />
            </View>

            {plantsQuery.isLoading ? (
              <View className="flex-1 items-center justify-center py-12">
                <ActivityIndicator size="large" color="#10B981" />
                <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  {t("common.loading")}
                </Text>
              </View>
            ) : plantsQuery.isError ? (
              <View className="flex-1 items-center justify-center py-12">
                <Text className="mb-3 text-[15px] font-semibold text-red-500">
                  {t("plantEvent.list.loadPlantsFailed")}
                </Text>
                <TouchableOpacity
                  onPress={() => void plantsQuery.refetch()}
                  className="mt-0 flex-row items-center justify-center rounded-xl bg-emerald-600 px-6 py-3.5 shadow-sm"
                >
                  <Text className="text-sm font-bold text-white">
                    {t("common.retry")}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : filteredPlants.length === 0 ? (
              <View className="flex-1 items-center justify-center py-12">
                <Leaf
                  size={48}
                  className="text-slate-400 dark:text-slate-500"
                  strokeWidth={1.5}
                />
                <Text className="mt-4 text-center text-[15px] font-semibold text-slate-500 dark:text-slate-400">
                  {pickerSearchQuery
                    ? t("plantEvent.list.emptyPlantSearchTitle")
                    : t("plantEvent.list.noPlantsTitle")}
                </Text>
                <Text className="mt-1 text-center text-[13px] text-slate-400 dark:text-slate-500">
                  {pickerSearchQuery
                    ? t("plantEvent.list.emptyPlantSearchMessage")
                    : t("plantEvent.list.noPlantsMessage")}
                </Text>
              </View>
            ) : (
              <View className="gap-2">
                {filteredPlants.map((plant: PlantResponse) => (
                  <TouchableOpacity
                    key={plant.id}
                    className="flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    onPress={() => handleSelectPlant(plant)}
                  >
                    <View className="items-center justify-center rounded-xl bg-emerald-50 p-2 dark:bg-emerald-400/15">
                      <Leaf
                        size={22}
                        className="text-emerald-700 dark:text-emerald-400"
                        strokeWidth={2.4}
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-base font-bold text-slate-800 dark:text-slate-100"
                        numberOfLines={1}
                      >
                        {plant.plantNumber}
                      </Text>
                      <Text
                        className="text-xs text-slate-500 dark:text-slate-400"
                        numberOfLines={1}
                      >
                        {plant.nickName?.trim() || t("plant.card.noNickname")}
                      </Text>
                    </View>
                    <View className="self-start rounded-lg bg-emerald-50 px-2.5 py-1 dark:bg-emerald-900/20">
                      <Text className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                        {plant.plantStatus}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : null}

        {/* Farm Plot picker */}
        {targetType === "FARM_PLOT" ? (
          <>
            <View className="mb-4 flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Search
                size={20}
                className="text-slate-400 dark:text-slate-500"
              />
              <TextInput
                placeholder={t("plantEvent.list.searchFarmPlotsPlaceholder")}
                placeholderTextColor="#94A3B8"
                className="ml-2 flex-1 text-[15px] text-slate-800 dark:text-slate-100"
                value={pickerSearchQuery}
                onChangeText={setPickerSearchQuery}
              />
            </View>

            {farmPlotsQuery.isLoading ? (
              <View className="items-center py-12">
                <ActivityIndicator size="large" color="#10B981" />
                <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  {t("common.loading")}
                </Text>
              </View>
            ) : farmPlotsQuery.isError ? (
              <View className="items-center py-12">
                <Text className="mb-3 text-[15px] font-semibold text-red-500">
                  {t("plantEvent.list.loadFarmPlotsFailed")}
                </Text>
                <TouchableOpacity
                  onPress={() => void farmPlotsQuery.refetch()}
                  className="mt-0 flex-row items-center justify-center rounded-xl bg-emerald-600 px-6 py-3.5 shadow-sm"
                >
                  <Text className="text-sm font-bold text-white">
                    {t("common.retry")}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : filteredFarmPlots.length === 0 ? (
              <View className="items-center py-12">
                <MapPin
                  size={48}
                  className="text-slate-400 dark:text-slate-500"
                  strokeWidth={1.5}
                />
                <Text className="mt-4 text-center text-[15px] font-semibold text-slate-500 dark:text-slate-400">
                  {pickerSearchQuery
                    ? t("plantEvent.list.emptyFarmPlotSearchTitle")
                    : t("plantEvent.list.noFarmPlotsTitle")}
                </Text>
                <Text className="mt-1 text-center text-[13px] text-slate-400 dark:text-slate-500">
                  {pickerSearchQuery
                    ? t("plantEvent.list.emptyFarmPlotSearchMessage")
                    : t("plantEvent.list.noFarmPlotsMessage")}
                </Text>
              </View>
            ) : (
              <View className="gap-2">
                {filteredFarmPlots.map((plot: FarmPlotResponse) => (
                  <TouchableOpacity
                    key={plot.id}
                    className="flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    onPress={() => handleSelectFarmPlot(plot)}
                  >
                    <View className="items-center justify-center rounded-xl bg-blue-50 p-2 dark:bg-blue-400/15">
                      <MapPin
                        size={22}
                        className="text-blue-700 dark:text-blue-400"
                        strokeWidth={2.4}
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-base font-bold text-slate-800 dark:text-slate-100"
                        numberOfLines={1}
                      >
                        {plot.name}
                      </Text>
                      <Text
                        className="text-xs text-slate-500 dark:text-slate-400"
                        numberOfLines={1}
                      >
                        {plot.code} {plot.areaM2 ? `• ${plot.areaM2} m²` : ""}
                      </Text>
                    </View>
                    <View className="self-start rounded-lg bg-blue-50 px-2.5 py-1 dark:bg-blue-900/20">
                      <Text className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400">
                        {plot.status}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Sticky header with filter */}
      <View
        className="flex-row items-center justify-between px-4 py-3"
        style={{
          backgroundColor: scheme === "dark" ? palette.background : "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: scheme === "dark" ? "rgba(47,127,52,0.2)" : "rgba(47,127,52,0.12)",
        }}
      >
        <View className="flex-1 flex-row items-center gap-2">
          <Text
            className="text-base font-bold text-slate-700 dark:text-slate-200"
            numberOfLines={1}
          >
            {title}
          </Text>
          <TouchableOpacity
            onPress={handleChangeTarget}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeftRight
              size={14}
              color={palette.primary}
            />
          </TouchableOpacity>
        </View>

        </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow p-4 pb-24"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={eventsQuery.isRefetching}
            onRefresh={handleRefresh}
            tintColor="#10B981"
            colors={["#10B981"]}
          />
        }
      >
        {/* Subtitle below sticky header */}
        <View className="mb-3 mt-2 px-1">
          <Text className="text-[15px] leading-6 text-slate-500 dark:text-slate-400">
            {subtitle}
          </Text>
        </View>

        {/* ── Filter bar (collapseable inside scroll) ───────────────── */}
        <PlantEventHubFilterBar
          filter={activeFilter}
          onApply={(f) => {
            setActiveFilter(f);
            setPage(0);
            setEventsCache([]);
          }}
          data={{
            applies: appliesQuery.data?.content ?? [],
            farmPlots: farmPlotsQuery.data ?? [],
            plants: plantsQuery.data?.content ?? [],
            farmZonesData: farmZonesQueryForFilter.data ?? [],
            farmZonesLoading: farmZonesQueryForFilter.isLoading,
            primaryColor: palette.primary,
          }}
        />

        <View className="mb-6 flex-row items-center gap-3">
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t("plantEvent.list.searchPlaceholder")}
          />
        </View>

        {eventsQuery.isLoading && page === 0 ? <LoadingView /> : null}

      {eventsQuery.isError && page === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={t("plantEvent.list.loadFailed")}
          actionLabel={t("common.retry")}
          onAction={() => void eventsQuery.refetch()}
        />
      ) : null}

      {!eventsQuery.isLoading &&
      !eventsQuery.isError &&
      filteredEvents.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={
            searchQuery
              ? t("plantEvent.list.emptySearchTitle")
              : t("plantEvent.list.emptyTitle")
          }
          subtitle={
            searchQuery
              ? t("plantEvent.list.emptySearchMessage")
              : t("plantEvent.list.emptyMessage")
          }
        />
      ) : null}

      {!eventsQuery.isError ? (
        <View className="mt-2">
          {filteredEvents.map((event) => (
            <PlantEventCard
              key={event.id}
              event={event}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteEvent}
            />
          ))}
        </View>
      ) : null}

      {!eventsQuery.isError && !eventsQuery.data?.last ? (
        <TouchableOpacity
          className="mt-1 flex-row items-center justify-center rounded-xl border border-emerald-600 bg-white py-3 dark:border-emerald-500 dark:bg-slate-900"
          onPress={handleLoadMore}
          disabled={eventsQuery.isFetching}
        >
          {eventsQuery.isFetching ? (
            <ActivityIndicator size="small" color="#10B981" />
          ) : (
            <Text className="text-sm font-bold text-emerald-600 dark:text-emerald-500">
              {t("plantEvent.list.loadMore")}
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
            {t("plantEvent.list.createEvent")}
          </Text>
        </TouchableOpacity>
      </View>

      </ScrollView>
    </View>
  );
}
