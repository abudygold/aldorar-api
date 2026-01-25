import { pool } from "../config/db.js";
import { toCamelCase } from "../utils/camelcase.js";
import { successResp, errorResp } from "../utils/response.js";

export const getPackages = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100); // max 100
    const offset = (page - 1) * limit;

    // 1️⃣ Get total count
    const countResult = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM umroh_packages
      WHERE is_publish = true
    `);

    const total = countResult.rows[0].total;
    const totalPages = Math.ceil(total / limit);

    // 2️⃣ Get paginated data
    const { rows } = await pool.query(
      `
      SELECT * FROM umroh_packages
      WHERE is_publish = true AND is_available = true
      ORDER BY created_at DESC
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

export const getPackageDetail = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM umroh_packages WHERE slug = $1`,
      [req.params.id],
    );

    successResp(res, toCamelCase(rows[0]), "Package detail");
  } catch (err) {
    next(err);
  }
};

export const createPackage = async (req, res, next) => {
  try {
    const {
      title,
      slug,
      umrohType,
      departureDate,
      durationDays,
      flightType,
      isPlusThaif,
      isHighSpeedTrain,
      airline,
      landingCity,
      madinahHotelName,
      madinahHotelStar,
      mekkahHotelName,
      mekkahHotelStar,
      startPrice,
      priceQuad,
      priceTriple,
      priceDouble,
      isAvailable,
      isPublish,
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO umroh_packages (
        title, slug, umroh_type, departure_date, 
        duration_days, flight_type,
        is_plus_thaif, is_high_speed_train,
        airline, landing_city,
        madinah_hotel_name, madinah_hotel_star,
        mekkah_hotel_name, mekkah_hotel_star,
        start_price, price_quad, price_triple, price_double,
        is_available, is_publish
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20
      ) RETURNING *`,
      [
        title,
        slug,
        umrohType,
        departureDate,
        durationDays,
        flightType,
        isPlusThaif,
        isHighSpeedTrain,
        airline,
        landingCity,
        madinahHotelName,
        madinahHotelStar,
        mekkahHotelName,
        mekkahHotelStar,
        startPrice,
        priceQuad,
        priceTriple,
        priceDouble,
        isAvailable ?? true,
        isPublish ?? true,
      ],
    );

    successResp(res, toCamelCase(rows[0]), "Package created");
  } catch (err) {
    next(err);
  }
};

export const updatePackage = async (req, res, next) => {
  try {
    const {
      title,
      slug,
      umrohType,
      departureDate,
      durationDays,
      flightType,
      isPlusThaif,
      isHighSpeedTrain,
      airline,
      landingCity,
      madinahHotelName,
      madinahHotelStar,
      mekkahHotelName,
      mekkahHotelStar,
      startPrice,
      priceQuad,
      priceTriple,
      priceDouble,
      isAvailable,
      isPublish,
    } = req.body;

    let idx = 1;
    const fields = [];
    const values = [];
    const updateFields = {
      title,
      slug,
      umroh_type: umrohType,
      departure_date: departureDate,
      duration_days: durationDays,
      flight_type: flightType,
      is_plus_thaif: isPlusThaif,
      is_high_speed_train: isHighSpeedTrain,
      airline,
      landing_city: landingCity,
      madinah_hotel_name: madinahHotelName,
      madinah_hotel_star: madinahHotelStar,
      mekkah_hotel_name: mekkahHotelName,
      mekkah_hotel_star: mekkahHotelStar,
      start_price: startPrice,
      price_quad: priceQuad,
      price_triple: priceTriple,
      price_double: priceDouble,
      is_available: isAvailable,
      is_publish: isPublish,
    };

    Object.entries(updateFields).forEach(([dbCol, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        fields.push(`${dbCol}=$${idx++}`);
        values.push(value);
      }
    });

    values.push(req.params.id);

    const { rows } = await pool.query(
      `UPDATE umroh_packages
      SET ${fields.join(", ")}, updated_at=NOW()
      WHERE id=$${idx}
      RETURNING *`,
      values,
    );

    if (!rows.length) {
      return errorResp(
        res,
        "Validation error",
        "VALIDATION_ERROR",
        404,
        "Package not found",
      );
    }

    successResp(res, toCamelCase(rows[0]), "Package updated");
  } catch (err) {
    next(err);
  }
};

export const deletePackage = async (req, res, next) => {
  try {
    await pool.query(
      `UPDATE umroh_packages SET is_publish = false WHERE id = $1`,
      [req.params.id],
    );
    successResp(res, null, "Package deleted");
  } catch (err) {
    next(err);
  }
};
