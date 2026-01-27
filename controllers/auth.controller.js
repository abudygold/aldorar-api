import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { JWT_SECRET, JWT_EXPIRES } from "../config/jwt.js";
import { successResp, errorResp } from "../utils/response.js";

/* ================= LOGIN ================= */
export const login = async (req, res, next) => {
  const { email, password } = req.body;

  const { rows } = await pool.query(
    "SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL",
    [email],
  );

  if (!rows.length) {
    return errorResp(res, "Invalid credentials", "AUTH_ERROR", 401);
  }

  const user = rows[0];
  const match = await bcrypt.compare(password, user.password_hash);

  if (!match) {
    return errorResp(res, "Invalid credentials", "AUTH_ERROR", 401);
  }

  // Generate JWT
  const accessToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES,
  });

  // 🔥 Store token in DB
  await pool.query(`UPDATE users SET access_token = $1 WHERE id = $2`, [
    accessToken,
    user.id,
  ]);

  successResp(
    res,
    {
      accessToken,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      },
    },
    "Login success",
  );
};

/* ================= LOGOUT ================= */
export const logout = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await pool.query(`UPDATE users SET access_token = NULL WHERE id = $1`, [
      userId,
    ]);

    successResp(res, null, "Logout success");
  } catch (err) {
    next(err);
  }
};
