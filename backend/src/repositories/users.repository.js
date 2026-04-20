const db = require('../config/db');

const findAll = async (limit, offset, filters = {}) => {
  let where = '1=1';
  const params = [];
  if (filters.search) {
    where += ' AND (u.full_name LIKE ? OR u.email LIKE ?)';
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  if (filters.role) {
    where += ' AND r.role_name = ?';
    params.push(filters.role);
  }
  const [rows] = await db.query(
    `SELECT u.id, u.full_name, u.email, u.status, u.created_at, u.role_id, r.role_name
     FROM users u JOIN roles r ON u.role_id = r.id WHERE ${where} ORDER BY u.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) as total FROM users u JOIN roles r ON u.role_id = r.id WHERE ${where}`, params
  );
  return { rows, total };
};

const findById = async (id) => {
  const [rows] = await db.query(
    `SELECT u.id, u.full_name, u.email, u.status, u.role_id, u.created_at, r.role_name
     FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
    [id]
  );
  return rows[0] || null;
};

const update = async (id, data) => {
  const fields = [];
  const values = [];
  if (data.full_name) { fields.push('full_name = ?'); values.push(data.full_name); }
  if (data.email) { fields.push('email = ?'); values.push(data.email); }
  if (data.role_id) { fields.push('role_id = ?'); values.push(data.role_id); }
  if (data.status) { fields.push('status = ?'); values.push(data.status); }
  if (data.password_hash) { fields.push('password_hash = ?'); values.push(data.password_hash); }
  if (fields.length === 0) return;
  values.push(id);
  await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
};

const remove = async (id) => {
  await db.query(`UPDATE users SET status = 'locked' WHERE id = ?`, [id]);
};

module.exports = { findAll, findById, update, remove };
