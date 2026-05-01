const enrollRepo = require('../repositories/enrollments.repository');
const paymentRepo = require('../repositories/payments.repository');
const coursesRepo = require('../repositories/courses.repository');
const db = require('../config/db');
const env = require('../config/env');
const { sendPaymentSuccessEmail } = require('./email.service');

const buildBankTransferInfo = (paymentId, amount) => ({
  bankName: env.ADMIN_BANK_NAME,
  bankBin: env.ADMIN_BANK_BIN,
  accountNo: env.ADMIN_BANK_ACCOUNT_NO,
  accountName: env.ADMIN_BANK_ACCOUNT_NAME,
  amount: Number(amount),
  transferContent: `ELEARNING ${paymentId}`,
});

const parseVndAmount = (value) => {
  if (typeof value === 'number') return value;
  const digits = String(value || '').replace(/[^\d]/g, '');
  return digits ? Number(digits) : NaN;
};

const normalizeTransferContent = (value) => {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
};

const activateEnrollmentForPayment = async (payment) => {
  await paymentRepo.updateStatus(payment.id, 'completed');

  const [[enrollment]] = await db.query(
    `SELECT * FROM enrollments WHERE payment_id = ?`, [payment.id]
  );

  if (!enrollment) return null;

  await enrollRepo.updateStatus(enrollment.id, 'active');
  await db.query(
    `INSERT IGNORE INTO learning_progress (student_id, course_id) VALUES (?, ?)`,
    [enrollment.user_id, enrollment.course_id]
  );

  const [[user]] = await db.query(`SELECT full_name, email FROM users WHERE id = ?`, [enrollment.user_id]);
  const [[course]] = await db.query(`SELECT title FROM courses WHERE id = ?`, [enrollment.course_id]);
  if (user && course) {
    sendPaymentSuccessEmail(user.email, {
      fullName: user.full_name,
      courseName: course.title,
      amount: payment.total_amount,
      paymentId: payment.id,
      paymentMethod: payment.payment_method,
    });
  }

  return enrollment;
};

// Step 1: Student bấm "Mở khóa" → tạo payment pending + enrollment pending
const enroll = async (userId, courseId, paymentMethod) => {
  const course = await coursesRepo.findById(courseId);
  if (!course) { const e = new Error('Khóa học không tồn tại'); e.statusCode = 404; throw e; }
  if (course.status !== 'published') { const e = new Error('Khóa học chưa được xuất bản'); e.statusCode = 400; throw e; }

  const existing = await enrollRepo.findByUserAndCourse(userId, courseId);
  if (existing && existing.access_status === 'active') {
    const e = new Error('Bạn đã đăng ký khóa học này rồi');
    e.statusCode = 400;
    throw e;
  }

  // Nếu đã có enrollment pending, trả về payment cũ
  if (existing && existing.access_status === 'pending') {
    let payment = await paymentRepo.findById(existing.payment_id);
    const currentPrice = Number(course.price);
    if (payment && Number(payment.total_amount) !== currentPrice) {
      await paymentRepo.updateAmount(existing.payment_id, currentPrice);
      payment = await paymentRepo.findById(existing.payment_id);
    }
    return {
      enrollmentId: existing.id,
      paymentId: existing.payment_id,
      status: 'pending',
      amount: Number(payment?.total_amount ?? currentPrice),
      payment,
      bankTransfer: buildBankTransferInfo(existing.payment_id, payment?.total_amount ?? currentPrice),
    };
  }

  const price = Number(course.price);

  // Free course → auto complete
  if (price === 0) {
    const paymentId = await paymentRepo.create({
      user_id: userId,
      course_id: courseId,
      total_amount: 0,
      payment_method: 'free',
      payment_status: 'completed',
      paid_at: new Date(),
    });

    const enrollId = await enrollRepo.create({
      user_id: userId,
      course_id: courseId,
      payment_id: paymentId,
      access_status: 'active',
    });

    await db.query(
      `INSERT IGNORE INTO learning_progress (student_id, course_id) VALUES (?, ?)`,
      [userId, courseId]
    );

    // Gửi email xác nhận (free course)
    const [[user]] = await db.query(`SELECT full_name, email FROM users WHERE id = ?`, [userId]);
    if (user) {
      sendPaymentSuccessEmail(user.email, {
        fullName: user.full_name,
        courseName: course.title,
        amount: 0,
        paymentId,
        paymentMethod: 'free',
      });
    }

    return { enrollmentId: enrollId, paymentId, status: 'active', amount: 0 };
  }

  // Paid course → pending
  const paymentId = await paymentRepo.create({
    user_id: userId,
    course_id: courseId,
    total_amount: price,
    payment_method: paymentMethod || 'bank_transfer',
    payment_status: 'pending',
  });

  const enrollId = await enrollRepo.create({
    user_id: userId,
    course_id: courseId,
    payment_id: paymentId,
    access_status: 'pending',
  });

  return {
    enrollmentId: enrollId,
    paymentId,
    status: 'pending',
    amount: price,
    bankTransfer: buildBankTransferInfo(paymentId, price),
  };
};

const completePaymentFromBank = async ({ paymentId, amount, content, bankReference }) => {
  const payment = await paymentRepo.findById(paymentId);
  if (!payment) { const e = new Error('Khong tim thay thanh toan'); e.statusCode = 404; throw e; }
  if (payment.payment_status === 'completed') {
    return { paymentId, status: 'completed', alreadyCompleted: true };
  }
  if (payment.payment_status !== 'pending') {
    const e = new Error('Giao dich khong o trang thai cho thanh toan');
    e.statusCode = 400;
    throw e;
  }

  const expectedAmount = Number(payment.total_amount);
  const paidAmount = parseVndAmount(amount);
  if (!Number.isFinite(paidAmount) || paidAmount < expectedAmount) {
    const e = new Error('So tien chuyen khoan khong khop voi don hang');
    e.statusCode = 400;
    throw e;
  }

  const normalizedContent = normalizeTransferContent(content);
  if (!normalizedContent.includes(`ELEARNING${paymentId}`)) {
    const e = new Error('Noi dung chuyen khoan khong khop ma thanh toan');
    e.statusCode = 400;
    throw e;
  }

  await activateEnrollmentForPayment(payment);
  return {
    paymentId,
    status: 'completed',
    amount: paidAmount,
    bankReference: bankReference || null,
  };
};

const getMyEnrollments = async (userId) => {
  return await enrollRepo.findByUser(userId);
};

const getCourseEnrollments = async (courseId) => {
  return await enrollRepo.findByCourse(courseId);
};

const checkEnrollment = async (userId, courseId) => {
  const enrollment = await enrollRepo.findByUserAndCourse(userId, courseId);
  return enrollment;
};

module.exports = { enroll, completePaymentFromBank, getMyEnrollments, getCourseEnrollments, checkEnrollment };
