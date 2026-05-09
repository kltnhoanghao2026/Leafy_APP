import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import { useResizePlugin } from "vision-camera-resize-plugin";
import {
  RotateCcw,
  CameraIcon,
  Aperture,
  SwitchCamera,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";

import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import type {
  LeafDetection,
  LeafDetectionResponse,
  PredictionResponse,
} from "@/src/features/disease-detection/api/disease-detection.api";
import { diseaseDetectionApi } from "@/src/features/disease-detection/api/disease-detection.api";

import { useTfliteModels } from "../models/useTfliteModels";
import { useLeafDetectionProcessor } from "../models/useLeafDetectionProcessor";
import { YOLO_INPUT_SIZE, MOBILENET_INPUT_SIZE } from "../models/constants";

import StepIndicator from "./StepIndicator";
import LeafDetectionView from "./LeafDetectionView";
import LeafListCard from "./LeafListCard";
import PredictionResultCard from "./PredictionResultCard";
import type { Step } from "./predict.types";
import {
  getDisplayImageHeight,
  cropLeafImage,
  commonShadow,
} from "./predict.utils";
import { ChevronLeft } from "lucide-react-native";

export default function LocalCaptureScreen({ onCancel }: { onCancel?: () => void }) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const scheme = colorScheme ?? "light";
  const palette = Colors[scheme];

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("back");
  const cameraRef = useRef<Camera>(null);
  const { resize } = useResizePlugin();

  const {
    isLoading: modelsLoading,
    isYoloLoaded,
    isMobilenetLoaded,
    error: modelError,
    yoloModel,
    mobilenetModel,
    yoloOutputShape,
  } = useTfliteModels();

  const [step, setStep] = useState<Step>("pick"); // "pick" = camera preview
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detections, setDetections] = useState<LeafDetection[]>([]);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [frameSize, setFrameSize] = useState({ width: 1080, height: 1920 });
  const latestDetectionsRef = useRef<LeafDetection[]>([]);
  const detectionResolver = useRef<((dets: LeafDetection[]) => void) | null>(null);

  const handleDetections = useCallback((dets: LeafDetection[]) => {
    latestDetectionsRef.current = dets;
    if (detectionResolver.current) {
      detectionResolver.current(dets);
      detectionResolver.current = null;
    }
  }, []);

  const { frameProcessor, triggerDetection } = useLeafDetectionProcessor({
    yoloModel,
    mobilenetModel,
    onDetections: handleDetections,
    frameWidth: frameSize.width,
    frameHeight: frameSize.height,
    yoloOutputShape,
    isActive: step === "pick" && isYoloLoaded,
    mode: "on-demand",
  });
  const [selectedLeafIndex, setSelectedLeafIndex] = useState<number | null>(
    null,
  );
  const [croppedUri, setCroppedUri] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [cameraPosition, setCameraPosition] = useState<"back" | "front">(
    "back",
  );

  const cardBg = scheme === "dark" ? "rgba(30, 41, 59, 0.8)" : "#FFFFFF";
  const borderColor =
    scheme === "dark" ? "rgba(71, 85, 105, 0.4)" : "rgba(226, 232, 240, 1)";

  // ── Permission handling ──────────────────────────────────────────

  React.useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // ── Capture and run YOLO ─────────────────────────────────────────

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || !yoloModel) return;

    try {
      setIsProcessing(true);
      
      // takePhoto first to avoid Camera2 API starvation crash when frame processor is busy
      const photo = await cameraRef.current.takePhoto({});

      // Then trigger YOLO inference and wait for the result
      const detectionsPromise = new Promise<LeafDetection[]>((resolve) => {
        detectionResolver.current = resolve;
      });
      triggerDetection();
      const freshDetections = await detectionsPromise;

      const photoUri = `file://${photo.path}`;
      const photoWidth = photo.width;
      const photoHeight = photo.height;

      setCapturedPhotoUri(photoUri);
      setImageSize({ width: photoWidth, height: photoHeight });
      setStep("detect");

      // Map frame detections to photo dimensions
      const scaleX = photoWidth / frameSize.width;
      const scaleY = photoHeight / frameSize.height;

      const scaledDetections = freshDetections.map((det) => ({
        ...det,
        boundingBox: {
          x1: det.boundingBox.x1 * scaleX,
          y1: det.boundingBox.y1 * scaleY,
          x2: det.boundingBox.x2 * scaleX,
          y2: det.boundingBox.y2 * scaleY,
        },
      }));

      setDetections(scaledDetections);
      
      const detectionResult = { detections: scaledDetections };

        // Auto-select the highest confidence detection
        if (detectionResult.detections.length > 0) {
          let maxIdx = 0;
          for (let i = 1; i < detectionResult.detections.length; i++) {
            if (
              detectionResult.detections[i].confidenceScore >
              detectionResult.detections[maxIdx].confidenceScore
            ) {
              maxIdx = i;
            }
          }
          setSelectedLeafIndex(maxIdx);
          try {
            const uri = await cropLeafImage(
              photoUri,
              detectionResult.detections[maxIdx].boundingBox,
              { width: photoWidth, height: photoHeight },
            );
            setCroppedUri(uri);
          } catch {
            /* crop failed, user can still select manually */
          }
        }
    } catch (error) {
      console.error("[LocalCapture] YOLO Detection Error:", error);
      Alert.alert(
        t("diseaseDetection.error", "Error"),
        t(
          "diseaseDetection.detectFailed",
          "Failed to detect leaves. Please try again.",
        ),
      );
      setStep("pick");
    } finally {
      setIsProcessing(false);
    }
  }, [yoloModel, frameSize, t]);

  // ── Select leaf and crop ─────────────────────────────────────────

  const handleSelectLeaf = useCallback(
    async (index: number) => {
      if (!capturedPhotoUri || detections.length === 0) return;
      setSelectedLeafIndex(index);
      const det = detections[index];

      try {
        const uri = await cropLeafImage(
          capturedPhotoUri,
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
    [capturedPhotoUri, detections, imageSize, t],
  );

  // ── Run MobileNetV2 prediction ───────────────────────────────────

  const handlePredict = useCallback(async () => {
    if (!croppedUri || !mobilenetModel) return;

    // If the frame processor already ran MobileNet on this detection, use that result directly
    if (selectedLeafIndex !== null && detections[selectedLeafIndex]?.localPrediction) {
      setResult(detections[selectedLeafIndex].localPrediction!);
      setStep('result');
      return;
    }

    // Fallback: send the cropped JPEG to the backend Keras model
    setIsPredicting(true);
    try {
      const predictionResult = await diseaseDetectionApi.predictFromUri(
        croppedUri,
        `crop-${Date.now()}.jpg`
      );

      if (predictionResult) {
        setResult(predictionResult);
        setStep("result");
      }
    } catch (error) {
      console.error('[LocalCapture] Prediction error:', error);
      Alert.alert(
        t("diseaseDetection.error", "Error"),
        t(
          "diseaseDetection.predictFailed",
          "Failed to analyze image. Please try again.",
        ),
      );
    } finally {
      setIsPredicting(false);
    }
  }, [croppedUri, mobilenetModel, selectedLeafIndex, detections, t]);

  // ── Reset ────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    if (step === "pick" && onCancel) {
      onCancel();
      return;
    }
    setStep("pick");
    setCapturedPhotoUri(null);
    setDetections([]);
    setSelectedLeafIndex(null);
    setCroppedUri(null);
    setResult(null);
    setIsProcessing(false);
    setIsPredicting(false);
  }, [step, onCancel]);

  const displayImageHeight = getDisplayImageHeight(imageSize);

  // ── Guard: no permission ─────────────────────────────────────────

  if (!hasPermission) {
    return (
      <SafeAreaView
        style={[styles.center, { backgroundColor: palette.background }]}
      >
        <CameraIcon size={48} color={palette.tabIconDefault} />
        <Text style={[styles.permText, { color: palette.text }]}>
          {t(
            "diseaseDetection.cameraPermissionNeeded",
            "Camera permission is required",
          )}
        </Text>
        <Pressable
          onPress={requestPermission}
          style={[styles.permButton, { backgroundColor: palette.primary }]}
        >
          <Text style={styles.permButtonText}>
            {t("diseaseDetection.grantPermission", "Grant Permission")}
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // ── Guard: no device ─────────────────────────────────────────────

  if (!device) {
    return (
      <SafeAreaView
        style={[styles.center, { backgroundColor: palette.background }]}
      >
        <Text style={{ color: palette.text }}>
          {t("diseaseDetection.noCamera", "No camera device found")}
        </Text>
      </SafeAreaView>
    );
  }

  // ── Render ───────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      {/* Model loading overlay */}
      {modelsLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>
            {t("diseaseDetection.loadingModels", "Loading AI models...")}
          </Text>
        </View>
      )}

      {modelError && (
        <View style={[styles.errorBanner, { backgroundColor: "#FEE2E2" }]}>
          <Text style={{ color: "#DC2626", fontSize: 13 }}>
            {t(
              "diseaseDetection.modelLoadError",
              "Failed to load AI models. Please restart the app.",
            )}
          </Text>
        </View>
      )}

      {/* ─── Camera preview (Step: pick) ────────────────────────── */}
      {step === "pick" && (
        <View style={{ flex: 1 }}>
          <Camera
            ref={cameraRef}
            device={device}
            isActive={step === "pick"}
            photo={true}
            frameProcessor={frameProcessor}
            style={StyleSheet.absoluteFill}
            onInitialized={() => {
              if (device.formats.length > 0) {
                const format = device.formats[0];
                setFrameSize({
                  width: format.videoWidth,
                  height: format.videoHeight,
                });
              }
            }}
          />

          {/* Top Header / Back Button */}
          {onCancel && (
            <SafeAreaView style={styles.topHeaderOverlay}>
              <Pressable onPress={onCancel} style={styles.backButton}>
                <ChevronLeft size={24} color="#FFFFFF" />
              </Pressable>
            </SafeAreaView>
          )}

          {/* Bottom controls */}
          <View style={styles.cameraControls}>
            {/* Flip camera */}
            <Pressable
              onPress={() =>
                setCameraPosition((prev) =>
                  prev === "back" ? "front" : "back",
                )
              }
              style={styles.flipButton}
            >
              <SwitchCamera size={24} color="#FFFFFF" />
            </Pressable>

            {/* Capture button */}
            <Pressable
              onPress={handleCapture}
              disabled={!isYoloLoaded || isProcessing}
              style={[
                styles.captureButton,
                (!isYoloLoaded || isProcessing) && { opacity: 0.5 },
              ]}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Aperture size={32} color="#FFFFFF" />
              )}
            </Pressable>

            {/* Spacer for symmetry */}
            <View style={{ width: 48 }} />
          </View>

          {/* Model status badge */}
          {!isYoloLoaded && !modelsLoading && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {t("diseaseDetection.modelNotReady", "Model not loaded yet...")}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ─── Detection results (Step: detect) ──────────────────── */}
      {step === "detect" && capturedPhotoUri && (
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: 16,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          <StepIndicator step={step} palette={palette} />

          <LeafDetectionView
            cardBg={cardBg}
            borderColor={borderColor}
            palette={palette}
            imageUri={capturedPhotoUri}
            detections={detections}
            imageSize={imageSize}
            displayImageHeight={displayImageHeight}
            selectedLeafIndex={selectedLeafIndex}
            isDetecting={isProcessing}
            onSelectLeaf={handleSelectLeaf}
          />

          {detections.length > 0 && !isProcessing && (
            <LeafListCard
              cardBg={cardBg}
              borderColor={borderColor}
              palette={palette}
              detections={detections}
              selectedLeafIndex={selectedLeafIndex}
              onSelectLeaf={handleSelectLeaf}
              croppedUri={croppedUri}
              isPredicting={isPredicting}
              onPredict={handlePredict}
            />
          )}

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
        </ScrollView>
      )}

      {/* ─── Prediction results (Step: result) ─────────────────── */}
      {step === "result" && result && (
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: 16,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          <StepIndicator step={step} palette={palette} />

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
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
  },
  permText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  permButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  loadingText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginTop: 12,
    fontSize: 15,
  },
  errorBanner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  cameraControls: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 32,
  },
  flipButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  topHeaderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 16,
    marginTop: 16,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
  },
});
