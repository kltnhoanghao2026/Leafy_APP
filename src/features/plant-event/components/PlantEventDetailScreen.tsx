import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState, useEffect } from "react";
import {
  Pencil,
  Calendar,
  ShieldCheck,
  Banknote,
  Info,
  CheckCircle2,
  XCircle,
  BarChart2,
  ShieldAlert,
} from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

import { plantEventApi } from "../api/plant-event.api";
import { usePlantEventById, useDeletePlantEventMutation } from "../queries";
import {
  getEventCategoryColors,
  getEventCategory,
  getEventTypeIcon,
} from "./plant-event.types";
import { PlantEventProgressModal } from "./PlantEventProgressModal";
import { AttachmentGrid, type AttachmentItem } from "./AttachmentGrid";
import { CATEGORY_DOT_COLORS } from "./calendarConstants";
import {
  formatPlantEventAlertDetails,
  getPlantEventDisplayText,
} from "../utils/alertEventDetails";

// ── Helper: section card ──────────────────────────────────────────────────

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <View className="mx-4 mb-3 overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900">
      <View className="flex-row items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <Icon size={15} className="text-slate-500 dark:text-slate-400" />
        <Text className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          {title}
        </Text>
      </View>
      <View className="px-4 py-3">{children}</View>
    </View>
  );
}

