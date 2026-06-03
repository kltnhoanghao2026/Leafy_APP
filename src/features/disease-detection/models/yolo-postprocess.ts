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

// ── NMS-baked-in parser ────────────────────────────────────────────

/**
 * Parse output from a YOLO TFLite model exported with NMS baked in
 * (Ultralytics `nms=True`).
 *
 * The model produces 4 output tensors:
 *   [0] detection_boxes:  [1, max_det, 4]  — normalised [y1, x1, y2, x2] in 0..1
 *   [1] detection_classes: [1, max_det]     — class index (float)
 *   [2] detection_scores:  [1, max_det]     — confidence score
 *   [3] detection_count:   [1]              — number of valid detections
 *
 * Coordinates are normalised to [0, 1] relative to the 640×640 input, then
 * scaled to the original image dimensions.
 */
export function parseYoloNmsOutput(
  outputs: ArrayBuffer[],
  imageWidth: number,
  imageHeight: number,
): LeafDetection[] {
  "worklet";
  const boxes = new Float32Array(outputs[0]);     // [max_det * 4]
  const classes = new Float32Array(outputs[1]);    // [max_det]
  const scores = new Float32Array(outputs[2]);     // [max_det]
  const countArr = new Float32Array(outputs[3]);   // [1]

  const numDetections = Math.round(countArr[0]);
  const results: LeafDetection[] = [];

  for (let i = 0; i < numDetections; i++) {
    const score = scores[i];
    if (score < YOLO_CONFIDENCE_THRESHOLD) continue;

    // TFLite NMS outputs normalised [y1, x1, y2, x2]
    const y1Norm = boxes[i * 4 + 0];
    const x1Norm = boxes[i * 4 + 1];
    const y2Norm = boxes[i * 4 + 2];
    const x2Norm = boxes[i * 4 + 3];

    const classIdx = Math.round(classes[i]);

    results.push({
      className: YOLO_CLASS_NAMES[classIdx] ?? "item",
      confidenceScore: score,
      boundingBox: {
        x1: Math.max(0, x1Norm * imageWidth),
        y1: Math.max(0, y1Norm * imageHeight),
        x2: Math.min(imageWidth, x2Norm * imageWidth),
        y2: Math.min(imageHeight, y2Norm * imageHeight),
      } satisfies BoundingBox,
    });
  }

  return results;
}

// ── Raw YOLO parser (no baked-in NMS, kept as fallback) ────────────

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

/**
 * Parse raw YOLO output (no baked-in NMS).
 * Shape [1, 5, 8400] or [1, 8400, 5].
 * Applies manual NMS.
 */
export function parseYoloRawOutput(
  outputBuffer: ArrayBufferLike,
  outputShape: number[],
  imageWidth: number,
  imageHeight: number,
  mode: "stretch" | "letterbox" | "center-crop" = "stretch"
): LeafDetection[] {
  "worklet";
  const data = new Float32Array(outputBuffer);

  const dim1 = outputShape.length === 3 ? outputShape[1] : outputShape[0];
  const dim2 = outputShape.length === 3 ? outputShape[2] : outputShape[1];

  const numBoxes = dim1 === 8400 ? dim1 : dim2 === 8400 ? dim2 : Math.max(dim1, dim2);
  const numValues = dim1 === 8400 ? dim2 : dim2 === 8400 ? dim1 : Math.min(dim1, dim2);

  const transposed = numValues === 5 && dim2 === 5;
  const rawDetections: RawDetection[] = [];
  
  let scaleX = imageWidth / YOLO_INPUT_SIZE;
  let scaleY = imageHeight / YOLO_INPUT_SIZE;
  let padX = 0;
  let padY = 0;

  if (mode === "letterbox") {
    const scale = Math.min(YOLO_INPUT_SIZE / imageWidth, YOLO_INPUT_SIZE / imageHeight);
    const newWidth = imageWidth * scale;
    const newHeight = imageHeight * scale;
    padX = (YOLO_INPUT_SIZE - newWidth) / 2;
    padY = (YOLO_INPUT_SIZE - newHeight) / 2;
    
    scaleX = 1 / scale;
    scaleY = 1 / scale;
  } else if (mode === "center-crop") {
    const size = Math.min(imageWidth, imageHeight);
    padX = -(imageWidth - size) / 2 * (YOLO_INPUT_SIZE / size);
    padY = -(imageHeight - size) / 2 * (YOLO_INPUT_SIZE / size);
    
    scaleX = size / YOLO_INPUT_SIZE;
    scaleY = size / YOLO_INPUT_SIZE;
  }

  for (let i = 0; i < numBoxes; i++) {
    let cx: number, cy: number, w: number, h: number;
    let maxClassConf = 0;
    let maxClassIdx = 0;

    if (transposed) {
      const offset = i * 5;
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
      const actualBoxes = numBoxes > numValues ? numBoxes : numValues;
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

    const x1 = (cx - w / 2 - padX) * scaleX;
    const y1 = (cy - h / 2 - padY) * scaleY;
    const x2 = (cx + w / 2 - padX) * scaleX;
    const y2 = (cy + h / 2 - padY) * scaleY;

    rawDetections.push({
      x1: Math.max(0, x1),
      y1: Math.max(0, y1),
      x2: Math.min(imageWidth, x2),
      y2: Math.min(imageHeight, y2),
      confidence: maxClassConf,
      classIndex: maxClassIdx,
    });
  }

  const kept = nms(rawDetections, YOLO_IOU_THRESHOLD);

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
