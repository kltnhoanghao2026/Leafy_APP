import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "expo-router";
import { Clock, ChevronRight, X, ChevronDown, Leaf, Calendar } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { MotiView } from "moti";

import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import { apiClient } from "@/src/lib/axios";
import { API_ENDPOINTS } from "@/src/lib/routes";
import { usePlants } from "@/src/features/plant";
import type { PlantResponse } from "@/src/features/plant";
import {
  useDiagnosisRequests,
  useDiagnosisResults,
  useDiagnosisResultByRequest,
  useUpdateRequestPlantMutation,
} from "../api/useDiagnosisHistory";
import { getDiseaseLabel, getConfidenceColor, commonShadow } from "./predict.utils";

function formatTimestamp(ts?: string) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString();
}

const getPlantName = (plant: PlantResponse) =>
  plant.nickName || plant.plantNumber || plant.tagCode || plant.id;

// ── Diagnosis Image Thumbnail Component ─────────────────────────────
function DiagnosisImage({ fileId, imageFileName }: { fileId?: string | null; imageFileName?: string }) {
  const { data: presignedUrl } = useQuery({
    queryKey: ["diagnosis-image", "presigned", fileId || imageFileName],
    queryFn: async () => {
      const key = fileId || imageFileName;
      if (!key) return null;
      const response = await apiClient.get<{ data: string }>(
        API_ENDPOINTS.FILES.PRESIGNED_URL(key),
        { params: { expirationMinutes: 60 * 24 * 7 } }
      );
      return response.data.data;
    },
    enabled: !!(fileId || imageFileName),
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  });

  if (!presignedUrl) {
    return <View style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.06)" }} />;
  }

  return (
    <Image
      source={{ uri: presignedUrl }}
      style={{ width: "100%", height: "100%" }}
      resizeMode="cover"
    />
  );
}

