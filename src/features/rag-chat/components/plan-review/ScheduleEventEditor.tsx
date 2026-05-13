import { View, Text, TouchableOpacity, Switch } from "react-native";
import { CheckCircle2, FlaskConical } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { getEventTypeIcon } from "@/src/features/plant-event/components/plant-event.types";
import { FieldInput } from "./FieldInput";
import { EventErrorList } from "./EventErrorList";
import type { EditableScheduleEvent } from "../../hooks/usePlanReviewerScreen";

type ScheduleEventEditorProps = {
  event: EditableScheduleEvent;
  index: number;
  eventErrors: string[];
  updateScheduleEvent: (index: number, patch: Partial<EditableScheduleEvent>) => void;
  setActiveEventTypePickerIndex: (index: number) => void;
};

export function ScheduleEventEditor({
  event,
  index,
  eventErrors,
  updateScheduleEvent,
  setActiveEventTypePickerIndex,
}: ScheduleEventEditorProps) {
  const { t } = useTranslation();

  const Icon = event.eventType
    ? getEventTypeIcon(event.eventType)
    : FlaskConical;
  const isTreatment = event.eventType === "TREATMENT_APPLICATION";

  return (
    <View
      key={`schedule-event-${index}`}
      className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"
    >
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Icon size={16} color="#2F7F34" />
          <Text className="text-sm font-bold text-slate-800">
            {event.note?.trim() ||
              `${t("ragChat.reviewer.step", "Step")} ${index + 1}`}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <CheckCircle2
            size={12}
            color={event.isPlanned ? "#059669" : "#94a3b8"}
          />
          <Text className="text-[11px] font-semibold text-slate-600">
            {event.isPlanned
              ? t("plantEvent.card.planned", "Planned")
              : t("plantEvent.card.immediate", "Immediate")}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        className="mb-2 rounded-xl border border-slate-200 bg-white px-3 py-2"
        onPress={() => setActiveEventTypePickerIndex(index)}
        activeOpacity={0.8}
      >
        <Text className="text-xs font-semibold text-slate-600">
          {t("plantEvent.form.eventType", "Event type")}
        </Text>
        <Text className="mt-0.5 text-sm text-slate-800">
          {event.eventType
            ? t(`plantEvent.eventType.${event.eventType}`)
            : t(
                "plantEvent.form.eventTypePlaceholder",
                "Select an event type...",
              )}
        </Text>
      </TouchableOpacity>

      <FieldInput
        label={t("plantEvent.form.note", "Note")}
        value={event.note}
        onChangeText={(value) => updateScheduleEvent(index, { note: value })}
        placeholder={t(
          "plantEvent.form.notePlaceholder",
          "Short label for this event",
        )}
      />

      <FieldInput
        label={t("plantEvent.form.description", "Description")}
        value={event.description}
        onChangeText={(value) =>
          updateScheduleEvent(index, { description: value })
        }
        placeholder={t(
          "plantEvent.form.descriptionPlaceholder",
          "Detailed description",
        )}
        multiline
      />

      <View className="mb-2 flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
        <Text className="text-sm font-medium text-slate-700">
          {t("plantEvent.form.isPlanned", "Planned event")}
        </Text>
        <Switch
          value={event.isPlanned}
          onValueChange={(value) =>
            updateScheduleEvent(index, { isPlanned: value })
          }
          trackColor={{ false: "#cbd5e1", true: "#6ee7b7" }}
          thumbColor={event.isPlanned ? "#059669" : "#94a3b8"}
        />
      </View>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <FieldInput
            label={t("plantEvent.form.daysFromNow", "Days from now")}
            value={event.daysFromNow}
            onChangeText={(value) =>
              updateScheduleEvent(index, { daysFromNow: value })
            }
            placeholder="0"
            keyboardType="numeric"
          />
        </View>
        <View className="flex-1">
          <FieldInput
            label={t("plantEvent.form.durationDays", "Duration (days)")}
            value={event.durationDays}
            onChangeText={(value) =>
              updateScheduleEvent(index, { durationDays: value })
            }
            placeholder="1"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <FieldInput
            label={t("plantEvent.form.startDate", "Start date")}
            value={event.calculatedStartDate}
            onChangeText={(value) =>
              updateScheduleEvent(index, { calculatedStartDate: value })
            }
            placeholder="YYYY-MM-DD"
          />
        </View>
        <View className="flex-1">
          <FieldInput
            label={t("plantEvent.form.endDate", "End date")}
            value={event.calculatedEndDate}
            onChangeText={(value) =>
              updateScheduleEvent(index, { calculatedEndDate: value })
            }
            placeholder="YYYY-MM-DD"
          />
        </View>
      </View>

      {isTreatment && (
        <>
          <View className="mt-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
            <Text className="text-xs font-semibold text-amber-800">
              {t(
                "ragChat.reviewer.chemicalHint",
                "Treatment application events should include PHI and PPE safety details.",
              )}
            </Text>
          </View>

          <View className="mt-2 flex-row gap-2">
            <View className="flex-1">
              <FieldInput
                label={t(
                  "plantEvent.form.phiDays",
                  "Pre-harvest interval (days)",
                )}
                value={event.phiDays}
                onChangeText={(value) =>
                  updateScheduleEvent(index, { phiDays: value })
                }
                placeholder="14"
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <FieldInput
                label={t("plantEvent.form.estimatedCost", "Estimated cost")}
                value={event.estimatedCost}
                onChangeText={(value) =>
                  updateScheduleEvent(index, { estimatedCost: value })
                }
                placeholder="500,000 VND"
              />
            </View>
          </View>

          <FieldInput
            label={t("plantEvent.form.ppeRequired", "PPE required")}
            value={event.ppeRequired}
            onChangeText={(value) =>
              updateScheduleEvent(index, { ppeRequired: value })
            }
            placeholder={t(
              "plantEvent.form.ppeRequiredPlaceholder",
              "Gloves, mask, goggles",
            )}
          />

          <FieldInput
            label={t("plantEvent.form.mrlNote", "MRL compliance note")}
            value={event.mrlNote}
            onChangeText={(value) =>
              updateScheduleEvent(index, { mrlNote: value })
            }
            placeholder={t(
              "plantEvent.form.mrlNotePlaceholder",
              "Maximum residue limit notes...",
            )}
            multiline
          />
        </>
      )}

      {!isTreatment && (
        <FieldInput
          label={t("plantEvent.form.estimatedCost", "Estimated cost")}
          value={event.estimatedCost}
          onChangeText={(value) =>
            updateScheduleEvent(index, { estimatedCost: value })
          }
          placeholder="500,000 VND"
        />
      )}

      <EventErrorList errors={eventErrors} />
    </View>
  );
}
