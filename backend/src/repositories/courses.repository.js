const db = require('../config/db');

const findAll = async (limit, offset, filters = {}) => {
  let where = '1=1';
  const params = [];
  if (filters.status) { where += ' AND c.status = ?'; params.push(filters.status); }
  if (filters.lecturer_id) { where += ' AND c.lecturer_id = ?'; params.push(filters.lecturer_id); }
  if (filters.search) { where += ' AND c.title LIKE ?'; params.push(`%${filters.search}%`); }

  const [rows] = await db.query(
    `SELECT c.*, u.full_name as lecturer_name
     FROM courses c JOIN users u ON c.lecturer_id = u.id
     WHERE ${where} ORDER BY c.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) as total FROM courses c WHERE ${where}`, params
  );
  return { rows, total };
};

const findById = async (id) => {
  const [rows] = await db.query(
    `SELECT c.*, u.full_name as lecturer_name
     FROM courses c JOIN users u ON c.lecturer_id = u.id WHERE c.id = ?`, [id]
  );
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await db.query(
    `INSERT INTO courses (title, description, thumbnail_url, intro_video_url, short_description, price, lecturer_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.title, data.description || null, data.thumbnail_url || null, data.intro_video_url || null, data.short_description || null, data.price || 0, data.lecturer_id, data.status || 'draft']
  );
  return result.insertId;
};

const update = async (id, data) => {
  const fields = [];
  const values = [];
  if (data.title) { fields.push('title = ?'); values.push(data.title); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.thumbnail_url !== undefined) { fields.push('thumbnail_url = ?'); values.push(data.thumbnail_url); }
  if (data.intro_video_url !== undefined) { fields.push('intro_video_url = ?'); values.push(data.intro_video_url); }
  if (data.short_description !== undefined) { fields.push('short_description = ?'); values.push(data.short_description); }
  if (data.price !== undefined) { fields.push('price = ?'); values.push(data.price); }
  if (data.status) { fields.push('status = ?'); values.push(data.status); }
  if (fields.length === 0) return;
  values.push(id);
  await db.query(`UPDATE courses SET ${fields.join(', ')} WHERE id = ?`, values);
};

const remove = async (id) => {
  // Cascade delete all related data
  await db.query(`DELETE FROM ai_messages WHERE conversation_id IN (SELECT id FROM ai_conversations WHERE course_id = ?)`, [id]);
  await db.query(`DELETE FROM ai_conversations WHERE course_id = ?`, [id]);
  await db.query(`DELETE FROM ai_data_sources WHERE course_id = ?`, [id]);
  await db.query(`DELETE FROM results WHERE submission_id IN (SELECT id FROM submissions WHERE assignment_id IN (SELECT id FROM assignments WHERE course_id = ?))`, [id]);
  await db.query(`DELETE FROM submissions WHERE assignment_id IN (SELECT id FROM assignments WHERE course_id = ?)`, [id]);
  await db.query(`DELETE FROM assignments WHERE course_id = ?`, [id]);
  await db.query(`DELETE FROM learning_progress WHERE course_id = ?`, [id]);
  await db.query(`DELETE FROM materials WHERE lesson_id IN (SELECT id FROM lessons WHERE course_id = ?)`, [id]);
  await db.query(`DELETE FROM lessons WHERE course_id = ?`, [id]);
  await db.query(`DELETE FROM course_sections WHERE course_id = ?`, [id]);
  await db.query(`DELETE FROM enrollments WHERE course_id = ?`, [id]);
  await db.query(`DELETE FROM courses WHERE id = ?`, [id]);
};

const countEnrollments = async (courseId) => {
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) as total FROM enrollments WHERE course_id = ?`, [courseId]
  );
  return total;
};

module.exports = { findAll, findById, create, update, remove, countEnrollments };
