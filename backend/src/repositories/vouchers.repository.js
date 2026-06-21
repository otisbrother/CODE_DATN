const db = require('../config/db');

const normalizeDate = (value) => {
  if (!value) return null;
  return value;
};

const findAll = async (filters = {}) => {
  let where = '1=1';
  const params = [];

  if (filters.status) {
    where += ' AND v.status = ?';
    params.push(filters.status);
  }
  if (filters.mode) {
    where += ' AND v.mode = ?';
    params.push(filters.mode);
  }
  if (filters.search) {
    where += ' AND (v.name LIKE ? OR v.code LIKE ?)';
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  const [rows] = await db.query(
    `SELECT v.*,
            COUNT(vc.id) AS course_count,
            MIN(vc.discount_percent) AS min_discount_percent,
            MAX(vc.discount_percent) AS max_discount_percent,
            u.full_name AS created_by_name
     FROM vouchers v
     LEFT JOIN voucher_courses vc ON vc.voucher_id = v.id AND vc.active = 1
     LEFT JOIN users u ON u.id = v.created_by
     WHERE ${where}
     GROUP BY v.id
     ORDER BY v.id DESC`,
    params
  );
  return rows;
};

const findPublicPromotions = async (limit = 3) => {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 3, 6));
  const [rows] = await db.query(
    `SELECT v.id, v.name, v.code, v.mode, v.description, v.starts_at, v.ends_at,
            COUNT(vc.id) AS course_count,
            MIN(vc.discount_percent) AS min_discount_percent,
            MAX(vc.discount_percent) AS max_discount_percent,
            GROUP_CONCAT(TRIM(c.title) ORDER BY c.title SEPARATOR ', ') AS course_titles
     FROM vouchers v
     JOIN voucher_courses vc ON vc.voucher_id = v.id AND vc.active = 1
     JOIN courses c ON c.id = vc.course_id AND c.status = 'published'
     WHERE v.status = 'active'
       AND (v.starts_at IS NULL OR v.starts_at <= NOW())
       AND (v.ends_at IS NULL OR v.ends_at >= NOW())
     GROUP BY v.id
     ORDER BY COALESCE(v.ends_at, '9999-12-31') ASC, v.id DESC
     LIMIT ?`,
    [safeLimit]
  );
  return rows;
};

const findPublicPromotionById = async (id) => {
  const [rows] = await db.query(
    `SELECT v.id, v.name, v.code, v.mode, v.description, v.starts_at, v.ends_at,
            COUNT(vc.id) AS course_count,
            MIN(vc.discount_percent) AS min_discount_percent,
            MAX(vc.discount_percent) AS max_discount_percent,
            GROUP_CONCAT(TRIM(c.title) ORDER BY c.title SEPARATOR ', ') AS course_titles
     FROM vouchers v
     JOIN voucher_courses vc ON vc.voucher_id = v.id AND vc.active = 1
     JOIN courses c ON c.id = vc.course_id AND c.status = 'published'
     WHERE v.id = ?
       AND v.status = 'active'
       AND (v.starts_at IS NULL OR v.starts_at <= NOW())
       AND (v.ends_at IS NULL OR v.ends_at >= NOW())
     GROUP BY v.id`,
    [id]
  );
  const voucher = rows[0] || null;
  if (!voucher) return null;

  const [courses] = await db.query(
    `SELECT c.id, TRIM(c.title) AS title, c.description, c.short_description, c.thumbnail_url,
            c.price, c.status, u.full_name AS lecturer_name,
            vc.discount_percent, vc.max_discount_amount
     FROM voucher_courses vc
     JOIN courses c ON c.id = vc.course_id
     JOIN users u ON u.id = c.lecturer_id
     WHERE vc.voucher_id = ?
       AND vc.active = 1
       AND c.status = 'published'
     ORDER BY c.title ASC`,
    [id]
  );
  voucher.courses = courses;
  return voucher;
};

const findById = async (id) => {
  const [rows] = await db.query(
    `SELECT v.*, u.full_name AS created_by_name
     FROM vouchers v
     LEFT JOIN users u ON u.id = v.created_by
     WHERE v.id = ?`,
    [id]
  );
  const voucher = rows[0] || null;
  if (!voucher) return null;

  const [courses] = await db.query(
    `SELECT vc.*, c.title AS course_title, c.price AS course_price
     FROM voucher_courses vc
     JOIN courses c ON c.id = vc.course_id
     WHERE vc.voucher_id = ?
     ORDER BY c.title ASC`,
    [id]
  );
  voucher.course_discounts = courses;
  return voucher;
};

