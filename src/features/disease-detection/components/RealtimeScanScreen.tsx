import React, { useCallback, useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import {
  CameraIcon,
  Pause,
  Play,
  ScanLine,
  RotateCcw,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";

import Colors from "@/src/constants/Colors";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import type {
  LeafDetection,
  PredictionResponse,
} from "@/src/features/disease-detection/api/disease-detection.api";
import { diseaseDetectionApi } from "@/src/features/disease-detection/api/disease-detection.api";

import { useTfliteModels } from "../models/useTfliteModels";
import { useLeafDetectionProcessor } from "../models/useLeafDetectionProcessor";
import { MOBILENET_INPUT_SIZE } from "../models/constants";
import PredictionResultCard from "./PredictionResultCard";
import {
  cropLeafImage,
  getConfidenceColor,
  commonShadow,
} from "./predict.utils";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function RealtimeScanScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const scheme = colorScheme ?? "light";
  const palette = Colors[scheme];

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("back");
  const cameraRef = useRef<Camera>(null);

  const {
    isLoading: modelsLoading,
    isYoloLoaded,
    isMobilenetLoaded,
    error: modelError,
    yoloModel,
    mobilenetModel,
    yoloOutputShape,
  } = useTfliteModels();

  const [isScanning, setIsScanning] = useState(true);
  const [detections, setDetections] = useState<LeafDetection[]>([]);
  const [isFrozen, setIsFrozen] = useState(false);
  const [selectedDetection, setSelectedDetection] =
    useState<LeafDetection | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [croppedUri, setCroppedUri] = useState<string | null>(null);
  const [frozenPhotoUri, setFrozenPhotoUri] = useState<string | null>(null);

  const cardBg = scheme === "dark" ? "rgba(30, 41, 59, 0.8)" : "#FFFFFF";
  const borderColor =
    scheme === "dark" ? "rgba(71, 85, 105, 0.4)" : "rgba(226, 232, 240, 1)";

  // ── Permission handling ──────────────────────────────────────────

  React.useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  // ── Frame size tracking ──────────────────────────────────────────

  const [frameSize, setFrameSize] = useState({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  });

  // Frame processor that runs YOLO on each frame
  const handleDetections = useCallback(
    (dets: LeafDetection[]) => {
      if (!isFrozen) setDetections(dets);
    },
    [isFrozen],
  );

  const { frameProcessor } = useLeafDetectionProcessor({
    yoloModel,
    onDetections: handleDetections,
    frameWidth: frameSize.width,
    frameHeight: frameSize.height,
    yoloOutputShape,
    isActive: isScanning && !isFrozen && isYoloLoaded,
    mode: "continuous",
  });

  // ── Freeze / tap on detection ────────────────────────────────────

  const handleFreeze = useCallback(async () => {
    if (!cameraRef.current) return null;
    setIsFrozen(true);
    setIsScanning(false);

    try {
      const photo = await cameraRef.current.takePhoto({});
      setFrozenPhotoUri(`file://${photo.path}`);
      setFrameSize({ width: photo.width, height: photo.height });
      return photo;
    } catch {
      // If photo capture fails, keep using live detections
      return null;
    }
  }, []);

  const handleResume = useCallback(() => {
    setIsFrozen(false);
    setIsScanning(true);
    setSelectedDetection(null);
    setResult(null);
    setCroppedUri(null);
    setFrozenPhotoUri(null);
  }, []);

  const handleTapDetection = useCallback(
    async (det: LeafDetection) => {
      let currentPhotoUri = frozenPhotoUri;
      let photoWidth = frameSize.width;
      let photoHeight = frameSize.height;

      if (!isFrozen) {
        // First freeze the camera, then select
        const photo = await handleFreeze();
        if (photo) {
          currentPhotoUri = `file://${photo.path}`;
          photoWidth = photo.width;
          photoHeight = photo.height;
        }
      }
      setSelectedDetection(det);

      // Crop and classify
      if (currentPhotoUri && mobilenetModel) {
        setIsPredicting(true);
        try {
          // Scale the bounding box from the video frame (frameSize from closure) to the high-res photo
          const scaleX = photoWidth / frameSize.width;
          const scaleY = photoHeight / frameSize.height;
          
          const scaledBoundingBox = {
            x1: det.boundingBox.x1 * scaleX,
            y1: det.boundingBox.y1 * scaleY,
            x2: det.boundingBox.x2 * scaleX,
            y2: det.boundingBox.y2 * scaleY,
          };

          const uri = await cropLeafImage(
            currentPhotoUri,
            scaledBoundingBox,
            { width: photoWidth, height: photoHeight },
          );
          setCroppedUri(uri);

          // Fallback: send the cropped JPEG to the backend Keras model
          const predictionResult = await diseaseDetectionApi.predictFromUri(
            uri,
            `crop-${Date.now()}.jpg`
          );
          if (predictionResult) {
            setResult(predictionResult);
          }
        } catch (error) {
          console.error('[RealtimeScan] Prediction error:', error);
          Alert.alert(
            t("diseaseDetection.error", "Error"),
            t(
              "diseaseDetection.predictFailed",
              "Failed to analyze. Please try again.",
            ),
          );
        } finally {
          setIsPredicting(false);
        }
      }
    },
    [
      isFrozen,
      handleFreeze,
      frozenPhotoUri,
      mobilenetModel,
      frameSize,
      t,
    ],
  );

  // ── Scale bounding boxes to screen ───────────────────────────────

  const scaleDetectionToScreen = useCallback(
    (det: LeafDetection) => {
      const scaleX = SCREEN_WIDTH / frameSize.width;
      const scaleY = SCREEN_HEIGHT / frameSize.height;
      const scale = Math.min(scaleX, scaleY);

      const renderedW = frameSize.width * scale;
      const renderedH = frameSize.height * scale;
      const offsetX = (SCREEN_WIDTH - renderedW) / 2;
      const offsetY = (SCREEN_HEIGHT - renderedH) / 2;

      return {
        left: offsetX + det.boundingBox.x1 * scale,
        top: offsetY + det.boundingBox.y1 * scale,
        width: (det.boundingBox.x2 - det.boundingBox.x1) * scale,
        height: (det.boundingBox.y2 - det.boundingBox.y1) * scale,
      };
    },
    [frameSize],
  );

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
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Camera */}
      <Camera
        ref={cameraRef}
        device={device}
        isActive={!isFrozen}
        photo={true}
        frameProcessor={frameProcessor}
        style={StyleSheet.absoluteFill}
        onInitialized={() => {
          // Get frame dimensions from device format
          if (device.formats.length > 0) {
            const format = device.formats[0];
            setFrameSize({
              width: format.videoWidth,
              height: format.videoHeight,
            });
          }
        }}
      />

      {/* Bounding box overlays */}
      {detections.map((det, idx) => {
        const box = scaleDetectionToScreen(det);
        const isSelected =
          selectedDetection?.boundingBox.x1 === det.boundingBox.x1 &&
          selectedDetection?.boundingBox.y1 === det.boundingBox.y1;

        return (
          <Pressable
            key={`det-${idx}`}
            onPress={() => handleTapDetection(det)}
            style={{
              position: "absolute",
              left: box.left,
              top: box.top,
              width: box.width,
              height: box.height,
              borderWidth: isSelected ? 3 : 2,
              borderColor: isSelected ? palette.primary : "#4ADE80",
              borderRadius: 4,
              backgroundColor: isSelected
                ? `${palette.primary}20`
                : "transparent",
            }}
          >
            <View
              style={{
                position: "absolute",
                top: -22,
                left: -1,
                backgroundColor: isSelected ? palette.primary : "#4ADE80",
                borderRadius: 4,
                paddingHorizontal: 6,
                paddingVertical: 2,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "700" }}>
                {t("diseaseDetection.leafItem", "Leaf {{num}}", {
                  num: idx + 1,
                })}
              </Text>
              <Text style={{ color: "#FFF", fontSize: 9, opacity: 0.85 }}>
                {(det.confidenceScore * 100).toFixed(0)}%
              </Text>
            </View>
          </Pressable>
        );
      })}

      {/* Model loading overlay */}
      {modelsLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>
            {t("diseaseDetection.loadingModels", "Loading AI models...")}
          </Text>
        </View>
      )}

      {/* Status bar at top */}
      <SafeAreaView style={styles.topBar}>
        <View style={styles.statusPill}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  isScanning && isYoloLoaded ? "#4ADE80" : "#F59E0B",
              },
            ]}
          />
          <Text style={styles.statusLabel}>
            {modelsLoading
              ? t("diseaseDetection.loadingModels", "Loading...")
              : isScanning
                ? t("diseaseDetection.scanning", "Scanning")
                : isFrozen
                  ? t("diseaseDetection.frozen", "Paused")
                  : t("diseaseDetection.ready", "Ready")}
          </Text>
          {detections.length > 0 && (
            <Text style={styles.detectionCount}>
              {t("diseaseDetection.leavesCount", "{{count}} leaves", {
                count: detections.length,
              })}
            </Text>
          )}
        </View>
      </SafeAreaView>

      {/* Bottom controls */}
      <SafeAreaView style={styles.bottomControls}>
        {/* Classification result card (when frozen + predicted) */}
        {result && selectedDetection && (
          <View style={styles.resultCard}>
            <PredictionResultCard
              cardBg={cardBg}
              borderColor={borderColor}
              palette={palette}
              scheme={scheme}
              result={result}
              croppedUri={croppedUri}
            />
          </View>
        )}

        {isPredicting && (
          <View style={styles.predictingPill}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.predictingText}>
              {t("diseaseDetection.analyzing", "Analyzing leaf...")}
            </Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          {isFrozen ? (
            <Pressable
              onPress={handleResume}
              style={[
                styles.actionButton,
                { backgroundColor: palette.primary },
              ]}
            >
              <Play size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>
                {t("diseaseDetection.resume", "Resume")}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleFreeze}
              disabled={detections.length === 0}
              style={[
                styles.actionButton,
                {
                  backgroundColor:
                    detections.length > 0
                      ? palette.primary
                      : "rgba(255,255,255,0.2)",
                },
              ]}
            >
              <Pause size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>
                {t("diseaseDetection.freeze", "Freeze")}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Hint text */}
        {!isFrozen && detections.length > 0 && (
          <Text style={styles.hintText}>
            {t(
              "diseaseDetection.tapLeafHint",
              "Tap a detected leaf or freeze to analyze",
            )}
          </Text>
        )}
      </SafeAreaView>
    </View>
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
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  detectionCount: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  bottomControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  resultCard: {
    marginBottom: 12,
    maxHeight: 250,
  },
  predictingPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 8,
  },
  predictingText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 8,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  hintText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
});
