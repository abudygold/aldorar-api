import { pool } from "../config/db.js";
import { toCamel } from "../utils/camelcase.js";
import { successResp, errorResp } from "../utils/response.js";
import { updateArticleSchema } from "../validations/article.validation.js";

export const listArticles = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100); // max 100
    const offset = (page - 1) * limit;

    // 1️⃣ Get total count
    const countResult = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM articles
      WHERE is_publish = true
    `);

    const total = countResult.rows[0].total;
    const totalPages = Math.ceil(total / limit);

    // 2️⃣ Get paginated data
    const { rows } = await pool.query(
      `
      SELECT
        a.title,
        a.slug,
        a.category,
        a.content,
        a.short_content,
        a.thumbnail_url,
        a.created_at,
        a.updated_at,
        a.is_publish,
        u.full_name AS author_name
      FROM articles a
      JOIN users u ON u.id = a.author_id
      WHERE a.is_publish = true
      ORDER BY a.created_at DESC
      LIMIT $1 OFFSET $2
    `,
      [limit, offset],
    );

    successResp(
      res,
      {
        rows: toCamel(rows),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      "Article list",
    );
  } catch (err) {
    next(err);
  }
};

export const getArticle = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT
        a.title,
        a.slug,
        a.category,
        a.content,
        a.short_content,
        a.thumbnail_url,
        a.created_at,
        a.updated_at,
        a.is_publish,
        u.full_name AS author_name
      FROM articles a
      JOIN users u ON u.id = a.author_id
      WHERE slug = $1 AND is_publish = true
    `,
      [req.params.id],
    );

    successResp(res, toCamel(rows[0]), "Article detail");
  } catch (err) {
    next(err);
  }
};

export const getRandomArticles = async (_, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        a.title,
        a.slug,
        a.category,
        a.short_content,
        a.thumbnail_url,
        a.created_at,
        u.full_name AS author_name
      FROM articles a
      JOIN users u ON u.id = a.author_id
      WHERE a.is_publish = true
      ORDER BY RANDOM()
      LIMIT 3
    `);

    return successResp(res, toCamel(rows), "Random articles");
  } catch (err) {
    next(err);
  }
};

export const createArticle = async (req, res, next) => {
  try {
    const {
      title,
      slug,
      category,
      content,
      shortContent,
      thumbnailUrl,
      isPublish,
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO articles
     (title, slug, category, content, short_content, thumbnail_url, is_publish, author_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        title,
        slug,
        category,
        content,
        shortContent,
        thumbnailUrl,
        isPublish,
        req.user.id,
      ],
    );

    successResp(res, toCamel(rows[0]), "Article updated");
  } catch (err) {
    next(err);
  }
};

export const updateArticle = async (req, res, next) => {
  try {
    const result = updateArticleSchema.safeParse(req.body);

    if (!result.success) {
      return errorResp(
        res,
        "Validation error",
        "VALIDATION_ERROR",
        400,
        result.error.format(),
      );
    }

    const {
      title,
      slug,
      category,
      content,
      shortContent,
      thumbnailUrl,
      isPublish,
    } = result.data;

    const fields = [];
    const values = [];
    let idx = 1;

    if (title) {
      fields.push(`title=$${idx++}`);
      values.push(title);
    }
    if (slug) {
      fields.push(`slug=$${idx++}`);
      values.push(slug);
    }
    if (category !== undefined) {
      fields.push(`category=$${idx++}`);
      values.push(category);
    }
    if (content) {
      fields.push(`content=$${idx++}`);
      values.push(content);
    }
    if (shortContent !== undefined) {
      fields.push(`short_content=$${idx++}`);
      values.push(shortContent);
    }
    if (thumbnailUrl !== undefined) {
      fields.push(`thumbnail_url=$${idx++}`);
      values.push(thumbnailUrl);
    }
    if (isPublish !== undefined) {
      fields.push(`is_publish=$${idx++}`);
      values.push(isPublish);
    }

    values.push(req.params.id);

    const { rows } = await pool.query(
      `UPDATE articles
      SET ${fields.join(", ")}, updated_at=NOW()
      WHERE id=$${idx}
      RETURNING *`,
      values,
    );

    if (!rows.length) {
      return errorResp(
        res,
        "Validation error",
        "VALIDATION_ERROR",
        404,
        "Article not found",
      );
    }

    successResp(res, toCamel(rows[0]), "Article updated");
  } catch (err) {
    next(err);
  }
};

export const deleteArticle = async (req, res, next) => {
  try {
    await pool.query("DELETE FROM articles WHERE id=$1", [req.params.id]);
    successResp(res, null, "Article deleted");
  } catch (err) {
    next(err);
  }
};
