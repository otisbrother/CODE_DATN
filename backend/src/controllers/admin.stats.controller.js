const db = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getStats = asyncHandler(async (req, res) => {
  // Total users by role
  const [usersByRole] = await db.query(
    `SELECT r.role_name, COUNT(u.id) as count
     FROM roles r LEFT JOIN users u ON r.id = u.role_id
     GROUP BY r.id, r.role_name`
  );

  // Total courses by status
  const [coursesByStatus] = await db.query(
    `SELECT status, COUNT(*) as count FROM courses GROUP BY status`
  );

  // Total enrollments
  const [[{ totalEnrollments }]] = await db.query(`SELECT COUNT(*) as totalEnrollments FROM enrollments`);

  // Total revenue (completed payments)
  const [[{ totalRevenue }]] = await db.query(
    `SELECT COALESCE(SUM(total_amount), 0) as totalRevenue FROM payments WHERE payment_status = 'completed'`
  );

  // Total submissions
  const [[{ totalSubmissions }]] = await db.query(`SELECT COUNT(*) as totalSubmissions FROM submissions`);
  const [[{ gradedSubmissions }]] = await db.query(`SELECT COUNT(*) as gradedSubmissions FROM submissions WHERE status = 'graded'`);

  // Total lessons
  const [[{ totalLessons }]] = await db.query(`SELECT COUNT(*) as totalLessons FROM lessons`);

  // Total assignments
  const [[{ totalAssignments }]] = await db.query(`SELECT COUNT(*) as totalAssignments FROM assignments`);

  // Pending AI data
  const [[{ pendingAI }]] = await db.query(`SELECT COUNT(*) as pendingAI FROM ai_data_sources WHERE status = 'pending'`);

  // Top 5 courses by enrollments
  const [topCourses] = await db.query(
    `SELECT c.id, c.title, c.status, u.full_name as lecturer_name, COUNT(e.id) as enrollment_count
     FROM courses c
     JOIN users u ON c.lecturer_id = u.id
     LEFT JOIN enrollments e ON c.id = e.course_id
     GROUP BY c.id, c.title, c.status, u.full_name
     ORDER BY enrollment_count DESC
     LIMIT 5`
  );

  // Recent enrollments (last 10)
  const [recentEnrollments] = await db.query(
    `SELECT e.id, e.enrolled_at, e.access_status,
     u.full_name as student_name, c.title as course_title
     FROM enrollments e
     JOIN users u ON e.user_id = u.id
     JOIN courses c ON e.course_id = c.id
     ORDER BY e.enrolled_at DESC LIMIT 10`
  );

  return ApiResponse.success(res, {
    usersByRole,
    coursesByStatus,
    totalEnrollments,
    totalRevenue,
    totalSubmissions,
    gradedSubmissions,
    totalLessons,
    totalAssignments,
    pendingAI,
    topCourses,
    recentEnrollments,
  });
});

module.exports = { getStats };
