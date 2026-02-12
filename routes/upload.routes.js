import express from "express";
import { auth } from "../middlewares/auth.middleware.js";
import * as ctrl from "../controllers/upload.controller.js";
import { upload } from "../utils/multer.js";

const router = express.Router();

router.use(auth);

// PROTECTED
router.post("/", upload.single("upload"), ctrl.single);

export default router;
