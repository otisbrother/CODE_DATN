const db = require('../config/db');

const findByCourse = async (courseId) => {
  const [rows] = await db.query(
    `SELECT * FROM course_sections WHERE course_id = ? ORDER BY section_order ASC`, [courseId]
  );
  return rows;
};

const findById = async (id) => {
  const [rows] = await db.query(`SELECT * FROM course_sections WHERE id = ?`, [id]);
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await db.query(
    `INSERT INTO course_sections (course_id, title, description, section_order, is_preview) VALUES (?, ?, ?, ?, ?)`,
    [data.course_id, data.title, data.description || null, data.section_order, data.is_preview || 0]
  );
  return result.insertId;
};

const update = async (id, data) => {
  const fields = [];
  const values = [];
  if (data.title) { fields.push('title = ?'); values.push(data.title); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.section_order !== undefined) { fields.push('section_order = ?'); values.push(data.section_order); }
  if (data.is_preview !== undefined) { fields.push('is_preview = ?'); values.push(data.is_preview); }
  if (fields.length === 0) return;
  values.push(id);
  await db.query(`UPDATE course_sections SET ${fields.join(', ')} WHERE id = ?`, values);
};

const remove = async (id) => {
  await db.query(`DELETE FROM course_sections WHERE id = ?`, [id]);
};

const countByCourse = async (courseId) => {
  const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM course_sections WHERE course_id = ?`, [courseId]);
  return total;
};

module.exports = { findByCourse, findById, create, update, remove, countByCourse };
