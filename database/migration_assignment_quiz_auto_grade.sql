-- =============================================
-- Migration: Thêm bài tập quiz/tự luận tự chấm
-- Chạy: mysql -u root -p elearning_ai < database/migration_assignment_quiz_auto_grade.sql
-- =============================================

ALTER TABLE assignments
  ADD COLUMN assignment_type VARCHAR(20) NOT NULL DEFAULT 'manual' AFTER status,
  ADD COLUMN questions_json LONGTEXT NULL AFTER assignment_type,
  ADD COLUMN auto_grade TINYINT(1) NOT NULL DEFAULT 0 AFTER questions_json;

ALTER TABLE submissions
  ADD COLUMN answers_json LONGTEXT NULL AFTER content;
