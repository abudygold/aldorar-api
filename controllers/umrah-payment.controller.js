import { pool } from "../config/db.js";
import { toCamelCase } from "../utils/camelcase.js";
import { toSnakeCase } from "../utils/snakecase.js";
import { successResp, errorResp } from "../utils/response.js";

export const findAll = async (req, res, next) => {
  try {
    const { transactionId } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const offset = (page - 1) * limit;

    const countResult = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM umrah_payments
      WHERE deleted_at IS NULL
    `);

    const params = transactionId ? [transactionId] : [];
    const where = transactionId
      ? `WHERE umrah_transaction_id = $1 AND deleted_at IS NULL`
      : `WHERE deleted_at IS NULL`;

    const { rows } = await pool.query(
      `
        SELECT *
        FROM umrah_payments
        ${where}
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `,
      [limit, offset],
    );

    const total = countResult.rows[0].total;
    const totalPages = Math.ceil(total / limit);

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
        SELECT *
        FROM umrah_payments
        WHERE id = $1 AND deleted_at IS NULL
      `,
      [id],
    );

    if (!rows.length) {
      return errorResp(res, "Not found", "NOT_FOUND", 404);
    }

    successResp(res, toCamelCase(rows[0]));
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const payload = toSnakeCase(req.body);
    const fields = Object.keys(payload);
    const values = Object.values(payload);

    const columns = fields.join(", ");
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(", ");

    const { rows } = await pool.query(
      `
        INSERT INTO umrah_payments (${columns})
        VALUES (${placeholders})
        RETURNING *
      `,
      values,
    );

    successResp(res, toCamelCase(rows[0]), "Payment created");
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payload = toSnakeCase(req.body);
    const fields = Object.keys(payload);
    const values = Object.values(payload);

    const setQuery = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");

    const { rows } = await pool.query(
      `
        UPDATE umrah_payments
        SET ${setQuery}
        WHERE id = $${fields.length + 1}
          AND deleted_at IS NULL
        RETURNING *
      `,
      [...values, id],
    );

    if (!rows.length) {
      return errorResp(res, "Not found", "NOT_FOUND", 404);
    }

    successResp(res, toCamelCase(rows[0]), "Payment updated");
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    await pool.query(
      `
      UPDATE umrah_payments
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [id],
    );

    successResp(res, null, "Payment removed");
  } catch (err) {
    next(err);
  }
};
