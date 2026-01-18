import { z } from "zod";

export const createUserSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  role: z.enum(["admin", "customer"]).optional(),
});

export const updateUserSchema = createUserSchema.partial();