const findByCode = async (code, excludedId = null) => {
  let sql = `SELECT * FROM vouchers WHERE code = ?`;
  const params = [code];
  if (excludedId) {
    sql += ` AND id <> ?`;
    params.push(excludedId);
  }
  const [rows] = await db.query(sql, params);
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await db.query(
    `INSERT INTO vouchers
      (name, code, mode, description, status, min_order_amount, new_student_days, starts_at, ends_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.code,
      data.mode,
      data.description || null,
      data.status || 'active',
      data.min_order_amount || null,
      data.new_student_days || null,
      normalizeDate(data.starts_at),
      normalizeDate(data.ends_at),
      data.created_by,
    ]
  );
  return result.insertId;
};

const update = async (id, data) => {
  await db.query(
    `UPDATE vouchers
     SET name = ?, code = ?, mode = ?, description = ?, status = ?,
         min_order_amount = ?, new_student_days = ?, starts_at = ?, ends_at = ?
     WHERE id = ?`,
    [
      data.name,
      data.code,
      data.mode,
      data.description || null,
      data.status || 'active',
      data.min_order_amount || null,
      data.new_student_days || null,
      normalizeDate(data.starts_at),
      normalizeDate(data.ends_at),
      id,
    ]
  );
};

const replaceCourseDiscounts = async (voucherId, courseDiscounts = []) => {
  await db.query(`DELETE FROM voucher_courses WHERE voucher_id = ?`, [voucherId]);
  if (!courseDiscounts.length) return;

  const values = courseDiscounts.map((item) => [
    voucherId,
    item.course_id,
    item.discount_percent,
    item.max_discount_amount || null,
    item.active === false ? 0 : 1,
  ]);

  await db.query(
    `INSERT INTO voucher_courses
      (voucher_id, course_id, discount_percent, max_discount_amount, active)
     VALUES ?`,
    [values]
  );
};

const setInactive = async (id) => {
  await db.query(`UPDATE vouchers SET status = 'inactive' WHERE id = ?`, [id]);
};

const findEligibleByCourse = async (courseId) => {
  const [rows] = await db.query(
    `SELECT v.*, vc.course_id, vc.discount_percent, vc.max_discount_amount
     FROM vouchers v
     JOIN voucher_courses vc ON vc.voucher_id = v.id
     WHERE vc.course_id = ?
       AND vc.active = 1
       AND v.status = 'active'
       AND (v.starts_at IS NULL OR v.starts_at <= NOW())
       AND (v.ends_at IS NULL OR v.ends_at >= NOW())`,
    [courseId]
  );
  return rows;
};

const findEligibleByCourseAndCode = async (courseId, code) => {
  const [rows] = await db.query(
    `SELECT v.*, vc.course_id, vc.discount_percent, vc.max_discount_amount
     FROM vouchers v
     JOIN voucher_courses vc ON vc.voucher_id = v.id
     WHERE vc.course_id = ?
       AND v.code = ?
       AND vc.active = 1
       AND v.status = 'active'
       AND (v.starts_at IS NULL OR v.starts_at <= NOW())
       AND (v.ends_at IS NULL OR v.ends_at >= NOW())
     LIMIT 1`,
    [courseId, code]
  );
  return rows[0] || null;
};

const upsertUsage = async (data) => {
  await db.query(
    `INSERT INTO voucher_usages
      (voucher_id, payment_id, user_id, course_id, discount_percent, original_amount, discount_amount, final_amount)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       voucher_id = VALUES(voucher_id),
       discount_percent = VALUES(discount_percent),
       original_amount = VALUES(original_amount),
       discount_amount = VALUES(discount_amount),
       final_amount = VALUES(final_amount)`,
    [
      data.voucher_id,
      data.payment_id,
      data.user_id,
      data.course_id,
      data.discount_percent,
      data.original_amount,
      data.discount_amount,
      data.final_amount,
    ]
  );
};

const removeUsageByPayment = async (paymentId) => {
  await db.query(`DELETE FROM voucher_usages WHERE payment_id = ?`, [paymentId]);
};

module.exports = {
  findAll,
  findPublicPromotions,
  findPublicPromotionById,
  findById,
  findByCode,
  create,
  update,
  replaceCourseDiscounts,
  setInactive,
  findEligibleByCourse,
  findEligibleByCourseAndCode,
  upsertUsage,
  removeUsageByPayment,
};
