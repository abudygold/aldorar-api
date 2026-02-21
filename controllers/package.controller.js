import { pool } from "../config/db.js";
import { successResp } from "../helper/response.js";
import {
  insertOne,
  paginate,
  selectAll,
  softDelete,
  updateOne,
} from "../helper/query.js";

const selectFields = [
  "tp.*",
  `COALESCE(
    (
      SELECT json_agg(tf.*)
      FROM trip_flight tf
      WHERE tf.trip_package_id = tp.id
    ),
    '[]'
  ) AS flights`,
  `COALESCE(
    (
      SELECT json_agg(th.*)
      FROM trip_hotel th
      WHERE th.trip_package_id = tp.id
    ),
    '[]'
  ) AS hotels`,
  `COALESCE(
      (
        SELECT json_agg(tpp.*)
        FROM trip_price tpp
        WHERE tpp.trip_package_id = tp.id
      ),
      '[]'
    ) AS prices`,
  `COALESCE(
    (
      SELECT json_agg(tb.*)
      FROM trip_bonus tb
      WHERE tb.trip_package_id = tp.id
    ),
    '[]'
  ) AS bonuses`,
  `COALESCE(
    (
      SELECT json_agg(ti.*)
      FROM trip_itinerary ti
      WHERE ti.trip_package_id = tp.id
    ),
    '[]'
  ) AS itineraries`,
];

const relations = (flights, hotels, prices, itineraries, bonuses) => [
  {
    table: "trip_flight",
    foreignKey: "tripPackageId",
    data: flights || [],
    allowedPayload: [
      "tripPackageId",
      "flightType",
      "flightDate",
      "airline",
      "flightNumber",
      "flightClass",
      "departureAirport",
      "arrivalAirport",
      "sequence",
    ],
  },
  {
    table: "trip_hotel",
    foreignKey: "tripPackageId",
    data: hotels || [],
    allowedPayload: [
      "tripPackageId",
      "hotelName",
      "star",
      "city",
      "country",
      "checkInDate",
      "checkOutDate",
      "sequence",
    ],
  },
  {
    table: "trip_price",
    foreignKey: "tripPackageId",
    data: prices || [],
    allowedPayload: [
      "tripPackageId",
      "roomType",
      "price",
      "dpAmount",
      "childPrice",
      "infantPrice",
      "currency",
      "validFrom",
      "validUntil",
      "isActive",
    ],
  },
  {
    table: "trip_itinerary",
    foreignKey: "tripPackageId",
    data: itineraries || [],
    allowedPayload: [
      "tripPackageId",
      "dayNumber",
      "title",
      "description",
      "city",
    ],
  },
  {
    table: "trip_bonus",
    foreignKey: "tripPackageId",
    data: bonuses || [],
    allowedPayload: ["tripPackageId", "bonusName", "description", "isOptional"],
  },
];

export const findAll = async (req, res, next) => {
  try {
    const result = await paginate({
      table: "trip_package",
      alias: "tp",
      select: selectFields,
      orderBy: "tp.created_at DESC",
      filters: { "tp.deleted_at": null },
      page: parseInt(req.query.page, 10) || 1,
      limit: Math.min(parseInt(req.query.limit, 10) || 10, 100),
    });

    return successResp(res, result, "Packages retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const findPublish = async (req, res, next) => {
  try {
    const result = await paginate({
      table: "trip_package",
      alias: "tp",
      select: selectFields,
      filters: { "tp.deleted_at": null, "tp.is_publish": true },
      orderBy: "tp.created_at DESC",
      page: parseInt(req.query.page, 10) || 1,
      limit: Math.min(parseInt(req.query.limit, 10) || 10, 100),
    });

    return successResp(res, result, "Packages retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const findOne = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await selectAll({
      table: "trip_package",
      alias: "tp",
      select: selectFields,
      filters: { "tp.deleted_at": null, "tp.slug": id },
    });

    return successResp(res, result[0], "Package retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { flights, hotels, prices, itineraries, bonuses } = req.body;

    const result = await insertOne({
      table: "trip_package",
      data: req.body,
      allowedPayload: [
        "title",
        "slug",
        "packageType",
        "tripType",
        "durationDays",
        "quota",
        "isPublish",
      ],
      relations: relations(flights, hotels, prices, itineraries, bonuses),
      client,
    });

    await client.query("COMMIT");
    return successResp(res, result, "Package created successfully");
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
};

export const update = async (req, res, next) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const { flights, hotels, prices, itineraries, bonuses } = req.body;

    const result = await updateOne({
      table: "trip_package",
      alias: "tp",
      data: req.body,
      allowedPayload: [
        "title",
        "slug",
        "packageType",
        "tripType",
        "durationDays",
        "quota",
        "isPublish",
      ],
      filters: { slug: id },
      relations: relations(flights, hotels, prices, itineraries, bonuses),
      client,
    });

    await client.query("COMMIT");
    return successResp(res, result, "Package updated successfully");
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
};

export const remove = async (req, res, next) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const { id: userId } = req.user;

    const result = await softDelete({
      table: "trip_package",
      filters: { id },
      deletedBy: userId,
    });

    await client.query("COMMIT");
    return successResp(res, result, "Package deleted successfully");
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
};
