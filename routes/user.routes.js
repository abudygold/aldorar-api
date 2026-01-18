import express from "express";
import { auth } from "../middlewares/auth.middleware.js";
import * as ctrl from "../controllers/user.controller.js";

const router = express.Router();

router.use(auth);

router.post("/", ctrl.createUser);
router.get("/", ctrl.listUsers);
router.get("/:id", ctrl.getUser);
router.put("/:id", ctrl.updateUser);
router.delete("/:id", ctrl.deleteUser);

export default router;
