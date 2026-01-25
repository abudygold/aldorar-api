import bcrypt from "bcrypt";
import { pool } from "../config/db.js";
import { toCamelCase } from "../utils/camelcase.js";

export const createUser = async (req, res) => {
  const { fullName, email, password, phone, role } = req.body;

  const hash = await bcrypt.hash(password, 10);

  const { rows } = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, phone, role)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [fullName, email, hash, phone, role],
  );

  res.json(toCamelCase(rows[0]));
};

export const listUsers = async (_, res) => {
  const { rows } = await pool.query(
    "SELECT id, full_name, email, phone, role FROM users",
  );
  res.json(toCamelCase(rows));
};

export const getUser = async (req, res) => {
  const { rows } = await pool.query(
    "SELECT id, full_name, email, phone, role FROM users WHERE id=$1",
    [req.params.id],
  );
  res.json(toCamelCase(rows[0]));
};

export const updateUser = async (req, res) => {
  // example simple update
  const { fullName, phone } = req.body;

  const { rows } = await pool.query(
    `UPDATE users SET full_name=$1, phone=$2, updated_at=NOW()
     WHERE id=$3 RETURNING *`,
    [fullName, phone, req.params.id],
  );

  res.json(toCamelCase(rows[0]));
};

export const deleteUser = async (req, res) => {
  await pool.query("DELETE FROM users WHERE id=$1", [req.params.id]);
  res.json({ message: "User deleted" });
};
