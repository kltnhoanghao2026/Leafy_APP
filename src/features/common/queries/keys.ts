export const commonKeys = {
  all: () => ["common"] as const,
  files: () => [...commonKeys.all(), "files"] as const,
  uploadAvatar: () => [...commonKeys.files(), "uploadAvatar"] as const,
};
