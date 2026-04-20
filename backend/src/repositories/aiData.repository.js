const db = require('../config/db');

const findByCourse = async (courseId) => {
  const [rows] = await db.query(
    `SELECT ads.*, u.full_name as uploader_name FROM ai_data_sources ads
     JOIN users u ON ads.uploaded_by = u.id WHERE ads.course_id = ? ORDER BY ads.id DESC`, [courseId]
  );
  return rows;
};

const findAll = async (status) => {
  let sql = `SELECT ads.*, u.full_name as uploader_name, c.title as course_title
     FROM ai_data_sources ads JOIN users u ON ads.uploaded_by = u.id JOIN courses c ON ads.course_id = c.id`;
  const params = [];
  if (status) { sql += ` WHERE ads.status = ?`; params.push(status); }
  sql += ` ORDER BY ads.id DESC`;
  const [rows] = await db.query(sql, params);
  return rows;
};

const findById = async (id) => {
  const [rows] = await db.query(`SELECT * FROM ai_data_sources WHERE id = ?`, [id]);
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await db.query(
    `INSERT INTO ai_data_sources (course_id, uploaded_by, file_name, file_type, file_url, content, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.course_id, data.uploaded_by, data.file_name, data.file_type, data.file_url || '', data.content || null, 'pending']
  );
  return result.insertId;
};

const updateStatus = async (id, status, approvedBy) => {
  await db.query(
    `UPDATE ai_data_sources SET status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?`,
    [status, approvedBy, id]
  );
};

const getApprovedByCourse = async (courseId) => {
  const [rows] = await db.query(
    `SELECT * FROM ai_data_sources WHERE course_id = ? AND status = 'approved'`, [courseId]
  );
  return rows;
};

module.exports = { findByCourse, findAll, findById, create, updateStatus, getApprovedByCourse };
