import express from "express";
import { auth } from "../middlewares/auth.middleware.js";
import * as ctrl from "../controllers/package.controller.js";
import { validate } from "../middlewares/validate.js";
import { createSchema, updateSchema } from "../validations/package.validation.js";

const router = express.Router();

// Public
router.get("/publish", ctrl.findPublish);
router.get("/:id", ctrl.findOne);

// Protected
router.get("/", auth, ctrl.findAll);
router.post("/", auth, validate(createSchema), ctrl.create);
router.put("/:id", auth, validate(updateSchema), ctrl.update);
router.delete("/:id", auth, ctrl.remove);

export default router;
