import { pool } from "../../config/db.js";
import { toCamelCase } from "../../utils/camelcase.js";
import { toSnakeCase } from "../../utils/snakecase.js";
import { successResp, errorResp } from "../../utils/response.js";

export const findAll = async (req, res, next) => {
  try {
    const { transactionId } = req.query;

    if (!transactionId) {
      return errorResp(
        res,
        "transactionId is required",
        "VALIDATION_ERROR",
        400,
      );
    }

    const { rows } = await pool.query(
      `
        SELECT *
        FROM trip_participant
        WHERE trip_transaction_id = $1
          AND deleted_at IS NULL
        ORDER BY created_at ASC
      `,
      [transactionId],
    );

    successResp(res, toCamelCase(rows));
  } catch (err) {
    next(err);
  }
};

export const findOne = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `SELECT * FROM trip_participant WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );

    if (!rows.length) {
      return errorResp(res, "Participant not found", "NOT_FOUND", 404, "");
    }

    successResp(res, toCamelCase(rows[0]));
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const fields = Object.keys(req.body);
    const values = Object.values(req.body);

    const setQuery = fields.map((f) => `${toSnakeCase(f)}`).join(", ");

    const { rows } = await pool.query(
      `
        INSERT INTO trip_participant (${setQuery}) 
        VALUES (${fields.length}) 
        RETURNING *
      `,
      [...values],
    );

    successResp(res, toCamelCase(rows[0]), "Jamaah created successfully");
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
      `
        UPDATE trip_participant 
        SET ${setQuery} 
        WHERE id = $${fields.length + 1} AND deleted_at IS NULL 
        RETURNING *`,
      [...values, id],
    );

    if (!rows.length) {
      return errorResp(
        res,
        "Participant not found or cannot be updated",
        "NOT_FOUND",
        404,
      );
    }

    successResp(res, toCamelCase(rows[0]), "Participant updated");
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rowCount } = await pool.query(
      `
        UPDATE trip_participant
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND deleted_at IS NULL
      `,
      [id],
    );

    if (!rowCount) {
      return errorResp(res, "Participant not found", "NOT_FOUND", 404);
    }

    successResp(res, null, "Participant deleted successfully");
  } catch (err) {
    next(err);
  }
};
