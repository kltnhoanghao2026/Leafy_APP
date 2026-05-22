import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Check,
  ClipboardList,
  Globe,
  Lock,
  Play,
  Plus,
  Trash2,
  X,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";

import { EmptyState } from "@/src/components/ui/EmptyState";
import { SearchInput } from "@/src/components/ui/SearchInput";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { Pagination } from "@/src/components/ui/Pagination";
import { useFilteredList } from "@/src/hooks/useFilteredList";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import { ConfirmDeleteDialog } from "@/src/components/ui/ConfirmDeleteDialog";
import type {
  PlanResponse,
  PlanApplyResponse,
  PlanStatus,
  PlanSourceType,
} from "../schemas/plan.schema";
import {
  STATUS_CHIP_CONFIG,
  SOURCE_TYPE_CHIPS,
  TAB_ACTIVE_COLOR,
  TAB_INACTIVE_COLOR,
} from "./plan.constants";
import { StatusChip } from "./ui/StatusChip";
import { CancelApplyDialog } from "./dialogs/CancelApplyDialog";
import { ApplyPlanPublicSheet } from "./apply-plan/ApplyPlanPublicSheet";
import { PlanCard } from "./PlanCard";
import { PlanApplyCard } from "./PlanApplyCard";
import {
  useMyPlans,
  useMyApplies,
  usePublicPlans,
  useDeletePlanMutation,
  useBulkDeletePlansMutation,
  useUpdateApplyStatusMutation,
  useCancelApplyMutation,
} from "../queries/plan.queries";

const PAGE_SIZE = 20;

type PlanTab = "my" | "applied" | "public";

// ── Plan List Item ────────────────────────────────────────────────────────────
function PlanListItem({
  plan,
  selected,
  onToggleSelect,
  onDelete,
  onApply,
  onPress,
  variant,
  isPublicView,
}: {
  plan: PlanResponse;
  selected: boolean;
  onToggleSelect?: (id: string) => void;
  onDelete?: (plan: PlanResponse) => void;
  onApply?: (plan: PlanResponse) => void;
  onPress: (plan: PlanResponse) => void;
  variant: "list" | "grid";
  isPublicView: boolean;
}) {
  return (
    <PlanCard
      plan={plan}
      selected={selected}
      onToggleSelect={onToggleSelect}
      onDelete={onDelete}
      onApply={onApply}
      onPress={onPress}
      variant={variant}
      isPublicView={isPublicView}
    />
  );
}

