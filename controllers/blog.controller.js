import { pool } from "../config/db.js";
import { successResp, errorResp } from "../helper/response.js";
import {
  insertOne,
  paginate,
  selectAll,
  softDelete,
  updateOne,
} from "../helper/query.js";

export const findAll = async (req, res, next) => {
  try {
    const result = await paginate({
      table: "blog",
      alias: "b",
      select: [
        "b.title",
        "b.slug",
        "b.short_content",
        "b.thumbnail_url",
        "b.is_publish",
        "b.created_at",
        "b.updated_at",
      ],
      relations: [
        {
          table: "categories",
          alias: "c",
          on: "c.id = b.category_id",
          select: ["c.label AS category"],
        },
        {
          table: "users",
          alias: "u",
          on: "u.id = b.author_id",
          select: ["CONCAT(u.first_name, ' ', u.last_name) AS authorName"],
        },
      ],
      filters: { "b.deleted_at": null },
      orderBy: "b.created_at DESC",
      page: parseInt(req.query.page, 10) || 1,
      limit: Math.min(parseInt(req.query.limit, 10) || 10, 100),
    });

    return successResp(res, result, "Blogs retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const findAllPublic = async (req, res, next) => {
  try {
    const result = await paginate({
      table: "blog",
      alias: "b",
      select: [
        "b.title",
        "b.slug",
        "b.short_content",
        "b.thumbnail_url",
        "b.is_publish",
        "b.created_at",
        "b.updated_at",
      ],
      relations: [
        {
          table: "categories",
          alias: "c",
          on: "c.id = b.category_id",
          select: ["c.label AS category"],
        },
        {
          table: "users",
          alias: "u",
          on: "u.id = b.author_id",
          select: ["CONCAT(u.first_name, ' ', u.last_name) AS authorName"],
        },
      ],
      filters: { "b.deleted_at": null, "b.is_publish": true },
      orderBy: "b.created_at DESC",
      page: parseInt(req.query.page, 10) || 1,
      limit: Math.min(parseInt(req.query.limit, 10) || 10, 100),
    });

    return successResp(res, result, "Blogs retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const findOne = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await selectAll({
      table: "blog",
      alias: "b",
      select: [
        "b.title",
        "b.slug",
        "b.content",
        "b.short_content",
        "b.thumbnail_url",
        "b.category_id",
        "b.is_publish",
        "b.created_at",
        "b.updated_at",
      ],
      relations: [
        {
          table: "categories",
          alias: "c",
          on: "c.id = b.category_id",
          select: ["c.label AS category"],
        },
        {
          table: "users",
          alias: "u",
          on: "u.id = b.author_id",
          select: ["CONCAT(u.first_name, ' ', u.last_name) AS authorName"],
        },
      ],
      filters: { "b.deleted_at": null, "b.slug": id },
    });

    return successResp(res, result[0], "Blog retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    req.body = {
      ...req.body,
      authorId: req.user.id,
    };

    if (req.file?.path) {
      req.body = {
        ...req.body,
        thumbnailUrl: req.file.path, // Cloudinary URL
      };
    }

    const result = await insertOne({
      table: "blog",
      data: req.body,
      allowedPayload: [
        "title",
        "slug",
        "content",
        "shortContent",
        "thumbnailUrl",
        "categoryId",
        "authorId",
        "isPublish",
      ],
      returning: [
        "title",
        "slug",
        "content",
        "short_content",
        "thumbnail_url",
        "created_at",
        "updated_at",
        "is_publish",
      ],
    });

    return successResp(res, result, "Blog created successfully");
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { articleId } = req.query;

    req.body = {
      ...req.body,
      authorId: req.user.id,
    };

    if (req.file?.path) {
      req.body = {
        ...req.body,
        thumbnailUrl: req.file.path, // Cloudinary URL
      };
    }

    // Check slug uniqueness except for the current blog
    const exists = await client.query(
      `
        SELECT 1 
        FROM blog 
        WHERE slug = $1
        AND id <> $2
        AND deleted_at IS NULL
      `,
      [id, articleId],
    );

    if (exists.rowCount > 0) {
      return errorResp(
        res,
        `Slug has already been used by another article`,
        "VALIDATION_ERROR",
        409,
      );
    }

    const result = await updateOne({
      table: "blog",
      data: req.body,
      filters: {
        slug: id,
      },
      allowedPayload: [
        "title",
        "slug",
        "content",
        "shortContent",
        "thumbnailUrl",
        "categoryId",
        "authorId",
        "isPublish",
      ],
      returning: [
        "title",
        "slug",
        "content",
        "short_content",
        "thumbnail_url",
        "created_at",
        "updated_at",
        "is_publish",
      ],
    });

    return successResp(res, result, "Blog updated successfully");
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;

    const result = await softDelete({
      table: "blog",
      filters: {
        id,
      },
      deletedBy: userId,
    });

    return successResp(res, result, "Blog deleted successfully");
  } catch (err) {
    next(err);
  }
};
