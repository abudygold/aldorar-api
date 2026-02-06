import express from "express";
import { auth } from "../middlewares/auth.middleware.js";
import * as ctrl from "../controllers/package/package.controller.js";
import { validate } from "../middlewares/validate.js";
import {
  createSchema,
  updateSchema,
} from "../validations/package/package.validation.js";

const router = express.Router();

// Public
router.get("/", ctrl.findAll);
router.get("/:id", ctrl.findOne);

// Protected
router.post("/", auth, validate(createSchema), ctrl.create);
router.put("/:id", auth, validate(updateSchema), ctrl.update);
router.delete("/:id", auth, ctrl.remove);

export default router;
