import express from "express";
import cors from 'cors';
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import articleRoutes from "./routes/article.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(errorHandler);

app.use("/auth", authRoutes);
// app.use("/users", userRoutes);
app.use("/articles", articleRoutes);

export default app;
