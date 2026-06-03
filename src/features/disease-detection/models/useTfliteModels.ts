import { useTensorflowModel } from "react-native-fast-tflite";

import type {
  LeafDetectionResponse,
  PredictionResponse,
} from "../api/disease-detection.api";
import { YOLO_INPUT_SIZE, MOBILENET_INPUT_SIZE } from "./constants";
import { parseYoloRawOutput } from "./yolo-postprocess";
import { parseMobilenetOutput } from "./mobilenet-postprocess";

// ── Asset requires (bundled .tflite files) ─────────────────────────

// eslint-disable-next-line @typescript-eslint/no-require-imports
const YOLO_MODEL_SOURCE = require("@/assets/models/yolo_int8.tflite");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const MOBILENET_MODEL_SOURCE = require("@/assets/models/coffee_mobilenetv2.tflite");

// ── Hook ────────────────────────────────────────────────────────────

export function useTfliteModels() {
  const yoloPlugin = useTensorflowModel(YOLO_MODEL_SOURCE);
  const mobilenetPlugin = useTensorflowModel(MOBILENET_MODEL_SOURCE);

  const yoloModel =
    yoloPlugin.state === "loaded" ? yoloPlugin.model : undefined;
  const mobilenetModel =
    mobilenetPlugin.state === "loaded" ? mobilenetPlugin.model : undefined;

  // ── Startup diagnostics ─────────────────────────────────────────
  // Log input/output metadata once so mismatches are immediately visible
  if (yoloPlugin.state === "loaded" && yoloModel) {
    const inp = yoloModel.inputs[0];
    console.log(
      `[YOLO] input  dtype=${inp?.dataType}  shape=${JSON.stringify(inp?.shape)}`,
    );
    console.log(
      `[YOLO] ${yoloModel.outputs.length} output tensor(s):`,
    );
    for (let i = 0; i < yoloModel.outputs.length; i++) {
      const out = yoloModel.outputs[i];
      console.log(
        `  [YOLO] output[${i}] dtype=${out?.dataType}  shape=${JSON.stringify(out?.shape)}`,
      );
    }
  }
  if (mobilenetPlugin.state === "loaded" && mobilenetModel) {
    const inp = mobilenetModel.inputs[0];
    const out = mobilenetModel.outputs[0];
    console.log(
      `[MobileNet] input  dtype=${inp?.dataType}  shape=${JSON.stringify(inp?.shape)}`,
    );
    console.log(
      `[MobileNet] output dtype=${out?.dataType}  shape=${JSON.stringify(out?.shape)}`,
    );
  }

  const isLoading =
    yoloPlugin.state === "loading" || mobilenetPlugin.state === "loading";
  const error =
    yoloPlugin.state === "error"
      ? yoloPlugin.error
      : mobilenetPlugin.state === "error"
        ? mobilenetPlugin.error
        : undefined;

  /**
   * Run YOLO leaf detection on an image represented as an ArrayBuffer.
   * The input must already be resized to 640x640x3 RGB uint8.
   *
   * The bundled model uses INT8 weights for size reduction but float32
   * input/output for full precision (dynamic-range quantization).
   * The uint8 pixel values are converted to float32 before inference.
   */
  const runYoloOnBuffer = (
    inputBuffer: ArrayBuffer,
    originalWidth: number,
    originalHeight: number,
    mode: "stretch" | "letterbox" | "center-crop" = "stretch"
  ): LeafDetectionResponse | null => {
    if (!yoloModel) return null;

    // Convert uint8 [0,255] -> float32 [0,1] (YOLO expects normalised input)
    const uint8 = new Uint8Array(inputBuffer);
    const float32 = new Float32Array(uint8.length);
    for (let i = 0; i < uint8.length; i++) {
      float32[i] = uint8[i] / 255.0;
    }

    const start = performance.now();
    const outputs = yoloModel.runSync([float32]);
    const elapsed = performance.now() - start;

    console.log(`[Local Inference] YOLO executed in ${elapsed.toFixed(2)}ms`);

    // Parse float32 output [1, 5, 8400] with manual NMS
    const outputShape = yoloModel.outputs[0]?.shape ?? [1, 5, 8400];
    const detections = parseYoloRawOutput(
      outputs[0]!.buffer,
      outputShape,
      originalWidth,
      originalHeight,
      mode
    );

    console.log(`[Local Inference] YOLO found ${detections.length} detections`);

    return {
      detections,
      modelName: "YOLO-Leaf (on-device)",
      imageWidth: originalWidth,
      imageHeight: originalHeight,
      processingTimeMs: elapsed,
      detectionCount: detections.length,
    };
  };

  /**
   * Run MobileNetV2 classification on an image represented as an ArrayBuffer.
   *
   * The input must already be resized to 224x224x3 RGB.
   * Pixel values must be in the range [0, 1] (float32 from expo-image-manipulator);
   * this function scales them to [0, 255] to match the backend preprocessing
   * (PIL casts raw uint8 → float32 without dividing by 255).
   */
  const runClassifierOnBuffer = (
    inputBuffer: ArrayBuffer,
  ): PredictionResponse | null => {
    if (!mobilenetModel) return null;

    const start = performance.now();

    // Scale [0, 1] → [0, 255] to match backend PIL preprocessing
    const floatInput = new Float32Array(inputBuffer);
    for (let i = 0; i < floatInput.length; i++) {
      floatInput[i] = floatInput[i] * 255;
    }

    const outputs = mobilenetModel.runSync([floatInput]);
    const elapsed = performance.now() - start;

    console.log(`[Local Inference] MobileNetV2-Coffee executed in ${elapsed.toFixed(2)}ms`);

    const predictions = parseMobilenetOutput(outputs[0]! as Float32Array);

    return {
      predictions,
      modelName: "MobileNetV2-Coffee (on-device)",
      processingTimeMs: elapsed,
    };
  };

  return {
    // Loading states
    isLoading,
    isYoloLoaded: yoloPlugin.state === "loaded",
    isMobilenetLoaded: mobilenetPlugin.state === "loaded",
    error,

    // Raw model refs
    yoloModel,
    mobilenetModel,

    // Model metadata
    yoloInputSize: YOLO_INPUT_SIZE,
    mobilenetInputSize: MOBILENET_INPUT_SIZE,
    yoloOutputShape: yoloModel?.outputs[0]?.shape,

    // High-level runners (for non-worklet use, e.g. capture mode)
    runYoloOnBuffer,
    runClassifierOnBuffer,
  };
}
