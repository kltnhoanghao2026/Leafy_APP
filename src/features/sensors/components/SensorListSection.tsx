import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import { BaseBottomSheet } from "@/src/shared/components/BaseBottomSheet";
import { Radio, Plus } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import type { Sensor, Zone } from "./sensors.types";
import { SensorRow } from "./SensorRow";

type Props = {
  sensors: Sensor[];
  zones: Zone[];
  onAdd: (sensor: Sensor) => void;
  onUpdate: (id: string, patch: Partial<Sensor>) => void;
  onDelete: (id: string) => void;
};

export function SensorListSection({
  sensors,
  zones,
  onAdd,
  onUpdate,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null);

  const zoneName = (zoneId?: string) => {
    if (!zoneId) return t("sensors.sensorList.unassigned");
    return (
      zones.find((z) => z.id === zoneId)?.name ??
      t("sensors.sensorList.unassigned")
    );
  };

  const confirmDelete = (sensor: Sensor) => {
    Alert.alert(
      t("sensors.sensorList.deleteTitle"),
      t("sensors.sensorList.deleteMessage", { name: sensor.name }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => onDelete(sensor.id),
        },
      ],
    );
  };

  return (
    <View className="rounded-3xl p-5 border shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <View className="flex-row items-center justify-between mb-5">
        <View className="flex-row items-center gap-2 flex-1 mr-2.5">
          <View className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 items-center justify-center">
            <Radio size={20} color="#245A34" strokeWidth={2.5} />
          </View>
          <Text
            className="text-[17px] font-bold text-[#245A34] dark:text-emerald-400"
            numberOfLines={1}
          >
            {t("sensors.sensorList.title")}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setIsAddOpen(true)}
          className="bg-[#245A34] dark:bg-emerald-600 px-3 flex-row items-center justify-center rounded-full shrink-0 py-2 h-9"
        >
          <Plus size={16} color="#FFFFFF" strokeWidth={3} className="mr-1" />
          <Text className="text-white font-bold text-[13px]">
            {t("common.add")}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="gap-3 mt-2">
        {sensors.map((sensor) => (
          <SensorRow
            key={sensor.id}
            sensor={sensor}
            zoneName={zoneName(sensor.zoneId)}
            onEdit={() => setEditingSensor(sensor)}
            onDelete={() => confirmDelete(sensor)}
          />
        ))}
      </View>

      {sensors.length === 0 && (
        <Text className="text-center text-slate-400 dark:text-slate-500 text-[14px] py-6">
          {t("sensors.sensorList.empty")}
        </Text>
      )}

      {/* Add Modal */}
      <AddSensorModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        zones={zones}
        nextId={`S${String(sensors.length + 1).padStart(2, "0")}`}
        onAdd={(s) => {
          onAdd(s);
          setIsAddOpen(false);
        }}
      />

      {/* Edit Modal */}
      {editingSensor && (
        <EditSensorModal
          isOpen
          sensor={editingSensor}
          zones={zones}
          onClose={() => setEditingSensor(null)}
          onSave={(patch) => {
            onUpdate(editingSensor.id, patch);
            setEditingSensor(null);
          }}
        />
      )}
    </View>
  );
}

function AddSensorModal({
  isOpen,
  onClose,
  zones,
  nextId,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  zones: Zone[];
  nextId: string;
  onAdd: (s: Sensor) => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [selectedZone, setSelectedZone] = useState<string>(zones[0]?.id ?? "");
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
        id: nextId,
        name: name.trim(),
        status: "online",
        battery: 100,
        lastSignal: t("sensors.sensorList.justNow"),
        zoneId: selectedZone || undefined,
      });
      setName("");
      setSelectedZone(zones[0]?.id ?? "");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseBottomSheet
      ref={bottomSheetRef}
      enableDynamicSizing={true}
      onChange={(index) => {
        if (index === -1) onClose();
      }}
    >
      <View className="pb-4">
        <Text className="text-[18px] font-bold mb-5 text-slate-900 dark:text-white">
          {t("sensors.sensorList.addModalTitle")}
        </Text>

        <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
          {t("sensors.sensorList.sensorNameField")}
        </Text>
        <TextInput
          className="rounded-xl border-[1.5px] border-slate-200 dark:border-slate-800 px-4 py-3 text-[14px] font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-900 mb-3.5"
          value={name}
          onChangeText={setName}
          placeholder={t("sensors.sensorList.sensorNamePlaceholder")}
          placeholderTextColor="#94A3B8"
        />

        <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
          {t("sensors.sensorList.sensorId", { id: nextId })}
        </Text>

        <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1 mt-2">
          {t("sensors.sensorList.zoneField")}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-3.5"
          contentContainerStyle={{ gap: 8 }}
        >
          {zones.map((z) => (
            <TouchableOpacity
              key={z.id}
              onPress={() => setSelectedZone(z.id)}
              className={`border px-3.5 py-1.5 rounded-full flex-row items-center gap-1.5 ${
                selectedZone === z.id
                  ? "bg-[#245A34] dark:bg-emerald-600 border-[#245A34] dark:border-emerald-600"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              <Text
                className={`font-bold text-[13px] ${
                  selectedZone === z.id
                    ? "text-white"
                    : "text-[#245A34] dark:text-emerald-400"
                }`}
              >
                {z.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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

function EditSensorModal({
  isOpen,
  sensor,
  zones,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  sensor: Sensor;
  zones: Zone[];
  onClose: () => void;
  onSave: (patch: Partial<Sensor>) => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(sensor.name);
  const [selectedZone, setSelectedZone] = useState(sensor.zoneId ?? "");
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => bottomSheetRef.current?.expand(), 50);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await onSave({ name: name.trim(), zoneId: selectedZone || undefined });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseBottomSheet
      ref={bottomSheetRef}
      enableDynamicSizing={true}
      onChange={(index) => {
        if (index === -1) onClose();
      }}
    >
      <View className="pb-4">
        <Text className="text-[18px] font-bold mb-5 text-slate-900 dark:text-white">
          {t("sensors.sensorList.editModalTitle")}
        </Text>

        <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
          {t("sensors.sensorList.sensorName")}
        </Text>
        <TextInput
          className="rounded-xl border-[1.5px] border-slate-200 dark:border-slate-800 px-4 py-3 text-[14px] font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-900 mb-3.5"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#94A3B8"
        />

        <Text className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
          {t("sensors.sensorList.zoneField")}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-3.5"
          contentContainerStyle={{ gap: 8 }}
        >
          {zones.map((z) => (
            <TouchableOpacity
              key={z.id}
              onPress={() => setSelectedZone(z.id)}
              className={`border px-3.5 py-1.5 rounded-full flex-row items-center gap-1.5 ${
                selectedZone === z.id
                  ? "bg-[#245A34] dark:bg-emerald-600 border-[#245A34] dark:border-emerald-600"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              <Text
                className={`font-bold text-[13px] ${
                  selectedZone === z.id
                    ? "text-white"
                    : "text-[#245A34] dark:text-emerald-400"
                }`}
              >
                {z.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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
            className={`flex-1 bg-[#245A34] dark:bg-emerald-600 rounded-full py-3 items-center flex-row justify-center ${isSubmitting ? "opacity-50" : ""}`}
            onPress={() => {
              void handleSave();
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="font-bold text-[14px] text-white">
                {t("common.save")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </BaseBottomSheet>
  );
}
