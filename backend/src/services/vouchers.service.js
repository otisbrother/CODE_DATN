const vouchersRepo = require('../repositories/vouchers.repository');
const coursesRepo = require('../repositories/courses.repository');
const db = require('../config/db');

const MODES = ['event', 'new_student', 'min_purchase'];
const STATUSES = ['active', 'inactive'];

const makeError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeCode = (code) => String(code || '').trim().toUpperCase();

const normalizeDate = (value) => {
  if (!value) return null;
  return String(value).replace('T', ' ').slice(0, 19);
};

const validatePayload = async (payload, excludedId = null) => {
  const data = {
    name: String(payload.name || '').trim(),
    code: normalizeCode(payload.code),
    mode: payload.mode,
    description: payload.description || null,
    status: payload.status || 'active',
    min_order_amount: payload.min_order_amount === '' || payload.min_order_amount === undefined ? null : Number(payload.min_order_amount),
    new_student_days: payload.new_student_days === '' || payload.new_student_days === undefined ? null : Number(payload.new_student_days),
    starts_at: normalizeDate(payload.starts_at),
    ends_at: normalizeDate(payload.ends_at),
    course_discounts: Array.isArray(payload.course_discounts) ? payload.course_discounts : [],
  };

  if (!data.name) throw makeError('Ten chuong trinh voucher khong duoc de trong');
  if (!data.code) throw makeError('Ma voucher khong duoc de trong');
  if (!MODES.includes(data.mode)) throw makeError('Che do voucher khong hop le');
  if (!STATUSES.includes(data.status)) throw makeError('Trang thai voucher khong hop le');
  if (data.mode === 'min_purchase' && (!Number.isFinite(data.min_order_amount) || data.min_order_amount <= 0)) {
    throw makeError('Voucher theo gia tri don hang can nguong gia toi thieu');
  }
  if (data.mode === 'new_student' && (!Number.isFinite(data.new_student_days) || data.new_student_days <= 0)) {
    data.new_student_days = 30;
  }
  if (data.starts_at && data.ends_at && new Date(data.starts_at) > new Date(data.ends_at)) {
    throw makeError('Ngay bat dau khong duoc lon hon ngay ket thuc');
  }
  if (data.course_discounts.length === 0) {
    throw makeError('Can chon it nhat mot khoa hoc duoc ap dung voucher');
  }

  const existing = await vouchersRepo.findByCode(data.code, excludedId);
  if (existing) throw makeError('Ma voucher da ton tai');

  const courseIds = new Set();
  data.course_discounts = data.course_discounts.map((item) => {
    const courseId = Number(item.course_id);
    const discountPercent = Number(item.discount_percent);
    const maxDiscountAmount = item.max_discount_amount === '' || item.max_discount_amount === undefined || item.max_discount_amount === null
      ? null
      : Number(item.max_discount_amount);

    if (!Number.isInteger(courseId) || courseId <= 0) throw makeError('Khoa hoc ap dung voucher khong hop le');
    if (courseIds.has(courseId)) throw makeError('Khong duoc chon trung khoa hoc trong mot voucher');
    courseIds.add(courseId);
    if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
      throw makeError('Phan tram giam gia phai trong khoang 1 den 100');
    }
    if (maxDiscountAmount !== null && (!Number.isFinite(maxDiscountAmount) || maxDiscountAmount <= 0)) {
      throw makeError('Muc giam toi da khong hop le');
    }

    return {
      course_id: courseId,
      discount_percent: discountPercent,
      max_discount_amount: maxDiscountAmount,
      active: item.active !== false,
    };
  });

  return data;
};

const getAll = async (filters) => vouchersRepo.findAll(filters);

const getPublicPromotions = async (limit) => vouchersRepo.findPublicPromotions(limit);

const getPublicPromotionById = async (id) => {
  const voucher = await vouchersRepo.findPublicPromotionById(id);
  if (!voucher) throw makeError('Khong tim thay voucher dang hoat dong', 404);
  return voucher;
};

