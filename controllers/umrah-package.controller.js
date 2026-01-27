import { pool } from "../config/db.js";
import { toCamelCase } from "../utils/camelcase.js";
import { toSnakeCase } from "../utils/snakecase.js";
import { successResp, errorResp } from "../utils/response.js";
import { makeSlug } from "../utils/make-slug.js";

export const findAll = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100); // max 100
    const offset = (page - 1) * limit;

    // 1️⃣ Get total count
    const countResult = await pool.query(
      `
        SELECT COUNT(*)::int AS total
        FROM umrah_package
        WHERE is_publish = true AND deleted_at IS NULL
      `,
    );

    const total = countResult.rows[0].total;
    const totalPages = Math.ceil(total / limit);

    // 2️⃣ Get paginated data
    const { rows } = await pool.query(
      `
        SELECT * FROM umrah_package
        WHERE is_publish = true AND deleted_at IS NULL 
        ORDER BY departure_date ASC
        LIMIT $1 OFFSET $2
      `,
      [limit, offset],
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
    const { rows } = await pool.query(
      `SELECT * FROM umrah_package WHERE slug = $1`,
      [req.params.id],
    );

    successResp(res, toCamelCase(rows[0]), "Package detail");
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const data = req.body;
    const { rows } = await pool.query(
      `
        INSERT INTO umrah_package
        (title, slug, umrah_type, departure_date, duration_days, quota, airline, 
        flight_type, landing_city, madinah_hotel_name, madinah_hotel_star, mekkah_hotel_name, 
        mekkah_hotel_star, is_plus_thaif, is_high_speed_train, is_publish)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        RETURNING *
      `,
      [
        data.title,
        makeSlug(data.title),
        data.umrahType,
        data.departureDate,
        data.durationDays,
        data.quota,
        data.airline,
        data.flightType,
        data.landingCity,
        data.madinahHotelName,
        data.madinahHotelStar,
        data.mekkahHotelName,
        data.mekkahHotelStar,
        data.isPlusThaif,
        data.isHighSpeedTrain,
        data.isPublish ?? true,
      ],
    );

    successResp(res, toCamelCase(rows[0]), "Package created");
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // 🔥 Auto-generate slug if title is updated
    if (updateData.title) {
      updateData.slug = makeSlug(updateData.title);
    }

    const fields = Object.keys(updateData);
    const values = Object.values(updateData);

    const setQuery = fields
      .map((f, i) => `${toSnakeCase(f)} = $${i + 1}`)
      .join(", ");

    const { rows } = await pool.query(
      `
        UPDATE umrah_package
        SET ${setQuery}
        WHERE id = $${fields.length + 1} AND deleted_at IS NULL
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
        `Umrah package with ID ${id} not found`,
      );
    }

    successResp(res, toCamelCase(rows[0]), "Package updated successfully");
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rowCount } = await pool.query(
      `
        UPDATE umrah_package
        SET deleted_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
      `,
      [id],
    );

    if (!rowCount) {
      return errorResp(
        res,
        "Not found",
        "NOT_FOUND",
        404,
        `Umrah package with ID ${id} not found`,
      );
    }

    successResp(res, null, "Package deleted successfully");
  } catch (err) {
    next(err);
  }
};
