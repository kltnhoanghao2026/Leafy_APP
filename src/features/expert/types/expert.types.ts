import type { CommunityPage } from "@/src/features/community/community-feed/components/community.types";

export type CertificateDto = {
  id: string;
  name: string;
  issuedBy: string;
  issuedAt: string;
  expiryDate?: string;
  documentUrl?: string;
};

export type ExpertProfile = {
  id: string;
  userId: string;
  fullName: string;
  profilePicture: string;
  avatar: string;
  role: "FARMER" | "EXPERT";
  specialty: string;
  certificates: CertificateDto[];
  isVerified: boolean;
  bio: string;
  addressLine: string;
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  latitude: number;
  longitude: number;
  active: boolean;
  email: string;
  phoneNumber: string;
  createdAt: string;
  lastModifiedAt: string;
  isFollowing: boolean;
  hasPendingConsultRequest: boolean;
};

export type ExpertsPage = CommunityPage<ExpertProfile>;

export type ConsultationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";

export type ExpertPalette = {
  text: string;
  background: string;
  primary: string;
  textGray: string;
  textInputPlaceholder: string;
};
