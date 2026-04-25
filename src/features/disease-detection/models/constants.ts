// ── YOLO Leaf Detection Model ──────────────────────────────────────

export const YOLO_INPUT_SIZE = 640;
export const YOLO_CONFIDENCE_THRESHOLD = 0.25;
export const YOLO_IOU_THRESHOLD = 0.45;
export const YOLO_NUM_CLASSES = 1;
export const YOLO_CLASS_NAMES = ["item"] as const;

// ── MobileNetV2 Classification Model ──────────────────────────────

export const MOBILENET_INPUT_SIZE = 224;
export const MOBILENET_CLASS_NAMES = [
  "healthy",
  "miner",
  "phoma",
  "red_spider_mite",
  "rust",
] as const;
export const MOBILENET_NUM_CLASSES = MOBILENET_CLASS_NAMES.length;

/**
 * Whether the bundled .tflite model's final layer already applies softmax.
 *
 * The Keras model is exported WITH a softmax output activation, so predictions
 * already sum to ~1.0. Set to `false` if re-exported without softmax (raw logits).
 *
 * This must match the backend: prediction_service.py feeds raw model output
 * directly without a second softmax pass.
 */
export const MOBILENET_OUTPUT_HAS_SOFTMAX = true;
