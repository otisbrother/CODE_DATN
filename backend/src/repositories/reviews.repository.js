const db = require('../config/db');

const findByCourse = async (courseId, { minRating } = {}) => {
  const params = [courseId];
  let where = 'cr.course_id = ?';
  if (minRating) { where += ' AND cr.rating >= ?'; params.push(minRating); }
  const [rows] = await db.query(
    `SELECT cr.*, u.full_name AS student_name, u.email AS student_email
     FROM course_reviews cr
     JOIN users u ON cr.student_id = u.id
     WHERE ${where}
     ORDER BY cr.created_at DESC`,
    params
  );
  return rows;
};

// Phản hồi <=2 sao gửi giáo viên/admin
const findLowRatingFeedback = async ({ maxRating = 2, lecturerId } = {}) => {
  const params = [maxRating];
  let where = 'cr.rating <= ?';
  if (lecturerId) { where += ' AND c.lecturer_id = ?'; params.push(lecturerId); }
  const [rows] = await db.query(
    `SELECT cr.*, u.full_name AS student_name, u.email AS student_email,
            c.title AS course_title, c.lecturer_id
     FROM course_reviews cr
     JOIN users u ON cr.student_id = u.id
     JOIN courses c ON cr.course_id = c.id
     WHERE ${where}
     ORDER BY cr.created_at DESC`,
    params
  );
  return rows;
};

const findByStudentAndCourse = async (studentId, courseId) => {
  const [rows] = await db.query(
    `SELECT * FROM course_reviews WHERE student_id = ? AND course_id = ?`,
    [studentId, courseId]
  );
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await db.query(
    `INSERT INTO course_reviews (course_id, student_id, rating, comment)
     VALUES (?, ?, ?, ?)`,
    [data.course_id, data.student_id, data.rating, data.comment || null]
  );
  return result.insertId;
};

const update = async (id, data) => {
  const fields = [];
  const values = [];
  if (data.rating !== undefined) { fields.push('rating = ?'); values.push(data.rating); }
  if (data.comment !== undefined) { fields.push('comment = ?'); values.push(data.comment); }
  if (fields.length === 0) return;
  values.push(id);
  await db.query(`UPDATE course_reviews SET ${fields.join(', ')} WHERE id = ?`, values);
};

const remove = async (id) => {
  await db.query(`DELETE FROM course_reviews WHERE id = ?`, [id]);
};

const getAvgRating = async (courseId) => {
  // Chỉ tính trên review công khai (>= 3 sao)
  const [[row]] = await db.query(
    `SELECT COALESCE(AVG(rating), 0) AS avg_rating, COUNT(*) AS review_count
     FROM course_reviews WHERE course_id = ? AND rating >= 3`,
    [courseId]
  );
  return { avg_rating: Math.round((row.avg_rating || 0) * 10) / 10, review_count: row.review_count || 0 };
};

const getCoursesWithRating = async () => {
  const [rows] = await db.query(
    `SELECT c.id, c.title, c.description, c.short_description, c.thumbnail_url, c.price, c.status,
            c.lecturer_id, u.full_name AS lecturer_name,
            COALESCE(AVG(cr.rating), 0) AS avg_rating,
            COUNT(cr.id) AS review_count
     FROM courses c
     JOIN users u ON c.lecturer_id = u.id
     LEFT JOIN course_reviews cr ON cr.course_id = c.id AND cr.rating >= 3
     WHERE c.status = 'published'
     GROUP BY c.id
     ORDER BY avg_rating DESC, review_count DESC`
  );
  return rows;
};

module.exports = {
  findByCourse,
  findLowRatingFeedback,
  findByStudentAndCourse,
  create,
  update,
  remove,
  getAvgRating,
  getCoursesWithRating,
};
