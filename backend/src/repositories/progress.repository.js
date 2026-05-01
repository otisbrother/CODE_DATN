const db = require('../config/db');

const findByStudentAndCourse = async (studentId, courseId) => {
  const [rows] = await db.query(
    `SELECT * FROM learning_progress WHERE student_id = ? AND course_id = ?`, [studentId, courseId]
  );
  return rows[0] || null;
};

const findByStudent = async (studentId) => {
  const [rows] = await db.query(
    `SELECT lp.*, c.title as course_title FROM learning_progress lp
     JOIN courses c ON lp.course_id = c.id WHERE lp.student_id = ?`, [studentId]
  );
  return rows;
};

const findByCourse = async (courseId) => {
  const [rows] = await db.query(
    `SELECT lp.*, u.full_name as student_name FROM learning_progress lp
     JOIN users u ON lp.student_id = u.id WHERE lp.course_id = ?`, [courseId]
  );
  return rows;
};

const upsert = async (studentId, courseId, data) => {
  const existing = await findByStudentAndCourse(studentId, courseId);
  if (existing) {
    await db.query(
      `UPDATE learning_progress SET completed_lessons = ?, completed_assignments = ?, completion_rate = ?, status = ? WHERE id = ?`,
      [data.completed_lessons, data.completed_assignments, data.completion_rate, data.status, existing.id]
    );
  } else {
    await db.query(
      `INSERT INTO learning_progress (student_id, course_id, completed_lessons, completed_assignments, completion_rate, status) VALUES (?, ?, ?, ?, ?, ?)`,
      [studentId, courseId, data.completed_lessons || 0, data.completed_assignments || 0, data.completion_rate || 0, data.status || 'in_progress']
    );
  }
};

const recalculate = async (studentId, courseId) => {
  // Count total / completed lessons
  const [[{ totalLessons }]] = await db.query(`SELECT COUNT(*) as totalLessons FROM lessons WHERE course_id = ?`, [courseId]);
  // For simplicity, completed_lessons tracks manually or via API call
  // Count total / completed assignments
  const [[{ totalAssignments }]] = await db.query(`SELECT COUNT(*) as totalAssignments FROM assignments WHERE course_id = ?`, [courseId]);
  const [[{ completedAssignments }]] = await db.query(
    `SELECT COUNT(DISTINCT s.assignment_id) as completedAssignments
     FROM submissions s JOIN assignments a ON s.assignment_id = a.id
     WHERE s.student_id = ? AND a.course_id = ?`, [studentId, courseId]
  );

  const existing = await findByStudentAndCourse(studentId, courseId);
  const completedLessons = existing ? existing.completed_lessons : 0;
  const totalItems = totalLessons + totalAssignments;
  const completedItems = completedLessons + completedAssignments;
  const rate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100 * 100) / 100 : 0;
  const status = rate >= 100 ? 'completed' : 'in_progress';

  await upsert(studentId, courseId, {
    completed_lessons: completedLessons,
    completed_assignments: completedAssignments,
    completion_rate: rate,
    status,
  });

  return await findByStudentAndCourse(studentId, courseId);
};

const findAll = async () => {
  const [rows] = await db.query(
    `SELECT lp.*, c.title as course_title, u.full_name as student_name, u.email as student_email
     FROM learning_progress lp
     JOIN courses c ON lp.course_id = c.id
     JOIN users u ON lp.student_id = u.id
     ORDER BY lp.course_id ASC, lp.completion_rate DESC`
  );
  return rows;
};

module.exports = { findByStudentAndCourse, findByStudent, findByCourse, upsert, recalculate, findAll };