function AlertDetailsCard({
  alertDetails,
}: {
  alertDetails: NonNullable<ReturnType<typeof formatPlantEventAlertDetails>>;
}) {
  const toneClass = {
    danger: "border-red-100 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30",
    warning: "border-amber-100 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30",
    info: "border-sky-100 bg-sky-50 dark:border-sky-900/40 dark:bg-sky-950/30",
  };
  const toneTextClass = {
    danger: "text-red-700 dark:text-red-300",
    warning: "text-amber-700 dark:text-amber-300",
    info: "text-sky-700 dark:text-sky-300",
  };

  return (
    <View className="gap-2">
      {alertDetails.message ? (
        <View className="rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-slate-800/70">
          <Text className="text-sm font-medium leading-5 text-slate-700 dark:text-slate-200">
            {alertDetails.message}
          </Text>
        </View>
      ) : null}
      {alertDetails.fields.length > 0 ? (
        <View className="flex-row flex-wrap gap-1.5">
          {alertDetails.fields.map(field => {
            const tone = field.tone ?? "info";
            return (
              <View
                key={`${field.label}:${field.value}`}
                className={`w-[48%] rounded-lg border px-2.5 py-2 ${toneClass[tone]}`}
              >
                <Text className={`text-[10px] font-semibold opacity-75 ${toneTextClass[tone]}`}>
                  {field.label}
                </Text>
                <Text className={`mt-0.5 text-xs font-bold ${toneTextClass[tone]}`}>
                  {field.value}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

// ── Helper: labeled row ───────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (value == null || value === "") return null;
  return (
    <View className="mb-2.5">
      <Text className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </Text>
      <Text className="text-sm text-slate-700 dark:text-slate-200">
        {value}
      </Text>
    </View>
  );
}

function InfoRowNumber({
  label,
  value,
  unit,
}: {
  label: string;
  value?: number | null;
  unit?: string;
}) {
  if (value == null) return null;
  return (
    <View className="mb-2.5">
      <Text className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </Text>
      <Text className="text-sm text-slate-700 dark:text-slate-200">
        {value}
        {unit ? ` ${unit}` : ""}
      </Text>
    </View>
  );
}

// ── Attachments helper ─────────────────────────────────────────────────────────

function EventAttachments({ attachmentIds }: { attachmentIds: string[] }) {
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchUrls = async () => {
      setLoading(true);
      const urls: Record<string, string> = {};
      await Promise.all(
        attachmentIds.map(async (fileId) => {
          try {
            const url = await plantEventApi.getPresignedUrl(fileId);
            if (!cancelled) {
              urls[fileId] = url;
            }
          } catch {
            // Keep empty URL for failed fetches
          }
        }),
      );
      if (!cancelled) {
        setAttachmentUrls(urls);
        setLoading(false);
      }
    };
    fetchUrls();
    return () => {
      cancelled = true;
    };
  }, [attachmentIds]);

  const resolvedAttachments: AttachmentItem[] = attachmentIds.map((fileId) => ({
    fileId,
    url: attachmentUrls[fileId] || "",
  }));

  if (loading) {
    return (
      <View className="py-2">
        <ActivityIndicator size="small" className="text-slate-400" />
      </View>
    );
  }

  return <AttachmentGrid attachments={resolvedAttachments} maxVisible={4} />;
}

// ── Main screen ───────────────────────────────────────────────────────────

export function PlantEventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const [progressVisible, setProgressVisible] = useState(false);

  const { data: event, isLoading, isError } = usePlantEventById(id ?? "");
  const deleteMutation = useDeletePlantEventMutation();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
        <ActivityIndicator size="large" color="#2F7F34" />
      </View>
    );
  }

  if (isError || !event) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-8 dark:bg-slate-950">
        <XCircle size={36} className="mb-3 text-red-400" />
        <Text className="text-center text-base font-semibold text-slate-700 dark:text-slate-200">
          {t("plantEvent.detail.loadFailed")}
        </Text>
      </View>
    );
  }

  const colors = getEventCategoryColors(event.eventType);
  const category = getEventCategory(event.eventType);
  const Icon = getEventTypeIcon(event.eventType);
  const { alertDetails, title, subtitle } = getPlantEventDisplayText(event);

  const hasSafetyData =
    event.phiDays != null || event.ppeRequired || event.mrlNote;
  const hasCostData = event.estimatedCost != null;

  const formatDate = (d?: string | null) => {
    if (!d) return null;
    try {
      return format(new Date(d), "dd MMM yyyy");
    } catch {
      return d;
    }
  };

  const formatDateTime = (d?: string | null) => {
    if (!d) return null;
    try {
      return format(new Date(d), "dd MMM yyyy, HH:mm");
    } catch {
      return d;
    }
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero card ─────────────────────────────────────────── */}
        <View
          className={`mx-4 mt-4 mb-3 overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900`}
        >
          {/* Category accent bar */}
          <View className="h-1 w-full" style={{ backgroundColor: CATEGORY_DOT_COLORS[category] ?? "#94a3b8" }} />

          <View className="flex-row items-start gap-3 px-4 py-4">
            {/* Icon badge */}
            <View
              className={`items-center justify-center rounded-xl p-3 ${colors.bg} ${colors.darkBg}`}
            >
              <Icon size={24} color={CATEGORY_DOT_COLORS[category] ?? "#94a3b8"} />
            </View>

            <View className="flex-1">
              <Text className="text-base font-bold text-slate-800 dark:text-slate-100">
                {title}
              </Text>
              {subtitle ? (
                <Text className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {subtitle}
                </Text>
              ) : null}

              {/* Badges row */}
              <View className="mt-1.5 flex-row flex-wrap gap-1.5">
                <View
                  className={`rounded-lg px-2 py-0.5 ${colors.bg} ${colors.darkBg}`}
                >
                  <Text
                    className={`text-[11px] font-semibold ${colors.text} ${colors.darkText}`}
                  >
                    {t(`plantEvent.eventType.${event.eventType}`)}
                  </Text>
                </View>

                <View
                  className={`rounded-lg px-2 py-0.5 ${colors.bg} ${colors.darkBg}`}
                >
                  <Text
                    className={`text-[11px] font-medium ${colors.text} ${colors.darkText}`}
                  >
                    {t(`plantEvent.category.${category}`)}
                  </Text>
                </View>

                {event.planned ? (
                  <View className="rounded-lg bg-violet-50 px-2 py-0.5 dark:bg-violet-900/20">
                    <Text className="text-[11px] font-semibold text-violet-600 dark:text-violet-400">
                      {t("plantEvent.card.planned")}
                    </Text>
                  </View>
                ) : (
                  <View className="rounded-lg bg-amber-50 px-2 py-0.5 dark:bg-amber-900/20">
                    <Text className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      {t("plantEvent.card.immediate")}
                    </Text>
                  </View>
                )}

                {!event.active && (
                  <View className="rounded-lg bg-slate-100 px-2 py-0.5 dark:bg-slate-700">
                    <Text className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {t("plantEvent.detail.inactive")}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* ── Progress Button ───────────────────────────────────── */}
        {(event.tasks?.length || (event.children && event.children.length > 0)) ? (
          <TouchableOpacity
            className="mx-4 mb-3 flex-row items-center justify-between rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/30"
            onPress={() => setProgressVisible(true)}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-3">
              <View className="rounded-full bg-emerald-50 p-2 dark:bg-emerald-900/30">
                <BarChart2 size={20} className="text-emerald-600 dark:text-emerald-400" />
              </View>
              <View>
                <Text className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {t("plantEvent.card.trackProgress")}
                </Text>
                <Text className="text-[11px] text-slate-500 dark:text-slate-400">
                  {event.tasks?.length ? t("plantEvent.card.tasksCount", { count: event.tasks.length }) : ""}
                  {event.tasks?.length && event.children?.length ? " • " : ""}
                  {event.children?.length ? t("plantEvent.card.childEventsCount", { count: event.children.length }) : ""}
                </Text>
              </View>
            </View>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </TouchableOpacity>
        ) : null}

        {/* ── Dates & Duration ──────────────────────────────────── */}
        <SectionCard
          title={t("plantEvent.detail.datesSection")}
          icon={Calendar}
        >
          <View className="flex-row flex-wrap gap-x-6">
            <InfoRow
              label={t("plantEvent.card.startDate")}
              value={formatDate(event.calculatedStartDate)}
            />
            <InfoRow
              label={t("plantEvent.card.endDate")}
              value={formatDate(event.calculatedEndDate)}
            />
            <InfoRowNumber
              label={t("plantEvent.card.duration")}
              value={event.durationDays}
              unit={t("plantEvent.card.days")}
            />
            <InfoRowNumber
              label={t("plantEvent.detail.daysFromStart")}
              value={event.daysFromStart}
              unit={t("plantEvent.card.days")}
            />
          </View>
        </SectionCard>

        {/* ── Description ───────────────────────────────────────── */}
        {alertDetails ? (
          <SectionCard title={alertDetails.title} icon={ShieldAlert}>
            <AlertDetailsCard alertDetails={alertDetails} />
          </SectionCard>
        ) : event.description ? (
          <SectionCard title={t("plantEvent.card.description")} icon={Info}>
            <Text className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              {event.description}
            </Text>
          </SectionCard>
        ) : null}

        {/* ── Attachments ─────────────────────────────────────── */}
        {event.attachmentIds && event.attachmentIds.length > 0 && (
          <SectionCard title={t("plantEvent.attachments.title", { count: event.attachmentIds.length })} icon={Info}>
            <EventAttachments attachmentIds={event.attachmentIds} />
          </SectionCard>
        )}

        {/* ── Agricultural Safety ───────────────────────────────── */}
        {hasSafetyData && (
          <SectionCard
            title={t("plantEvent.detail.safetySection")}
            icon={ShieldCheck}
          >
            <InfoRowNumber
              label={t("plantEvent.card.phi")}
              value={event.phiDays}
              unit={t("plantEvent.card.days")}
            />
            <InfoRow
              label={t("plantEvent.card.ppe")}
              value={event.ppeRequired}
            />
            <InfoRow label={t("plantEvent.card.mrl")} value={event.mrlNote} />
          </SectionCard>
        )}

        {/* ── Cost ──────────────────────────────────────────────── */}
        {hasCostData && (
          <SectionCard
            title={t("plantEvent.detail.costSection")}
            icon={Banknote}
          >
            <InfoRow
              label={t("plantEvent.card.cost")}
              value={event.estimatedCost}
            />
          </SectionCard>
        )}

        {/* ── Record Info ───────────────────────────────────────── */}
        <SectionCard
          title={t("plantEvent.detail.metaSection")}
          icon={CheckCircle2}
        >
          <View className="flex-row flex-wrap gap-x-6">
            <InfoRow
              label={t("plantEvent.detail.createdAt")}
              value={formatDateTime(event.createdAt)}
            />
            <InfoRow
              label={t("plantEvent.detail.modifiedAt")}
              value={formatDateTime(event.lastModifiedAt)}
            />
            <InfoRow
              label={t("plantEvent.detail.createdBy")}
              value={event.createdBy}
            />
            <InfoRow
              label={t("plantEvent.detail.modifiedBy")}
              value={event.lastModifiedBy}
            />
          </View>
        </SectionCard>
      </ScrollView>

      {/* ── Edit FAB ──────────────────────────────────────────────── */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 flex-row items-center gap-2 rounded-2xl bg-green-700 px-5 py-3 shadow-lg active:bg-green-800"
        onPress={() => router.push(`/(main)/plant-events/edit/${event.id}`)}
        activeOpacity={0.8}
      >
        <Pencil size={16} color="white" />
        <Text className="text-sm font-bold text-white">
          {t("plantEvent.detail.editEvent")}
        </Text>
      </TouchableOpacity>

      <PlantEventProgressModal
        event={event}
        visible={progressVisible}
        onClose={() => setProgressVisible(false)}
        onEdit={(ev) => router.push(`/(main)/plant-events/edit/${ev.id}`)}
        onDelete={(ev) => {
          setProgressVisible(false);
          Alert.alert(
            t("plantEvent.detail.deleteConfirmTitle"),
            t("plantEvent.detail.deleteConfirmMessage", { note: ev.note ?? ev.eventType }),
            [
              { text: t("common.cancel"), style: "cancel" },
              {
                text: t("plantEvent.detail.delete"),
                style: "destructive",
                onPress: () => {
                  deleteMutation.mutate(ev.id, {
                    onSuccess: () => {
                      router.back();
                    },
                  });
                },
              },
            ],
          );
        }}
      />
    </View>
  );
}
