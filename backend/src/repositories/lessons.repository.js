const db = require('../config/db');

const findByCourse = async (courseId) => {
  const [rows] = await db.query(
    `SELECT * FROM lessons WHERE course_id = ? ORDER BY section_id ASC, lesson_order ASC`, [courseId]
  );
  return rows;
};

const findBySection = async (sectionId) => {
  const [rows] = await db.query(
    `SELECT * FROM lessons WHERE section_id = ? ORDER BY lesson_order ASC`, [sectionId]
  );
  return rows;
};

const findById = async (id) => {
  const [rows] = await db.query(`SELECT * FROM lessons WHERE id = ?`, [id]);
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await db.query(
    `INSERT INTO lessons (course_id, section_id, title, content, video_url, duration_seconds, is_preview, status, lesson_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.course_id, data.section_id, data.title, data.content || null, data.video_url || null, data.duration_seconds || null, data.is_preview || 0, data.status || 'active', data.lesson_order]
  );
  return result.insertId;
};

const update = async (id, data) => {
  const fields = [];
  const values = [];
  if (data.title) { fields.push('title = ?'); values.push(data.title); }
  if (data.content !== undefined) { fields.push('content = ?'); values.push(data.content); }
  if (data.section_id !== undefined) { fields.push('section_id = ?'); values.push(data.section_id); }
  if (data.video_url !== undefined) { fields.push('video_url = ?'); values.push(data.video_url); }
  if (data.duration_seconds !== undefined) { fields.push('duration_seconds = ?'); values.push(data.duration_seconds); }
  if (data.is_preview !== undefined) { fields.push('is_preview = ?'); values.push(data.is_preview); }
  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
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

module.exports = { findByCourse, findBySection, findById, create, update, remove, countByCourse };
