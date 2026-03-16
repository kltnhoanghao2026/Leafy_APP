import type { AuthResponse } from "@/src/lib/axios";

export type { AuthResponse };

export interface RegistrationInitResponse {
  message: string;
  email: string;
  expiresInSeconds: number;
}
