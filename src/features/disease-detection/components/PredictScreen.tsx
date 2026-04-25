import React, { useState, useCallback, useLayoutEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  SafeAreaView,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import {
  RotateCcw,
  Cpu,
  Globe,
  Check,
  Camera as CameraIcon,
  ScanLine,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useNavigation, useRouter } from "expo-router";

import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import {
  useDetectLeaf,
  usePredict,
} from "@/src/features/disease-detection/api/usePredict";
import type {
  LeafDetection,
  PredictionResponse,
} from "@/src/features/disease-detection/api/disease-detection.api";

import type { Step, PredictMode } from "./predict.types";
import {
  getDisplayImageHeight,
  cropLeafImage,
  commonShadow,
} from "./predict.utils";
import StepIndicator from "./StepIndicator";
import ImagePickerCard from "./ImagePickerCard";
import RealtimeScanScreen from "./RealtimeScanScreen";
import LocalCaptureScreen from "./LocalCaptureScreen";
import LeafDetectionView from "./LeafDetectionView";
import LeafListCard from "./LeafListCard";
import PredictionResultCard from "./PredictionResultCard";

export default function PredictScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const scheme = colorScheme ?? "light";
  const palette = Colors[scheme];

  const [step, setStep] = useState<Step>("pick");
  const [predictMode, setPredictMode] = useState<PredictMode>("api");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLocalCameraActive, setIsLocalCameraActive] = useState(false);
  const [selectedImage, setSelectedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [detections, setDetections] = useState<LeafDetection[]>([]);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [selectedLeafIndex, setSelectedLeafIndex] = useState<number | null>(
    null,
  );
  const [croppedUri, setCroppedUri] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);

  const detectMutation = useDetectLeaf();
  const predictMutation = usePredict();

  const cardBg = scheme === "dark" ? "rgba(30, 41, 59, 0.8)" : "#FFFFFF";
  const borderColor =
    scheme === "dark" ? "rgba(71, 85, 105, 0.4)" : "rgba(226, 232, 240, 1)";

  // ── Header dropdown ──────────────────────────────────────────────

  useLayoutEffect(() => {
    const ModeIcon = predictMode === "api" ? Globe : Cpu;
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => setDropdownOpen((v) => !v)}
          style={{
            width: 36,
            height: 36,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 10,
            backgroundColor:
              scheme === "dark"
                ? "rgba(71, 85, 105, 0.35)"
                : "rgba(47, 127, 52, 0.08)",
            marginRight: 4,
          }}
        >
          <ModeIcon size={18} color={palette.primary} />
        </Pressable>
      ),
    });
  }, [navigation, predictMode, palette, scheme, t]);

  // ── Step 1: Pick image ───────────────────────────────────────────

  const runDetection = useCallback(
    (asset: ImagePicker.ImagePickerAsset) => {
      setStep("detect");
      setDetections([]);
      setSelectedLeafIndex(null);
      setCroppedUri(null);
      setResult(null);

      detectMutation.mutate(asset, {
        onSuccess: async (data) => {
          setDetections(data.detections);
          const iSize = { width: data.imageWidth, height: data.imageHeight };
          setImageSize(iSize);

          if (data.detections.length > 0) {
            let maxIdx = 0;
            for (let i = 1; i < data.detections.length; i++) {
              if (
                data.detections[i].confidenceScore >
                data.detections[maxIdx].confidenceScore
              ) {
                maxIdx = i;
              }
            }
            setSelectedLeafIndex(maxIdx);
            try {
              const uri = await cropLeafImage(
                asset.uri,
                data.detections[maxIdx].boundingBox,
                iSize,
              );
              setCroppedUri(uri);
            } catch {
              Alert.alert(
                t("diseaseDetection.error", "Error"),
                t(
                  "diseaseDetection.cropFailed",
                  "Failed to auto-crop the detected leaf.",
                ),
              );
            }
          }
        },
        onError: (error) => {
          Alert.alert(
            t("diseaseDetection.error", "Error"),
            error.message ||
              t(
                "diseaseDetection.detectFailed",
                "Failed to detect leaves. Please try again.",
              ),
          );
          setStep("pick");
        },
      });
    },
    [detectMutation, t],
  );

  const pickFromGallery = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        t("diseaseDetection.permissionRequired", "Permission Required"),
        t(
          "diseaseDetection.galleryPermission",
          "Please allow gallery access to pick an image.",
        ),
      );
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) {
      setSelectedImage(res.assets[0]);
      runDetection(res.assets[0]);
    }
  }, [t, runDetection]);

  const takePhoto = useCallback(async () => {
    if (predictMode === "local-capture") {
      setIsLocalCameraActive(true);
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        t("diseaseDetection.permissionRequired", "Permission Required"),
        t(
          "diseaseDetection.cameraPermission",
          "Please allow camera access to take a photo.",
        ),
      );
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!res.canceled && res.assets[0]) {
      setSelectedImage(res.assets[0]);
      runDetection(res.assets[0]);
    }
  }, [t, runDetection]);

  // ── Step 2: Crop selected leaf & predict ─────────────────────────

  const handleSelectLeaf = useCallback(
    async (index: number) => {
      if (!selectedImage || detections.length === 0) return;
      setSelectedLeafIndex(index);
      const det = detections[index];

      try {
        const uri = await cropLeafImage(
          selectedImage.uri,
          det.boundingBox,
          imageSize,
        );
        setCroppedUri(uri);
      } catch {
        Alert.alert(
          t("diseaseDetection.error", "Error"),
          t("diseaseDetection.cropFailed", "Failed to crop the leaf image."),
        );
      }
    },
    [selectedImage, detections, imageSize, t],
  );

  const handlePredict = useCallback(() => {
    if (!croppedUri) return;
    setStep("result");
    predictMutation.mutate(
      { uri: croppedUri, filename: `crop-${Date.now()}.jpg` },
      {
        onSuccess: (data) => setResult(data),
        onError: () => {
          Alert.alert(
            t("diseaseDetection.error", "Error"),
            t(
              "diseaseDetection.predictFailed",
              "Failed to analyze image. Please try again.",
            ),
          );
          setStep("detect");
        },
      },
    );
  }, [croppedUri, predictMutation, t]);

  const handleReset = useCallback(() => {
    setStep("pick");
    setSelectedImage(null);
    setDetections([]);
    setSelectedLeafIndex(null);
    setCroppedUri(null);
    setResult(null);
    detectMutation.reset();
    predictMutation.reset();
  }, [detectMutation, predictMutation]);

  // ── Helpers ──────────────────────────────────────────────────────

  const displayImageHeight = getDisplayImageHeight(imageSize);

  // ── Render ───────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      {/* ─── Mode dropdown overlay ──────────────────────────────── */}
      <Modal
        visible={dropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownOpen(false)}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={() => setDropdownOpen(false)}>
          <View style={{ flex: 1 }}>
            <View
              style={{
                position: "absolute",
                top: 56,
                right: 12,
                backgroundColor: cardBg,
                borderRadius: 12,
                borderWidth: 1,
                borderColor,
                overflow: "hidden",
                minWidth: 180,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              {(
                [
                  {
                    value: "api" as PredictMode,
                    label: t("diseaseDetection.modeApi", "Cloud API"),
                    description: t(
                      "diseaseDetection.modeApiDesc",
                      "Server-side inference",
                    ),
                    Icon: Globe,
                  },
                  {
                    value: "local-capture" as PredictMode,
                    label: t(
                      "diseaseDetection.modeLocalCapture",
                      "Local Capture",
                    ),
                    description: t(
                      "diseaseDetection.modeLocalCaptureDesc",
                      "Capture & analyze on-device",
                    ),
                    Icon: CameraIcon,
                  },
                  {
                    value: "local-realtime" as PredictMode,
                    label: t(
                      "diseaseDetection.modeLocalRealtime",
                      "Real-time Scan",
                    ),
                    description: t(
                      "diseaseDetection.modeLocalRealtimeDesc",
                      "Live camera detection",
                    ),
                    Icon: ScanLine,
                  },
                ] as const
              ).map(({ value, label, description, Icon }) => (
                <Pressable
                  key={value}
                  onPress={() => {
                    setDropdownOpen(false);
                    setPredictMode(value);
                    setStep("pick");
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderBottomWidth: value !== "local-realtime" ? 1 : 0,
                    borderBottomColor: borderColor,
                  }}
                >
                  <Icon
                    size={18}
                    color={
                      predictMode === value ? palette.primary : palette.text
                    }
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color:
                          predictMode === value
                            ? palette.primary
                            : palette.text,
                      }}
                    >
                      {label}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: palette.tabIconDefault,
                        marginTop: 1,
                      }}
                    >
                      {description}
                    </Text>
                  </View>
                  {predictMode === value && (
                    <Check size={15} color={palette.primary} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {predictMode === "local-realtime" ? (
        <View style={{ flex: 1 }}>
          <RealtimeScanScreen />
        </View>
      ) : isLocalCameraActive && predictMode === "local-capture" ? (
        <View style={{ flex: 1 }}>
          <LocalCaptureScreen onCancel={() => setIsLocalCameraActive(false)} />
        </View>
      ) : (
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <StepIndicator step={step} palette={palette} />

        {/* ─── Step 1: Pick image ─────────────────────────────────── */}
        {step === "pick" && (
          <ImagePickerCard
            cardBg={cardBg}
            borderColor={borderColor}
            palette={palette}
            onPickGallery={pickFromGallery}
            onTakePhoto={takePhoto}
          />
        )}

        {/* ─── Step 2: Detect leaves & choose ─────────────────────── */}
        {step === "detect" && selectedImage && (
          <>
            <LeafDetectionView
              cardBg={cardBg}
              borderColor={borderColor}
              palette={palette}
              imageUri={selectedImage.uri}
              detections={detections}
              imageSize={imageSize}
              displayImageHeight={displayImageHeight}
              selectedLeafIndex={selectedLeafIndex}
              isDetecting={detectMutation.isPending}
              onSelectLeaf={handleSelectLeaf}
            />

            {detections.length > 0 && !detectMutation.isPending && (
              <LeafListCard
                cardBg={cardBg}
                borderColor={borderColor}
                palette={palette}
                detections={detections}
                selectedLeafIndex={selectedLeafIndex}
                onSelectLeaf={handleSelectLeaf}
                croppedUri={croppedUri}
                isPredicting={predictMutation.isPending}
                onPredict={handlePredict}
              />
            )}

            {/* Reset button */}
            <Pressable
              onPress={handleReset}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${palette.primary}15`,
                borderRadius: 12,
                paddingVertical: 14,
                gap: 8,
              }}
            >
              <RotateCcw size={18} color={palette.primary} />
              <Text
                style={{
                  color: palette.primary,
                  fontWeight: "600",
                  fontSize: 14,
                }}
              >
                {t("diseaseDetection.chooseAnother", "Choose another image")}
              </Text>
            </Pressable>
          </>
        )}

        {/* ─── Step 3: Results ────────────────────────────────────── */}
        {step === "result" && result && (
          <>
            <PredictionResultCard
              cardBg={cardBg}
              borderColor={borderColor}
              palette={palette}
              scheme={scheme}
              result={result}
              croppedUri={croppedUri}
            />

            <Pressable
              onPress={handleReset}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${palette.primary}15`,
                borderRadius: 12,
                paddingVertical: 14,
                gap: 8,
              }}
            >
              <RotateCcw size={18} color={palette.primary} />
              <Text
                style={{
                  color: palette.primary,
                  fontWeight: "600",
                  fontSize: 14,
                }}
              >
                {t("diseaseDetection.startOver", "Start over")}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
      )}
    </SafeAreaView>
  );
}
