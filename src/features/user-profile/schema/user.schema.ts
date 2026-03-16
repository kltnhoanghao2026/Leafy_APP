export interface UserProfile {
  id: string;
  userId: string;
  fullName?: string;
  profilePicture?: string;
  avatar?: string;
  role: string;
  specialty?: string;
  isVerified: boolean;
  bio?: string;
  active: boolean;
  email?: string;
  phoneNumber?: string;
  createdAt: string;
  lastModifiedAt?: string;
}
