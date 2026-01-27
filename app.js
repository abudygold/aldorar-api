import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import blogRoutes from "./routes/blog.routes.js";
import categoriesRoutes from "./routes/categories.routes.js";
import umrahPackageRoutes from "./routes/umrah-package.routes.js";
import umrahPriceRoutes from "./routes/umrah-price.routes.js";
import umrahTransactionRoutes from "./routes/umrah-transaction.routes.js";
import umrahPaymentRoutes from "./routes/umrah-payment.routes.js";
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
app.use("/user", userRoutes);
app.use("/blog", blogRoutes);
app.use("/categories", categoriesRoutes);
app.use("/umrah-package", umrahPackageRoutes);
app.use("/umrah-price", umrahPriceRoutes);
app.use("/umrah-transaction", umrahTransactionRoutes);
app.use("/umrah-payment", umrahPaymentRoutes);

export default app;
