import DateTimePicker from "@react-native-community/datetimepicker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import * as ImagePicker from "expo-image-picker";
import {
  Award,
  Building,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  Plus,
  ShieldCheck,
  Stethoscope,
  Trash2,
} from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import Colors from "@/src/constants/Colors";
import { fileApi } from "@/src/features/common";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import { parseApiError } from "@/src/lib/error-handler";

import { profileApi } from "../api/profile-api";
import { getMyProfileQueryOptions, profileKeys } from "../queries/options";

interface CertificateEntry {
  title: string;
  issuedBy: string;
  proofUrl: string;
  proofFileId: string;
  fileType: string;
  localProofUri: string | null;
  issueDate: string;
  isUploadingProof: boolean;
}

const emptyCert = (): CertificateEntry => ({
  title: "",
  issuedBy: "",
  proofUrl: "",
  proofFileId: "",
  fileType: "",
  localProofUri: null,
  issueDate: "",
  isUploadingProof: false,
});

const isValidLocalDate = (value: string): boolean => {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return false;
  const date = new Date(`${trimmed}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === trimmed
  );
};

export function CertificateScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme();
  const scheme = colorScheme ?? "light";
  const palette = Colors[scheme];

  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(getMyProfileQueryOptions());

  const [certificates, setCertificates] = useState<CertificateEntry[]>([
    emptyCert(),
  ]);
  const [proposedSpecialty, setProposedSpecialty] = useState("");
  const [activePickerIndex, setActivePickerIndex] = useState(-1);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

  const updateCert = (index: number, patch: Partial<CertificateEntry>) => {
    setCertificates((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    );
  };

  const addCert = () => setCertificates((prev) => [...prev, emptyCert()]);

  const removeCert = (index: number) =>
    setCertificates((prev) => prev.filter((_, i) => i !== index));

  const isAnyUploading = certificates.some((c) => c.isUploadingProof);

  const submitApprovalRequestMutation = useMutation({
    mutationFn: (payload: {
      profileId: string;
      body: {
        certificates: Array<{
          title: string;
          issuedBy: string;
          proofUrl: string;
          issueDate: string;
        }>;
        proposedSpecialty?: string;
      };
    }) => profileApi.submitApprovalRequest(payload.profileId, payload.body),
    onSuccess: (response) => {
      setPendingRequestId(response.id);
      setCertificates([emptyCert()]);
      setProposedSpecialty("");
      queryClient.invalidateQueries({ queryKey: profileKeys.me() });
      Alert.alert(
        t("profile.expertApplication.successTitle"),
        t("profile.expertApplication.successMessage"),
      );
    },
    onError: (mutationError) => {
      const parsed = parseApiError(mutationError);
      Alert.alert(t("profile.expertApplication.errorTitle"), parsed.message);
    },
  });

  const onUploadProof = async (index: number) => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          t("profile.expertApplication.errorTitle"),
          t("profile.expertApplication.proofPermissionDenied"),
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });

      if (result.canceled || !result.assets[0]) return;

      updateCert(index, {
        localProofUri: result.assets[0].uri,
        isUploadingProof: true,
      });
      const uploaded = await fileApi.uploadProof(result.assets[0]);
      updateCert(index, {
        proofUrl: uploaded.url,
        proofFileId: uploaded.fileId,
        fileType: uploaded.fileType,
        isUploadingProof: false,
      });
      Alert.alert(
        t("profile.expertApplication.successTitle"),
        t("profile.expertApplication.proofUploaded"),
      );
    } catch (uploadError) {
      updateCert(index, { localProofUri: null, isUploadingProof: false });
      const parsed = parseApiError(uploadError);
      Alert.alert(t("profile.expertApplication.errorTitle"), parsed.message);
    }
  };

  const onSubmitExpertApplication = () => {
    if (!profile) return;

    for (const cert of certificates) {
      if (
        !cert.title.trim() ||
        !cert.issuedBy.trim() ||
        !cert.proofUrl.trim() ||
        !cert.issueDate.trim()
      ) {
        Alert.alert(
          t("profile.expertApplication.errorTitle"),
          t("profile.expertApplication.requiredFields"),
        );
        return;
      }
      if (!isValidLocalDate(cert.issueDate.trim())) {
        Alert.alert(
          t("profile.expertApplication.errorTitle"),
          t("profile.expertApplication.invalidIssueDate"),
        );
        return;
      }
    }

    submitApprovalRequestMutation.mutate({
      profileId: profile.id,
      body: {
        certificates: certificates.map((c) => ({
          title: c.title.trim(),
          issuedBy: c.issuedBy.trim(),
          proofUrl: c.proofUrl.trim(),
          proofFileId: c.proofFileId.trim() || undefined,
          fileType: c.fileType.trim() || undefined,
          issueDate: c.issueDate.trim(),
        })),
        proposedSpecialty: proposedSpecialty.trim() || undefined,
      },
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background-light px-6 dark:bg-background-dark">
        <ActivityIndicator color={palette.primary} size="large" />
      </View>
    );
  }

  if (isError || !profile) {
    const parsed = parseApiError(error);
    return (
      <View className="flex-1 items-center justify-center bg-background-light px-6 dark:bg-background-dark">
        <Text className="text-center text-base font-semibold text-slate-900 dark:text-slate-100">
          {t("profile.loadErrorTitle")}
        </Text>
        <Text className="mt-2 text-center text-sm text-slate-500">
          {parsed.message}
        </Text>
        <Pressable
          className="mt-4 rounded-xl bg-primary px-4 py-2"
          onPress={() => void refetch()}
        >
          <Text className="font-semibold text-white">{t("common.retry")}</Text>
        </Pressable>
      </View>
    );
  }

  const isExpert = profile.role === "EXPERT";
  const approvedCertificates = profile.certificates ?? [];
  const canSubmit =
    !submitApprovalRequestMutation.isPending &&
    !isAnyUploading &&
    certificates.every(
      (c) => c.title && c.issuedBy && c.issueDate && c.localProofUri,
    );

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      >
        <View className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-background-dark">
          <Text className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {isExpert
              ? t("profile.expertApplication.alreadyExpertTitle")
              : t("profile.expertApplication.applyTitle")}
          </Text>
          <Text className="mt-1 text-xs text-slate-500">
            {isExpert
              ? t("profile.expertApplication.alreadyExpertDescription")
              : t("profile.expertApplication.applyDescription")}
          </Text>

          {/* Approved certificates list */}
          {approvedCertificates.length > 0 ? (
            <View className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-700/40 dark:bg-emerald-900/20">
              <View className="mb-3 flex-row items-center gap-2">
                <CheckCircle2 size={18} color="#059669" />
                <Text className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  {t("profile.expertApplication.approvedCertificates")}
                </Text>
              </View>
              <View className="gap-3">
                {approvedCertificates.map((certificate) => (
                  <View
                    key={certificate.id}
                    className="flex-row items-start gap-3 rounded-xl border border-emerald-200/60 bg-white p-3 shadow-sm shadow-emerald-100/50 dark:border-emerald-700/30 dark:bg-slate-800 dark:shadow-none"
                  >
                    <View className="mt-0.5 rounded-full bg-emerald-100 p-1.5 dark:bg-emerald-900/50">
                      <Award size={16} color="#059669" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {certificate.title}
                      </Text>
                      <View className="mt-1 flex-row flex-wrap items-center gap-x-2 gap-y-1">
                        <View className="flex-row items-center gap-1">
                          <Building size={12} color="#64748B" />
                          <Text className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            {certificate.issuedBy}
                          </Text>
                        </View>
                        <View className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <View className="flex-row items-center gap-1">
                          <CalendarDays size={12} color="#64748B" />
                          <Text className="text-xs text-slate-500">
                            {certificate.issueDate}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Application form */}
          {!isExpert ? (
            <View className="mt-6 gap-6">
              {/* Proposed specialty â€” request-level field */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t("profile.expertApplication.proposedSpecialty")}
                </Text>
                <View className="flex-row items-center gap-3 rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-3.5 dark:border-slate-700 dark:bg-slate-800/50">
                  <Stethoscope size={20} color="#94A3B8" />
                  <TextInput
                    value={proposedSpecialty}
                    onChangeText={setProposedSpecialty}
                    placeholder={t(
                      "profile.expertApplication.proposedSpecialtyPlaceholder",
                    )}
                    placeholderTextColor="#94A3B8"
                    className="flex-1 text-base text-slate-900 dark:text-slate-100"
                  />
                </View>
              </View>

              {/* Certificate entries */}
              {certificates.map((cert, index) => (
                <View
                  key={index}
                  className="gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/40"
                >
                  {/* Entry header */}
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {t("profile.expertApplication.certificateN", {
                        n: index + 1,
                      })}
                    </Text>
                    {certificates.length > 1 && (
                      <Pressable
                        onPress={() => removeCert(index)}
                        className="flex-row items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 active:opacity-70 dark:bg-red-900/20"
                      >
                        <Trash2 size={12} color="#DC2626" />
                        <Text className="text-xs font-semibold text-red-600 dark:text-red-400">
                          {t("profile.expertApplication.removeCertificate")}
                        </Text>
                      </Pressable>
                    )}
                  </View>

                  {/* Title */}
                  <View className="gap-2">
                    <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {t("profile.expertApplication.certificateTitle")}
                    </Text>
                    <View className="flex-row items-center gap-3 rounded-xl border border-slate-300 bg-white px-3.5 py-3.5 dark:border-slate-600 dark:bg-slate-800">
                      <Award size={20} color="#94A3B8" />
                      <TextInput
                        value={cert.title}
                        onChangeText={(v) => updateCert(index, { title: v })}
                        placeholder={t(
                          "profile.expertApplication.certificateTitlePlaceholder",
                        )}
                        placeholderTextColor="#94A3B8"
                        className="flex-1 text-base text-slate-900 dark:text-slate-100"
                      />
                    </View>
                  </View>

                  {/* Issued by */}
                  <View className="gap-2">
                    <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {t("profile.expertApplication.issuedBy")}
                    </Text>
                    <View className="flex-row items-center gap-3 rounded-xl border border-slate-300 bg-white px-3.5 py-3.5 dark:border-slate-600 dark:bg-slate-800">
                      <Building size={20} color="#94A3B8" />
                      <TextInput
                        value={cert.issuedBy}
                        onChangeText={(v) => updateCert(index, { issuedBy: v })}
                        placeholder={t(
                          "profile.expertApplication.issuedByPlaceholder",
                        )}
                        placeholderTextColor="#94A3B8"
                        className="flex-1 text-base text-slate-900 dark:text-slate-100"
                      />
                    </View>
                  </View>

                  {/* Issue date */}
                  <View className="gap-2">
                    <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {t("profile.expertApplication.issueDate")}
                    </Text>
                    <Pressable
                      onPress={() => setActivePickerIndex(index)}
                      className="flex-row items-center gap-3 rounded-xl border border-slate-300 bg-white px-3.5 py-3.5 active:opacity-70 dark:border-slate-600 dark:bg-slate-800"
                    >
                      <CalendarDays size={20} color="#94A3B8" />
                      <Text
                        className={`flex-1 text-base ${
                          cert.issueDate
                            ? "text-slate-900 dark:text-slate-100"
                            : "text-[#94A3B8]"
                        }`}
                      >
                        {cert.issueDate || "YYYY-MM-DD"}
                      </Text>
                    </Pressable>
                    {activePickerIndex === index && (
                      <DateTimePicker
                        value={
                          cert.issueDate ? new Date(cert.issueDate) : new Date()
                        }
                        mode="date"
                        display="default"
                        maximumDate={new Date()}
                        onChange={(_, selectedDate) => {
                          setActivePickerIndex(-1);
                          if (selectedDate) {
                            updateCert(index, {
                              issueDate: format(selectedDate, "yyyy-MM-dd"),
                            });
                          }
                        }}
                      />
                    )}
                  </View>

                  {/* Proof upload */}
                  <View className="gap-2">
                    <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {t("profile.expertApplication.proof")}
                    </Text>
                    {cert.localProofUri || cert.proofUrl ? (
                      <View className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                        <Image
                          source={{ uri: cert.localProofUri || cert.proofUrl }}
                          className="h-full w-full"
                          resizeMode="cover"
                        />
                        {cert.isUploadingProof ? (
                          <View className="absolute inset-0 items-center justify-center bg-black/40">
                            <ActivityIndicator color="#fff" />
                            <Text className="mt-2 text-xs font-medium text-white">
                              {t("profile.expertApplication.uploadingProof")}
                            </Text>
                          </View>
                        ) : (
                          <Pressable
                            onPress={() => void onUploadProof(index)}
                            className="absolute bottom-3 right-3 flex-row items-center gap-1.5 rounded-lg bg-black/60 px-3 py-2 active:opacity-80"
                          >
                            <Camera size={14} color="#fff" />
                            <Text className="text-xs font-semibold text-white">
                              Change
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => void onUploadProof(index)}
                        className="items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-white py-10 active:opacity-70 dark:border-slate-600 dark:bg-slate-800"
                      >
                        <View className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/30">
                          <ImageIcon size={24} color="#059669" />
                        </View>
                        <View className="items-center gap-1">
                          <Text className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                            {t("profile.expertApplication.uploadProof")}
                          </Text>
                          <Text className="text-xs text-slate-500">
                            JPG, PNG, GIF up to 5MB
                          </Text>
                        </View>
                      </Pressable>
                    )}
                  </View>
                </View>
              ))}

              {/* Add certificate button */}
              <Pressable
                onPress={addCert}
                disabled={isAnyUploading}
                className="flex-row items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-300 py-3.5 active:opacity-70 dark:border-emerald-700"
              >
                <Plus size={18} color="#059669" />
                <Text className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {t("profile.expertApplication.addCertificate")}
                </Text>
              </Pressable>

              {/* Pending banner */}
              {pendingRequestId ? (
                <View className="flex-row items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 dark:bg-amber-900/20">
                  <Clock size={16} color="#D97706" />
                  <Text className="flex-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                    {t("profile.expertApplication.pendingLabel", {
                      requestId: pendingRequestId,
                    })}
                  </Text>
                </View>
              ) : null}

              {/* Submit */}
              <Pressable
                className={`mt-2 flex-row items-center justify-center gap-2 rounded-2xl px-4 py-3.5 shadow-sm ${
                  !canSubmit
                    ? "bg-emerald-600/50"
                    : "bg-emerald-500 active:bg-emerald-600"
                }`}
                onPress={onSubmitExpertApplication}
                disabled={!canSubmit}
              >
                {submitApprovalRequestMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ShieldCheck size={20} color="#fff" />
                )}
                <Text className="text-base font-bold text-white shadow-sm">
                  {submitApprovalRequestMutation.isPending
                    ? t("profile.expertApplication.submitting")
                    : t("profile.expertApplication.submit")}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
