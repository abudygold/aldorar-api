import { errorResp } from "../utils/response.js";

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return errorResp(
      res,
      result.error.flatten().fieldErrors,
      "VALIDATION_ERROR",
      400,
    );
  }

  req.body = result.data;
  next();
};
