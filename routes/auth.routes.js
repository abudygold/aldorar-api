import express from "express";
import * as ctrl from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.js";
import { auth } from "../middlewares/auth.middleware.js";
import { loginSchema } from "../validations/auth.validation.js";

const router = express.Router();

// PROTECTED
router.post("/login", validate(loginSchema), ctrl.login);
router.post("/logout", auth, ctrl.logout);

export default router;
