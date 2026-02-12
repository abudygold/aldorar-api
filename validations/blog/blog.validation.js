import { z } from "zod";
import { makeSlug } from "../../utils/make-slug.js";

export const createSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(20),
  shortContent: z.string().max(250),
  categoryId: z.string().uuid(),
  thumbnailUrl: z.string().max(250).optional(),
  isPublish: z.boolean().optional(),
  cover: z.any().optional(),
});

export const updateSchema = createSchema
  .partial()
  .extend({
    slug: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be updated",
  })
  .transform((data) => {
    // Logic: If title exists and slug doesn't, create it
    if (data.title) {
      return { ...data, slug: makeSlug(data.title) };
    }
    return data;
  });
