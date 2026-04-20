const enrollRepo = require('../repositories/enrollments.repository');
const paymentRepo = require('../repositories/payments.repository');
const coursesRepo = require('../repositories/courses.repository');
const db = require('../config/db');

const enroll = async (userId, courseId, paymentMethod) => {
  const course = await coursesRepo.findById(courseId);
  if (!course) { const e = new Error('Khóa học không tồn tại'); e.statusCode = 404; throw e; }

  const existing = await enrollRepo.findByUserAndCourse(userId, courseId);
  if (existing) { const e = new Error('Bạn đã đăng ký khóa học này rồi'); e.statusCode = 400; throw e; }

  // Create payment (fake — auto-complete)
  const paymentId = await paymentRepo.create({
    user_id: userId,
    total_amount: course.price,
    payment_method: paymentMethod || 'bank_transfer',
    payment_status: 'completed',
    paid_at: new Date(),
  });

  // Create enrollment with active status
  const enrollId = await enrollRepo.create({
    user_id: userId,
    course_id: courseId,
    payment_id: paymentId,
    access_status: 'active',
  });

  // Initialize learning progress
  await db.query(
    `INSERT IGNORE INTO learning_progress (student_id, course_id) VALUES (?, ?)`,
    [userId, courseId]
  );

  return { enrollmentId: enrollId, paymentId, status: 'active' };
};

const getMyEnrollments = async (userId) => {
  return await enrollRepo.findByUser(userId);
};

const getCourseEnrollments = async (courseId) => {
  return await enrollRepo.findByCourse(courseId);
};

module.exports = { enroll, getMyEnrollments, getCourseEnrollments };
