import bcrypt from "bcrypt";
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
      SELECT COUNT(*)::int AS total FROM users
    `);

    const total = countResult.rows[0].total;
    const totalPages = Math.ceil(total / limit);

    // 2️⃣ Get paginated data
    const { rows } = await pool.query(
      `
        SELECT id, first_name, last_name, full_name, email, phone, role, created_at, updated_at 
        FROM users 
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
        SELECT id, first_name, last_name, full_name, email, phone, role, created_at, updated_at 
        FROM users 
        WHERE id = $1
      `,
      [id],
    );

    if (!rows.length) {
      return errorResp(res, "User not found", "NOT_FOUND", 404);
    }

    successResp(res, toCamelCase(rows[0]));
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, role, isActive } =
      req.body;
    const passwordHash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `
        INSERT INTO users
        (first_name, last_name, email, password_hash, phone, role, is_active)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING id, first_name, last_name, full_name, email, role
      `,
      [
        firstName,
        lastName,
        email,
        passwordHash,
        phone,
        role || "customer",
        isActive || false,
      ],
    );

    successResp(res, toCamelCase(rows[0]), "User created successfully");
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
        UPDATE users SET ${setQuery}
        WHERE id = $${fields.length + 1} AND deleted_at IS NULL
        RETURNING id, full_name, email, role
      `,
      [...values, id],
    );

    if (!rows.length) {
      return errorResp(res, "User not found", "NOT_FOUND", 404);
    }

    successResp(res, toCamelCase(rows[0]), "User updated");
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rowCount } = await pool.query(
      `
        UPDATE users
        SET deleted_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
      `,
      [id],
    );

    if (!rowCount) {
      return errorResp(res, "User not found", "NOT_FOUND", 404);
    }

    successResp(res, null, "User deleted successfully");
  } catch (err) {
    next(err);
  }
};