// ── Applied Plan List Item ───────────────────────────────────────────────────
function AppliedListItem({
  apply,
  variant,
  onStatusChange,
  onCancel,
  router,
}: {
  apply: PlanApplyResponse;
  variant: "list" | "grid";
  onStatusChange: (applyId: string, status: PlanStatus) => void;
  onCancel: (apply: PlanApplyResponse) => void;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <PlanApplyCard
      apply={apply}
      variant={variant}
      onStatusChange={onStatusChange}
      onCancelApply={onCancel}
      onPress={(item) => router.push(`/plans/apply/${item.id}`)}
    />
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────
export function PlanScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [activeTab, setActiveTab] = useState<PlanTab>("my");
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // ── My plans: filter state ───────────────────────────────────────────────
  const [sourceTypeFilter, setSourceTypeFilter] = useState<PlanSourceType | "">("");

  // ── Applied tab: status filter ─────────────────────────────────────────
  const [applyStatusFilter, setApplyStatusFilter] = useState<PlanStatus | "">("");

  // ── Selection state (my tab only) ──────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatusChip, setBulkStatusChip] = useState<PlanStatus | "">("");

  // ── Delete confirmation ─────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<PlanResponse | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // ── Cancel applied plan ─────────────────────────────────────────────────
  const [cancelTarget, setCancelTarget] = useState<PlanApplyResponse | null>(null);

  // ── Apply dialog (public tab) ───────────────────────────────────────────
  const [applyTarget, setApplyTarget] = useState<PlanResponse | null>(null);

  // ── Queries ─────────────────────────────────────────────────────────────
  const myPlansQuery = useMyPlans({
    page,
    size: PAGE_SIZE,
    sortBy: "createdAt",
    sortDir: "DESC" as const,
    sourceType: sourceTypeFilter || undefined,
  });
  const publicPlansQuery = usePublicPlans({
    page,
    size: PAGE_SIZE,
    sortBy: "createdAt",
    sortDir: "DESC" as const,
    sourceType: sourceTypeFilter || undefined,
  });
  const myAppliesQuery = useMyApplies({
    page,
    size: PAGE_SIZE,
    sortBy: "createdAt",
    sortDir: "DESC" as const,
    status: applyStatusFilter || undefined,
  });

  const deletePlan = useDeletePlanMutation();
  const bulkDeletePlans = useBulkDeletePlansMutation();
  const updateApplyStatus = useUpdateApplyStatusMutation();
  const cancelApply = useCancelApplyMutation();

  // ── Active query / data ──────────────────────────────────────────────────
  const activeQuery =
    activeTab === "my"
      ? myPlansQuery
      : activeTab === "public"
      ? publicPlansQuery
      : myAppliesQuery;

  const paginatedPlans =
    activeTab !== "applied" ? activeQuery.data?.content ?? [] : [];
  const paginatedApplies =
    activeTab === "applied" ? (myAppliesQuery.data?.content ?? []) : [];
  const totalPages = activeQuery.data?.totalPages ?? 0;

  // ── Search ──────────────────────────────────────────────────────────────

  const planItems: PlanResponse[] =
    activeTab === "my"
      ? (myPlansQuery.data?.content ?? [])
      : activeTab === "public"
      ? (publicPlansQuery.data?.content ?? [])
      : [];
  const applyItems: PlanApplyResponse[] = activeTab === "applied"
    ? (myAppliesQuery.data?.content ?? [])
    : [];
  const planFiltered = useFilteredList({
    items: planItems,
    searchQuery,
    fields: [
      (p: PlanResponse) => p.planName ?? "",
      (p: PlanResponse) => p.diseaseName ?? "",
    ],
  });
  const applyFiltered = useFilteredList({
    items: applyItems,
    searchQuery,
    fields: [
      (a: PlanApplyResponse) => a.planId,
      (a: PlanApplyResponse) => a.status,
    ],
  });

  // ── Selection helpers ────────────────────────────────────────────────────
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const allPageSelected =
    paginatedPlans.length > 0 &&
    paginatedPlans.every((p) => selectedIds.has(p.id));

  const handleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedPlans.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds(
        (prev) =>
          new Set([...prev, ...paginatedPlans.map((p) => p.id)]),
      );
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setBulkStatusChip("");
  };

  // ── Delete handlers ──────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePlan.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error?.response?.data?.message || "Không thể xóa kế hoạch này.";
      Alert.alert("Lỗi", message);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await bulkDeletePlans.mutateAsync([...selectedIds]);
      clearSelection();
      setShowBulkDeleteConfirm(false);
    } catch {
      Alert.alert("Lỗi", "Không thể xóa các kế hoạch đã chọn.");
    }
  };

  // ── Status change (applied tab) ────────────────────────────────────────
  const handleStatusChange = (applyId: string, status: PlanStatus) => {
    const apply = paginatedApplies.find((a) => a.id === applyId);
    void updateApplyStatus.mutateAsync({
      applyId,
      status,
      planId: apply?.planId ?? "",
    });
  };

  // ── Tab change ──────────────────────────────────────────────────────────
  const handleTabChange = (tab: PlanTab) => {
    setActiveTab(tab);
    setPage(0);
    setSearchQuery("");
    clearSelection();
  };

  const handleRefresh = () => {
    setPage(0);
    void activeQuery.refetch();
  };

  // ── Reset page on filter change ──────────────────────────────────────────
  // (page changes automatically via dependency in pageParams)

  // ── Empty state messages ────────────────────────────────────────────────
  const emptyTitle =
    activeTab === "public"
      ? searchQuery
        ? t("plan.empty.publicTitle")
        : t("plan.empty.publicTitle")
      : activeTab === "applied"
      ? t("plan.empty.appliedTitle")
      : t("plan.empty.myTitle");

  const emptyMessage =
    activeTab === "public"
      ? t("plan.empty.publicMessage")
      : activeTab === "applied"
      ? t("plan.empty.appliedMessage")
      : t("plan.empty.myMessage");

  const selectedCount = selectedIds.size;

  return (
    <View className="flex-1 bg-white dark:bg-slate-900">
      {/* ── Tab Switcher ── */}
      <View className="px-4 py-2 border-b border-slate-200 dark:border-slate-800">
        <View className="flex-row rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {([
            { key: "my" as const, icon: Lock, label: t("plan.tabs.my") },
            { key: "applied" as const, icon: Play, label: t("plan.tabs.applied") },
            { key: "public" as const, icon: Globe, label: t("plan.tabs.public") },
          ] as const).map(({ key, icon: Icon, label }) => (
            <TouchableOpacity
              key={key}
              onPress={() => handleTabChange(key)}
              style={[
                styles.tabButton,
                activeTab === key ? { backgroundColor: isDark ? "#334155" : "#ffffff", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 } : undefined,
              ]}
            >
              <Icon
                size={16}
                color={activeTab === key ? TAB_ACTIVE_COLOR : TAB_INACTIVE_COLOR}
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === key ? TAB_ACTIVE_COLOR : TAB_INACTIVE_COLOR,
                  },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={activeQuery.isRefetching}
            onRefresh={handleRefresh}
            tintColor="#245A34"
            colors={["#245A34"]}
          />
        }
      >
      
        {/* ── Filter Card ── */}
        <View className="mx-4 mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Search */}
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={
              activeTab === "applied"
                ? t("plan.list.searchAppliedPlaceholder")
                : t("plan.list.searchPlaceholder")
            }
          />

          {/* Status filter — applied tab only */}
          {activeTab === "applied" && (
            <View className="mt-3">
              <Text className="mb-1.5 text-xs font-black uppercase tracking-wide text-slate-500">
                {t("plan.filter.statusLabel", "Trạng thái")}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {STATUS_CHIP_CONFIG.map(({ value, labelKey }) => (
                  <StatusChip
                    key={value || "all"}
                    value={value}
                    current={applyStatusFilter}
                    labelKey={labelKey}
                    onPress={() => {
                      setApplyStatusFilter(value as PlanStatus | "");
                      setPage(0);
                    }}
                    activeClass="border-[#245A34] bg-[#245A34] text-white"
                  />
                ))}
              </View>
            </View>
          )}

          {/* Source type filter */}
          <View className="mt-3">
            <Text className="mb-1.5 text-xs font-black uppercase tracking-wide text-slate-500">
              {t("plan.filter.sourceLabel", "Nguồn")}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {SOURCE_TYPE_CHIPS.map(({ value, labelKey }) => (
                <StatusChip
                  key={value || "all"}
                  value={value}
                  current={sourceTypeFilter}
                  labelKey={labelKey}
                  onPress={() => {
                    setSourceTypeFilter(value as PlanSourceType | "");
                    setPage(0);
                  }}
                  activeClass="border-[#245A34] bg-[#245A34] text-white"
                />
              ))}
            </View>
          </View>
        </View>

        {/* ── My Plans: selection bar ── */}
        {activeTab === "my" &&
          paginatedPlans.length > 0 &&
          !myPlansQuery.isLoading && (
            <View className="mx-4 mt-3">
              <View className="flex-row items-center justify-between px-1">
                <View className="flex-row items-center gap-2.5">
                  {/* Select all checkbox */}
                  <Pressable
                    onPress={handleSelectAll}
                    className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all ${
                      allPageSelected || selectedCount > 0
                        ? "border-[#245A34] bg-[#245A34]"
                        : "border-slate-300 bg-white dark:border-slate-600"
                    }`}
                  >
                    {allPageSelected ? (
                      <Check size={12} color="#ffffff" strokeWidth={3} />
                    ) : selectedCount > 0 ? (
                      <View className="h-1.5 w-1.5 rounded-full bg-white" />
                    ) : null}
                  </Pressable>

                  <Text className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    {selectedCount > 0
                      ? `${selectedCount} / ${paginatedPlans.length} ${t("plan.bulk.pageCount", { count: selectedCount, total: paginatedPlans.length })}`
                      : `${paginatedPlans.length} ${t("plan.list.itemLabel")}`}
                  </Text>

                  {!allPageSelected && selectedCount > 0 && (
                    <TouchableOpacity onPress={handleSelectAll}>
                      <Text className="text-xs font-semibold text-[#245A34]">
                        {t("plan.bulk.selectPage")}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {selectedCount > 0 && (
                  <TouchableOpacity onPress={clearSelection}>
                    <Text className="text-xs font-semibold text-slate-400">
                      {t("plan.bulk.deselectAll")}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Bulk action bar */}
              {selectedCount > 0 && (
                <View className="mt-2 rounded-2xl bg-[#245A34] px-4 py-3 shadow-xl shadow-[#245A34]/20">
                  <View className="flex-row flex-wrap items-center gap-3">
                    <View className="flex-row items-center gap-2">
                      <View className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                        <Check size={12} color="#ffffff" strokeWidth={3} />
                      </View>
                      <Text className="text-sm font-bold text-white">
                        {selectedCount} {t("plan.bulk.selectedCount", { count: selectedCount })}
                      </Text>
                    </View>

                    <View className="h-5 w-px bg-white/20" />

                    <Text className="text-xs font-semibold text-white/60">
                      {t("plan.bulk.bulkStatusChange")}:
                    </Text>

                    <View className="flex-row items-center gap-1 rounded-xl bg-white/10 p-1">
                      {(["PENDING", "APPLYING", "ACTIVE", "COMPLETED"] as PlanStatus[]).map((s) => (
                        <TouchableOpacity
                          key={s}
                          onPress={() =>
                            setBulkStatusChip(bulkStatusChip === s ? "" : s)
                          }
                          className={`rounded-lg px-2 py-1 text-xs font-bold transition-all ${
                            bulkStatusChip === s
                              ? "bg-white text-[#245A34]"
                              : "text-white/80 hover:bg-white/20 hover:text-white"
                          }`}
                        >
                          <Text className={`text-xs font-bold ${bulkStatusChip === s ? "text-[#245A34]" : "text-white/80"}`}>
                            {t(`plan.status.${s}`)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <View className="h-5 w-px bg-white/20" />

                    <TouchableOpacity
                      onPress={() => setShowBulkDeleteConfirm(true)}
                      disabled={bulkDeletePlans.isPending}
                      className="flex-row items-center gap-1.5 rounded-xl bg-red-500/25 px-3 py-1.5"
                    >
                      <Trash2 size={14} color="#ffffff" className="shrink-0" strokeWidth={2.5} />
                      <Text className="text-xs font-bold text-white">
                        {t("plan.bulk.deleteSelected")}
                      </Text>
                    </TouchableOpacity>

                    <View className="ml-auto">
                      <TouchableOpacity
                        onPress={clearSelection}
                        className="rounded-xl p-1.5 text-white/70 transition hover:bg-white/20 hover:text-white"
                      >
                        <X size={16} color="#ffffff" strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

        {/* ── Loading ── */}
        {activeQuery.isLoading && page === 0 ? <LoadingView /> : null}

        {/* ── Error ── */}
        {activeQuery.isError && page === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={t("plan.list.loadFailed")}
            actionLabel={t("common.retry")}
            onAction={() => void activeQuery.refetch()}
          />
        ) : null}

        {/* ── Empty ── */}
        {!activeQuery.isLoading &&
        !activeQuery.isError &&
        (activeTab !== "applied" ? planFiltered.length === 0 : applyFiltered.length === 0) ? (
          <View className="mx-4 mt-6 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <Globe className="mx-auto h-10 w-10 text-slate-300" size={40} />
            <Text className="mt-4 text-xl font-black text-slate-900 dark:text-white">
              {emptyTitle}
            </Text>
            <Text className="mt-2 text-sm font-semibold text-slate-500">
              {emptyMessage}
            </Text>
          </View>
        ) : null}

        {/* ── Plan List (my / public) ── */}
        {!activeQuery.isError ? (
          activeTab !== "applied" ? (
            <View className="mx-4 mt-4 flex-col gap-3">
              {planFiltered.map((item: PlanResponse) => (
                <PlanListItem
                  key={item.id}
                  plan={item}
                  selected={selectedIds.has(item.id)}
                  onToggleSelect={
                    activeTab === "my" ? toggleSelect : undefined
                  }
                  onDelete={
                    activeTab === "my" ? setDeleteTarget : undefined
                  }
                  onApply={
                    activeTab === "public" ? setApplyTarget : undefined
                  }
                  onPress={(p) => router.push(`/plans/${p.id}` as never)}
                  variant="list"
                  isPublicView={activeTab === "public"}
                />
              ))}
            </View>
          ) : (
            /* ── Applied List ── */
            <View className="mx-4 mt-4 flex-col gap-3">
              {applyFiltered.map((item: PlanApplyResponse) => (
                <AppliedListItem
                  key={item.id}
                  apply={item}
                  variant="list"
                  onStatusChange={handleStatusChange}
                  onCancel={setCancelTarget}
                  router={router}
                />
              ))}
            </View>
          )
        ) : null}
      </ScrollView>

      {/* ── Fetching overlay ── */}
      {activeQuery.isFetching && !activeQuery.isLoading && (
        <View className="pointer-events-none absolute bottom-0 left-0 right-0 top-0 z-50 items-center justify-center bg-slate-900/10 dark:bg-black/20">
          <View className="rounded-2xl bg-white p-4 shadow-xl dark:bg-slate-800">
            <ActivityIndicator size="large" color="#10B981" />
          </View>
        </View>
      )}

      {/* ── Pagination Footer ── */}
      {!activeQuery.isError && totalPages > 1 ? (
        <View className="border-t border-slate-200 bg-white pb-4 dark:border-slate-800 dark:bg-slate-950">
          <Pagination
            page={page}
            totalPages={totalPages}
            totalElements={activeQuery.data?.totalElements}
            onPageChange={(p) => {
              setPage(p);
              setSelectedIds(new Set());
            }}
            itemLabel={
              activeTab === "applied"
                ? t("plan.list.itemAppliedLabel")
                : t("plan.list.itemLabel")
            }
          />
        </View>
      ) : null}

      {/* ── FAB: Create Plan — my tab only ── */}
      {activeTab === "my" && (
        <TouchableOpacity
          onPress={() => router.push("/plans/create")}
          className="absolute bottom-24 right-5 z-40 h-14 w-14 items-center justify-center rounded-full bg-[#245A34] shadow-lg"
        >
          <Plus size={24} color="#ffffff" strokeWidth={2.5} />
        </TouchableOpacity>
      )}

      {/* ── Delete single plan dialog ── */}
      {deleteTarget && (
        <ConfirmDeleteDialog
          visible={!!deleteTarget}
          title={t("plan.bulk.deleteConfirmTitle")}
          description={t("plan.bulk.deleteConfirmMessage", {
            name: deleteTarget.diseaseName || deleteTarget.planName || deleteTarget.id,
          })}
          isDeleting={deletePlan.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}

      {/* ── Bulk delete dialog ── */}
      {showBulkDeleteConfirm && (
        <ConfirmDeleteDialog
          visible={showBulkDeleteConfirm}
          title={t("plan.bulk.bulkDeleteConfirmTitle")}
          description={t("plan.bulk.bulkDeleteConfirmMessage", { count: selectedIds.size })}
          isDeleting={bulkDeletePlans.isPending}
          onCancel={() => setShowBulkDeleteConfirm(false)}
          onConfirm={handleBulkDelete}
        />
      )}

      {/* ── Cancel apply dialog ── */}
      {cancelTarget && (
        <CancelApplyDialog
          apply={cancelTarget}
          isCancelling={cancelApply.isPending}
          onClose={() => setCancelTarget(null)}
          onConfirm={async () => {
            await cancelApply.mutateAsync(cancelTarget.id);
            setCancelTarget(null);
          }}
        />
      )}

      {/* ── Apply public plan dialog ── */}
      {applyTarget && (
        <ApplyPlanPublicSheet
          plan={applyTarget}
          onClose={() => setApplyTarget(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 8,
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
