import type { PredictionResult } from "../api/disease-detection.api";
import { MOBILENET_CLASS_NAMES, MOBILENET_NUM_CLASSES, MOBILENET_OUTPUT_HAS_SOFTMAX } from "./constants";

type MobilenetOutputTensor = Float32Array | ArrayBufferLike;

/**
 * Apply softmax to a raw logits array.
 */
function softmax(logits: Float32Array): Float32Array {
  "worklet";
  const maxVal = logits.reduce((m, v) => Math.max(m, v), -Infinity);
  const exps = new Float32Array(logits.length);
  let sum = 0;
  for (let i = 0; i < logits.length; i++) {
    exps[i] = Math.exp(logits[i] - maxVal);
    sum += exps[i];
  }
  for (let i = 0; i < exps.length; i++) {
    exps[i] /= sum;
  }
  return exps;
}

/**
 * Parse MobileNetV2 TFLite output into PredictionResult[].
 *
 * The model outputs [1, 5] — one score per class.
 * Whether softmax is applied is controlled by MOBILENET_OUTPUT_HAS_SOFTMAX:
 *   - true  → model already outputs probabilities (baked-in softmax). Use as-is.
 *   - false → model outputs raw logits. Apply softmax here.
 *
 * This matches the backend (prediction_service.py), which also uses the raw
 * model output directly without a secondary softmax pass.
 *
 * @param outputTensor Raw Float32Array or ArrayBuffer from TFLite model output
 */
export function parseMobilenetOutput(
  outputTensor: MobilenetOutputTensor,
): PredictionResult[] {
  "worklet";
  const raw =
    outputTensor instanceof Float32Array
      ? outputTensor
      : new Float32Array(outputTensor);
  const values = raw.slice(0, MOBILENET_NUM_CLASSES);

  // Sanitise non-finite values
  for (let i = 0; i < values.length; i++) {
    if (!Number.isFinite(values[i])) values[i] = 0;
  }

  // Apply softmax only when the model does NOT bake it in (i.e. outputs logits)
  const probs = MOBILENET_OUTPUT_HAS_SOFTMAX ? values : softmax(values);

  // Build results sorted by confidence descending
  const results: PredictionResult[] = [];
  for (let i = 0; i < MOBILENET_NUM_CLASSES; i++) {
    results.push({
      className: MOBILENET_CLASS_NAMES[i],
      confidenceScore: probs[i],
    });
  }

  results.sort((a, b) => b.confidenceScore - a.confidenceScore);
  return results;
}
