import express from "express";
import * as ctrl from "../controllers/upload.controller.js";
import { upload } from "../utils/multer.js";

const router = express.Router();

// PROTECTED
router.post("/", upload.single("upload"), ctrl.single);

export default router;
