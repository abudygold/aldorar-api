import { z } from "zod";

export const createSchema = z.object({
  tripPackageId: z.string().uuid(),
  jamaahCount: z.number().int().positive(),
  pricePerPerson: z.number().positive(),
});

export const updateSchema = z
  .object({
    status: z.enum(["pending", "paid", "confirmed", "canceled"]).optional(),
    jamaahCount: z.number().int().positive().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be updated",
  });
