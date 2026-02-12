import { pool } from "../../config/db.js";
import { toCamelCase } from "../../utils/camelcase.js";
import { toSnakeCase } from "../../utils/snakecase.js";
import { successResp, errorResp } from "../../utils/response.js";

export const findAll = async (req, res, next) => {
  try {
    const { tripPackageId } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100); // max 100
    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];

    // 1️⃣ Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM trip_price`,
    );

    const total = countResult.rows[0].total;
    const totalPages = Math.ceil(total / limit);

    if (tripPackageId) {
      values.push(tripPackageId);
      conditions.push(`upp.trip_package_id = $${values.length}`);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // 2️⃣ Get paginated data
    const { rows } = await pool.query(
      `
        SELECT
          tpp.*,
          tp.title AS package_title
        FROM trip_price tpp
        JOIN trip_package tp ON tp.id = tpp.trip_package_id
        ${where}
        ORDER BY tpp.created_at DESC
        LIMIT $1 OFFSET $2
      `,
      [...values, limit, offset],
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

export const findOne = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `
        SELECT
          upp.*,
          up.title AS package_title
        FROM trip_price upp
        JOIN trip_package up ON up.id = upp.trip_package_id
        WHERE upp.id = $1
      `,
      [id],
    );

    if (!rows.length) {
      return errorResp(res, `Price with ID ${id} not found`, "NOT_FOUND", 404);
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
        INSERT INTO trip_price (${setQuery}) 
        VALUES (${fields.length}) 
        RETURNING *`,
      [...values],
    );

    successResp(res, toCamelCase(rows[0]), "Price created successfully");
  } catch (err) {
    // unique constraint (package + room_type)
    if (err.code === "23505") {
      return errorResp(
        res,
        "Room type already exists for this package",
        "DUPLICATE",
        409,
      );
    }
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
        UPDATE trip_price
        SET ${setQuery}
        WHERE id = $${fields.length + 1}
        RETURNING *
      `,
      [...values, id],
    );

    if (!rows.length) {
      return errorResp(res, `Price with ID ${id} not found`, "NOT_FOUND", 404);
    }

    successResp(res, toCamelCase(rows[0]), "Price updated successfully");
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`DELETE FROM trip_price WHERE id = $1`, [
      id,
    ]);

    if (!result.rowCount) {
      return errorResp(res, `Price with ID ${id} not found`, "NOT_FOUND", 404);
    }

    successResp(res, null, "Price deleted successfully");
  } catch (err) {
    next(err);
  }
};
