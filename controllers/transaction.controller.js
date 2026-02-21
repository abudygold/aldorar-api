import { pool } from "../config/db.js";
import { successResp } from "../helper/response.js";
import {
  deleteCascade,
  insertOne,
  paginate,
  selectAll,
  softDeleteCascade,
  updateOne,
} from "../helper/query.js";

export const findAll = async (req, res, next) => {
  try {
    const result = await paginate({
      table: "trip_transaction",
      alias: "t",
      select: [
        "t.*",
        `COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'travelerId', tt.traveler_id,
                'firstName', td.first_name,
                'lastName', td.last_name,
                'gender', td.gender,
                'birthDate', td.birth_date,
                'nationality', td.nationality,
                'passportNumber', td.passport_number
              )
            )
            FROM trip_traveler tt
            LEFT JOIN traveler td ON tt.traveler_id = td.id
            WHERE tt.trip_transaction_id = t.id
          ),
          '[]'
        ) AS travelers`,
      ],
      orderBy: "t.created_at DESC",
      page: parseInt(req.query.page, 10) || 1,
      limit: Math.min(parseInt(req.query.limit, 10) || 10, 100),
    });

    return successResp(res, result, "Transactions retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const findOne = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await selectAll({
      table: "trip_transaction",
      alias: "t",
      select: [
        "t.*",
        `COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'tripTransactionId', tt.trip_transaction_id,
                'travelerId', tt.traveler_id,
                'firstName', td.first_name,
                'lastName', td.last_name,
                'gender', td.gender,
                'birthDate', td.birth_date,
                'nationality', td.nationality,
                'passportNumber', td.passport_number
              )
            )
            FROM trip_traveler tt
            LEFT JOIN traveler td ON tt.traveler_id = td.id
            WHERE tt.trip_transaction_id = t.id
          ),
          '[]'
        ) AS travelers`,
      ],
      filters: { "t.id": id },
    });

    return successResp(res, result[0], "Transaction retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { travelers } = req.body;

    /* const totalTripCount = await selectAll({
      table: "traveler",
      select: ["id", "total_trip_count"],
      filters: {
        id: {
          operator: "IN",
          value: travelers.map((v) => v.travelerId.trim()),
        },
      },
    });

    const updatedTravelers = totalTripCount.map((traveler) => ({
      total_trip_count: traveler.totalTripCount + 1,
      ...traveler,
    })); */

    await client.query("BEGIN");

    const result = await insertOne({
      table: "trip_transaction",
      data: req.body,
      allowedPayload: [
        "tripPackageId",
        "invoiceNumber",
        "createdBy",
        "totalParticipant",
        "pricePerPerson",
        "subtotal",
        "groupDiscount",
        "additionalFee",
        "marketingFee",
        "totalAmount",
        "totalPaid",
        "paymentStatus",
        "bookingStatus",
        "note",
      ],
      relations: [
        {
          table: "trip_traveler",
          foreignKey: "tripTransactionId",
          data: travelers || [],
          allowedPayload: ["tripTransactionId", "travelerId"],
        },
        /* {
          table: "traveler",
          isBulkUpdate: true,
          key: "id",
          data: updatedTravelers || [],
          allowedPayload: ["total_trip_count"],
        }, */
      ],
      client,
    });

    await client.query("COMMIT");
    return successResp(res, result, "Transaction created successfully");
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
    const { travelers } = req.body;

    const result = await updateOne({
      table: "trip_transaction",
      data: req.body,
      allowedPayload: [
        "tripPackageId",
        "invoiceNumber",
        "createdBy",
        "totalParticipant",
        "pricePerPerson",
        "subtotal",
        "groupDiscount",
        "additionalFee",
        "marketingFee",
        "totalAmount",
        "totalPaid",
        "paymentStatus",
        "bookingStatus",
        "note",
      ],
      relations: [
        {
          table: "trip_traveler",
          foreignKey: "tripTransactionId",
          data: travelers || [],
          allowedPayload: ["tripTransactionId", "travelerId"],
        },
      ],
      filters: {
        id,
      },
      client,
    });

    await client.query("COMMIT");
    return successResp(res, result, "Transaction updated successfully");
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
};

export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await deleteCascade({
      table: "trip_transaction",
      filters: { id },
      relations: [
        {
          table: "trip_traveler",
          foreignKey: "trip_transaction_id",
          relations: [
            {
              table: "trip_traveler_document",
              foreignKey: "trip_traveler_id",
            },
          ],
        },
        {
          table: "trip_transaction_payment",
          foreignKey: "trip_transaction_id",
        },
      ],
    });

    return successResp(res, result, "Transaction deleted successfully");
  } catch (err) {
    next(err);
  }
};
