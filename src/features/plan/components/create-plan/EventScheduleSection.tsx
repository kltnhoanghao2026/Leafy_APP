import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import {
  Plus,
  Trash2,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCircle2,
  Circle,
  List,
  LayoutGrid,
} from "lucide-react-native";
import { Calendar } from "react-native-calendars";
import { format, addDays, parseISO, isValid } from "date-fns";
import { EventTypePickerModal } from "@/src/features/plant-event/components/EventTypePickerModal";
import {
  CATEGORY_DOT_COLORS,
  getEventCategory,
} from "@/src/features/plant-event/components/calendarConstants";
import {
  EVENT_TYPE_LABELS,
  getEventTypeIcon,
} from "@/src/features/plant-event/components/plant-event.types";
import type { EventTaskRequest } from "@/src/features/plant-event/components/plant-event.types";
import type { PlanEventScheduleItem } from "./create-plan.types";

// ── Constants ─────────────────────────────────────────────────────────────────

const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  IRRIGATION: { bg: "bg-blue-50", text: "text-blue-700" },
  NUTRITION: { bg: "bg-amber-50", text: "text-amber-700" },
  WEED_CONTROL: { bg: "bg-orange-50", text: "text-orange-700" },
  PRUNING: { bg: "bg-purple-50", text: "text-purple-700" },
  SCOUTING: { bg: "bg-slate-100", text: "text-slate-600" },
  DISEASE_DETECTED: { bg: "bg-red-50", text: "text-red-700" },
  TREATMENT_APPLICATION: { bg: "bg-green-50", text: "text-green-700" },
  QUARANTINE: { bg: "bg-rose-50", text: "text-rose-700" },
  HEALTH_RECOVERY: { bg: "bg-emerald-50", text: "text-emerald-700" },
  PHENOLOGY: { bg: "bg-teal-50", text: "text-teal-700" },
  REPOT: { bg: "bg-violet-50", text: "text-violet-700" },
  HARVEST: { bg: "bg-lime-50", text: "text-lime-700" },
};

// ── Event Row ──────────────────────────────────────────────────────────────────

interface EventRowProps {
  index: number;
  total: number;
  event: PlanEventScheduleItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onChange: (field: keyof PlanEventScheduleItem, value: string | number | undefined) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdate: (event: PlanEventScheduleItem) => void;
}

