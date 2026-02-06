import { pool } from "../config/db.js";
import { toCamelCase } from "../utils/camelcase.js";
import { toSnakeCase } from "../utils/snakecase.js";
import { successResp, errorResp } from "../utils/response.js";

export const findAll = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100); // max 100
    const offset = (page - 1) * limit;

    // 1️⃣ Get total count
    const countResult = await pool.query(`
      SELECT COUNT(*)::int AS total FROM categories 
      WHERE deleted_at IS NULL
    `);

    const total = countResult.rows[0].total;
    const totalPages = Math.ceil(total / limit);

    // 2️⃣ Get paginated data
    const { rows } = await pool.query(
      `SELECT * FROM categories 
      WHERE deleted_at IS NULL 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2`,
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
      `SELECT * FROM categories 
      WHERE id = $1 AND deleted_at IS NULL`,
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
      `INSERT INTO categories (label, value, code) VALUES ($1,$2,$3) RETURNING *`,
      [data.label, data.value, data.code],
    );

    successResp(res, toCamelCase(rows[0]), "Category created successfully");
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fields = Object.keys(req.body);
    const values = Object.values(req.body);

    const setQuery = fields
      .map((f, i) => `${toSnakeCase(f)} = $${i + 1}`)
      .join(", ");

    const { rows } = await pool.query(
      `UPDATE categories SET ${setQuery} WHERE id = $${fields.length + 1} RETURNING *`,
      [...values, id],
    );

    if (!rows.length) {
      return errorResp(
        res,
        "Validation error",
        "VALIDATION_ERROR",
        404,
        `Category with ID ${id} does not exist`,
      );
    }

    successResp(res, toCamelCase(rows[0]), "Category updated");
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    await pool.query(
      `
      UPDATE categories SET deleted_at = NOW() 
      WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );

    successResp(res, null, "Category deleted successfully");
  } catch (err) {
    next(err);
  }
};
