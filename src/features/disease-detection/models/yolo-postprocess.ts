import type { BoundingBox, LeafDetection } from "../api/disease-detection.api";
import {
  YOLO_INPUT_SIZE,
  YOLO_CONFIDENCE_THRESHOLD,
  YOLO_IOU_THRESHOLD,
  YOLO_CLASS_NAMES,
  YOLO_NUM_CLASSES,
} from "./constants";

// ── Types ──────────────────────────────────────────────────────────

interface RawDetection {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  confidence: number;
  classIndex: number;
}

// ── Helpers (worklet-compatible, plain JS) ─────────────────────────

function iou(a: RawDetection, b: RawDetection): number {
  "worklet";
  const interX1 = Math.max(a.x1, b.x1);
  const interY1 = Math.max(a.y1, b.y1);
  const interX2 = Math.min(a.x2, b.x2);
  const interY2 = Math.min(a.y2, b.y2);

  const interArea =
    Math.max(0, interX2 - interX1) * Math.max(0, interY2 - interY1);
  const areaA = (a.x2 - a.x1) * (a.y2 - a.y1);
  const areaB = (b.x2 - b.x1) * (b.y2 - b.y1);
  const unionArea = areaA + areaB - interArea;

  return unionArea > 0 ? interArea / unionArea : 0;
}

function nms(detections: RawDetection[], iouThreshold: number): RawDetection[] {
  "worklet";
  // Sort by confidence descending
  const sorted = detections.slice().sort((a, b) => b.confidence - a.confidence);
  const kept: RawDetection[] = [];

  for (const det of sorted) {
    let suppress = false;
    for (const k of kept) {
      if (iou(det, k) > iouThreshold) {
        suppress = true;
        break;
      }
    }
    if (!suppress) kept.push(det);
  }

  return kept;
}

// ── Main post-processing ───────────────────────────────────────────

/**
 * Parse YOLO TFLite output tensor into LeafDetection[].
 *
 * The YOLO model (exported via Ultralytics → SavedModel → TFLite) typically
 * outputs shape [1, 5, 8400] where:
 *   - dim 1 = [cx, cy, w, h, class_conf] (for 1-class model: 4 + 1 = 5)
 *   - dim 2 = 8400 candidate boxes
 *
 * If the tensor is transposed to [1, 8400, 5], we detect that and handle it.
 *
 * Coordinates are in the YOLO input space (0..640). We scale them to the
 * original image dimensions.
 *
 * @param outputBuffer Raw ArrayBuffer from TFLite model
 * @param outputShape  Shape of the output tensor, e.g. [1, 5, 8400]
 * @param imageWidth   Original image width (for scaling)
 * @param imageHeight  Original image height (for scaling)
 */
export function parseYoloOutput(
  outputBuffer: ArrayBufferLike,
  outputShape: number[],
  imageWidth: number,
  imageHeight: number,
): LeafDetection[] {
  "worklet";
  const data = new Float32Array(outputBuffer);

  // Robust dimension extraction logic: explicitly find 8400 for boxes
  const dim1 = outputShape.length === 3 ? outputShape[1] : outputShape[0];
  const dim2 = outputShape.length === 3 ? outputShape[2] : outputShape[1];

  // YOLO models typically have 8400 (YOLOv8/11) boxes at 640x640
  const numBoxes = dim1 === 8400 ? dim1 : dim2 === 8400 ? dim2 : Math.max(dim1, dim2);
  const numValues = dim1 === 8400 ? dim2 : dim2 === 8400 ? dim1 : Math.min(dim1, dim2);

  // Determine if shape is [..., 8400, 5] (transposed) or [..., 5, 8400]
  const transposed = numValues === 5 && dim2 === 5;

  const rawDetections: RawDetection[] = [];

  const expectedValues = 4 + YOLO_NUM_CLASSES; // cx, cy, w, h, + class confs

  const scaleX = imageWidth / YOLO_INPUT_SIZE;
  const scaleY = imageHeight / YOLO_INPUT_SIZE;

  const actualNumBoxes = transposed
    ? numBoxes
    : numValues === expectedValues
      ? numBoxes
      : numValues;
  const stride = transposed ? 5 : expectedValues;

  for (let i = 0; i < numBoxes; i++) {
    let cx: number, cy: number, w: number, h: number;
    let maxClassConf = 0;
    let maxClassIdx = 0;

    if (transposed) {
      // Shape [1, 8400, 5]: row-major, each row is [cx, cy, w, h, conf]
      const offset = i * stride;
      cx = data[offset];
      cy = data[offset + 1];
      w = data[offset + 2];
      h = data[offset + 3];

      for (let c = 0; c < YOLO_NUM_CLASSES; c++) {
        const conf = data[offset + 4 + c];
        if (conf > maxClassConf) {
          maxClassConf = conf;
          maxClassIdx = c;
        }
      }
    } else {
      // Shape [1, 5, 8400]: each channel is a separate row of 8400 values
      const boxCount = numBoxes > numValues ? numBoxes : numValues;
      const actualBoxes = boxCount === 8400 ? 8400 : numBoxes;
      cx = data[0 * actualBoxes + i];
      cy = data[1 * actualBoxes + i];
      w = data[2 * actualBoxes + i];
      h = data[3 * actualBoxes + i];

      for (let c = 0; c < YOLO_NUM_CLASSES; c++) {
        const conf = data[(4 + c) * actualBoxes + i];
        if (conf > maxClassConf) {
          maxClassConf = conf;
          maxClassIdx = c;
        }
      }
    }

    if (maxClassConf < YOLO_CONFIDENCE_THRESHOLD) continue;

    // Convert center-format to corner-format and scale to original image
    const x1 = (cx - w / 2) * scaleX;
    const y1 = (cy - h / 2) * scaleY;
    const x2 = (cx + w / 2) * scaleX;
    const y2 = (cy + h / 2) * scaleY;

    rawDetections.push({
      x1: Math.max(0, x1),
      y1: Math.max(0, y1),
      x2: Math.min(imageWidth, x2),
      y2: Math.min(imageHeight, y2),
      confidence: maxClassConf,
      classIndex: maxClassIdx,
    });
  }

  // Apply NMS
  const kept = nms(rawDetections, YOLO_IOU_THRESHOLD);

  // Convert to LeafDetection format
  return kept.map((det) => ({
    className: YOLO_CLASS_NAMES[det.classIndex] ?? "item",
    confidenceScore: det.confidence,
    boundingBox: {
      x1: det.x1,
      y1: det.y1,
      x2: det.x2,
      y2: det.y2,
    } satisfies BoundingBox,
  }));
}
