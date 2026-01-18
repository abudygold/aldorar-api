import express from "express";
import { auth } from "../middlewares/auth.middleware.js";
import * as ctrl from "../controllers/article.controller.js";

const router = express.Router();

// PUBLIC
router.get("/", ctrl.listArticles);
router.get("/related", ctrl.getRandomArticles);
router.get("/:id", ctrl.getArticle);

// PROTECTED
router.post("/", auth, ctrl.createArticle);
router.put("/:id", auth, ctrl.updateArticle);
router.delete("/:id", auth, ctrl.deleteArticle);

export default router;
