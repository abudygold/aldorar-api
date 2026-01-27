import { pool } from "../config/db.js";
import { toCamelCase } from "../utils/camelcase.js";
import { toSnakeCase } from "../utils/snakecase.js";
import { successResp, errorResp } from "../utils/response.js";

/* =========================
   FIND ALL (by transaction)
========================= */
export const findAll = async (req, res, next) => {
  try {
    const { transactionId } = req.query;

    if (!transactionId) {
      return errorResp(
        res,
        "Validation error",
        "VALIDATION_ERROR",
        400,
        "transactionId is required",
      );
    }

    const { rows } = await pool.query(
      `
        SELECT *
        FROM umrah_jamaah
        WHERE umrah_transaction_id = $1
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

/* =========================
   FIND ONE
========================= */
export const findOne = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `
        SELECT *
        FROM umrah_jamaah
        WHERE id = $1
          AND deleted_at IS NULL
      `,
      [id],
    );

    if (!rows.length) {
      return errorResp(res, "Not found", "NOT_FOUND", 404, "Jamaah not found");
    }

    successResp(res, toCamelCase(rows[0]));
  } catch (err) {
    next(err);
  }
};

/* =========================
   CREATE
========================= */
export const create = async (req, res, next) => {
  try {
    const {
      umrahTransactionId,
      fullName,
      gender,
      birthDate,
      passportNumber,
      passportIssuedAt,
      passportExpiredAt,
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO umrah_jamaah
      (umrah_transaction_id, full_name, gender, birth_date, passport_number, passport_issued_at, passport_expired_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`,
      [
        umrahTransactionId,
        fullName,
        gender,
        birthDate,
        passportNumber,
        passportIssuedAt,
        passportExpiredAt,
      ],
    );

    successResp(res, toCamelCase(rows[0]), "Jamaah created successfully");
  } catch (err) {
    next(err);
  }
};

/* =========================
   UPDATE
========================= */
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
        UPDATE umrah_jamaah 
        SET ${setQuery} 
        WHERE id = $${fields.length + 1} AND deleted_at IS NULL 
        RETURNING *`,
      [...values, id],
    );

    if (!rows.length) {
      return errorResp(
        res,
        "Not Found",
        "NOT_FOUND",
        404,
        "Jamaah not found or cannot be updated",
      );
    }

    successResp(res, toCamelCase(rows[0]), "Jamaah updated");
  } catch (err) {
    next(err);
  }
};

/* =========================
   DELETE (SOFT)
========================= */
export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rowCount } = await pool.query(
      `
        UPDATE umrah_jamaah
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND deleted_at IS NULL
      `,
      [id],
    );

    if (!rowCount) {
      return errorResp(res, "Not found", "NOT_FOUND", 404, "Jamaah not found");
    }

    successResp(res, null, "Jamaah deleted successfully");
  } catch (err) {
    next(err);
  }
};
