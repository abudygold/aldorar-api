import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import articleRoutes from "./routes/article.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import slowDown from "express-slow-down";

const app = express();
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 menit
  delayAfter: 100, // setelah 100 request
  delayMs: () => 500, // tiap request berikutnya delay 500ms
});

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
  speedLimiter,
);

app.use(express.json());
app.use(errorHandler);

app.use("/auth", authRoutes);
app.use("/articles", articleRoutes);

export default app;
