const db = require('../config/db');

let aiDataColumnsPromise = null;

const getAiDataColumns = async () => {
  if (!aiDataColumnsPromise) {
    aiDataColumnsPromise = db.query(`SHOW COLUMNS FROM ai_data_sources`)
      .then(([rows]) => new Set(rows.map((row) => row.Field)));
  }
  return aiDataColumnsPromise;
};

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
  const tableColumns = await getAiDataColumns();
  const columns = ['course_id', 'uploaded_by', 'file_name', 'file_type'];
  const values = [data.course_id, data.uploaded_by, data.file_name, data.file_type];

  if (tableColumns.has('file_url')) {
    columns.push('file_url');
    values.push(data.file_url || '');
  }

  if (tableColumns.has('content')) {
    columns.push('content');
    values.push(data.content || null);
  }

  columns.push('status');
  values.push(data.status || 'pending');

  if (tableColumns.has('approved_by') && data.approved_by) {
    columns.push('approved_by');
    values.push(data.approved_by);
  }

  if (tableColumns.has('approved_at') && data.approved_at) {
    columns.push('approved_at');
    values.push(data.approved_at);
  }

  const [result] = await db.query(
    `INSERT INTO ai_data_sources (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
    values
  );
  return result.insertId;
};

const updateStatus = async (id, status, approvedBy) => {
  await db.query(
    `UPDATE ai_data_sources SET status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?`,
    [status, approvedBy, id]
  );
};

const update = async (id, data) => {
  const tableColumns = await getAiDataColumns();
  const fields = [];
  const values = [];

  if (data.file_name !== undefined) {
    fields.push('file_name = ?');
    values.push(data.file_name);
  }

  if (data.file_type !== undefined) {
    fields.push('file_type = ?');
    values.push(data.file_type);
  }

  if (tableColumns.has('file_url') && data.file_url !== undefined) {
    fields.push('file_url = ?');
    values.push(data.file_url || '');
  }

  if (tableColumns.has('content') && data.content !== undefined) {
    fields.push('content = ?');
    values.push(data.content || null);
  }

  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(data.status);
  }

  if (tableColumns.has('approved_by') && data.approved_by !== undefined) {
    fields.push('approved_by = ?');
    values.push(data.approved_by || null);
  }

  if (tableColumns.has('approved_at') && data.approved_at !== undefined) {
    fields.push('approved_at = ?');
    values.push(data.approved_at);
  }

  if (fields.length === 0) return;

  values.push(id);
  await db.query(`UPDATE ai_data_sources SET ${fields.join(', ')} WHERE id = ?`, values);
};

const remove = async (id) => {
  await db.query(`DELETE FROM ai_data_sources WHERE id = ?`, [id]);
};

const getApprovedByCourse = async (courseId) => {
  const [rows] = await db.query(
    `SELECT * FROM ai_data_sources WHERE course_id = ? AND status = 'approved'`, [courseId]
  );
  return rows;
};

module.exports = { findByCourse, findAll, findById, create, update, remove, updateStatus, getApprovedByCourse };
