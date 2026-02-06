import { pool } from "../../config/db.js";
import { toCamelCase } from "../../utils/camelcase.js";
import { successResp, errorResp } from "../../utils/response.js";
import { toSnakeCase } from "../../utils/snakecase.js";

export const findAll = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100); // max 100
    const offset = (page - 1) * limit;

    // 1️⃣ Get total count
    const countResult = await pool.query(`
      SELECT COUNT(*)::int AS total FROM trip_transactions 
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
        FROM trip_transactions t
        JOIN trip_package p ON p.id = t.trip_package_id 
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
              'tripType', p.trip_type,
              'packageType', p.package_type,
              'departureDate', p.departure_date,
              'durationDays', p.duration_days,
              'quota', p.quota,
              'quotaUsed', p.quota_used,
              'departureDate', p.departure_date,
              'departureAirline', p.departure_airline,
              'departureFlightType', p.departure_flight_type,
              'departureLanding', p.departure_landing,
              'returnDate', p.return_date,
              'returnAirline', p.return_airline,
              'returnFlightType', p.return_flight_type,
              'returnLanding', p.return_landing,
              'madinahHotelName', p.madinah_hotel_name,
              'madinahHotelStar', p.madinah_hotel_star,
              'mekkahHotelName', p.mekkah_hotel_name,
              'mekkahHotelStar', p.mekkah_hotel_star
            ) AS trip_package,
            json_build_object(
              'firstName', u.first_name,
              'lastName', u.last_name,
              'fullName', u.full_name,
              'email', u.email,
              'phone', u.phone
            ) AS client
        FROM trip_transactions t
        JOIN trip_package p ON p.id = t.trip_package_id 
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

export const create = async (req, res, next) => {
  try {
    const { jamaahCount, pricePerPerson } = req.body;
    const userId = req.user.id;
    const totalPrice = jamaahCount * pricePerPerson;
    const fields = Object.keys(req.body);
    const values = Object.values(req.body);

    const setQuery = fields
      .map((f, i) => `${toSnakeCase(f)} = $${i + 1}`)
      .join(", ");

    const { rows } = await pool.query(
      `
        INSERT INTO trip_transaction (${setQuery}, total_price, user_id) 
        VALUES (${fields.length + 1}) 
        RETURNING *`,
      [...values, totalPrice, userId],
    );

    successResp(res, toCamelCase(rows[0]), "Transaction created successfully");
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
        UPDATE trip_transaction 
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
      UPDATE trip_transaction
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
