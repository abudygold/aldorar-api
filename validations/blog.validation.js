import { z } from "zod";
import { makeSlug } from "../helper/make-slug.js";

export const blogSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(20),
  shortContent: z.string().max(250),
  categoryId: z.string().uuid(),
  thumbnailUrl: z.string().max(250).optional(),
  isPublish: z.coerce.boolean().optional(),
  cover: z.any().optional(),
});

export const createSchema = blogSchema
  .extend({
    slug: z.string().optional(),
    authorId: z.string().optional(),
  })
  .transform((data) => {
    return {
      ...data,
      slug: makeSlug(data.title),
    };
  });

export const updateSchema = blogSchema
  .partial()
  .extend({
    slug: z.string().optional(),
    authorId: z.string().optional(),
  })
  .transform((data) => {
    if (data.title) {
      return {
        ...data,
        slug: makeSlug(data.title),
      };
    }
    return data;
  });
