import { useMutation } from "@tanstack/react-query";
import type { ImagePickerAsset } from "expo-image-picker";

import {
  diseaseDetectionApi,
  type LeafDetectionResponse,
  type PredictionResponse,
} from "./disease-detection.api";

export const useDetectLeaf = () => {
  return useMutation<LeafDetectionResponse, Error, ImagePickerAsset>({
    mutationFn: (asset) => diseaseDetectionApi.detectLeaf(asset),
  });
};

export const usePredict = () => {
  return useMutation<
    PredictionResponse,
    Error,
    { uri: string; filename: string }
  >({
    mutationFn: ({ uri, filename }) =>
      diseaseDetectionApi.predictFromUri(uri, filename),
  });
};
