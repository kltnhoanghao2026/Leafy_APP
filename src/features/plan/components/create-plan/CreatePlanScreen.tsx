import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ClipboardList,
  CalendarClock,
  Eye,
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuthContext } from "@/src/features/auth/context/AuthContext";
import { useFarmPlots } from "@/src/features/farm/hooks/useFarmPlots";
import { useCreatePlanMutation } from "../../queries/plan.queries";
import {
  PlanFormState,
  PlanInfoErrors,
  emptyForm,
  emptyEvent,
  type PlanEventScheduleItem,
} from "./create-plan.types";
import { PlanInfoSection } from "./PlanInfoSection";
import { EventScheduleSection } from "./EventScheduleSection";
import { PlanPreviewCalendar } from "./PlanPreviewCalendar";

const DRAFT_KEY = "plan_create_draft";

export default function CreatePlanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ diseaseName?: string }>();

  // Profile & farm plots
  const { profileId } = useAuthContext();
  const ownerProfileId = profileId ?? "";
  const { data: farmPlots } = useFarmPlots(ownerProfileId);

  // Form state
  const [form, setForm] = useState<PlanFormState>(() => emptyForm());
  const [events, setEvents] = useState<PlanEventScheduleItem[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [planErrors, setPlanErrors] = useState<PlanInfoErrors>({});
  const [activeTab, setActiveTab] = useState<"info" | "events" | "preview">(
    "info",
  );

  // Close dropdowns when switching tabs (prevents overlay / touch issues)
  const handleTabChange = (tab: "info" | "events" | "preview") => {
    setActiveTab(tab);
    // force close any dropdown that might stay open
    setForm((prev) => ({ ...prev }));
  };

  // Track if we need to save draft
  const isInitialized = useRef(false);

  // Load draft from storage on mount
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const raw = await AsyncStorage.getItem(DRAFT_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { form: PlanFormState; events: PlanEventScheduleItem[] };
          if (parsed.form) {
            setForm({
              ...emptyForm(),
              ...parsed.form,
              diseaseName: params.diseaseName || parsed.form.diseaseName || "",
            });
          }
          if (parsed.events) {
            setEvents(parsed.events);
          }
        } else if (params.diseaseName) {
          setForm((prev) => ({ ...prev, diseaseName: params.diseaseName! }));
        }
      } catch {
        // ignore
      } finally {
        isInitialized.current = true;
      }
    };
    void loadDraft();
  }, [params.diseaseName]);

  // Persist draft to storage
  useEffect(() => {
    if (!isInitialized.current) return;

    const saveDraft = async () => {
      try {
        await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ form, events }));
      } catch {
        // ignore quota errors
      }
    };
    void saveDraft();
  }, [form, events]);

  const farmPlotOptions = [
    { value: "", label: "-- Tất cả trang trại --" },
    ...(farmPlots ?? []).map((p) => ({ value: p.id, label: p.name })),
  ];

  const updateForm = (field: keyof PlanFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setPlanErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const addEvent = () => setEvents((prev) => [...prev, emptyEvent()]);
  const updateEvent = (
    index: number,
    field: keyof PlanEventScheduleItem,
    value: string | number | undefined,
  ) =>
    setEvents((prev) =>
      prev.map((evt, i) =>
        i === index ? { ...evt, [field]: value } : evt,
      ),
    );
  const removeEvent = (index: number) =>
    setEvents((prev) => prev.filter((_, i) => i !== index));
  const duplicateEvent = (index: number) =>
    setEvents((prev) => {
      const copy = { ...prev[index] };
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
  const moveEvent = (from: number, to: number) =>
    setEvents((prev) => {
      const next = [...prev];
      const [removed] = next.splice(from, 1);
      next.splice(to, 0, removed);
      return next;
    });
  const updateEventFull = (index: number, evt: PlanEventScheduleItem) =>
    setEvents((prev) => prev.map((e, i) => (i === index ? evt : e)));

  // Create plan mutation
  const createPlan = useCreatePlanMutation();

  const handleSubmit = async () => {
    setSubmitError(null);

    // Validate
    const pErr: PlanInfoErrors = {};
    if (!form.diseaseName.trim()) {
      pErr.diseaseName = "Vui lòng nhập tên bệnh / vấn đề.";
    }
    if (Object.keys(pErr).length > 0) {
      setPlanErrors(pErr);
      setActiveTab("info");
      return;
    }

    for (const [i, evt] of events.entries()) {
      if (!evt.eventType) {
        setSubmitError(`Sự kiện #${i + 1}: Vui lòng chọn loại sự kiện.`);
        setActiveTab("events");
        return;
      }
      if (!evt.note?.trim()) {
        setSubmitError(`Sự kiện #${i + 1}: Vui lòng nhập ghi chú.`);
        setActiveTab("events");
        return;
      }
    }

    // Clean events
    const cleanedEvents = events.map((evt) => ({
      eventType: evt.eventType,
      targetType: evt.targetType,
      note: evt.note,
      description: evt.description?.trim() || undefined,
      daysFromStart: evt.daysFromStart,
      durationDays: evt.durationDays,
      estimatedCost: evt.estimatedCost?.trim() || undefined,
      phiDays: evt.phiDays,
      ppeRequired: evt.ppeRequired?.trim() || undefined,
      mrlNote: evt.mrlNote?.trim() || undefined,
      tasks:
        evt.tasks && evt.tasks.length > 0
          ? evt.tasks.map((t) => ({
              title: t.title,
              description: t.description || undefined,
              order: t.order,
              estimatedCost: t.estimatedCost || undefined,
              completed: t.completed ?? false,
            }))
          : undefined,
    }));

    const payload = {
      diseaseName: form.diseaseName.trim(),
      planName: form.planName?.trim() || undefined,
      farmPlotId: form.farmPlotId || undefined,
      source: "documents" as const,
      sourceType: "USER_CREATED" as const,
      severityLevel: form.severityLevel || undefined,
      requiredInputs: form.requiredInputs?.trim()
        ? [form.requiredInputs.trim()]
        : undefined,
      safetyWarnings: form.safetyWarnings?.trim()
        ? [form.safetyWarnings.trim()]
        : undefined,
      successIndicators: form.successIndicators?.trim() || undefined,
      estimatedCost: form.estimatedCost?.trim() || undefined,
      isPublic: form.isPublic,
      schedule: cleanedEvents.length > 0 ? cleanedEvents : undefined,
    };

    try {
      const created = await createPlan.mutateAsync(payload);
      await AsyncStorage.removeItem(DRAFT_KEY);

      const planId = created?.data?.data?.id;
      if (planId) {
        router.replace(`/plans/${planId}`);
      } else {
        router.replace("/plans");
      }
    } catch (err) {
      console.error("[CreatePlanScreen] handleSubmit error:", err);
      setSubmitError("Có lỗi xảy ra khi tạo kế hoạch. Vui lòng thử lại.");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      {/* Tab switcher (mirrors PlanScreen spacing) */}
      <View style={styles.headerWrap}>
        <View style={styles.tabInner}>
          <TouchableOpacity
          onPress={() => handleTabChange("info")}
          style={[
            styles.tabButton,
            activeTab === "info" && styles.tabButtonActive,
          ]}
        >
          <ClipboardList
            size={16}
            color={activeTab === "info" ? "#059669" : "#64748b"}
            strokeWidth={2.5}
          />
          <Text
            style={[
              styles.tabButtonText,
              { color: activeTab === "info" ? "#059669" : "#64748b" },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            Thông tin
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleTabChange("events")}
          style={[
            styles.tabButton,
            activeTab === "events" && styles.tabButtonActive,
          ]}
        >
          <CalendarClock
            size={16}
            color={activeTab === "events" ? "#059669" : "#64748b"}
            strokeWidth={2.5}
          />
          <View style={styles.tabLabelRow}>
            <Text
              style={[
                styles.tabButtonText,
                { color: activeTab === "events" ? "#059669" : "#64748b" },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Lịch trình
            </Text>

            {events.length > 0 && (
              <View
                style={[
                  styles.eventBadge,
                  activeTab === "events"
                    ? { backgroundColor: "rgba(255,255,255,0.22)" }
                    : { backgroundColor: "rgba(36,90,52,0.10)" },
                ]}
              >
                <Text
                  style={[
                    styles.eventBadgeText,
                    { color: activeTab === "events" ? "#059669" : "#245A34" },
                  ]}
                >
                  {events.length}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleTabChange("preview")}
          style={[
            styles.tabButton,
            activeTab === "preview" && styles.tabButtonActive,
          ]}
        >
          <Eye
            size={16}
            color={activeTab === "preview" ? "#059669" : "#64748b"}
            strokeWidth={2.5}
          />
          <Text
            style={[
              styles.tabButtonText,
              { color: activeTab === "preview" ? "#059669" : "#64748b" },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            Xem trước
          </Text>
        </TouchableOpacity>
        </View>
      </View>

      {/* Tab panels */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "info" && (
          <PlanInfoSection
            form={form}
            updateForm={updateForm}
            farmPlotOptions={farmPlotOptions}
            errors={planErrors}
          />
        )}

        {activeTab === "events" && (
          <EventScheduleSection
            events={events}
            onAdd={addEvent}
            onChange={updateEvent}
            onRemove={removeEvent}
            onDuplicate={duplicateEvent}
            onMove={moveEvent}
            onUpdate={updateEventFull}
          />
        )}

        {activeTab === "preview" && (
          <PlanPreviewCalendar draftEvents={events} />
        )}
      </ScrollView>

      {/* Error message */}
      {submitError && (
        <View style={styles.errorMessage}>
          <Text style={styles.errorText}>{submitError}</Text>
        </View>
      )}

      {/* Bottom action bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelButtonText}>Huỷ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={createPlan.isPending}
          style={styles.submitButton}
        >
          {createPlan.isPending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <ClipboardList size={16} color="#ffffff" strokeWidth={2.5} />
              <Text style={styles.submitButtonText}>
                Tạo kế hoạch
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  headerWrap: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  tabInner: {
    flexDirection: "row",
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    minHeight: 40,
  },
  tabButtonActive: {
    backgroundColor: "#ffffff",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  tabLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "700",
    flexShrink: 1,
  },
  eventBadge: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  eventBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
  },
  errorMessage: {
    position: "absolute",
    bottom: 96,
    left: 16,
    right: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#b91c1c",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  cancelButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    backgroundColor: "#245A34",
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
});
