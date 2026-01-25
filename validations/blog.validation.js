import { z } from "zod";

export const createSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(20),
  shortContent: z.string().max(200),
  thumbnailUrl: z.string(),
  categoryId: z.string(),
  isPublish: z.boolean().optional(),
});

export const updateSchema = createSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be updated",
  });
