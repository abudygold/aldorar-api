import express from "express";
import cors from "cors";
import slowDown from "express-slow-down";
import { errorHandler } from "./middlewares/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import blogRoutes from "./routes/blog.routes.js";
import categoriesRoutes from "./routes/categories.routes.js";
import packageRoutes from "./routes/package.routes.js";
import travelerRoutes from "./routes/traveler.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import paymentRoutes from "./routes/payment.routes.js";

const app = express();
const speedLimiter = slowDown({
  windowMs: 1 * 60 * 1000, // 1 menit
  delayAfter: 10, // setelah 10 request
  delayMs: () => 100, // tiap request berikutnya delay 100ms
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
app.use("/user", userRoutes);
app.use("/blog", blogRoutes);
app.use("/categories", categoriesRoutes);
app.use("/package", packageRoutes);
app.use("/traveler", travelerRoutes);
app.use("/transaction", transactionRoutes);
app.use("/upload", uploadRoutes);
app.use("/payment", paymentRoutes);

export default app;
