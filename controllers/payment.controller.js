import { successResp } from "../helper/response.js";
import {
  insertOne,
  paginate,
  selectAll,
  softDelete,
  updateOne,
} from "../helper/query.js";

export const findAll = async (req, res, next) => {
  try {
    const result = await paginate({
      table: "trip_transaction_payment",
      alias: "ttp",
      select: [
        "ttp.id",
        "ttp.payment_number",
        "ttp.payment_method",
        "ttp.payment_channel",
        "ttp.amount",
        "ttp.payment_type",
        "ttp.payment_status",
        "ttp.paid_at",
        "ttp.received_by",
        "ttp.reference_number",
        "ttp.note",
      ],
      relations: [
        {
          table: "trip_transaction",
          alias: "tt",
          on: "tt.id = ttp.trip_transaction_id",
          select: ["tt.invoice_number"],
        },
        {
          table: "trip_package",
          alias: "tp",
          on: "tp.id = tt.trip_package_id",
          select: ["tp.title AS package_name"],
        },
      ],
      orderBy: "ttp.created_at DESC",
      page: parseInt(req.query.page, 10) || 1,
      limit: Math.min(parseInt(req.query.limit, 10) || 10, 100),
    });

    return successResp(res, result, "Payments retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const findOne = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await selectAll({
      table: "trip_transaction_payment",
      alias: "ttp",
      select: [
        "ttp.id",
        "ttp.payment_number",
        "ttp.payment_method",
        "ttp.payment_channel",
        "ttp.amount",
        "ttp.payment_type",
        "ttp.payment_status",
        "ttp.paid_at",
        "ttp.received_by",
        "ttp.reference_number",
        "ttp.note",
      ],
      filters: { "ttp.id": id },
      relations: [
        {
          table: "trip_transaction",
          alias: "tt",
          on: "tt.id = ttp.trip_transaction_id",
          select: ["tt.invoice_number"],
        },
        {
          table: "trip_package",
          alias: "tp",
          on: "tp.id = tt.trip_package_id",
          select: ["tp.title AS package_name"],
        },
      ],
    });

    return successResp(res, result[0], "Payment retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    console.log("Creating payment with data:", req.body); // Debug log
    const result = await insertOne({
      table: "trip_transaction_payment",
      data: req.body,
      allowedPayload: [
        "tripTransactionId",
        "paymentNumber",
        "paymentMethod",
        "paymentChannel",
        "amount",
        "paymentType",
        "paymentStatus",
        // "paidAt",
        // "receivedBy",
        "referenceNumber",
        "note",
      ],
    });

    return successResp(res, result, "Payment created successfully");
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await updateOne({
      table: "trip_transaction_payment",
      data: req.body,
      filters: {
        id,
      },
      allowedPayload: [
        "tripTransactionId",
        "paymentNumber",
        "paymentMethod",
        "paymentChannel",
        "amount",
        "paymentType",
        "paymentStatus",
        // "paidAt",
        // "receivedBy",
        "referenceNumber",
        "note",
      ],
    });

    return successResp(res, result, "Payment updated successfully");
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await softDelete({
      table: "trip_transaction_payment",
      filters: {
        id,
      },
    });

    return successResp(res, result, "Payment deleted successfully");
  } catch (err) {
    next(err);
  }
};
