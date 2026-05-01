const db = require('../config/db');

const findByUserAndCourse = async (userId, courseId) => {
  const [rows] = await db.query(
    `SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?`, [userId, courseId]
  );
  return rows[0] || null;
};

const findByUser = async (userId) => {
  const [rows] = await db.query(
    `SELECT e.*, c.title as course_title, c.description, c.price, c.thumbnail_url, u.full_name as lecturer_name
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
    `INSERT INTO enrollments (user_id, course_id, payment_id, access_status) VALUES (?, ?, ?, ?)`,
    [data.user_id, data.course_id, data.payment_id, data.access_status || 'pending']
  );
  return result.insertId;
};

const updateStatus = async (id, status) => {
  await db.query(`UPDATE enrollments SET access_status = ? WHERE id = ?`, [status, id]);
};

module.exports = { findByUserAndCourse, findByUser, findByCourse, create, updateStatus };
