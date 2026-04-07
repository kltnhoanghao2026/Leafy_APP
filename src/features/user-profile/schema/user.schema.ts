export type UserRole = "FARMER" | "EXPERT";

export interface CertificateResponse {
  id: string;
  title: string;
  issuedBy: string;
  proofUrl: string;
  issueDate: string;
  expired: boolean;
}

export type ApprovalRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface AddCertificateRequest {
  title: string;
  issuedBy: string;
  proofUrl: string;
  issueDate: string;
}

export interface CreateApprovalRequest {
  certificates: AddCertificateRequest[];
}

export interface ApprovalRequestResponse {
  id: string;
  profileId: string;
  certificates: CertificateResponse[];
  status: ApprovalRequestStatus | string;
  rejectionReason?: string | null;
}

export interface UserPreferenceGeneralSettings {
  showAllFriends?: boolean;
  languageEn?: boolean;
}

export interface UserPreferenceSecuritySettings {
  twoFactorEnabled?: boolean;
}

export interface UserPreferencePrivacySettings {
  showDob?: "FULL_DATE" | "MONTH_DAY" | "YEAR" | "NONE" | string;
  showActiveStatus?: boolean;
  showReadStatus?: boolean;
  canText?: "EVERYBODY" | "FRIENDS" | "NOBODY" | string;
  canCall?: "EVERYBODY" | "FRIENDS" | "NOBODY" | string;
  showPosts?: boolean;
  showPostAfter?: string | null;
  allowSearchOnPhoneNumber?: boolean;
}

export interface UserPreferenceSyncSettings {
  syncSuggestion?: boolean;
  showSyncProgress?: boolean;
}

export interface UserPreferenceAppearanceSettings {
  theme?: boolean;
}

export interface UserPreferenceMessageSettings {
  quickResponseEnable?: boolean;
  separatePriorityAndOtherEnable?: boolean;
  showTypingStatus?: boolean;
}

export interface UserPreferenceNotificationSettings {
  notifyNewMessageFromDirect?: boolean;
  previewNewMessageFromDirect?: boolean;
  notifyNewMessageFromGroup?: boolean;
  notifyCall?: boolean;
  notifyNewPostFromFriend?: boolean;
  notifyDOB?: boolean;
  notifyNewMessage?: boolean;
  shakeOnNewMessage?: boolean;
  previewNewMessage?: boolean;
}

export interface UserPreferenceUtilitiesSettings {
  stickerSuggestion?: boolean;
}

export interface UserPreferenceRequest {
  generalSettings?: UserPreferenceGeneralSettings;
  securitySettings?: UserPreferenceSecuritySettings;
  privacySettings?: UserPreferencePrivacySettings;
  syncSettings?: UserPreferenceSyncSettings;
  appearanceSettings?: UserPreferenceAppearanceSettings;
  messageSettings?: UserPreferenceMessageSettings;
  notificationSettings?: UserPreferenceNotificationSettings;
  utilitiesSettings?: UserPreferenceUtilitiesSettings;
}

export interface ProfileResponse {
  id: string;
  userId: string;
  fullName?: string;
  profilePicture?: string;
  avatar?: string;
  role?: UserRole;
  specialty?: string;
  certificates?: CertificateResponse[];
  isVerified?: boolean;
  bio?: string;
  active: boolean;
  email?: string;
  phoneNumber?: string;
  createdAt: string;
  lastModifiedAt?: string;
}

export interface ProfileUpdateRequest {
  avatar?: string;
  role?: UserRole;
  specialty?: string;
  bio?: string;
  fullName?: string;
  userPreference?: UserPreferenceRequest;
}
