const db = require('../config/db');

const findAll = async (limit, offset, filters = {}) => {
  let where = `r.role_name <> 'admin'`;
  const params = [];
  if (filters.search) {
    where += ' AND (u.full_name LIKE ? OR u.email LIKE ?)';
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  if (filters.role) {
    where += ' AND r.role_name = ?';
    params.push(filters.role);
  }
  const [rows] = await db.query(
    `SELECT u.id, u.full_name, u.email, u.status, u.created_at, u.role_id, r.role_name
     FROM users u JOIN roles r ON u.role_id = r.id WHERE ${where} ORDER BY u.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) as total FROM users u JOIN roles r ON u.role_id = r.id WHERE ${where}`, params
  );
  return { rows, total };
};

const findById = async (id) => {
  const [rows] = await db.query(
    `SELECT u.id, u.full_name, u.email, u.status, u.role_id, u.created_at,
            u.avatar_url, u.headline, u.bio, r.role_name
     FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
    [id]
  );
  return rows[0] || null;
};

// Danh sach giang vien co it nhat 1 khoa hoc da xuat ban (cho khu "Nguoi Truyen Lua")
const findLecturersWithPublishedCourses = async () => {
  const [rows] = await db.query(
    `SELECT u.id, u.full_name, u.avatar_url, u.headline,
            COUNT(c.id) AS course_count,
            COALESCE(SUM(c.enroll_count), 0) AS student_count
     FROM users u
     JOIN roles r ON u.role_id = r.id
     JOIN (
       SELECT c.id, c.lecturer_id,
              (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS enroll_count
       FROM courses c WHERE c.status = 'published'
     ) c ON c.lecturer_id = u.id
     WHERE r.role_name = 'lecturer' AND u.status = 'active'
     GROUP BY u.id, u.full_name, u.avatar_url, u.headline
     ORDER BY course_count DESC, student_count DESC`
  );
  return rows;
};

// Ho so cong khai cua 1 giang vien (chi role lecturer)
const findLecturerPublic = async (id) => {
  const [rows] = await db.query(
    `SELECT u.id, u.full_name, u.avatar_url, u.headline, u.bio, u.created_at
     FROM users u JOIN roles r ON u.role_id = r.id
     WHERE u.id = ? AND r.role_name = 'lecturer' AND u.status = 'active'`,
    [id]
  );
  return rows[0] || null;
};

const findByEmail = async (email) => {
  const [rows] = await db.query(
    `SELECT u.id, u.full_name, u.email, u.status, u.role_id, u.created_at, r.role_name
     FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?`,
    [email]
  );
  return rows[0] || null;
};

const getRoleByName = async (roleName) => {
  const [rows] = await db.query(`SELECT * FROM roles WHERE role_name = ?`, [roleName]);
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await db.query(
    `INSERT INTO users (full_name, email, password_hash, role_id, status) VALUES (?, ?, ?, ?, ?)`,
    [data.full_name, data.email, data.password_hash, data.role_id, data.status || 'active']
  );
  return result.insertId;
};

const update = async (id, data) => {
  const fields = [];
  const values = [];
  if (data.full_name) { fields.push('full_name = ?'); values.push(data.full_name); }
  if (data.email) { fields.push('email = ?'); values.push(data.email); }
  if (data.status) { fields.push('status = ?'); values.push(data.status); }
  if (data.password_hash) { fields.push('password_hash = ?'); values.push(data.password_hash); }
  if (data.avatar_url !== undefined) { fields.push('avatar_url = ?'); values.push(data.avatar_url); }
  if (data.headline !== undefined) { fields.push('headline = ?'); values.push(data.headline); }
  if (data.bio !== undefined) { fields.push('bio = ?'); values.push(data.bio); }
  if (fields.length === 0) return;
  values.push(id);
  await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
};

const remove = async (id) => {
  await db.query(`UPDATE users SET status = 'locked' WHERE id = ?`, [id]);
};

module.exports = {
  findAll, findById, findByEmail, getRoleByName, create, update, remove,
  findLecturersWithPublishedCourses, findLecturerPublic,
};
