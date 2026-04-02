import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Search, SlidersHorizontal, Home, Plus } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { useAuthContext } from "@/src/features/auth/context/AuthContext";

import {
  FarmZoneFormModal,
  type ZonePayload,
} from "@/src/features/farm/components/FarmZoneFormModal";
import { FarmPlotCard } from "./FarmPlotCard";
import type { FarmZoneResponse } from "./farm.types";
import {
  useFarmPlotsByOwner,
  useDeletePlotMutation,
  useCreateZoneMutation,
  useUpdateZoneMutation,
  useDeleteZoneMutation,
} from "../queries";

export function FarmScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const { profileId } = useAuthContext();
  const ownerProfileId = profileId ?? "";

  const {
    data: plots,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useFarmPlotsByOwner(ownerProfileId);

  const deletePlot = useDeletePlotMutation();
  const createZone = useCreateZoneMutation();
  const updateZone = useUpdateZoneMutation();
  const deleteZone = useDeleteZoneMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const [zoneModalVisible, setZoneModalVisible] = useState(false);
  const [activePlotForZone, setActivePlotForZone] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editingZone, setEditingZone] = useState<FarmZoneResponse | null>(null);

  const formatArea = (m2: number) => {
    if (m2 >= 10000) return `${(m2 / 10000).toFixed(1)} ha`;
    return `${m2} m²`;
  };

  const filteredPlots = (plots ?? []).filter(
    (p) =>
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDeletePlot = (id: string, name: string) => {
    Alert.alert(
      t("farm.list.deletePlotTitle"),
      t("farm.list.deletePlotMessage", { name }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => deletePlot.mutate(id),
        },
      ],
    );
  };

  const handleEditPlot = (id: string) => {
    router.push({ pathname: "/(main)/farm/edit/[id]", params: { id } });
  };

  const handleOpenCreateZone = (plotId: string, plotName: string) => {
    setActivePlotForZone({ id: plotId, name: plotName });
    setEditingZone(null);
    setZoneModalVisible(true);
  };

  const handleOpenEditZone = (zone: FarmZoneResponse, plotName: string) => {
    setActivePlotForZone({ id: zone.farmPlotId, name: plotName });
    setEditingZone(zone);
    setZoneModalVisible(true);
  };

  const handleOpenPlants = (plotId: string, plotName: string) => {
    router.push({
      pathname: "/(main)/plants",
      params: { farmPlotId: plotId, farmName: plotName },
    });
  };

  const handleDeleteZone = (zone: FarmZoneResponse) => {
    Alert.alert(
      t("farm.list.deleteZoneTitle"),
      t("farm.list.deleteZoneMessage", { name: zone.zoneName }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => deleteZone.mutate(zone.id),
        },
      ],
    );
  };

  const handleCloseZoneModal = () => {
    if (createZone.isPending || updateZone.isPending) return;
    setZoneModalVisible(false);
    setEditingZone(null);
    setActivePlotForZone(null);
  };

  const handleSubmitZone = async (payload: ZonePayload) => {
    if (!activePlotForZone) return;

    try {
      if (editingZone) {
        await updateZone.mutateAsync({ id: editingZone.id, body: payload });
      } else {
        await createZone.mutateAsync({
          plotId: activePlotForZone.id,
          body: payload,
        });
      }

      setZoneModalVisible(false);
      setEditingZone(null);
      setActivePlotForZone(null);
    } catch {
      Alert.alert(
        t("farm.alerts.saveZoneFailedTitle"),
        t("farm.alerts.saveZoneFailedMessage"),
      );
    }
  };

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
        <View className="mr-1 flex-1 flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Search size={20} className="text-slate-400 dark:text-slate-500" />
          <TextInput
            placeholder={t("farm.list.searchPlaceholder")}
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

      {/* Loading State */}
      {isLoading && (
        <View className="flex-1 items-center justify-center py-12">
          <ActivityIndicator size="large" color="#10B981" />
          <Text className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            {t("common.loading")}
          </Text>
        </View>
      )}

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
        <View className="flex-1 items-center justify-center py-12">
          <Home
            size={48}
            className="text-slate-400 dark:text-slate-500"
            strokeWidth={1.5}
          />
          <Text className="mt-4 text-center text-[15px] font-semibold text-slate-500 dark:text-slate-400">
            {searchQuery
              ? t("farm.list.emptySearchTitle")
              : t("farm.list.emptyTitle")}
          </Text>
          <Text className="mt-1 text-center text-[13px] text-slate-400 dark:text-slate-500">
            {searchQuery
              ? t("farm.list.emptySearchMessage")
              : t("farm.list.emptyMessage")}
          </Text>
        </View>
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
          isSubmitting={createZone.isPending || updateZone.isPending}
          onClose={handleCloseZoneModal}
          onSubmit={handleSubmitZone}
        />
      ) : null}
    </ScrollView>
  );
}
