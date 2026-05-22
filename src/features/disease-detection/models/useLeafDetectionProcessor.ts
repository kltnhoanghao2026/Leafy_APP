import { useCallback } from "react";
import { useSharedValue, useRunOnJS } from "react-native-worklets-core";
import { useFrameProcessor } from "react-native-vision-camera";
import { useResizePlugin } from "vision-camera-resize-plugin";

import type { LeafDetection } from "../api/disease-detection.api";
import { YOLO_INPUT_SIZE, YOLO_NUM_CLASSES, MOBILENET_INPUT_SIZE } from "./constants";
import { parseYoloRawOutput } from "./yolo-postprocess";
import { parseMobilenetOutput } from "./mobilenet-postprocess";

interface UseLeafDetectionProcessorOptions {
  /** YOLO TFLite model (JSI HostObject, shared to worklet by VisionCamera) */
  yoloModel?:
    | ReturnType<
        typeof import("react-native-fast-tflite").useTensorflowModel
      >["model"]
    | undefined;
  /** MobileNetV2 TFLite model */
  mobilenetModel?:
    | ReturnType<
        typeof import("react-native-fast-tflite").useTensorflowModel
      >["model"]
    | undefined;
  /** Callback to deliver detections back to JS thread */
  onDetections: (detections: LeafDetection[]) => void;
  /** Original frame width for coordinate scaling */
  frameWidth: number;
  /** Original frame height for coordinate scaling */
  frameHeight: number;
  /** YOLO output shape from model metadata */
  yoloOutputShape: number[] | undefined;
  /** Whether the processor should be active */
  isActive: boolean;
  /** Run mode: 'continuous' (realtime) or 'on-demand' (only runs when trigger() is called) */
  mode?: "continuous" | "on-demand";
}

function clamp(value: number, min: number, max: number): number {
  "worklet";
  return Math.min(max, Math.max(min, value));
}

function makeSafeCropRect(
  box: { x1: number; y1: number; x2: number; y2: number },
  frameWidth: number,
  frameHeight: number,
) {
  "worklet";
  const x1 = clamp(Math.floor(box.x1), 0, Math.max(0, frameWidth - 1));
  const y1 = clamp(Math.floor(box.y1), 0, Math.max(0, frameHeight - 1));
  const x2 = clamp(Math.ceil(box.x2), x1 + 1, frameWidth);
  const y2 = clamp(Math.ceil(box.y2), y1 + 1, frameHeight);

  return {
    x: x1,
    y: y1,
    width: Math.max(1, x2 - x1),
    height: Math.max(1, y2 - y1),
  };
}

function scaleFloat01To255(input: Float32Array): Float32Array {
  "worklet";
  const scaled = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) {
    scaled[i] = input[i] * 255;
  }
  return scaled;
}

/**
 * Creates a VisionCamera frame processor that runs YOLO leaf detection
 * on every frame. Detections are passed back to the JS thread via
 * Worklets.createRunOnJS.
 *
 * The bundled model uses INT8 weights for size reduction but float32
 * input/output (dynamic-range quantization), so no dequantization is needed.
 */
export function useLeafDetectionProcessor({
  yoloModel,
  mobilenetModel,
  onDetections,
  frameWidth,
  frameHeight,
  yoloOutputShape,
  isActive,
  mode = "continuous",
}: UseLeafDetectionProcessorOptions) {
  const { resize } = useResizePlugin();
  const lastInferenceTime = useSharedValue(0);
  const shouldDetect = useSharedValue(false);

  const deliverDetections = useRunOnJS(onDetections, [onDetections]);
  
  const triggerDetection = useCallback(() => {
    shouldDetect.value = true;
  }, [shouldDetect]);
  const outputShape = yoloOutputShape ?? [1, 4 + YOLO_NUM_CLASSES, 8400];
  const origW = frameWidth || 640;
  const origH = frameHeight || 480;

  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      if (!isActive || yoloModel == null) return;

      if (mode === "on-demand") {
        if (!shouldDetect.value) return;
        shouldDetect.value = false;
      } else {
        // Throttle: skip if less than 100ms since last inference (~10fps max)
        const now = performance.now();
        if (now - lastInferenceTime.value < 100) return;
        lastInferenceTime.value = now;
      }

      const size = Math.min(frame.width, frame.height);
      const cropX = (frame.width - size) / 2;
      const cropY = (frame.height - size) / 2;

      // Resize frame to YOLO input size (float32 for the model)
      const resized = resize(frame, {
        crop: {
          x: cropX,
          y: cropY,
          width: size,
          height: size,
        },
        scale: {
          width: YOLO_INPUT_SIZE,
          height: YOLO_INPUT_SIZE,
        },
        pixelFormat: "rgb",
        dataType: "float32",
      });

      // Run YOLO inference
      const infStart = performance.now();
      const outputs = yoloModel.runSync([resized]);
      const infElapsed = performance.now() - infStart;
      console.log(`[Local Inference] YOLO (Realtime) executed in ${Math.round(infElapsed)}ms`);

      // Parse float32 output [1, 5, 8400] with manual NMS
      const detections = parseYoloRawOutput(
        outputs[0]!.buffer,
        outputShape,
        frame.width,
        frame.height,
        "center-crop"
      );

      // If in on-demand mode (taking a photo) and mobilenet is loaded,
      // run MobileNetV2 on each detection!
      if (mode === "on-demand" && mobilenetModel && detections.length > 0) {
        const mobilenetExpectsFloat32 =
          mobilenetModel.inputs[0]?.dataType === "float32";
        const mobilenetInputType = mobilenetExpectsFloat32
          ? "float32"
          : "uint8";
        for (let i = 0; i < detections.length; i++) {
          const det = detections[i];
          const cropRect = makeSafeCropRect(det.boundingBox, frame.width, frame.height);

          // Crop and resize using vision-camera-resize-plugin
          const croppedAndResized = resize(frame, {
            crop: {
              x: cropRect.x,
              y: cropRect.y,
              width: cropRect.width,
              height: cropRect.height,
            },
            scale: { width: MOBILENET_INPUT_SIZE, height: MOBILENET_INPUT_SIZE },
            pixelFormat: "rgb",
            dataType: mobilenetInputType,
          });

          // When float32, resize plugin returns [0, 1]; scale to [0, 255] to
          // match backend PIL preprocessing (raw uint8 cast to float32, no /255).
          const mobilenetInput = mobilenetExpectsFloat32
            ? scaleFloat01To255(croppedAndResized as Float32Array)
            : (croppedAndResized as Uint8Array);

          const mnStart = performance.now();
          const mnOutputs = mobilenetModel.runSync([mobilenetInput]);
          const mnElapsed = performance.now() - mnStart;
          console.log(
            `[Local Inference] MobileNetV2 (frame) dtype=${mobilenetInputType} executed in ${Math.round(mnElapsed)}ms`,
          );

          // Assuming output shape [1, num_classes]
          const predictions = parseMobilenetOutput(
            mnOutputs[0]! as Float32Array,
          );

          det.localPrediction = {
            predictions: predictions,
            modelName: "Coffee-MobileNetV2-TFLite-Local",
            processingTimeMs: performance.now() - infStart,
          };
        }
      }

      // Deliver results back to JS thread
      deliverDetections(detections);
    },
    [yoloModel, isActive, mode, outputShape, origW, origH],
  );

  return { frameProcessor, triggerDetection };
}
