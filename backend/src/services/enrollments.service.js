const enrollRepo = require('../repositories/enrollments.repository');
const paymentRepo = require('../repositories/payments.repository');
const coursesRepo = require('../repositories/courses.repository');
const vouchersRepo = require('../repositories/vouchers.repository');
const vouchersService = require('./vouchers.service');
const db = require('../config/db');
const env = require('../config/env');
const { sendPaymentSuccessEmail } = require('./email.service');

const calcExpiresAt = (durationDays) => {
  if (!durationDays || durationDays <= 0) return null;
  const d = new Date();
  d.setDate(d.getDate() + Number(durationDays));
  return d;
};

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

const applyVoucherUsage = async ({ voucher, paymentId, userId, courseId, originalAmount, finalAmount }) => {
  if (!voucher) {
    await vouchersRepo.removeUsageByPayment(paymentId);
    return null;
  }

  await vouchersRepo.upsertUsage({
    voucher_id: voucher.voucher_id,
    payment_id: paymentId,
    user_id: userId,
    course_id: courseId,
    discount_percent: voucher.discount_percent,
    original_amount: originalAmount,
    discount_amount: voucher.discount_amount,
    final_amount: finalAmount,
  });
  return voucher;
};

const activateEnrollmentForPayment = async (payment) => {
  await paymentRepo.updateStatus(payment.id, 'completed');

  const [[enrollment]] = await db.query(
    `SELECT * FROM enrollments WHERE payment_id = ?`,
    [payment.id]
  );

  if (!enrollment) return null;

  await enrollRepo.updateStatus(enrollment.id, 'active');

  // Tính expires_at dựa trên duration_days của course
  const [[course]] = await db.query(`SELECT title, duration_days FROM courses WHERE id = ?`, [enrollment.course_id]);
  const expiresAt = calcExpiresAt(course?.duration_days);
  if (expiresAt) {
    await db.query(`UPDATE enrollments SET expires_at = ? WHERE id = ?`, [expiresAt, enrollment.id]);
  }

  await db.query(
    `INSERT IGNORE INTO learning_progress (student_id, course_id) VALUES (?, ?)`,
    [enrollment.user_id, enrollment.course_id]
  );

  const [[user]] = await db.query(`SELECT full_name, email FROM users WHERE id = ?`, [enrollment.user_id]);
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

const enroll = async (userId, courseId, paymentMethod, voucherCode = '') => {
  const course = await coursesRepo.findById(courseId);
  if (!course) {
    const error = new Error('Khoa hoc khong ton tai');
    error.statusCode = 404;
    throw error;
  }
  if (course.status !== 'published') {
    const error = new Error('Khoa hoc chua duoc xuat ban');
    error.statusCode = 400;
    throw error;
  }

  const existing = await enrollRepo.findByUserAndCourse(userId, courseId);
  if (existing && existing.access_status === 'active') {
    const error = new Error('Ban da dang ky khoa hoc nay roi');
    error.statusCode = 400;
    throw error;
  }

  const price = Number(course.price);
  const voucher = await vouchersService.getEligibleVoucherByCode(userId, course, voucherCode);
  const finalAmount = voucher ? voucher.final_amount : price;

  if (existing && existing.access_status === 'pending') {
    let payment = await paymentRepo.findById(existing.payment_id);
    if (payment && Number(payment.total_amount) !== finalAmount) {
      await paymentRepo.updateAmount(existing.payment_id, finalAmount);
      payment = await paymentRepo.findById(existing.payment_id);
    }

    await applyVoucherUsage({
      voucher,
      paymentId: existing.payment_id,
      userId,
      courseId,
      originalAmount: price,
      finalAmount,
    });

    if (finalAmount === 0 && payment?.payment_status === 'pending') {
      await activateEnrollmentForPayment({ ...payment, total_amount: 0 });
      return {
        enrollmentId: existing.id,
        paymentId: existing.payment_id,
        status: 'active',
        amount: 0,
        originalAmount: price,
        discountAmount: voucher?.discount_amount || 0,
        voucher,
      };
    }

    return {
      enrollmentId: existing.id,
      paymentId: existing.payment_id,
      status: 'pending',
      amount: Number(payment?.total_amount ?? finalAmount),
      originalAmount: price,
      discountAmount: voucher?.discount_amount || 0,
      voucher,
      payment,
      bankTransfer: buildBankTransferInfo(existing.payment_id, payment?.total_amount ?? finalAmount),
    };
  }

  if (price === 0 || finalAmount === 0) {
    const paymentId = await paymentRepo.create({
      user_id: userId,
      course_id: courseId,
      total_amount: 0,
      payment_method: price === 0 ? 'free' : 'voucher',
      payment_status: 'completed',
      paid_at: new Date(),
    });

    await applyVoucherUsage({
      voucher,
      paymentId,
      userId,
      courseId,
      originalAmount: price,
      finalAmount: 0,
    });

    const enrollId = await enrollRepo.create({
      user_id: userId,
      course_id: courseId,
      payment_id: paymentId,
      access_status: 'active',
      expires_at: calcExpiresAt(course.duration_days),
    });

    await db.query(
      `INSERT IGNORE INTO learning_progress (student_id, course_id) VALUES (?, ?)`,
      [userId, courseId]
    );

    const [[user]] = await db.query(`SELECT full_name, email FROM users WHERE id = ?`, [userId]);
    if (user) {
      sendPaymentSuccessEmail(user.email, {
        fullName: user.full_name,
        courseName: course.title,
        amount: 0,
        paymentId,
        paymentMethod: price === 0 ? 'free' : 'voucher',
      });
    }

    return {
      enrollmentId: enrollId,
      paymentId,
      status: 'active',
      amount: 0,
      originalAmount: price,
      discountAmount: voucher?.discount_amount || 0,
      voucher,
    };
  }

  const paymentId = await paymentRepo.create({
    user_id: userId,
    course_id: courseId,
    total_amount: finalAmount,
    payment_method: paymentMethod || 'bank_transfer',
    payment_status: 'pending',
  });

  await applyVoucherUsage({
    voucher,
    paymentId,
    userId,
    courseId,
    originalAmount: price,
    finalAmount,
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
    amount: finalAmount,
    originalAmount: price,
    discountAmount: voucher?.discount_amount || 0,
    voucher,
    bankTransfer: buildBankTransferInfo(paymentId, finalAmount),
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

const MAX_PRESERVE = 2; // mỗi khóa chỉ được bảo lưu tối đa 2 lần

// Map mã lý do -> text dễ đọc lưu vào DB
const buildPreserveReason = (reason, note) => {
  const map = {
    no_time: 'Đang không có thời gian học',
    not_suitable: 'Khóa học chưa phù hợp ở thời điểm hiện tại',
  };
  if (reason === 'other') return `Lý do khác: ${String(note || '').trim() || '(không ghi rõ)'}`.slice(0, 500);
  return map[reason] || 'Không ghi lý do';
};

const preserveEnrollment = async (userId, courseId, reason, note) => {
  const enrollment = await enrollRepo.findByUserAndCourse(userId, courseId);
  if (!enrollment) {
    const e = new Error('Chưa đăng ký khóa học này'); e.statusCode = 404; throw e;
  }
  if (enrollment.access_status !== 'active') {
    const e = new Error('Chỉ có thể bảo lưu khóa học đã kích hoạt'); e.statusCode = 400; throw e;
  }
  if (enrollment.is_preserved) {
    const e = new Error('Khóa học đang được bảo lưu rồi'); e.statusCode = 400; throw e;
  }
  if (!enrollment.expires_at) {
    const e = new Error('Khóa học vĩnh viễn không cần bảo lưu'); e.statusCode = 400; throw e;
  }
  if (Number(enrollment.preserve_count || 0) >= MAX_PRESERVE) {
    const e = new Error(`Bạn đã dùng hết ${MAX_PRESERVE} lượt bảo lưu cho khóa học này`); e.statusCode = 400; throw e;
  }

  const reasonText = buildPreserveReason(reason, note);
  await enrollRepo.preserve(enrollment.id, reasonText);
  return {
    message: 'Bảo lưu khóa học thành công',
    preserved_at: new Date(),
    preserve_count: Number(enrollment.preserve_count || 0) + 1,
    preserve_remaining: MAX_PRESERVE - (Number(enrollment.preserve_count || 0) + 1),
    reason: reasonText,
  };
};

const resumeEnrollment = async (userId, courseId) => {
  const enrollment = await enrollRepo.findByUserAndCourse(userId, courseId);
  if (!enrollment) {
    const e = new Error('Chưa đăng ký khóa học này'); e.statusCode = 404; throw e;
  }
  if (!enrollment.is_preserved || !enrollment.preserved_at) {
    const e = new Error('Khóa học không đang bảo lưu'); e.statusCode = 400; throw e;
  }

  // Tính số ngày đã bảo lưu và cộng thêm vào expires_at
  const preservedMs = Date.now() - new Date(enrollment.preserved_at).getTime();
  const oldExpires = new Date(enrollment.expires_at);
  const newExpires = new Date(oldExpires.getTime() + preservedMs);

  await enrollRepo.resume(enrollment.id, newExpires);
  return { message: 'Mở lại khóa học thành công', new_expires_at: newExpires };
};

module.exports = { enroll, completePaymentFromBank, getMyEnrollments, getCourseEnrollments, checkEnrollment, preserveEnrollment, resumeEnrollment };
