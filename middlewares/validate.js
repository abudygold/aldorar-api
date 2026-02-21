import { errorResp } from "../helper/response.js";

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return errorResp(
      res,
      Object.keys(result.error.flatten().fieldErrors).length > 0
        ? result.error.flatten().fieldErrors
        : result.error.flatten().formErrors,
      "VALIDATION_ERROR",
      400,
    );
  }

  req.body = result.data;
  next();
};
