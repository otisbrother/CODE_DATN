const db = require('../config/db');

const findByUserAndCourse = async (userId, courseId) => {
  const [rows] = await db.query(
    `SELECT e.*, c.duration_days FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE e.user_id = ? AND e.course_id = ?`, [userId, courseId]
  );
  return rows[0] || null;
};

const findByUser = async (userId) => {
  const [rows] = await db.query(
    `SELECT e.*, e.expires_at, c.title as course_title, c.description, c.price, c.thumbnail_url, c.duration_days, u.full_name as lecturer_name
     FROM enrollments e
     JOIN courses c ON e.course_id = c.id
     JOIN users u ON c.lecturer_id = u.id
     WHERE e.user_id = ? ORDER BY e.enrolled_at DESC`, [userId]
  );
  return rows;
};

const findByCourse = async (courseId) => {
  const [rows] = await db.query(
    `SELECT e.*, u.full_name, u.email
     FROM enrollments e JOIN users u ON e.user_id = u.id
     WHERE e.course_id = ? ORDER BY e.enrolled_at DESC`, [courseId]
  );
  return rows;
};

const create = async (data) => {
  const [result] = await db.query(
    `INSERT INTO enrollments (user_id, course_id, payment_id, access_status, expires_at) VALUES (?, ?, ?, ?, ?)`,
    [data.user_id, data.course_id, data.payment_id, data.access_status || 'pending', data.expires_at || null]
  );
  return result.insertId;
};

const updateStatus = async (id, status) => {
  await db.query(`UPDATE enrollments SET access_status = ? WHERE id = ?`, [status, id]);
};

const preserve = async (id, reason) => {
  await db.query(
    `UPDATE enrollments SET is_preserved = 1, preserved_at = NOW(),
       preserve_count = preserve_count + 1, preserve_reason = ? WHERE id = ?`,
    [reason || null, id]
  );
};

const resume = async (id, newExpiresAt) => {
  await db.query(
    `UPDATE enrollments SET is_preserved = 0, preserved_at = NULL, expires_at = ? WHERE id = ?`,
    [newExpiresAt, id]
  );
};

module.exports = { findByUserAndCourse, findByUser, findByCourse, create, updateStatus, preserve, resume };

