import { pool } from "../config/db.js";
import { toCamelCase } from "../utils/camelcase.js";
import { toSnakeCase } from "../utils/snakecase.js";
import { successResp, errorResp } from "../utils/response.js";

/**
 * GET /umrah-price
 */
export const findAll = async (req, res, next) => {
  try {
    const { umrahPackageId } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100); // max 100
    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];

    // 1️⃣ Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM umrah_package_prices`,
    );

    const total = countResult.rows[0].total;
    const totalPages = Math.ceil(total / limit);

    if (umrahPackageId) {
      values.push(umrahPackageId);
      conditions.push(`upp.umrah_package_id = $${values.length}`);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // 2️⃣ Get paginated data
    const { rows } = await pool.query(
      `
        SELECT
          upp.*,
          up.title AS package_title
        FROM umrah_package_prices upp
        JOIN umrah_package up ON up.id = upp.umrah_package_id
        ${where}
        ORDER BY upp.created_at DESC
        LIMIT $1 OFFSET $2
      `,
      [values, limit, offset],
    );

    successResp(
      res,
      {
        rows: toCamelCase(rows),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      "Package list",
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /umrah-price/:id
 */
export const findOne = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `
      SELECT
        upp.*,
        up.title AS package_title
      FROM umrah_package_prices upp
      JOIN umrah_package up ON up.id = upp.umrah_package_id
      WHERE upp.id = $1
      `,
      [id],
    );

    if (!rows.length) {
      return errorResp(
        res,
        "Not found",
        "NOT_FOUND",
        404,
        `Price with ID ${id} not found`,
      );
    }

    successResp(res, toCamelCase(rows[0]));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /umrah-price
 */
export const create = async (req, res, next) => {
  try {
    const { umrahPackageId, roomType, price } = req.body;

    const { rows } = await pool.query(
      `
      INSERT INTO umrah_package_prices
        (umrah_package_id, room_type, price)
      VALUES ($1,$2,$3)
      RETURNING *
      `,
      [umrahPackageId, roomType, price],
    );

    successResp(res, toCamelCase(rows[0]), "Price created successfully");
  } catch (err) {
    // unique constraint (package + room_type)
    if (err.code === "23505") {
      return errorResp(
        res,
        "Duplicate room type",
        "DUPLICATE",
        409,
        "Room type already exists for this package",
      );
    }
    next(err);
  }
};

/**
 * PUT /umrah-price/:id
 */
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
      UPDATE umrah_package_prices
      SET ${setQuery}
      WHERE id = $${fields.length + 1}
      RETURNING *
      `,
      [...values, id],
    );

    if (!rows.length) {
      return errorResp(
        res,
        "Not found",
        "NOT_FOUND",
        404,
        `Price with ID ${id} not found`,
      );
    }

    successResp(res, toCamelCase(rows[0]), "Price updated successfully");
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /umrah-price/:id
 */
export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM umrah_package_prices WHERE id = $1`,
      [id],
    );

    if (!result.rowCount) {
      return errorResp(
        res,
        "Not found",
        "NOT_FOUND",
        404,
        `Price with ID ${id} not found`,
      );
    }

    successResp(res, null, "Price deleted successfully");
  } catch (err) {
    next(err);
  }
};
