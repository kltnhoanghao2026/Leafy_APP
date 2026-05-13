import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "@/src/features/auth/context/AuthContext";
import type { FarmZoneResponse } from "../components/farm.types";
import {
  useFarmPlotsByOwner,
  useDeletePlotMutation,
  useCreateZoneMutation,
  useUpdateZoneMutation,
  useDeleteZoneMutation,
} from "../queries";
import type { ZonePayload } from "../components/FarmZoneFormModal";

export function useFarmScreen() {
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

  const isSubmittingZone = createZone.isPending || updateZone.isPending;

  return {
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
  };
}
