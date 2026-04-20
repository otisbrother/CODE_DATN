const db = require('../config/db');

const findByEmail = async (email) => {
  const [rows] = await db.query(
    `SELECT u.*, r.role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?`,
    [email]
  );
  return rows[0] || null;
};

const findById = async (id) => {
  const [rows] = await db.query(
    `SELECT u.id, u.full_name, u.email, u.status, u.role_id, u.created_at, r.role_name
     FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
    [id]
  );
  return rows[0] || null;
};

const create = async (userData) => {
  const { full_name, email, password_hash, role_id } = userData;
  const [result] = await db.query(
    `INSERT INTO users (full_name, email, password_hash, role_id) VALUES (?, ?, ?, ?)`,
    [full_name, email, password_hash, role_id]
  );
  return result.insertId;
};

const getRoleByName = async (roleName) => {
  const [rows] = await db.query(`SELECT * FROM roles WHERE role_name = ?`, [roleName]);
  return rows[0] || null;
};

module.exports = { findByEmail, findById, create, getRoleByName };
