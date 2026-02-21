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
      table: "categories",
      select: ["id", "label", "value", "code"],
      orderBy: "created_at DESC",
      filters: { deleted_at: null },
      page: parseInt(req.query.page, 10) || 1,
      limit: Math.min(parseInt(req.query.limit, 10) || 10, 100),
    });

    return successResp(res, result, "Categories retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const findByCode = async (req, res, next) => {
  try {
    const result = await selectAll({
      table: "categories",
      select: ["id", "label", "value", "code"],
      filters: {
        deleted_at: null,
        code: {
          operator: "IN",
          value: req.query.code.includes(",")
            ? req.query.code?.split(",").map((v) => v.trim())
            : req.query.code,
        },
      },
      orderBy: "label ASC",
    });

    return successResp(res, result, "Categories retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const findOne = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await selectAll({
      table: "categories",
      select: ["id", "label", "value", "code"],
      filters: {
        id,
        deleted_at: null,
      },
    });

    return successResp(res, result[0], "Category retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const result = await insertOne({
      table: "categories",
      data: req.body,
      allowedPayload: ["id", "label", "value", "code"],
      returning: ["label", "value", "code"],
    });

    return successResp(res, result, "Category created successfully");
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await updateOne({
      table: "categories",
      data: req.body,
      filters: {
        id,
      },
      allowedPayload: ["id", "label", "value", "code"],
      returning: ["label", "value", "code"],
      res,
    });

    return successResp(res, result, "Category updated successfully");
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;

    const result = await softDelete({
      table: "categories",
      filters: {
        id,
      },
      deletedBy: userId,
    });

    return successResp(res, result, "Category deleted successfully");
  } catch (err) {
    if (err.code === "23503") {
      return successResp(res, null, "Category is in use and cannot be deleted");
    }

    next(err);
  }
};
