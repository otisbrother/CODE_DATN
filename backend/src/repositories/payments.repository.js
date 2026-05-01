const db = require('../config/db');

const create = async (data) => {
  const [result] = await db.query(
    `INSERT INTO payments (user_id, course_id, total_amount, payment_method, payment_status, paid_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [data.user_id, data.course_id || null, data.total_amount, data.payment_method || 'bank_transfer', data.payment_status || 'pending', data.paid_at || null]
  );
  return result.insertId;
};

const findById = async (id) => {
  const [rows] = await db.query(
    `SELECT p.*, u.full_name as user_name, u.email as user_email, c.title as course_title
     FROM payments p
     JOIN users u ON p.user_id = u.id
     LEFT JOIN courses c ON p.course_id = c.id
     WHERE p.id = ?`, [id]
  );
  return rows[0] || null;
};

const updateStatus = async (id, status) => {
  const paid_at = status === 'completed' ? new Date() : null;
  await db.query(`UPDATE payments SET payment_status = ?, paid_at = COALESCE(paid_at, ?) WHERE id = ?`, [status, paid_at, id]);
};

const updateAmount = async (id, amount) => {
  await db.query(
    `UPDATE payments SET total_amount = ? WHERE id = ? AND payment_status = 'pending'`,
    [amount, id]
  );
};

const findByUser = async (userId) => {
  const [rows] = await db.query(
    `SELECT p.*, c.title as course_title
     FROM payments p
     LEFT JOIN courses c ON p.course_id = c.id
     WHERE p.user_id = ? ORDER BY p.id DESC`, [userId]
  );
  return rows;
};

const findAll = async (status) => {
  let sql = `SELECT p.*, u.full_name as user_name, u.email as user_email, c.title as course_title
     FROM payments p
     JOIN users u ON p.user_id = u.id
     LEFT JOIN courses c ON p.course_id = c.id`;
  const params = [];
  if (status) {
    sql += ` WHERE p.payment_status = ?`;
    params.push(status);
  }
  sql += ` ORDER BY p.id DESC`;
  const [rows] = await db.query(sql, params);
  return rows;
};

module.exports = { create, findById, updateStatus, updateAmount, findByUser, findAll };
