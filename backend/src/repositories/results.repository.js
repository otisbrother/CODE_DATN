const db = require('../config/db');

const findBySubmission = async (submissionId) => {
  const [rows] = await db.query(`SELECT * FROM results WHERE submission_id = ?`, [submissionId]);
  return rows[0] || null;
};
const create = async (data) => {
  const [result] = await db.query(
    `INSERT INTO results (submission_id, score, feedback) VALUES (?, ?, ?)`,
    [data.submission_id, data.score, data.feedback || null]
  );
  // Update submission status to graded
  await db.query(`UPDATE submissions SET status = 'graded' WHERE id = ?`, [data.submission_id]);
  return result.insertId;
};
const update = async (submissionId, data) => {
  await db.query(
    `UPDATE results SET score = ?, feedback = ? WHERE submission_id = ?`,
    [data.score, data.feedback || null, submissionId]
  );
};

module.exports = { findBySubmission, create, update };
