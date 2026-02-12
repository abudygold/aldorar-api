import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import blogRoutes from "./routes/blog/blog.routes.js";
import categoriesRoutes from "./routes/blog/categories.routes.js";
import packageRoutes from "./routes/package/package.routes.js";
import priceRoutes from "./routes/package/price.routes.js";
import transactionRoutes from "./routes/package/transaction.routes.js";
import paymentRoutes from "./routes/package/payment.routes.js";
import participantRoutes from "./routes/package/participant.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import slowDown from "express-slow-down";

const app = express();
const speedLimiter = slowDown({
  windowMs: 1 * 60 * 1000, // 1 menit
  delayAfter: 10, // setelah 10 request
  delayMs: () => 100, // tiap request berikutnya delay 100ms
});

app.use(
  cors({
    // origin: process.env.FRONTEND_URL,
    origin: "*",
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
app.use("/price", priceRoutes);
app.use("/transaction", transactionRoutes);
app.use("/payment", paymentRoutes);
app.use("/participant", participantRoutes);
app.use("/upload", uploadRoutes);

export default app;
