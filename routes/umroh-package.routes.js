import express from "express";
import { auth } from "../middlewares/auth.middleware.js";
import * as ctrl from "../controllers/umroh-package.controller.js";
import { validate } from "../middlewares/validate.js";
import {
  createUmrohPackageSchema,
  updateUmrohPackageSchema,
} from "../validations/umroh-package.validation.js";

const router = express.Router();

// Public
router.get("/", ctrl.getPackages);
router.get("/:id", ctrl.getPackageDetail);

// Protected
router.post("/", auth, validate(createUmrohPackageSchema), ctrl.createPackage);
router.put(
  "/:id",
  auth,
  validate(updateUmrohPackageSchema),
  ctrl.updatePackage,
);
router.delete("/:id", auth, ctrl.deletePackage);

export default router;
