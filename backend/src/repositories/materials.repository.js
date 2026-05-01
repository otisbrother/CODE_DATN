const db = require('../config/db');

const findByLesson = async (lessonId) => {
  const [rows] = await db.query(`SELECT * FROM materials WHERE lesson_id = ? ORDER BY sort_order ASC`, [lessonId]);
  return rows;
};

const findById = async (id) => {
  const [rows] = await db.query(`SELECT * FROM materials WHERE id = ?`, [id]);
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await db.query(
    `INSERT INTO materials (lesson_id, file_name, file_type, material_type, file_url, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
    [data.lesson_id, data.file_name, data.file_type, data.material_type || 'document', data.file_url, data.sort_order || 1]
  );
  return result.insertId;
};

const remove = async (id) => {
  await db.query(`DELETE FROM materials WHERE id = ?`, [id]);
};

module.exports = { findByLesson, findById, create, remove };
