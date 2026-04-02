import { useMutation } from "@tanstack/react-query";
import type { ImagePickerAsset } from "expo-image-picker";

import { fileApi } from "../api/file.api";
import { commonKeys } from "./keys";

export const useUploadAvatarMutation = () =>
  useMutation({
    mutationKey: commonKeys.uploadAvatar(),
    mutationFn: (asset: ImagePickerAsset) => fileApi.uploadAvatar(asset),
  });
