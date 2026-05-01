const db = require('../config/db');

// Assignments
const findByCourse = async (courseId) => {
  const [rows] = await db.query(`SELECT * FROM assignments WHERE course_id = ? ORDER BY section_id ASC, id DESC`, [courseId]);
  return rows;
};
const findAssignmentById = async (id) => {
  const [rows] = await db.query(`SELECT * FROM assignments WHERE id = ?`, [id]);
  return rows[0] || null;
};
const createAssignment = async (data) => {
  const [result] = await db.query(
    `INSERT INTO assignments (course_id, section_id, title, description, due_date, max_score, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.course_id, data.section_id, data.title, data.description || null, data.due_date || null, data.max_score || 10, data.status || 'active']
  );
  return result.insertId;
};
const updateAssignment = async (id, data) => {
  const fields = []; const values = [];
  if (data.title) { fields.push('title = ?'); values.push(data.title); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.due_date !== undefined) { fields.push('due_date = ?'); values.push(data.due_date); }
  if (data.max_score !== undefined) { fields.push('max_score = ?'); values.push(data.max_score); }
  if (data.section_id !== undefined) { fields.push('section_id = ?'); values.push(data.section_id); }
  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
  if (fields.length === 0) return;
  values.push(id);
  await db.query(`UPDATE assignments SET ${fields.join(', ')} WHERE id = ?`, values);
};
const removeAssignment = async (id) => { await db.query(`DELETE FROM assignments WHERE id = ?`, [id]); };

module.exports = { findByCourse, findAssignmentById, createAssignment, updateAssignment, removeAssignment };
