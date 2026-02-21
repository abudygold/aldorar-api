import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { JWT_SECRET } from "../config/jwt.js";
import { errorResp } from "../helper/response.js";

export const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResp(res, "Unauthorized", "UNAUTHORIZED", 401);
    }

    const token = authHeader.split(" ")[1];

    // 1️⃣ Verify JWT signature & expiration
    const payload = jwt.verify(token, JWT_SECRET);

    // 2️⃣ Check token exists in DB
    const { rows } = await pool.query(
      `SELECT id, role FROM users WHERE id = $1 AND access_token = $2`,
      [payload.id, token],
    );

    if (!rows.length) {
      return errorResp(res, "Session expired", "UNAUTHORIZED", 401);
    }

    // 3️⃣ Attach user to request
    req.user = rows[0];
    next();
  } catch (err) {
    return errorResp(res, "Unauthorized", "UNAUTHORIZED", 401);
  }
};
