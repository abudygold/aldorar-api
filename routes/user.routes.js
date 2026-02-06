import express from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.js";
import * as ctrl from "../controllers/user.controller.js";
import { createSchema, updateSchema } from "../validations/user.validation.js";

const router = express.Router();

router.post("/", validate(createSchema), ctrl.create);
router.use(auth);

// PROTECTED
router.get("/", ctrl.findAll);
router.get("/:id", ctrl.findOne);
router.put("/:id", validate(updateSchema), ctrl.update);
router.delete("/:id", ctrl.remove);

export default router;
