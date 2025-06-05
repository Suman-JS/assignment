import { z } from "zod";

export const registerUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Email is required"),
  gender: z
    .enum(["male", "female", "other"])
    .refine((val) => ["male", "female", "other"].includes(val), {
      message: "Choose one of: male, female, or other",
    }),
  password: z
    .string({
      message: "Password is required",
    })
    .min(6, "Password must be at least 6 characters"),
});

export const UpdateSchema = registerUserSchema
  .pick({
    name: true,
    gender: true,
  })
  .optional();

export const loginSchema = registerUserSchema.pick({
  email: true,
  password: true,
});

export const verifySchema = z.object({
  email: z.string().email("Email is required"),
  otp: z
    .number({
      message: "OTP is required",
    })
    .min(6, "OTP must be 6 digits"),
});

export type Register = z.infer<typeof registerUserSchema>;

export type Login = z.infer<typeof loginSchema>;

export type Verify = z.infer<typeof verifySchema>;

export type Update = z.infer<typeof UpdateSchema>;
