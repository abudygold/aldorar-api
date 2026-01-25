import slugify from "slugify";

export const makeSlug = (text) =>
  slugify(text, {
    lower: true,
    strict: true, // remove special chars
    trim: true,
  });
