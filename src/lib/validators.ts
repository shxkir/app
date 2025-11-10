import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d).+$/,
      "Password must contain at least one letter and one number."
    ),
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores."),
  displayName: z.string().min(2).max(40).optional(),
  bio: z.string().max(280).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const followSchema = z.object({
  userId: z.string().cuid(),
});

export const messageSchema = z.object({
  receiverId: z.string().cuid(),
  content: z.string().min(1).max(1024),
});

export const adminUserActionSchema = z.object({
  userId: z.string().cuid(),
  action: z.enum(["promote", "demote", "delete"]),
});
