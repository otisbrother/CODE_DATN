const db = require('../config/db');
const { parseJson } = require('../services/assignmentGrading.service');

const mapAssignment = (row) => {
  if (!row) return null;
  return {
    ...row,
    assignment_type: row.assignment_type || 'manual',
    auto_grade: Boolean(row.auto_grade),
    is_final_test: Boolean(row.is_final_test),
    questions: parseJson(row.questions_json, []),
  };
};

const serializeQuestions = (questions) => {
  if (questions === undefined) return undefined;
  if (typeof questions === 'string') return questions;
  return JSON.stringify(Array.isArray(questions) ? questions : []);
};

// Assignments
const findByCourse = async (courseId) => {
  const [rows] = await db.query(`SELECT * FROM assignments WHERE course_id = ? ORDER BY section_id ASC, id DESC`, [courseId]);
  return rows.map(mapAssignment);
};
const findAssignmentById = async (id) => {
  const [rows] = await db.query(`SELECT * FROM assignments WHERE id = ?`, [id]);
  return mapAssignment(rows[0]);
};
const createAssignment = async (data) => {
  const questionsJson = serializeQuestions(data.questions);
  const assignmentType = data.assignment_type || (questionsJson ? 'mixed' : 'manual');
  const autoGrade = data.auto_grade !== undefined ? Number(Boolean(data.auto_grade)) : Number(assignmentType !== 'manual');
  const timeLimit = data.time_limit_seconds ? Number(data.time_limit_seconds) : null;
  const [result] = await db.query(
    `INSERT INTO assignments
      (course_id, section_id, title, description, due_date, max_score, status, assignment_type, questions_json, auto_grade, is_final_test, time_limit_seconds)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.course_id,
      data.section_id,
      data.title,
      data.description || null,
      data.due_date || null,
      data.max_score || 10,
      data.status || 'active',
      assignmentType,
      questionsJson || null,
      autoGrade,
      data.is_final_test ? 1 : 0,
      timeLimit,
    ]
  );
  return result.insertId;
};
const updateAssignment = async (id, data) => {
  const fields = []; const values = [];
  if (data.title) { fields.push('title = ?'); values.push(data.title); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.due_date !== undefined) { fields.push('due_date = ?'); values.push(data.due_date || null); }
  if (data.max_score !== undefined) { fields.push('max_score = ?'); values.push(data.max_score); }
  if (data.section_id !== undefined) { fields.push('section_id = ?'); values.push(data.section_id); }
  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
  if (data.assignment_type !== undefined) { fields.push('assignment_type = ?'); values.push(data.assignment_type); }
  if (data.questions !== undefined) { fields.push('questions_json = ?'); values.push(serializeQuestions(data.questions)); }
  if (data.auto_grade !== undefined) { fields.push('auto_grade = ?'); values.push(Number(Boolean(data.auto_grade))); }
  if (data.is_final_test !== undefined) { fields.push('is_final_test = ?'); values.push(data.is_final_test ? 1 : 0); }
  if (data.time_limit_seconds !== undefined) { fields.push('time_limit_seconds = ?'); values.push(data.time_limit_seconds ? Number(data.time_limit_seconds) : null); }
  if (fields.length === 0) return;
  values.push(id);
  await db.query(`UPDATE assignments SET ${fields.join(', ')} WHERE id = ?`, values);
};
const removeAssignment = async (id) => { await db.query(`DELETE FROM assignments WHERE id = ?`, [id]); };

// Test cuối khóa: mỗi khóa chỉ 1 -> bỏ cờ ở các bài khác
const clearFinalTestExcept = async (courseId, exceptId) => {
  await db.query(`UPDATE assignments SET is_final_test = 0 WHERE course_id = ? AND id <> ?`, [courseId, exceptId]);
};
const findFinalTestByCourse = async (courseId) => {
  const [rows] = await db.query(`SELECT * FROM assignments WHERE course_id = ? AND is_final_test = 1 LIMIT 1`, [courseId]);
  return mapAssignment(rows[0]);
};

module.exports = { findByCourse, findAssignmentById, createAssignment, updateAssignment, removeAssignment, clearFinalTestExcept, findFinalTestByCourse };
