import bcrypt from "bcrypt";
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
      table: "users",
      select: ["first_name", "last_name", "email", "phone", "is_active"],
      filters: { deleted_at: null },
      orderBy: "created_at DESC",
      page: parseInt(req.query.page, 10) || 1,
      limit: Math.min(parseInt(req.query.limit, 10) || 10, 100),
    });

    return successResp(res, result, "Users retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const findOne = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await selectAll({
      table: "users",
      select: ["first_name", "last_name", "email", "phone", "is_active"],
      filters: {
        email: id,
        deleted_at: null,
      },
    });

    console.log(result);

    return successResp(res, result[0], "User retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { password, ...rest } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = { ...rest, passwordHash: hashedPassword };

    const result = await insertOne({
      table: "users",
      data: userData,
      allowedPayload: [
        "firstName",
        "lastName",
        "email",
        "passwordHash",
        "phone",
        "role",
        "isActive",
      ],
      returning: "first_name, last_name, email, phone, role, is_active",
    });

    return successResp(res, result, "User created successfully");
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await updateOne({
      table: "users",
      data: req.body,
      filters: {
        email: id,
      },
      allowedPayload: [
        "firstName",
        "lastName",
        "email",
        "phone",
        "role",
        "isActive",
      ],
      returning: "first_name, last_name, email, phone, role, is_active",
    });

    return successResp(res, result, "User updated successfully");
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;

    const result = await softDelete({
      table: "users",
      deletedBy: userId,
      filters: {
        id,
      },
    });

    return successResp(res, result, "User deleted successfully");
  } catch (err) {
    next(err);
  }
};
