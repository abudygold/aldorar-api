import { z } from "zod";

export const createArticleSchema = z.object({
  title: z.string().max(200),
  slug: z.string().max(255),
  category: z.string(),
  content: z.string().optional(),
  shortContent: z.string().max(100),
  thumbnailUrl: z.string(),
  isPublish: z.boolean().optional(),
});

export const updateArticleSchema = createArticleSchema.partial();
