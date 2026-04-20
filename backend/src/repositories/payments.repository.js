const db = require('../config/db');

const create = async (data) => {
  const [result] = await db.query(
    `INSERT INTO payments (user_id, total_amount, payment_method, payment_status, paid_at) VALUES (?, ?, ?, ?, ?)`,
    [data.user_id, data.total_amount, data.payment_method || 'bank_transfer', data.payment_status || 'pending', data.paid_at || null]
  );
  return result.insertId;
};

const findById = async (id) => {
  const [rows] = await db.query(`SELECT * FROM payments WHERE id = ?`, [id]);
  return rows[0] || null;
};

const updateStatus = async (id, status) => {
  const paid_at = status === 'completed' ? new Date() : null;
  await db.query(`UPDATE payments SET payment_status = ?, paid_at = ? WHERE id = ?`, [status, paid_at, id]);
};

const findByUser = async (userId) => {
  const [rows] = await db.query(`SELECT * FROM payments WHERE user_id = ? ORDER BY id DESC`, [userId]);
  return rows;
};

module.exports = { create, findById, updateStatus, findByUser };
