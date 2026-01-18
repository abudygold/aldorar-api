export const successResp = (
  res,
  data = null,
  msg = "Success",
  code = "SUCCESS",
  status = 200,
) => {
  return res.status(status).json({
    code,
    msg,
    data,
  });
};

export const errorResp = (
  res,
  msg = "Error",
  code = "ERROR",
  status = 400,
  data = null,
) => {
  return res.status(status).json({
    code,
    msg,
    data,
  });
};