function EventRow({
  index,
  total,
  event,
  isExpanded,
  onToggleExpand,
  onChange,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onUpdate,
}: EventRowProps) {
  const typeColors = EVENT_TYPE_COLORS[event.eventType] ?? {
    bg: "bg-slate-100",
    text: "text-slate-500",
  };
  const TypeIcon = getEventTypeIcon(event.eventType);

  return (
    <View className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      {/* Compact header row */}
      <View className="flex-row items-center gap-2 px-3 py-2.5">
        {/* Reorder buttons */}
        <View className="flex shrink-0 flex-col">
          <TouchableOpacity
            onPress={onMoveUp}
            disabled={index === 0}
            className={`flex h-5 w-5 items-center justify-center rounded ${
              index === 0 ? "opacity-25" : ""
            }`}
          >
            <ChevronUp
              size={14}
              color={index === 0 ? "#cbd5e1" : "#64748b"}
              strokeWidth={2.5}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onMoveDown}
            disabled={index === total - 1}
            className={`flex h-5 w-5 items-center justify-center rounded ${
              index === total - 1 ? "opacity-25" : ""
            }`}
          >
            <ChevronDown
              size={14}
              color={index === total - 1 ? "#cbd5e1" : "#64748b"}
              strokeWidth={2.5}
            />
          </TouchableOpacity>
        </View>

        {/* Index badge */}
        <View className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#245A34]/10">
          <Text className="text-[10px] font-black text-[#245A34]">
            {index + 1}
          </Text>
        </View>

        {/* Summary — click to expand/collapse */}
        <TouchableOpacity
          onPress={onToggleExpand}
          className="flex min-w-0 flex-1 flex-row items-center gap-2"
        >
          {event.eventType ? (
            <View className={`shrink-0 flex-row items-center gap-1 rounded-full px-2 py-0.5 ${typeColors.bg}`}>
              <TypeIcon size={10} color={typeColors.text.replace("text-", "#")} />
              <Text className={`text-[10px] font-black ${typeColors.text}`}>
                {EVENT_TYPE_LABELS[event.eventType]}
              </Text>
            </View>
          ) : (
            <View className="rounded-full bg-slate-100 px-2 py-0.5">
              <Text className="text-[10px] font-black text-slate-400">
                Chưa chọn loại
              </Text>
            </View>
          )}

          <Text
            className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-500"
            numberOfLines={1}
          >
            {event.note?.trim() || (
              <Text className="italic text-slate-300">Chưa có ghi chú</Text>
            )}
          </Text>

          {/* Timing chips */}
          <View className="flex shrink-0 flex-row items-center gap-1">
            {event.daysFromStart != null && (
              <View className="rounded-md bg-slate-50 px-1.5 py-0.5 ring-1 ring-slate-100">
                <Text className="text-[10px] font-bold text-slate-400">
                  +{event.daysFromStart}d
                </Text>
              </View>
            )}
            {event.durationDays != null && (
              <View className="rounded-md bg-slate-50 px-1.5 py-0.5 ring-1 ring-slate-100">
                <Text className="text-[10px] font-bold text-slate-400">
                  {event.durationDays}d
                </Text>
              </View>
            )}
          </View>

          {isExpanded ? (
            <ChevronUp size={14} color="#64748b" strokeWidth={2.5} />
          ) : (
            <ChevronDown size={14} color="#64748b" strokeWidth={2.5} />
          )}
        </TouchableOpacity>

        {/* Duplicate */}
        <TouchableOpacity
          onPress={onDuplicate}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
        >
          <Copy size={14} color="#64748b" strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Delete */}
        <TouchableOpacity
          onPress={onRemove}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
        >
          <Trash2 size={14} color="#64748b" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Expanded detail form */}
      {isExpanded && (
        <View className="gap-3 border-t border-slate-100 bg-slate-50/50 p-4">
          {/* Event Type */}
          <View>
            <Text className="mb-1.5 text-xs font-bold text-slate-700">
              Loại sự kiện <Text className="text-red-500">*</Text>
            </Text>
            <TouchableOpacity
              className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5"
              onPress={() => onUpdate({ ...event, _showTypePicker: true } as PlanEventScheduleItem & { _showTypePicker?: boolean })}
            >
              <Text
                className={`text-sm ${
                  event.eventType ? "text-slate-700" : "text-slate-400"
                }`}
              >
                {EVENT_TYPE_LABELS[event.eventType] || "-- Chọn loại --"}
              </Text>
              <ChevronDown size={16} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Note */}
          <View>
            <Text className="mb-1.5 text-xs font-bold text-slate-700">
              Ghi chú <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              value={event.note ?? ""}
              onChangeText={(text) => onChange("note", text)}
              placeholder="VD: Phun thuốc gốc đồng..."
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* Description */}
          <View>
            <Text className="mb-1.5 text-xs font-bold text-slate-700">
              Mô tả chi tiết (tuỳ chọn)
            </Text>
            <TextInput
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              value={event.description ?? ""}
              onChangeText={(text) => onChange("description", text)}
              placeholder="Hướng dẫn thực hiện, liều lượng, lưu ý..."
              placeholderTextColor="#94a3b8"
              multiline
            />
          </View>

          {/* Days from start and duration */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="mb-1.5 text-xs font-bold text-slate-700">
                Bắt đầu sau (ngày)
              </Text>
              <TextInput
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                value={event.daysFromStart?.toString() ?? ""}
                onChangeText={(text) =>
                  onChange(
                    "daysFromStart",
                    text === "" ? undefined : parseInt(text, 10),
                  )
                }
                placeholder="VD: 3"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
              />
            </View>
            <View className="flex-1">
              <Text className="mb-1.5 text-xs font-bold text-slate-700">
                Thời lượng (ngày)
              </Text>
              <TextInput
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                value={event.durationDays?.toString() ?? ""}
                onChangeText={(text) =>
                  onChange(
                    "durationDays",
                    text === "" ? undefined : parseInt(text, 10),
                  )
                }
                placeholder="VD: 7"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Estimated cost */}
          <View>
            <Text className="mb-1.5 text-xs font-bold text-slate-700">
              Chi phí ước tính (tuỳ chọn)
            </Text>
            <TextInput
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              value={event.estimatedCost ?? ""}
              onChangeText={(text) => onChange("estimatedCost", text)}
              placeholder="VD: 200.000 VNĐ"
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* PHI and PPE */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="mb-1.5 text-xs font-bold text-slate-700">
                Khoảng cách an toàn - PHI (ngày)
              </Text>
              <TextInput
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                value={event.phiDays?.toString() ?? ""}
                onChangeText={(text) =>
                  onChange(
                    "phiDays",
                    text === "" ? undefined : parseInt(text, 10),
                  )
                }
                placeholder="VD: 7"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
              />
            </View>
            <View className="flex-1">
              <Text className="mb-1.5 text-xs font-bold text-slate-700">
                PPE bắt buộc (tuỳ chọn)
              </Text>
              <TextInput
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                value={event.ppeRequired ?? ""}
                onChangeText={(text) => onChange("ppeRequired", text)}
                placeholder="VD: Găng tay, khẩu trang..."
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          {/* MRL Note */}
          <View>
            <Text className="mb-1.5 text-xs font-bold text-slate-700">
              Giới hạn tồn dư tối đa - MRL (tuỳ chọn)
            </Text>
            <TextInput
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              value={event.mrlNote ?? ""}
              onChangeText={(text) => onChange("mrlNote", text)}
              placeholder="VD: MRL ≤ 0.01 mg/kg theo Codex..."
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* Tasks sub-form */}
          <View className="rounded-2xl border border-slate-200 bg-white p-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-[11px] font-black uppercase tracking-wide text-slate-600">
                  Danh sách công việc
                </Text>
                {(event.tasks ?? []).length > 0 && (
                  <View className="rounded-full bg-[#245A34]/10 px-1.5 py-0.5">
                    <Text className="text-[10px] font-black text-[#245A34]">
                      {(event.tasks ?? []).filter((t) => t.completed).length}/
                      {(event.tasks ?? []).length}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                className="flex-row items-center gap-1 rounded-xl border border-[#245A34] px-2.5 py-1"
                onPress={() => {
                  const tasks: EventTaskRequest[] = [
                    ...(event.tasks ?? []),
                    { title: "", completed: false },
                  ];
                  onUpdate({ ...event, tasks });
                }}
              >
                <Plus size={12} color="#245A34" strokeWidth={2.5} />
                <Text className="text-[10px] font-bold text-[#245A34]">
                  Thêm công việc
                </Text>
              </TouchableOpacity>
            </View>

            {(event.tasks ?? []).length === 0 ? (
              <View className="mt-2 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-4">
                <Text className="text-[11px] font-medium text-slate-400">
                  Chưa có công việc nào. Nhấn {"\"Thêm công việc\""} để bắt đầu.
                </Text>
              </View>
            ) : (
              <View className="mt-2 gap-1.5">
                {(event.tasks ?? []).map((task, ti) => (
                  <View
                    key={ti}
                    className={`flex-row items-start gap-2 rounded-xl border p-2 ${
                      task.completed
                        ? "border-emerald-100 bg-emerald-50/30"
                        : "border-slate-100 bg-white"
                    }`}
                  >
                    {/* Completed toggle */}
                    <TouchableOpacity
                      onPress={() => {
                        const tasks = (event.tasks ?? []).map((t, j) =>
                          j === ti ? { ...t, completed: !t.completed } : t,
                        );
                        onUpdate({ ...event, tasks });
                      }}
                      className="mt-1 shrink-0"
                    >
                      {task.completed ? (
                        <CheckCircle2 size={16} color="#10b981" />
                      ) : (
                        <Circle size={16} color="#cbd5e1" />
                      )}
                    </TouchableOpacity>

                    {/* Fields */}
                    <View className="flex-1 gap-1">
                      <TextInput
                        value={task.title}
                        onChangeText={(text) => {
                          const tasks = (event.tasks ?? []).map((t, j) =>
                            j === ti ? { ...t, title: text } : t,
                          );
                          onUpdate({ ...event, tasks });
                        }}
                        placeholder="Tiêu đề công việc *"
                        placeholderTextColor="#94a3b8"
                        className={`rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] ${
                          task.completed ? "text-slate-400 line-through" : "text-slate-700"
                        }`}
                      />
                      <TextInput
                        value={task.description ?? ""}
                        onChangeText={(text) => {
                          const tasks = (event.tasks ?? []).map((t, j) =>
                            j === ti
                              ? { ...t, description: text || undefined }
                              : t,
                          );
                          onUpdate({ ...event, tasks });
                        }}
                        placeholder="Mô tả (tuỳ chọn)"
                        placeholderTextColor="#94a3b8"
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-700"
                      />
                      <TextInput
                        value={task.estimatedCost ?? ""}
                        onChangeText={(text) => {
                          const tasks = (event.tasks ?? []).map((t, j) =>
                            j === ti
                              ? { ...t, estimatedCost: text || undefined }
                              : t,
                          );
                          onUpdate({ ...event, tasks });
                        }}
                        placeholder="Chi phí ước tính (tuỳ chọn)"
                        placeholderTextColor="#94a3b8"
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-700"
                      />
                    </View>

                    {/* Delete */}
                    <TouchableOpacity
                      onPress={() => {
                        const tasks = (event.tasks ?? []).filter(
                          (_, j) => j !== ti,
                        );
                        onUpdate({ ...event, tasks });
                      }}
                      className="mt-0.5 shrink-0 rounded-lg p-1.5"
                    >
                      <Trash2 size={14} color="#64748b" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      {/* Type picker modal */}
      {"_showTypePicker" in event && event._showTypePicker && (
        <EventTypePickerModal
          visible={true}
          selectedEventType={event.eventType}
          onClose={() => onUpdate({ ...event, _showTypePicker: false } as PlanEventScheduleItem & { _showTypePicker?: boolean })}
          onSelect={(eventType) => {
            onUpdate({
              ...event,
              eventType,
              _showTypePicker: false,
            } as PlanEventScheduleItem & { _showTypePicker?: boolean });
          }}
        />
      )}
    </View>
  );
}

// ── EventScheduleSection ──────────────────────────────────────────────────────

interface EventScheduleSectionProps {
  events: PlanEventScheduleItem[];
  onAdd: () => void;
  onChange: (
    index: number,
    field: keyof PlanEventScheduleItem,
    value: string | number | undefined,
  ) => void;
  onRemove: (index: number) => void;
  onDuplicate: (index: number) => void;
  onMove: (from: number, to: number) => void;
  onUpdate: (index: number, event: PlanEventScheduleItem) => void;
}

export function EventScheduleSection({
  events,
  onAdd,
  onChange,
  onRemove,
  onDuplicate,
  onMove,
  onUpdate,
}: EventScheduleSectionProps) {
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [expandedList, setExpandedList] = useState<boolean[]>([]);

  // Keep expandedList in sync
  const syncedExpandedList = (() => {
    if (expandedList.length === events.length) return expandedList;
    return Array.from({ length: events.length }, (_, i) => expandedList[i] ?? false);
  })();

  const handleAdd = () => {
    onAdd();
    setExpandedList((prev) => [...prev, true]);
  };

  const handleRemove = (index: number) => {
    onRemove(index);
    setExpandedList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDuplicate = (index: number) => {
    onDuplicate(index);
    setExpandedList((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, false);
      return next;
    });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    onMove(index, index - 1);
    setExpandedList((prev) => {
      const next = [...prev];
      [next[index], next[index - 1]] = [next[index - 1], next[index]];
      return next;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === events.length - 1) return;
    onMove(index, index + 1);
    setExpandedList((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const toggleExpanded = (index: number) => {
    setExpandedList((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  return (
    <View className="flex flex-col gap-0 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      {/* Header */}
      <View className="mb-4 flex-row flex-wrap items-center justify-between gap-2">
        <View className="flex-row items-center gap-2">
          <CalendarClock size={16} color="#245A34" strokeWidth={2.5} />
          <Text className="text-sm font-black text-slate-900">
            Lịch trình sự kiện
          </Text>
          {events.length > 0 && (
            <View className="rounded-full bg-[#245A34]/10 px-2 py-0.5">
              <Text className="text-[11px] font-black text-[#245A34]">
                {events.length}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row items-center gap-2">
          {/* View mode toggle */}
          <View className="flex-row rounded-xl bg-slate-100 p-0.5">
            <TouchableOpacity
              onPress={() => setViewMode("list")}
              className={`flex-row items-center gap-1 rounded-[10px] px-2.5 py-1.5 ${
                viewMode === "list" ? "bg-white shadow-sm" : ""
              }`}
            >
              <List
                size={14}
                color={viewMode === "list" ? "#245A34" : "#64748b"}
                strokeWidth={2.5}
              />
              <Text
                className={`text-xs font-bold ${
                  viewMode === "list" ? "text-[#245A34]" : "text-slate-500"
                }`}
              >
                Danh sách
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode("calendar")}
              className={`flex-row items-center gap-1 rounded-[10px] px-2.5 py-1.5 ${
                viewMode === "calendar" ? "bg-white shadow-sm" : ""
              }`}
            >
              <LayoutGrid
                size={14}
                color={viewMode === "calendar" ? "#245A34" : "#64748b"}
                strokeWidth={2.5}
              />
              <Text
                className={`text-xs font-bold ${
                  viewMode === "calendar" ? "text-[#245A34]" : "text-slate-500"
                }`}
              >
                Lịch
              </Text>
            </TouchableOpacity>
          </View>

          {viewMode === "list" && (
            <TouchableOpacity
              onPress={handleAdd}
              className="flex-row items-center gap-1.5 rounded-xl border border-[#245A34] px-3 py-1.5"
            >
              <Plus size={14} color="#245A34" strokeWidth={2.5} />
              <Text className="text-xs font-bold text-[#245A34]">
                Thêm sự kiện
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Calendar View */}
      {viewMode === "calendar" ? (
        <CalendarView
          events={events}
          onUpdate={onUpdate}
          onRemove={handleRemove}
        />
      ) : events.length === 0 ? (
        /* Empty state */
        <View className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12">
          <CalendarClock size={40} color="#cbd5e1" strokeWidth={1.5} />
          <Text className="mt-3 text-sm font-semibold text-slate-500">
            Chưa có sự kiện nào trong lịch trình.
          </Text>
          <Text className="mt-1 text-xs font-medium text-slate-400">
            Nhấn {"\"Thêm sự kiện\""} để tạo lịch tưới nước, bón phân, phun thuốc...
          </Text>
        </View>
      ) : (
        <View className="flex flex-col gap-2">
          {events.map((evt, i) => (
            <EventRow
              key={i}
              index={i}
              total={events.length}
              event={evt}
              isExpanded={syncedExpandedList[i] ?? false}
              onToggleExpand={() => toggleExpanded(i)}
              onChange={(field, value) => onChange(i, field, value)}
              onRemove={() => handleRemove(i)}
              onDuplicate={() => handleDuplicate(i)}
              onMoveUp={() => handleMoveUp(i)}
              onMoveDown={() => handleMoveDown(i)}
              onUpdate={(event) => onUpdate(i, event)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ── Calendar View ─────────────────────────────────────────────────────────────

interface CalendarViewProps {
  events: PlanEventScheduleItem[];
  onUpdate: (index: number, event: PlanEventScheduleItem) => void;
  onRemove: (index: number) => void;
}

function CalendarView({ events, onUpdate, onRemove }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Build marked dates
  const markedDates = (() => {
    const marks: Record<
      string,
      { dots?: { key: string; color: string }[]; selected?: boolean; selectedColor?: string }
    > = {};

    const today = new Date();
    events.forEach((evt, index) => {
      if (evt.daysFromStart == null) return;

      const startDate = addDays(today, evt.daysFromStart);
      const endDate =
        evt.durationDays != null && evt.durationDays > 0
          ? addDays(startDate, evt.durationDays - 1)
          : startDate;

      const color = evt.eventType
        ? CATEGORY_DOT_COLORS[getEventCategory(evt.eventType)]
        : "#22c55e";

      for (
        let day = new Date(startDate);
        day <= endDate;
        day = addDays(day, 1)
      ) {
        const key = format(day, "yyyy-MM-dd");
        if (!marks[key]) {
          marks[key] = { dots: [] };
        }

        const hasDot = marks[key].dots?.some((dot) => dot.color === color);
        if (!hasDot) {
          marks[key].dots = [
            ...(marks[key].dots ?? []),
            { key: `${key}-${color}`, color },
          ];
        }
      }
    });

    // Mark selected date
    if (!marks[selectedDate]) {
      marks[selectedDate] = {};
    }
    marks[selectedDate].selected = true;
    marks[selectedDate].selectedColor = "#2F7F34";

    return marks;
  })();

  // Events on selected date
  const eventsOnDate = events.filter((evt) => {
    if (evt.daysFromStart == null) return false;

    const today = new Date();
    const startDate = addDays(today, evt.daysFromStart);
    const endDate =
      evt.durationDays != null && evt.durationDays > 0
        ? addDays(startDate, evt.durationDays - 1)
        : startDate;

    const selected = parseISO(selectedDate);
    return selected >= startDate && selected <= endDate;
  });

  return (
    <View className="flex flex-col gap-3">
      {/* Calendar */}
      <View className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <View className="flex-row items-center justify-between px-3 pt-3 pb-1">
          <Text className="text-sm font-bold text-slate-800 capitalize">
            {format(calendarMonth, "MMMM yyyy")}
          </Text>
        </View>
        <Calendar
          current={format(calendarMonth, "yyyy-MM-dd")}
          markedDates={markedDates}
          markingType="multi-dot"
          hideArrows
          hideExtraDays
          renderHeader={() => null}
          onMonthChange={(month: { dateString: string }) => {
            const parsed = parseISO(month.dateString);
            if (isValid(parsed)) {
              setCalendarMonth(parsed);
            }
          }}
          onDayPress={(day: { dateString: string }) =>
            setSelectedDate(day.dateString)
          }
          theme={{
            backgroundColor: "transparent",
            calendarBackground: "transparent",
            textSectionTitleColor: "#64748b",
            selectedDayBackgroundColor: "#2F7F34",
            selectedDayTextColor: "#FFFFFF",
            todayTextColor: "#2F7F34",
            dayTextColor: "#1e293b",
            textDisabledColor: "#cbd5e1",
            dotColor: "#2F7F34",
            arrowColor: "#2F7F34",
            monthTextColor: "#1e293b",
            textDayFontWeight: "500",
            textMonthFontWeight: "700",
            textDayHeaderFontWeight: "600",
            textDayFontSize: 14,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 12,
          }}
          style={{ paddingHorizontal: 4, paddingBottom: 8 }}
        />
      </View>

      {/* Events on selected date */}
      <Text className="text-xs font-bold text-slate-700">
        Sự kiện trong ngày ({eventsOnDate.length})
      </Text>
      {eventsOnDate.length === 0 ? (
        <View className="items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-6">
          <Text className="text-xs text-slate-400">
            Không có sự kiện trong ngày này
          </Text>
        </View>
      ) : (
        eventsOnDate.map((evt, i) => {
          const eventIndex = events.indexOf(evt);
          const typeColors = EVENT_TYPE_COLORS[evt.eventType] ?? {
            bg: "bg-slate-100",
            text: "text-slate-500",
          };

          return (
            <View
              key={eventIndex}
              className="flex-row items-center justify-between rounded-xl border border-slate-100 bg-white p-3"
            >
              <View className="flex-row items-center gap-2">
                <View
                  className={`shrink-0 rounded-full px-2 py-0.5 ${typeColors.bg}`}
                >
                  <Text className={`text-[10px] font-black ${typeColors.text}`}>
                    {EVENT_TYPE_LABELS[evt.eventType]}
                  </Text>
                </View>
                <Text className="text-sm text-slate-700">{evt.note}</Text>
              </View>
              <TouchableOpacity
                onPress={() => onRemove(eventIndex)}
                className="p-1.5"
              >
                <Trash2 size={14} color="#64748b" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </View>
  );
}
