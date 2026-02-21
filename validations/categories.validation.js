import { z } from "zod";

const characterSchema = z.string().max(60);

export const createSchema = z.object({
  label: characterSchema,
  value: characterSchema,
  code: characterSchema,
});

export const updateSchema = createSchema.partial();
