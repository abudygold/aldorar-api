import express from "express";
import { auth } from "../middlewares/auth.middleware.js";
import * as ctrl from "../controllers/blog.controller.js";
import { validate } from "../middlewares/validate.js";
import { updateSchema } from "../validations/blog.validation.js";
import { fileUpload } from "../helper/multer.js";

const router = express.Router();

// PUBLIC
router.get("/public", ctrl.findAllPublic);
router.get("/:id", ctrl.findOne);

// PROTECTED
router.get("/", auth, ctrl.findAll);
router.post(
  "/",
  auth,
  fileUpload.single("cover"),
  validate(updateSchema),
  ctrl.create,
);
router.put(
  "/:id",
  auth,
  fileUpload.single("cover"),
  validate(updateSchema),
  ctrl.update,
);
router.delete("/:id", auth, ctrl.remove);

export default router;
