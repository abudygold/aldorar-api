import { z } from "zod";

const characterSchema = z.string().max(60);

export const createSchema = z.object({
  label: characterSchema,
  code: characterSchema,
});

export const updateSchema = createSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be updated",
  });
