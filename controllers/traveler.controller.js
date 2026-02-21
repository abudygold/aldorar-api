import { pool } from "../config/db.js";
import { successResp } from "../helper/response.js";
import {
  bulkInsert,
  paginate,
  selectAll,
  softDelete,
  updateOne,
} from "../helper/query.js";

const allowedPayload = [
  "id",
  "firstName",
  "lastName",
  "gender",
  "birthDate",
  "nationality",
  "phone",
  "email",
  "passportNumber",
  "passportIssuedDate",
  "passportExpiredDate",
  "passportIssuedCountry",
  "totalTripCount",
];

const returning = [
  "id",
  "first_name",
  "last_name",
  "gender",
  "birth_date",
  "nationality",
  "phone",
  "email",
  "passport_number",
  "passport_issued_date",
  "passport_expired_date",
  "passport_issued_country",
  "total_trip_count",
];

export const findAll = async (req, res, next) => {
  try {
    const result = await paginate({
      table: "traveler",
      select: returning,
      orderBy: "created_at DESC",
      filters: { deleted_at: null },
      page: parseInt(req.query.page, 10) || 1,
      limit: Math.min(parseInt(req.query.limit, 10) || 10, 100),
    });

    return successResp(res, result, "Travelers retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const findOne = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await selectAll({
      table: "traveler",
      select: returning,
      filters: {
        id,
        deleted_at: null,
      },
    });

    return successResp(res, result[0], "Traveler retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { travelers } = req.body;

    const result = await bulkInsert({
      table: "traveler",
      rowsData: travelers,
      allowedPayload,
      returning: returning,
    });

    await client.query("COMMIT");
    return successResp(res, result, "Traveler created successfully");
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
};

export const update = async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log(id, req.body);

    const result = await updateOne({
      table: "traveler",
      data: req.body,
      filters: {
        id,
      },
      allowedPayload,
      returning: returning,
    });

    return successResp(res, result, "Traveler updated successfully");
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;

    const result = await softDelete({
      table: "traveler",
      filters: {
        id,
      },
      deletedBy: userId,
    });

    return successResp(res, result, "Traveler deleted successfully");
  } catch (err) {
    next(err);
  }
};
