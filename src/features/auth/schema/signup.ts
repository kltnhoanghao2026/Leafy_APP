import { z } from "zod";

export const signupStep1Schema = z
  .object({
    email: z.string().min(1, "Email is required").email("Invalid email format"),
    phoneNumber: z
      .string()
      .optional()
      .refine(
        (v) => !v || /^(\+84|0)[0-9]{9}$/.test(v),
        "Phone number must be a valid Vietnamese phone number",
      ),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupStep1Values = z.infer<typeof signupStep1Schema>;

export const signupOtpSchema = z.object({
  otp: z
    .string()
    .min(6, "OTP must be 6 digits")
    .max(6, "OTP must be 6 digits")
    .regex(/^[0-9]{6}$/, "OTP must contain only digits"),
});

export type SignupOtpValues = z.infer<typeof signupOtpSchema>;
