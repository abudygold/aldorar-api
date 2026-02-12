import express from "express";
import { auth } from "../../middlewares/auth.middleware.js";
import * as ctrl from "../../controllers/blog/blog.controller.js";
import { validate } from "../../middlewares/validate.js";
import {
  createSchema,
  updateSchema,
} from "../../validations/blog/blog.validation.js";
import { upload } from "../../utils/multer.js";

const router = express.Router();

// PUBLIC
router.get("/", ctrl.findAll);
router.get("/:id", ctrl.findOne);

// PROTECTED
router.post(
  "/",
  auth,
  upload.single("cover"),
  validate(createSchema),
  ctrl.create,
);
router.put(
  "/:id",
  auth,
  upload.single("cover"),
  validate(updateSchema),
  ctrl.update,
);
router.delete("/:id", auth, ctrl.remove);

export default router;
