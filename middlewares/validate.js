import { errorResp } from "../utils/response.js";

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return errorResp(
      res,
      "Validation error",
      "VALIDATION_ERROR",
      400,
      result.error.flatten().fieldErrors,
    );
  }

  req.body = result.data;
  next();
};
