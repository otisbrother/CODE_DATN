-- =============================================
-- Migration: Thêm thời hạn khóa học + bảo lưu
-- Chạy: mysql -u root -p elearning_ai < database/migration_course_duration.sql
-- =============================================

-- Thêm cột duration_days vào bảng courses (NULL = không giới hạn / vĩnh viễn)
ALTER TABLE courses ADD COLUMN duration_days INT NULL DEFAULT NULL AFTER status;

-- Thêm cột expires_at vào bảng enrollments (NULL = không giới hạn / vĩnh viễn)
ALTER TABLE enrollments ADD COLUMN expires_at DATETIME NULL DEFAULT NULL AFTER access_status;

-- Thêm cột bảo lưu vào bảng enrollments
ALTER TABLE enrollments ADD COLUMN is_preserved TINYINT(1) NOT NULL DEFAULT 0 AFTER expires_at;
ALTER TABLE enrollments ADD COLUMN preserved_at DATETIME NULL DEFAULT NULL AFTER is_preserved;
