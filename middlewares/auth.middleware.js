import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { JWT_SECRET } from '../config/jwt.js';

export const auth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing token' });
  }

  const token = header.split(' ')[1];

  try {
    // 1️⃣ Verify JWT signature & expiration
    const decoded = jwt.verify(token, JWT_SECRET);

    // 2️⃣ Check token exists in DB
    const { rows } = await pool.query(
      'SELECT id, role FROM users WHERE id = $1 AND access_token = $2',
      [decoded.id, token]
    );

    if (!rows.length) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // 3️⃣ Attach user to request
    req.user = rows[0];

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token expired or invalid' });
  }
};
