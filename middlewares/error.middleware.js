import { errorResp } from "../helper/response.js";

export const errorHandler = (err, req, res, next) => {
  console.error(err);

  return errorResp(
    res,
    err.message || "Internal Server Error",
    err.code || "INTERNAL_ERROR",
    err.status || 500,
  );
};
