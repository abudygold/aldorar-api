import { z } from "zod";

export const createSchema = z.object({
  firstName: z.string().max(100),
  lastName: z.string().max(100),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  role: z.enum(["admin", "customer", "owner"]).optional(),
  isActive: z.boolean().optional(),
});

export const updateSchema = createSchema
  .omit({ password: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be updated",
  });