export default function DiagnosisHistoryScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const scheme = useColorScheme() ?? "light";
  const palette = Colors[scheme];

  const [page] = useState(0);
  const [size] = useState(20);

  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [plantPickerOpen, setPlantPickerOpen] = useState(false);

  const requestsQuery = useDiagnosisRequests(page, size, true);
  const resultsQuery = useDiagnosisResults(0, 100, true);
  const resultQuery = useDiagnosisResultByRequest(selectedRequestId ?? undefined, detailOpen);
  const plantsQuery = usePlants(
    { page: 0, size: 100, sortBy: "createdAt", sortDir: "DESC" },
    true
  );

  const updatePlantMutation = useUpdateRequestPlantMutation();

  const requests = useMemo(() => {
    const data = requestsQuery.data?.data;
    if (data && typeof data === "object") {
      if ("content" in data && Array.isArray(data.content)) {
        return data.content;
      }
      if ("items" in data && Array.isArray(data.items)) {
        return data.items;
      }
    }
    return Array.isArray(data) ? data : [];
  }, [requestsQuery.data?.data]);

  const results = useMemo(() => {
    const data = resultsQuery.data?.data;
    if (data && typeof data === "object") {
      if ("content" in data && Array.isArray(data.content)) {
        return data.content;
      }
    }
    return Array.isArray(data) ? data : [];
  }, [resultsQuery.data?.data]);

  const resultsMap = useMemo(() => {
    return new Map(results.map((item) => [item.diagnoseRequestId, item]));
  }, [results]);

  const plants = useMemo(() => plantsQuery.data?.content ?? [], [plantsQuery.data?.content]);

  const selectedRequest = useMemo(() => {
    return requests.find((r) => r.diagnoseRequestId === selectedRequestId);
  }, [requests, selectedRequestId]);

  const linkedPlant = useMemo(() => {
    if (!selectedRequest?.plantId) return null;
    return plants.find((p) => p.id === selectedRequest.plantId);
  }, [plants, selectedRequest?.plantId]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("diseaseDetection.historyTitle", "Lịch sử chẩn đoán"),
    });
  }, [navigation, t]);

  const handleAppointPlant = (plantId: string | null) => {
    if (!selectedRequestId) return;
    updatePlantMutation.mutate(
      { requestId: selectedRequestId, plantId },
      {
        onSuccess: () => {
          setPlantPickerOpen(false);
        },
        onError: () => {
          Alert.alert(
            t("common.error", "Lỗi"),
            t("diseaseDetection.appointFailed", "Không thể gắn cây trồng. Vui lòng thử lại.")
          );
        },
      }
    );
  };

  const cardBg = scheme === "dark" ? "rgba(30,41,59,0.8)" : "#FFFFFF";
  const borderColor =
    scheme === "dark" ? "rgba(71,85,105,0.4)" : "rgba(226,232,240,1)";

  return (
    <View style={{ flex: 1, backgroundColor: scheme === "dark" ? "#0F172A" : "#F8FAFC" }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Widget */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: `${palette.primary}18`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Clock size={20} color={palette.primary} strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: "900", color: palette.text }}>
              {t("diseaseDetection.historyTitle", "Lịch sử chẩn đoán")}
            </Text>
            <Text
              style={{
                marginTop: 2,
                fontSize: 12,
                fontWeight: "600",
                color: palette.tabIconDefault,
              }}
            >
              {t(
                "diseaseDetection.historyDesc",
                "Quản lý lịch sử chẩn đoán và gắn bệnh với cây trồng."
              )}
            </Text>
          </View>
        </View>

        {requestsQuery.isLoading ? (
          <View style={{ paddingVertical: 40 }}>
            <ActivityIndicator color={palette.primary} size="large" />
          </View>
        ) : requestsQuery.isError ? (
          <View
            style={{
              padding: 16,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "rgba(239,68,68,0.25)",
              backgroundColor:
                scheme === "dark" ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.06)",
            }}
          >
            <Text
              style={{
                color: scheme === "dark" ? "#FCA5A5" : "#B91C1C",
                fontSize: 13,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              {t("diseaseDetection.historyLoadFailed", "Tải lịch sử chẩn đoán thất bại.")}
            </Text>
          </View>
        ) : requests.length === 0 ? (
          <View
            style={[
              {
                backgroundColor: cardBg,
                borderRadius: 24,
                borderWidth: 1,
                borderColor,
                padding: 40,
                alignItems: "center",
                justifyContent: "center",
              },
              commonShadow,
            ]}
          >
            <Clock size={40} color={palette.tabIconDefault} style={{ marginBottom: 12 }} />
            <Text
              style={{
                color: palette.text,
                fontSize: 15,
                fontWeight: "800",
                textAlign: "center",
              }}
            >
              {t("diseaseDetection.historyEmpty", "Chưa có lịch sử chẩn đoán")}
            </Text>
            <Text
              style={{
                color: palette.tabIconDefault,
                fontSize: 12,
                fontWeight: "600",
                textAlign: "center",
                marginTop: 4,
              }}
            >
              Thực hiện chẩn đoán lá cây và kết quả sẽ hiển thị ở đây.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {requests.map((r, index) => {
              const requestPlant = plants.find((p) => p.id === r.plantId);
              const result = resultsMap.get(r.diagnoseRequestId);
              const topPrediction = result?.result?.[0];

              return (
                <MotiView
                  key={r.diagnoseRequestId}
                  from={{ opacity: 0, translateY: 15 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: "timing", duration: 400, delay: index * 40 }}
                >
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      setSelectedRequestId(r.diagnoseRequestId);
                      setDetailOpen(true);
                    }}
                    style={[
                      {
                        backgroundColor: cardBg,
                        borderWidth: 1,
                        borderColor,
                        borderRadius: 22,
                        padding: 16,
                        flexDirection: "row",
                        alignItems: "center",
                      },
                      commonShadow,
                    ]}
                  >
                    {/* Leaf Thumbnail */}
                    <View
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 16,
                        overflow: "hidden",
                        backgroundColor: scheme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)",
                        marginRight: 16,
                        borderWidth: 1,
                        borderColor:
                          scheme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.06)",
                      }}
                    >
                      <DiagnosisImage fileId={r.fileId} imageFileName={r.imageFileName} />
                    </View>

                    {/* Middle Info */}
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      {/* Date & Time with Calendar Icon */}
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Calendar size={12} color={palette.tabIconDefault} style={{ marginRight: 4 }} />
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: palette.tabIconDefault,
                          }}
                        >
                          {formatTimestamp(r.timeStamp)}
                        </Text>
                      </View>

                      {/* Request Filename */}
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 15,
                          fontWeight: "800",
                          color: palette.text,
                          marginTop: 4,
                        }}
                      >
                        {r.imageFileName || t("diseaseDetection.historyItem", "Yêu cầu chẩn đoán")}
                      </Text>

                      {/* Prediction Status text */}
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: topPrediction
                            ? getConfidenceColor(topPrediction.confidenceScore)
                            : palette.tabIconDefault,
                          marginTop: 4,
                        }}
                      >
                        {topPrediction
                          ? `${getDiseaseLabel(topPrediction.diseaseName)} · ${Math.round(topPrediction.confidenceScore * 100)}%`
                          : t("diseaseDetection.noResultYet", "Chưa tải kết quả")}
                      </Text>

                      {/* Plant badge styled as a pill */}
                      {requestPlant && (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: scheme === "dark" ? "rgba(36,90,52,0.25)" : "rgba(36,90,52,0.08)",
                            borderRadius: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            marginTop: 8,
                            alignSelf: "flex-start",
                            borderWidth: 0.5,
                            borderColor: scheme === "dark" ? "rgba(36,90,52,0.4)" : "rgba(36,90,52,0.15)",
                          }}
                        >
                          <Leaf size={10} color={scheme === "dark" ? "#4ADE80" : "#245A34"} style={{ marginRight: 4 }} />
                          <Text style={{ fontSize: 10, fontWeight: "800", color: scheme === "dark" ? "#4ADE80" : "#245A34" }}>
                            {getPlantName(requestPlant)}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Right Chevron Button Wrapper */}
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor:
                          scheme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.03)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ChevronRight size={16} color={palette.tabIconDefault} />
                    </View>
                  </TouchableOpacity>
                </MotiView>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ─── Detail Modal ────────────────────────────────────────── */}
      <Modal
        visible={detailOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setDetailOpen(false)}
      >
        <Pressable
          onPress={() => setDetailOpen(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            padding: 16,
            justifyContent: "center",
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: scheme === "dark" ? "#0F172A" : "#FFFFFF",
              borderRadius: 28,
              borderWidth: 1,
              borderColor: scheme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(226,232,240,1)",
              overflow: "hidden",
              maxHeight: "85%",
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor:
                  scheme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(226,232,240,1)",
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "900", color: palette.text }}>
                {t("diseaseDetection.historyDetail", "Chi tiết chẩn đoán")}
              </Text>
              <Pressable
                onPress={() => setDetailOpen(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor:
                    scheme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.04)",
                }}
              >
                <X size={18} color={palette.tabIconDefault} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
              {/* Diagnosis Image Crop Preview */}
              {selectedRequest && (
                <View
                  style={[
                    {
                      height: 220,
                      borderRadius: 20,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: scheme === "dark" ? "rgba(255,255,255,0.08)" : "#E2E8F0",
                      marginBottom: 20,
                      backgroundColor: "rgba(15,23,42,0.03)",
                    },
                    commonShadow,
                  ]}
                >
                  <DiagnosisImage fileId={selectedRequest.fileId} imageFileName={selectedRequest.imageFileName} />
                </View>
              )}

              {/* Plant Linkage Card (Appoint Plant) */}
              {selectedRequest && (
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: scheme === "dark" ? "rgba(255,255,255,0.08)" : "#E2E8F0",
                    backgroundColor: scheme === "dark" ? "rgba(30,41,59,0.3)" : "#F8FAFC",
                    borderRadius: 20,
                    padding: 16,
                    marginBottom: 24,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <Leaf size={16} color={palette.primary} strokeWidth={2.5} />
                    <Text style={{ fontSize: 13, fontWeight: "800", color: palette.text }}>
                      {t("diseaseDetection.attachPlantTitle", "Gắn với cây trồng")}
                    </Text>
                  </View>

                  {updatePlantMutation.isPending ? (
                    <ActivityIndicator size="small" color={palette.primary} style={{ marginVertical: 8 }} />
                  ) : (
                    <TouchableOpacity
                      onPress={() => setPlantPickerOpen(true)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderWidth: 1,
                        borderColor: scheme === "dark" ? "rgba(71,85,105,0.5)" : "#E2E8F0",
                        backgroundColor: cardBgStyle(scheme),
                        borderRadius: 14,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: linkedPlant ? palette.text : palette.tabIconDefault,
                        }}
                      >
                        {linkedPlant ? getPlantName(linkedPlant) : t("common.none", "Bỏ gán")}
                      </Text>
                      <ChevronDown size={18} color={palette.tabIconDefault} />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Prediction Results */}
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "900",
                  color: palette.textGray || "#64748B",
                  marginBottom: 12,
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                }}
              >
                {t("diseaseDetection.results", "Kết quả phân loại")}
              </Text>

              {resultQuery.isLoading ? (
                <ActivityIndicator color={palette.primary} />
              ) : resultQuery.isError ? (
                <Text style={{ color: palette.tabIconDefault, fontWeight: "600" }}>
                  {t("diseaseDetection.historyDetailLoadFailed", "Không thể tải chi tiết.")}
                </Text>
              ) : (
                <View style={{ gap: 14 }}>
                  {(resultQuery.data?.data?.result ?? []).map((item, idx) => {
                    const confidenceColor = getConfidenceColor(item.confidenceScore);
                    const percent = Math.round(item.confidenceScore * 100);

                    return (
                      <View
                        key={`${item.diseaseName}-${idx}`}
                        style={{
                          borderWidth: 1,
                          borderColor:
                            scheme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(226,232,240,1)",
                          backgroundColor:
                            scheme === "dark" ? "rgba(30,41,59,0.3)" : "rgba(248,250,252,1)",
                          borderRadius: 18,
                          padding: 16,
                        }}
                      >
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                          <Text style={{ fontSize: 14, fontWeight: "800", color: palette.text }}>
                            {getDiseaseLabel(item.diseaseName)}
                          </Text>
                          <Text style={{ fontSize: 14, fontWeight: "900", color: confidenceColor }}>
                            {percent}%
                          </Text>
                        </View>

                        {/* Progress Bar */}
                        <View
                          style={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor:
                              scheme === "dark" ? "rgba(255,255,255,0.08)" : "#E2E8F0",
                            overflow: "hidden",
                          }}
                        >
                          <MotiView
                            from={{ width: "0%" }}
                            animate={{ width: `${percent}%` }}
                            transition={{ type: "timing", duration: 800, delay: idx * 100 }}
                            style={{
                              height: "100%",
                              borderRadius: 3,
                              backgroundColor: confidenceColor,
                            }}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── Plant Picker Sub-Modal ─────────────────────────────── */}
      <Modal
        visible={plantPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPlantPickerOpen(false)}
        statusBarTranslucent
      >
        <Pressable
          onPress={() => setPlantPickerOpen(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.55)",
            padding: 24,
            justifyContent: "center",
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: scheme === "dark" ? "#0F172A" : "#FFFFFF",
              borderRadius: 28,
              borderWidth: 1,
              borderColor: scheme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(226,232,240,1)",
              overflow: "hidden",
              maxHeight: "65%",
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor:
                  scheme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(226,232,240,1)",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "900", color: palette.text }}>
                {t("diseaseDetection.selectPlant", "Chọn cây trồng")}
              </Text>
              <Pressable
                onPress={() => setPlantPickerOpen(false)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(15,23,42,0.04)",
                }}
              >
                <X size={16} color={palette.tabIconDefault} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 12 }}
            >
              {/* Option to clear linkage */}
              <Pressable
                onPress={() => handleAppointPlant(null)}
                style={({ pressed }) => ({
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderRadius: 14,
                  backgroundColor: pressed ? "rgba(239,68,68,0.12)" : "transparent",
                  marginBottom: 8,
                })}
              >
                <Text style={{ fontSize: 14, fontWeight: "800", color: "#EF4444" }}>
                  {t("common.none", "Bỏ gán (Không chọn)")}
                </Text>
              </Pressable>

              {plants.map((p: PlantResponse) => (
                <Pressable
                  key={p.id}
                  onPress={() => handleAppointPlant(p.id)}
                  style={({ pressed }) => ({
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderRadius: 14,
                    backgroundColor: pressed
                      ? scheme === "dark"
                        ? "rgba(47,127,52,0.2)"
                        : "rgba(47,127,52,0.08)"
                      : "transparent",
                  })}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color:
                        p.id === selectedRequest?.plantId
                          ? palette.primary
                          : palette.text,
                    }}
                  >
                    {getPlantName(p)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const cardBgStyle = (scheme: "light" | "dark") =>
  scheme === "dark" ? "rgba(15,23,42,0.5)" : "#FFFFFF";
