const db = require('../config/db');

const findByStudentAndCourse = async (studentId, courseId) => {
  const [rows] = await db.query(
    `SELECT * FROM ai_conversations WHERE student_id = ? AND course_id = ? ORDER BY created_at DESC`, [studentId, courseId]
  );
  return rows;
};

const findById = async (id) => {
  const [rows] = await db.query(`SELECT * FROM ai_conversations WHERE id = ?`, [id]);
  return rows[0] || null;
};

const create = async (studentId, courseId) => {
  const [result] = await db.query(
    `INSERT INTO ai_conversations (student_id, course_id) VALUES (?, ?)`, [studentId, courseId]
  );
  return result.insertId;
};

const getMessages = async (conversationId) => {
  const [rows] = await db.query(
    `SELECT * FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC`, [conversationId]
  );
  return rows;
};

const addMessage = async (conversationId, senderType, content) => {
  const [result] = await db.query(
    `INSERT INTO ai_messages (conversation_id, sender_type, content) VALUES (?, ?, ?)`,
    [conversationId, senderType, content]
  );
  return result.insertId;
};

module.exports = { findByStudentAndCourse, findById, create, getMessages, addMessage };
