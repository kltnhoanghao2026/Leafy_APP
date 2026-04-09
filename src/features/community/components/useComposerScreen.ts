import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next";

import { fileApi } from "@/src/features/common/api/file.api";
import { useCreatePostMutation } from "../queries/mutations";
import type {
  BackendPostMedia,
  PostCreateRequest,
  PostVisibility,
} from "./community.types";
import { useComposerAvatar } from "./useComposerAvatar";

export function useComposerScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [visibility, setVisibility] = useState<PostVisibility>("ALL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const avatar = useComposerAvatar();
  const createPostMutation = useCreatePostMutation();

  const canPost = caption.trim().length > 0 || media.length > 0;

  const pickMedia = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10,
    });

    if (!result.canceled && result.assets.length > 0) {
      setMedia((prev) => [...prev, ...result.assets]);
    }
  }, []);

  const removeMedia = useCallback((index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const submitPost = useCallback(async () => {
    if (!canPost || isSubmitting) return;

    setIsSubmitting(true);

    try {
      let uploadedMedia: BackendPostMedia[] = [];

      if (media.length > 0) {
        const uploadResults = await Promise.all(
          media.map((asset) => fileApi.uploadPostMedia(asset)),
        );
        uploadedMedia = uploadResults;
      }

      const request: PostCreateRequest = {
        content: {
          caption: caption.trim() || undefined,
        },
        media: uploadedMedia.length > 0 ? uploadedMedia : undefined,
        postType: "FEED",
        visibility,
      };

      await createPostMutation.mutateAsync(request);

      Alert.alert("", t("community.composer.postSuccess"));
      router.back();
    } catch {
      Alert.alert("", t("community.composer.postError"));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    canPost,
    isSubmitting,
    caption,
    media,
    visibility,
    createPostMutation,
    router,
    t,
  ]);

  return {
    caption,
    setCaption,
    media,
    visibility,
    setVisibility,
    isSubmitting,
    canPost,
    pickMedia,
    removeMedia,
    submitPost,
    ...avatar,
  };
}
