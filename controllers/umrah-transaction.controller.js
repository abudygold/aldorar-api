import { pool } from "../config/db.js";
import { toCamelCase } from "../utils/camelcase.js";
import { successResp, errorResp } from "../utils/response.js";
import { toSnakeCase } from "../utils/snakecase.js";

/**
 * LIST TRANSACTIONS (by logged-in user)
 */
export const findAll = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100); // max 100
    const offset = (page - 1) * limit;

    // 1️⃣ Get total count
    const countResult = await pool.query(`
      SELECT COUNT(*)::int AS total FROM umrah_transactions 
      WHERE deleted_at IS NULL
    `);

    const total = countResult.rows[0].total;
    const totalPages = Math.ceil(total / limit);

    const { rows } = await pool.query(
      `
        SELECT 
          t.*,
          p.title AS package_name,
          p.departure_date 
        FROM umrah_transactions t
        JOIN umrah_package p ON p.id = t.umrah_package_id 
        WHERE t.deleted_at IS NULL
        ORDER BY t.created_at DESC
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

/**
 * GET SINGLE TRANSACTION
 */
export const findOne = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `
        SELECT
            t.*,
            json_build_object(
              'title', p.title,
              'slug', p.slug,
              'umrahType', p.umrah_type,
              'departureDate', p.departure_date,
              'durationDays', p.duration_days,
              'quota', p.quota,
              'quotaUsed', p.quota_used,
              'airline', p.airline,
              'flightType', p.flight_type,
              'landingCity', p.landing_city,
              'madinahHotelName', p.madinah_hotel_name,
              'madinahHotelStar', p.madinah_hotel_star,
              'mekkahHotelName', p.mekkah_hotel_name,
              'mekkahHotelStar', p.mekkah_hotel_star
            ) AS umrah_package,
            json_build_object(
              'firstName', u.first_name,
              'lastName', u.last_name,
              'fullName', u.full_name,
              'email', u.email,
              'phone', u.phone
            ) AS client
        FROM umrah_transactions t
        JOIN umrah_package p ON p.id = t.umrah_package_id 
        JOIN users u ON u.id = t.user_id
        WHERE t.id = $1 AND t.deleted_at IS NULL
      `,
      [id],
    );

    if (!rows.length) {
      return errorResp(
        res,
        "Not Found",
        "NOT_FOUND",
        404,
        "Transaction not found",
      );
    }

    successResp(res, toCamelCase(rows[0]));
  } catch (err) {
    next(err);
  }
};

/**
 * CREATE TRANSACTION
 */
export const create = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { umrahPackageId, jamaahCount, pricePerPerson } = req.body;

    const totalPrice = jamaahCount * pricePerPerson;

    const { rows } = await pool.query(
      `
      INSERT INTO umrah_transactions (
        transaction_code,
        umrah_package_id,
        user_id,
        jamaah_count,
        price_per_person,
        total_price
      )
      VALUES (
        'TRX-' || EXTRACT(EPOCH FROM NOW())::bigint,
        $1, $2, $3, $4, $5
      )
      RETURNING *
      `,
      [umrahPackageId, userId, jamaahCount, pricePerPerson, totalPrice],
    );

    successResp(res, toCamelCase(rows[0]), "Transaction created successfully");
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE TRANSACTION STATUS
 * (status divalidasi DB trigger)
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
        UPDATE umrah_transactions 
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
        "Transaction not found or cannot be updated",
      );
    }

    successResp(res, toCamelCase(rows[0]), "Transaction updated");
  } catch (err) {
    next(err);
  }
};

/**
 * SOFT DELETE TRANSACTION
 */
export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { rowCount } = await pool.query(
      `
      UPDATE umrah_transactions
      SET deleted_at = NOW()
      WHERE id = $1
        AND user_id = $2
        AND deleted_at IS NULL
      `,
      [id, userId],
    );

    if (!rowCount) {
      return errorResp(
        res,
        "Not Found",
        "NOT_FOUND",
        404,
        "Transaction not found",
      );
    }

    successResp(res, null, "Transaction deleted");
  } catch (err) {
    next(err);
  }
};
