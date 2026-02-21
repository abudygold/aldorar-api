import { errorResp } from "../helper/response.js";

export const single = async (req, res, next) => {
  try {
    if (!req.file || !req.file.path) {
      return errorResp(res, "Upload failed", "UPLOAD_FAILED", 400);
    }

    res.json({
      url: req.file.path, // URL dari Cloudinary
    });
  } catch (err) {
    next(err);
  }
};
