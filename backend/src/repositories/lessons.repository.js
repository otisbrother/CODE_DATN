const db = require('../config/db');

const findByCourse = async (courseId) => {
  const [rows] = await db.query(
    `SELECT * FROM lessons WHERE course_id = ? ORDER BY lesson_order ASC`, [courseId]
  );
  return rows;
};

const findById = async (id) => {
  const [rows] = await db.query(`SELECT * FROM lessons WHERE id = ?`, [id]);
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await db.query(
    `INSERT INTO lessons (course_id, title, content, lesson_order) VALUES (?, ?, ?, ?)`,
    [data.course_id, data.title, data.content || null, data.lesson_order]
  );
  return result.insertId;
};

const update = async (id, data) => {
  const fields = [];
  const values = [];
  if (data.title) { fields.push('title = ?'); values.push(data.title); }
  if (data.content !== undefined) { fields.push('content = ?'); values.push(data.content); }
  if (data.lesson_order) { fields.push('lesson_order = ?'); values.push(data.lesson_order); }
  if (fields.length === 0) return;
  values.push(id);
  await db.query(`UPDATE lessons SET ${fields.join(', ')} WHERE id = ?`, values);
};

const remove = async (id) => {
  await db.query(`DELETE FROM lessons WHERE id = ?`, [id]);
};

const countByCourse = async (courseId) => {
  const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM lessons WHERE course_id = ?`, [courseId]);
  return total;
};

module.exports = { findByCourse, findById, create, update, remove, countByCourse };
