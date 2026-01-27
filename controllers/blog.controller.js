import { pool } from "../config/db.js";
import { toCamelCase } from "../utils/camelcase.js";
import { toSnakeCase } from "../utils/snakecase.js";
import { successResp, errorResp } from "../utils/response.js";
import { makeSlug } from "../utils/make-slug.js";

export const findAll = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100); // max 100
    const offset = (page - 1) * limit;

    // 1️⃣ Get total count
    const countResult = await pool.query(`
      SELECT COUNT(*)::int AS total 
      FROM blog 
      WHERE is_publish = true AND deleted_at IS NULL
    `);

    const total = countResult.rows[0].total;
    const totalPages = Math.ceil(total / limit);

    // 2️⃣ Get paginated data
    const { rows } = await pool.query(
      `
        SELECT
          b.title,
          b.short_content,
          b.thumbnail_url,
          b.created_at,
          c.label AS category,
          u.full_name AS author
        FROM blog b
        JOIN categories c ON c.id = b.category_id
        JOIN users u ON u.id = b.author_id
        WHERE b.is_publish = true AND b.deleted_at IS NULL
        ORDER BY b.created_at DESC
        LIMIT $1 OFFSET $2
      `,
      [limit, offset],
    );

    successResp(res, {
      rows: toCamelCase(rows),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const findOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      ` 
        SELECT
          b.title,
          b.content,
          b.short_content,
          b.thumbnail_url,
          b.created_at,
          b.updated_at,
          c.label AS category,
          u.full_name AS author
        FROM blog b
        JOIN categories c ON c.id = b.category_id
        JOIN users u ON u.id = b.author_id
        WHERE b.slug = $1 AND b.is_publish = true AND b.deleted_at IS NULL
      `,
      [id],
    );

    successResp(res, toCamelCase(rows[0]));
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const data = req.body;
    const { rows } = await pool.query(
      `INSERT INTO blog (
        title, slug, content, short_content, thumbnail_url, category_id, author_id, is_publish
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        data.title,
        makeSlug(data.title),
        data.content,
        data.shortContent,
        data.thumbnailUrl,
        data.categoryId,
        req.user.id,
        data.isPublish ?? true,
      ],
    );

    successResp(res, toCamelCase(rows[0]), "Blog created successfully");
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // 🔥 Auto-generate slug if title is updated
    if (updateData.title) {
      updateData.slug = makeSlug(updateData.title);
    }

    const fields = Object.keys(updateData);
    const values = Object.values(updateData);

    const setQuery = fields
      .map((f, i) => `${toSnakeCase(f)} = $${i + 1}`)
      .join(", ");

    const { rows } = await pool.query(
      `UPDATE blog SET ${setQuery} WHERE id = $${fields.length + 1} RETURNING *`,
      [...values, id],
    );

    if (!rows.length) {
      return errorResp(
        res,
        "Validation error",
        "VALIDATION_ERROR",
        404,
        `Blog with ID ${id} does not exist`,
      );
    }

    successResp(res, toCamelCase(rows[0]), "Blog updated");
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    await pool.query(
      `
      UPDATE blog SET deleted_at = NOW() 
      WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );

    successResp(res, null, "Blog deleted");
  } catch (err) {
    next(err);
  }
};
