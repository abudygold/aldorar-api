import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/heic",
  "image/avif",
];

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: process.env.CLOUDINARY_FOLDER,
    resource_type: "image",
    format: async () => "webp",
    public_id: () => `img-${Date.now()}`,
    transformation: [{ width: 1600, crop: "limit", quality: "auto" }],
  },
});

export const fileUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported image format"), false);
    }
  },
});

export const fileDestroy = async (fileName) => {
  try {
    const result = await cloudinary.uploader.destroy(
      `${process.env.CLOUDINARY_FOLDER}/${fileName}`,
      {
        resource_type: "image",
      },
    );
    return result;
  } catch (err) {
    console.error("Cloudinary destroy error:", err);
    throw err;
  }
};