const getById = async (id) => {
  const voucher = await vouchersRepo.findById(id);
  if (!voucher) throw makeError('Khong tim thay voucher', 404);
  return voucher;
};

const create = async (payload, adminId) => {
  const data = await validatePayload(payload);
  data.created_by = adminId;
  const id = await vouchersRepo.create(data);
  await vouchersRepo.replaceCourseDiscounts(id, data.course_discounts);
  return getById(id);
};

const update = async (id, payload) => {
  await getById(id);
  const data = await validatePayload(payload, id);
  await vouchersRepo.update(id, data);
  await vouchersRepo.replaceCourseDiscounts(id, data.course_discounts);
  return getById(id);
};

const remove = async (id) => {
  await getById(id);
  await vouchersRepo.setInactive(id);
};

const isNewStudent = async (userId, days) => {
  const [[user]] = await db.query(`SELECT created_at FROM users WHERE id = ?`, [userId]);
  if (!user?.created_at) return false;
  const createdAt = new Date(user.created_at).getTime();
  const minCreatedAt = Date.now() - (Number(days || 30) * 24 * 60 * 60 * 1000);
  return createdAt >= minCreatedAt;
};

const calculateDiscount = (price, voucher) => {
  const rawDiscount = Math.round((price * Number(voucher.discount_percent)) / 100);
  const maxDiscount = voucher.max_discount_amount ? Number(voucher.max_discount_amount) : null;
  const discountAmount = Math.min(price, maxDiscount ? Math.min(rawDiscount, maxDiscount) : rawDiscount);
  return {
    voucher_id: voucher.id,
    code: voucher.code,
    name: voucher.name,
    mode: voucher.mode,
    discount_percent: Number(voucher.discount_percent),
    discount_amount: discountAmount,
    original_amount: price,
    final_amount: Math.max(price - discountAmount, 0),
  };
};

const getBestEligibleVoucher = async (userId, course) => {
  const price = Number(course.price || 0);
  if (price <= 0) return null;

  const vouchers = await vouchersRepo.findEligibleByCourse(course.id);
  const eligible = [];

  for (const voucher of vouchers) {
    if (voucher.mode === 'new_student') {
      const ok = await isNewStudent(userId, voucher.new_student_days || 30);
      if (!ok) continue;
    }
    if (voucher.mode === 'min_purchase' && price < Number(voucher.min_order_amount || 0)) {
      continue;
    }
    eligible.push(calculateDiscount(price, voucher));
  }

  eligible.sort((a, b) => b.discount_amount - a.discount_amount);
  return eligible[0] || null;
};

const getEligibleVoucherByCode = async (userId, course, code) => {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) return null;

  const voucher = await vouchersRepo.findEligibleByCourseAndCode(course.id, normalizedCode);
  if (!voucher) throw makeError('Ma voucher khong hop le hoac khong ap dung cho khoa hoc nay', 400);

  const price = Number(course.price || 0);
  if (voucher.mode === 'new_student') {
    const ok = await isNewStudent(userId, voucher.new_student_days || 30);
    if (!ok) throw makeError('Voucher chi ap dung cho hoc vien moi', 400);
  }
  if (voucher.mode === 'min_purchase' && price < Number(voucher.min_order_amount || 0)) {
    throw makeError('Khoa hoc chua dat gia tri toi thieu de dung voucher', 400);
  }

  return calculateDiscount(price, voucher);
};

const previewForCourse = async (userId, courseId, code = '') => {
  const course = await coursesRepo.findById(courseId);
  if (!course) throw makeError('Khoa hoc khong ton tai', 404);
  const price = Number(course.price || 0);
  const voucher = await getEligibleVoucherByCode(userId, course, code);
  return voucher || {
    voucher_id: null,
    original_amount: price,
    discount_amount: 0,
    final_amount: price,
  };
};

module.exports = {
  getAll,
  getPublicPromotions,
  getPublicPromotionById,
  getById,
  create,
  update,
  remove,
  getBestEligibleVoucher,
  getEligibleVoucherByCode,
  previewForCourse,
};
