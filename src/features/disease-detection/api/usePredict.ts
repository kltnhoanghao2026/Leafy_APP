import { useMutation } from "@tanstack/react-query";
import type { ImagePickerAsset } from "expo-image-picker";

import {
  diseaseDetectionApi,
  type LeafDetectionResponse,
  type PredictionResponse,
} from "./disease-detection.api";

export const useDetectLeaf = () => {
  return useMutation<
    LeafDetectionResponse,
    Error,
    { asset: ImagePickerAsset; plantId?: string; farmPlotId?: string; farmZoneId?: string }
  >({
    mutationFn: ({ asset, plantId, farmPlotId, farmZoneId }) =>
      diseaseDetectionApi.detectLeaf(asset, { plantId, farmPlotId, farmZoneId }),
  });
};

export const usePredict = () => {
  return useMutation<
    PredictionResponse,
    Error,
    { uri: string; filename: string; plantId?: string; farmPlotId?: string; farmZoneId?: string }
  >({
    mutationFn: ({ uri, filename, plantId, farmPlotId, farmZoneId }) =>
      diseaseDetectionApi.predictFromUri(uri, filename, { plantId, farmPlotId, farmZoneId }),
  });
};
