import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import { BaseBottomSheet } from "@/src/shared/components/BaseBottomSheet";
import {
  LayoutGrid,
  Map as MapIcon,
  Check,
  X,
  Trash2,
  Edit2,
  PlusCircle,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import type { Zone } from "./sensors.types";

type Props = {
  hasActivePlot: boolean;
  isLoading: boolean;
  isMutating: boolean;
  zones: Zone[];
  onAdd: (
    zone: Pick<Zone, "name" | "variety" | "area" | "status">,
  ) => Promise<void> | void;
  onUpdate: (id: string, patch: Partial<Zone>) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
};

export function ZoneManagerSection({
  hasActivePlot,
  isLoading,
  isMutating,
  zones,
  onAdd,
  onUpdate,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Zone>>({});
  const [isAddOpen, setIsAddOpen] = useState(false);

  const startEdit = (zone: Zone) => {
    setEditingId(zone.id);
    setEditForm({
      name: zone.name,
      variety: zone.variety,
      area: zone.area,
      status: zone.status,
    });
  };
  const cancelEdit = () => setEditingId(null);
  const saveEdit = async (id: string) => {
    await onUpdate(id, editForm);
    setEditingId(null);
  };
  const confirmDelete = (zone: Zone) => {
    Alert.alert(
      t("sensors.zoneManager.deleteTitle"),
      t("sensors.zoneManager.deleteMessage", { name: zone.name }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => {
            void onDelete(zone.id);
          },
        },
      ],
    );
  };

  const statusLabel = (status: Zone["status"]) => {
    if (status === "ACTIVE") return t("common.status.activeUpper");
    if (status === "INACTIVE") return t("common.status.inactiveUpper");
    return t("common.status.archivedUpper");
  };

  return (
    <View>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-5">
        <View className="flex-row items-center gap-2">
          <LayoutGrid size={22} color="#245A34" strokeWidth={2.5} />
          <Text className="text-[17px] font-bold text-[#245A34] dark:text-emerald-400">
            {t("sensors.zoneManager.title")}
          </Text>
        </View>
        <TouchableOpacity
          disabled={!hasActivePlot || isLoading || isMutating}
          onPress={() => setIsAddOpen(true)}
          className={`flex-row items-center gap-1.5 ${!hasActivePlot || isLoading || isMutating ? "opacity-50" : "opacity-100"}`}
        >
          <PlusCircle size={18} color="#245A34" strokeWidth={2.5} />
          <Text className="text-[#245A34] dark:text-emerald-400 font-bold text-[13px]">
            {t("sensors.zoneManager.addZone")}
          </Text>
        </TouchableOpacity>
      </View>

      {!hasActivePlot || isLoading || (!isLoading && zones.length === 0) ? (
        <View className="rounded-3xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <Text className="text-slate-500 dark:text-slate-400 text-[13px] leading-5">
            {!hasActivePlot
              ? t("sensors.zoneManager.noPlotSelected")
              : isLoading
                ? t("sensors.zoneManager.loadingZones")
                : t("sensors.zoneManager.emptyZones")}
          </Text>
        </View>
      ) : null}

      {/* Zone cards */}
      {!isLoading &&
        zones.map((zone) => {
          const isEditing = editingId === zone.id;
          const isGrowing = zone.status === "ACTIVE";
          return (
            <View
              key={zone.id}
              className="rounded-3xl p-[18px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm mb-3"
            >
              {/* Card Header */}
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-row items-center gap-3">
                  <View className="w-[46px] h-[46px] rounded-full bg-emerald-50 dark:bg-emerald-900/40 items-center justify-center">
                    <MapIcon size={22} color="#245A34" strokeWidth={2.5} />
                  </View>
                  <View>
                    <Text className="text-[17px] font-bold text-slate-900 dark:text-white mb-1">
                      {zone.name}
                    </Text>
                    <View
                      className={`px-2.5 py-[3px] rounded-full self-start ${isGrowing ? "bg-emerald-50 dark:bg-emerald-900/30" : "bg-amber-50 dark:bg-amber-900/30"}`}
                    >
                      <Text
                        className={`text-[9px] font-black tracking-widest ${isGrowing ? "text-emerald-500" : "text-amber-500"}`}
                      >
                        {statusLabel(zone.status)}
                      </Text>
                    </View>
                  </View>
                </View>

                {isEditing ? (
                  <View className="flex-row gap-1.5">
                    <TouchableOpacity
                      onPress={() => {
                        void saveEdit(zone.id);
                      }}
                      disabled={isMutating}
                      className="w-[34px] h-[34px] rounded-full items-center justify-center bg-emerald-50 dark:bg-emerald-900/20"
                    >
                      <Check size={15} color="#10B981" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={cancelEdit}
                      disabled={isMutating}
                      className="w-[34px] h-[34px] rounded-full items-center justify-center bg-slate-50 dark:bg-slate-800"
                    >
                      <X size={15} color="#94A3B8" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => confirmDelete(zone)}
                    disabled={isMutating}
                    className="w-[34px] h-[34px] rounded-full items-center justify-center bg-slate-50 dark:bg-slate-800"
                  >
                    <Trash2 size={15} color="#94A3B8" strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>

              <View className="h-px bg-slate-100 dark:bg-slate-800 my-2.5" />

              <View className="mt-1">
                {isEditing ? (
                  <TextInput
                    value={editForm.name}
                    onChangeText={(v) =>
                      setEditForm((p) => ({ ...p, name: v }))
                    }
                    className="flex-1 rounded-lg bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1.5 text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-2"
                    placeholder={t("sensors.zoneManager.zoneNamePlaceholder")}
                    placeholderTextColor="#94A3B8"
                  />
                ) : null}

                {isEditing ? (
                  <TextInput
                    value={editForm.variety}
                    onChangeText={(v) =>
                      setEditForm((p) => ({ ...p, variety: v }))
                    }
                    className="flex-1 rounded-lg bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1.5 text-[13px] font-medium text-slate-700 dark:text-slate-300"
                    placeholder={t("sensors.zoneManager.varietyPlaceholder")}
                    placeholderTextColor="#94A3B8"
                  />
                ) : (
                  <Text className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mr-2">
                    {t("sensors.zoneManager.varietyLabel", {
                      variety: zone.variety,
                    })}
                  </Text>
                )}
              </View>

              <View className="flex-row justify-between items-center mt-3">
                {isEditing ? (
                  <View className="flex-1 flex-row gap-2 mr-2">
                    <TextInput
                      value={editForm.area}
                      onChangeText={(v) =>
                        setEditForm((p) => ({ ...p, area: v }))
                      }
                      className="flex-1 rounded-lg bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1.5 text-[13px] font-medium text-slate-700 dark:text-slate-300 mr-0"
                      placeholder={t("sensors.zoneManager.areaPlaceholder")}
                      placeholderTextColor="#94A3B8"
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setEditForm((p) => ({
                          ...p,
                          status: p.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                        }))
                      }
                      className="border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 rounded-full flex-row items-center gap-1.5"
                    >
                      <Text className="font-bold text-[13px] text-[#245A34] dark:text-emerald-400">
                        {editForm.status === "ACTIVE"
                          ? t("sensors.zoneManager.pause")
                          : t("sensors.zoneManager.activate")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text className="text-[13px] font-bold text-slate-400 dark:text-slate-500 flex-1">
                    {zone.area}
                  </Text>
                )}
                {!isEditing && (
                  <TouchableOpacity
                    disabled={isMutating}
                    onPress={() => startEdit(zone)}
                    className="border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 rounded-full flex-row items-center gap-1.5"
                  >
                    <Edit2 size={13} color="#245A34" strokeWidth={2.5} />
                    <Text className="font-bold text-[13px] text-[#245A34] dark:text-emerald-400">
                      {t("common.edit")}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

      {/* Add Zone Modal */}
      <AddZoneModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={async (zone) => {
          await onAdd(zone);
          setIsAddOpen(false);
        }}
      />
    </View>
  );
}

function AddZoneModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (
    zone: Pick<Zone, "name" | "variety" | "area" | "status">,
  ) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [variety, setVariety] = useState("");
  const [area, setArea] = useState("");
  const [status, setStatus] = useState<Zone["status"]>("ACTIVE");
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => bottomSheetRef.current?.expand(), 50);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isOpen]);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onAdd({
        name: name.trim(),
        variety: variety.trim() || t("sensors.zoneManager.notSpecified"),
        area: area.trim() || t("sensors.zoneManager.defaultArea"),
        status,
      });
      setName("");
      setVariety("");
      setArea("");
      setStatus("ACTIVE");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseBottomSheet
      ref={bottomSheetRef}
      enableDynamicSizing={true}
      onChange={(index) => {
        if (index === -1) {
          onClose();
        }
      }}
    >
      <View className="pb-4">
        <Text className="text-[18px] font-bold mb-5 text-slate-900 dark:text-white">
          {t("sensors.zoneManager.addModalTitle")}
        </Text>

        <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
          {t("sensors.zoneManager.zoneNameField")}
        </Text>
        <TextInput
          className="rounded-xl border-[1.5px] border-slate-200 dark:border-slate-800 px-4 py-3 text-[14px] font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-900 mb-3.5"
          value={name}
          onChangeText={setName}
          placeholder={t("sensors.zoneManager.zoneNameExample")}
          placeholderTextColor="#94A3B8"
        />

        <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
          {t("sensors.zoneManager.varietyField")}
        </Text>
        <TextInput
          className="rounded-xl border-[1.5px] border-slate-200 dark:border-slate-800 px-4 py-3 text-[14px] font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-900 mb-3.5"
          value={variety}
          onChangeText={setVariety}
          placeholder={t("sensors.zoneManager.varietyExample")}
          placeholderTextColor="#94A3B8"
        />

        <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
          {t("sensors.zoneManager.areaField")}
        </Text>
        <TextInput
          className="rounded-xl border-[1.5px] border-slate-200 dark:border-slate-800 px-4 py-3 text-[14px] font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-900 mb-3.5"
          value={area}
          onChangeText={setArea}
          placeholder={t("sensors.zoneManager.areaExample")}
          placeholderTextColor="#94A3B8"
        />

        <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
          {t("sensors.zoneManager.statusField")}
        </Text>
        <View className="flex-row gap-2.5 mb-5">
          {(["ACTIVE", "INACTIVE"] as Zone["status"][]).map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setStatus(s)}
              className={`border px-3.5 py-1.5 rounded-full flex-row items-center gap-1.5 ${
                status === s
                  ? "bg-[#245A34] dark:bg-emerald-600 border-[#245A34] dark:border-emerald-600"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              <Text
                className={`font-bold text-[13px] ${
                  status === s
                    ? "text-white"
                    : "text-[#245A34] dark:text-emerald-400"
                }`}
              >
                {s === "ACTIVE"
                  ? t("common.status.active")
                  : t("common.status.inactive")}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="flex-row gap-2.5 mt-2">
          <TouchableOpacity
            className="flex-1 border-[1.5px] border-slate-200 dark:border-slate-800 rounded-full py-3 items-center"
            onPress={onClose}
            disabled={isSubmitting}
          >
            <Text className="font-bold text-[14px] text-slate-500 dark:text-slate-400">
              {t("common.cancel")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 bg-[#245A34] dark:bg-emerald-600 rounded-full py-3 items-center flex-row justify-center ${!name.trim() || isSubmitting ? "opacity-50" : ""}`}
            onPress={() => {
              void handleAdd();
            }}
            disabled={!name.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="font-bold text-[14px] text-white">
                {t("common.add")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </BaseBottomSheet>
  );
}
