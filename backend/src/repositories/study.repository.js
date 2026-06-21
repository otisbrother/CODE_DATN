const db = require('../config/db');

// Lấy toàn bộ buổi học đã lưu của 1 học viên
const findByStudent = async (studentId) => {
  const [rows] = await db.query(
    `SELECT * FROM study_schedules WHERE student_id = ? ORDER BY start_time ASC, day_key ASC`,
    [studentId]
  );
  return rows;
};

// Thay toàn bộ lịch của học viên bằng danh sách mới (xóa cũ + chèn mới trong 1 transaction)
const replaceForStudent = async (studentId, items = []) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`DELETE FROM study_schedules WHERE student_id = ?`, [studentId]);
    for (const it of items) {
      await conn.query(
        `INSERT INTO study_schedules
           (student_id, course_id, day_key, start_time, duration_minutes, lesson_id, lesson_title, course_title, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          studentId,
          it.course_id,
          it.day_key,
          it.start_time,
          it.duration_minutes || 45,
          it.lesson_id || null,
          it.lesson_title || null,
          it.course_title || null,
          it.note || null,
        ]
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = { findByStudent, replaceForStudent };
