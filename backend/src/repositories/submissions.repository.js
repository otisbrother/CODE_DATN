const db = require('../config/db');
const { parseJson } = require('../services/assignmentGrading.service');

const mapSubmission = (row) => {
  if (!row) return null;
  return {
    ...row,
    answers: parseJson(row.answers_json, null),
  };
};

const findByAssignment = async (assignmentId) => {
  const [rows] = await db.query(
    `SELECT s.*, u.full_name as student_name, r.score, r.feedback
     FROM submissions s
     JOIN users u ON s.student_id = u.id
     LEFT JOIN results r ON r.submission_id = s.id
     WHERE s.assignment_id = ?
     ORDER BY s.submitted_at DESC`,
    [assignmentId]
  );
  return rows.map(mapSubmission);
};
const findById = async (id) => {
  const [rows] = await db.query(
    `SELECT s.*, u.full_name as student_name FROM submissions s JOIN users u ON s.student_id = u.id WHERE s.id = ?`, [id]
  );
  return mapSubmission(rows[0]);
};
const findByStudentAndAssignment = async (studentId, assignmentId) => {
  const [rows] = await db.query(
    `SELECT * FROM submissions WHERE student_id = ? AND assignment_id = ?`, [studentId, assignmentId]
  );
  return mapSubmission(rows[0]);
};
const create = async (data) => {
  const answersJson = data.answers !== undefined ? JSON.stringify(data.answers) : (data.answers_json || null);
  const [result] = await db.query(
    `INSERT INTO submissions (assignment_id, student_id, content, answers_json, status) VALUES (?, ?, ?, ?, ?)`,
    [data.assignment_id, data.student_id, data.content || null, answersJson, 'submitted']
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
  return rows.map(mapSubmission);
};

module.exports = { findByAssignment, findById, findByStudentAndAssignment, create, findByStudent };
