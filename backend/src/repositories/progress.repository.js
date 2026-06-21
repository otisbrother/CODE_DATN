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

// Luu % video da xem cho 1 bai (chi tang, lay max) - "xem den dau luu den do"
const saveLessonWatch = async (studentId, lessonId, percent) => {
  const p = Math.max(0, Math.min(Number(percent) || 0, 100));
  await db.query(
    `INSERT INTO lesson_completions (student_id, lesson_id, watched_percent) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE watched_percent = GREATEST(watched_percent, VALUES(watched_percent))`,
    [studentId, lessonId, p]
  );
};

// Danh dau hoan thanh hoan toan 1 bai (watched_percent = 100)
const markLessonComplete = async (studentId, lessonId) => {
  await saveLessonWatch(studentId, lessonId, 100);
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
  // ===== Thành phần 1: VIDEO = tổng (% xem mỗi bài / 100), mỗi bài tối đa 1 =====
  const [[{ totalLessons }]] = await db.query(`SELECT COUNT(*) as totalLessons FROM lessons WHERE course_id = ?`, [courseId]);
  const [[{ videoSum }]] = await db.query(
    `SELECT COALESCE(SUM(LEAST(lc.watched_percent, 100)), 0) / 100 AS videoSum
     FROM lesson_completions lc JOIN lessons l ON lc.lesson_id = l.id
     WHERE lc.student_id = ? AND l.course_id = ?`, [studentId, courseId]
  );

  // ===== Thành phần 2: BÀI TẬP thường (loại trừ test cuối khóa) = số bài đã nộp =====
  const [[{ totalAssignments }]] = await db.query(
    `SELECT COUNT(*) as totalAssignments FROM assignments WHERE course_id = ? AND is_final_test = 0`, [courseId]
  );
  const [[{ completedAssignments }]] = await db.query(
    `SELECT COUNT(DISTINCT s.assignment_id) as completedAssignments
     FROM submissions s JOIN assignments a ON s.assignment_id = a.id
     WHERE s.student_id = ? AND a.course_id = ? AND a.is_final_test = 0`, [studentId, courseId]
  );

  // ===== Thành phần 3: TEST CUỐI KHÓA = điểm / điểm tối đa =====
  const [finalRows] = await db.query(
    `SELECT id, max_score FROM assignments WHERE course_id = ? AND is_final_test = 1 LIMIT 1`, [courseId]
  );
  let testFraction = 0;
  const hasFinalTest = finalRows.length > 0 ? 1 : 0;
  if (hasFinalTest) {
    const max = Number(finalRows[0].max_score) > 0 ? Number(finalRows[0].max_score) : 10;
    const [[res]] = await db.query(
      `SELECT r.score FROM submissions s JOIN results r ON r.submission_id = s.id
       WHERE s.assignment_id = ? AND s.student_id = ? ORDER BY r.id DESC LIMIT 1`,
      [finalRows[0].id, studentId]
    );
    if (res && res.score != null) testFraction = Math.min(Number(res.score) / max, 1);
  }

  // ===== Tổng hợp: chia đều theo từng mục =====
  const totalItems = Number(totalLessons) + Number(totalAssignments) + hasFinalTest;
  const videoItems = Math.min(Number(videoSum), Number(totalLessons));
  const completedItems = videoItems + Math.min(Number(completedAssignments), Number(totalAssignments)) + testFraction;
  const rate = totalItems > 0 ? Math.min(Math.round((completedItems / totalItems) * 10000) / 100, 100) : 0;
  const status = rate >= 100 ? 'completed' : 'in_progress';

  // completed_lessons (để hiển thị) = số bài đã xem >= 90%
  const [[{ completedLessons }]] = await db.query(
    `SELECT COUNT(*) as completedLessons FROM lesson_completions lc JOIN lessons l ON lc.lesson_id = l.id
     WHERE lc.student_id = ? AND l.course_id = ? AND lc.watched_percent >= 90`, [studentId, courseId]
  );

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

module.exports = { findByStudentAndCourse, findByStudent, findByCourse, markLessonComplete, saveLessonWatch, upsert, recalculate, findAll };
