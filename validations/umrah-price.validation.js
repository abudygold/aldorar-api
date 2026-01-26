import { z } from "zod";

export const createSchema = z.object({
  umrahPackageId: z.string().uuid(),
  roomType: z.enum(["quad", "triple", "double"]),
  price: z.number().positive(),
});

export const updateSchema = createSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be updated",
  });
