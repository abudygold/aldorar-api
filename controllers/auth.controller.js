import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { JWT_SECRET, JWT_EXPIRES } from "../config/jwt.js";

export const login = async (req, res) => {
  const { email, password } = req.body;

  const { rows } = await pool.query("SELECT * FROM users WHERE email=$1", [
    email,
  ]);

  if (!rows.length) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const user = rows[0];
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Generate JWT
  const accessToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES,
  });

  // Store token in DB
  await pool.query("UPDATE users SET access_token = $1 WHERE id = $2", [
    accessToken,
    user.id,
  ]);

  res.json({ accessToken });
};

export const logout = async (req, res) => {
  await pool.query("UPDATE users SET access_token = NULL WHERE id = $1", [
    req.user.id,
  ]);

  res.json({ message: "Logged out successfully" });
};
