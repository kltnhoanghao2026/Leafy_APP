import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { getMyProfileQueryOptions } from "@/src/features/user-profile/queries/options";

export function useComposerAvatar() {
  const { t } = useTranslation();
  const [isAvatarError, setIsAvatarError] = useState(false);
  const { data: profile } = useQuery(getMyProfileQueryOptions());

  const displayName =
    profile?.fullName?.trim() || t("screens.profile.profileUser", "Người dùng");

  const avatarUri =
    profile?.profilePicture?.trim() || profile?.avatar?.trim() || "";

  const avatarLetter = useMemo(() => {
    const first = displayName.charAt(0);
    return first ? first.toUpperCase() : "U";
  }, [displayName]);

  const shouldShowLetterAvatar = !avatarUri || isAvatarError;

  return {
    displayName,
    avatarUri,
    avatarLetter,
    shouldShowLetterAvatar,
    setIsAvatarError,
  };
}
