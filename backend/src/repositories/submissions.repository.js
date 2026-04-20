const db = require('../config/db');

const findByAssignment = async (assignmentId) => {
  const [rows] = await db.query(
    `SELECT s.*, u.full_name as student_name FROM submissions s JOIN users u ON s.student_id = u.id WHERE s.assignment_id = ? ORDER BY s.submitted_at DESC`,
    [assignmentId]
  );
  return rows;
};
const findById = async (id) => {
  const [rows] = await db.query(
    `SELECT s.*, u.full_name as student_name FROM submissions s JOIN users u ON s.student_id = u.id WHERE s.id = ?`, [id]
  );
  return rows[0] || null;
};
const findByStudentAndAssignment = async (studentId, assignmentId) => {
  const [rows] = await db.query(
    `SELECT * FROM submissions WHERE student_id = ? AND assignment_id = ?`, [studentId, assignmentId]
  );
  return rows[0] || null;
};
const create = async (data) => {
  const [result] = await db.query(
    `INSERT INTO submissions (assignment_id, student_id, content, file_url, status) VALUES (?, ?, ?, ?, ?)`,
    [data.assignment_id, data.student_id, data.content || null, data.file_url || null, 'submitted']
  );
  return result.insertId;
};
const findByStudent = async (studentId) => {
  const [rows] = await db.query(
    `SELECT s.*, a.title as assignment_title, a.max_score, c.title as course_title,
     r.score, r.feedback
     FROM submissions s
     JOIN assignments a ON s.assignment_id = a.id
     JOIN courses c ON a.course_id = c.id
     LEFT JOIN results r ON r.submission_id = s.id
     WHERE s.student_id = ? ORDER BY s.submitted_at DESC`, [studentId]
  );
  return rows;
};

module.exports = { findByAssignment, findById, findByStudentAndAssignment, create, findByStudent };
