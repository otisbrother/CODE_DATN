-- =========================================================
-- E-LEARNING AI - MIGRATION TU DATABASE CU SANG SCHEMA HIEN TAI
-- MySQL 8.0+
--
-- Muc dich:
--   - Giu lai du lieu dang co.
--   - Bo sung day du cot/bang ma backend hien tai dang su dung.
--   - Co the chay lai: cac cot, index va khoa ngoai da ton tai se duoc bo qua.
--
-- Khuyen nghi sao luu database truoc khi chay.
-- Chay bang MySQL Workbench hoac:
-- mysql -u root -p elearning_ai < database/migration_legacy_to_current.sql
--
-- Chi dung file nay khi database cu da co cac bang nen:
-- roles, users, courses, payments, enrollments, lessons, materials,
-- assignments, submissions, results, learning_progress,
-- ai_data_sources, ai_conversations, ai_messages.
-- Database moi phai dung database/schema.sql, khong chay file nay.
-- =========================================================

CREATE DATABASE IF NOT EXISTS elearning_ai
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE elearning_ai;

SET NAMES utf8mb4;
SET @OLD_SQL_SAFE_UPDATES = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;

DELIMITER $$

DROP PROCEDURE IF EXISTS add_column_if_missing$$
CREATE PROCEDURE add_column_if_missing(
  IN table_name_value VARCHAR(64),
  IN column_name_value VARCHAR(64),
  IN column_definition_value TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = table_name_value
      AND COLUMN_NAME = column_name_value
  ) THEN
    SET @sql_text = CONCAT(
      'ALTER TABLE `', table_name_value,
      '` ADD COLUMN `', column_name_value, '` ',
      column_definition_value
    );
    PREPARE migration_statement FROM @sql_text;
    EXECUTE migration_statement;
    DEALLOCATE PREPARE migration_statement;
  END IF;
END$$

DROP PROCEDURE IF EXISTS add_index_if_missing$$
CREATE PROCEDURE add_index_if_missing(
  IN table_name_value VARCHAR(64),
  IN index_name_value VARCHAR(64),
  IN index_definition_value TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = table_name_value
      AND INDEX_NAME = index_name_value
  ) THEN
    SET @sql_text = CONCAT(
      'ALTER TABLE `', table_name_value,
      '` ADD ', index_definition_value
    );
    PREPARE migration_statement FROM @sql_text;
    EXECUTE migration_statement;
    DEALLOCATE PREPARE migration_statement;
  END IF;
END$$

DROP PROCEDURE IF EXISTS drop_index_if_exists$$
CREATE PROCEDURE drop_index_if_exists(
  IN table_name_value VARCHAR(64),
  IN index_name_value VARCHAR(64)
)
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = table_name_value
      AND INDEX_NAME = index_name_value
  ) THEN
    SET @sql_text = CONCAT(
      'ALTER TABLE `', table_name_value,
      '` DROP INDEX `', index_name_value, '`'
    );
    PREPARE migration_statement FROM @sql_text;
    EXECUTE migration_statement;
    DEALLOCATE PREPARE migration_statement;
  END IF;
END$$

DROP PROCEDURE IF EXISTS add_fk_if_missing$$
CREATE PROCEDURE add_fk_if_missing(
  IN table_name_value VARCHAR(64),
  IN constraint_name_value VARCHAR(64),
  IN constraint_definition_value TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = table_name_value
      AND CONSTRAINT_NAME = constraint_name_value
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
  ) THEN
    SET @sql_text = CONCAT(
      'ALTER TABLE `', table_name_value,
      '` ADD CONSTRAINT `', constraint_name_value, '` ',
      constraint_definition_value
    );
    PREPARE migration_statement FROM @sql_text;
    EXECUTE migration_statement;
    DEALLOCATE PREPARE migration_statement;
  END IF;
END$$

DROP PROCEDURE IF EXISTS drop_fk_if_exists$$
CREATE PROCEDURE drop_fk_if_exists(
  IN table_name_value VARCHAR(64),
  IN constraint_name_value VARCHAR(64)
)
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = table_name_value
      AND CONSTRAINT_NAME = constraint_name_value
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
  ) THEN
    SET @sql_text = CONCAT(
      'ALTER TABLE `', table_name_value,
      '` DROP FOREIGN KEY `', constraint_name_value, '`'
    );
    PREPARE migration_statement FROM @sql_text;
    EXECUTE migration_statement;
    DEALLOCATE PREPARE migration_statement;
  END IF;
END$$

DELIMITER ;

-- 1. Khoa hoc: anh, video gioi thieu, mo ta ngan va thoi han hoc.
CALL add_column_if_missing('courses', 'thumbnail_url', 'VARCHAR(500) NULL AFTER `description`');
CALL add_column_if_missing('courses', 'intro_video_url', 'VARCHAR(500) NULL AFTER `thumbnail_url`');
CALL add_column_if_missing('courses', 'short_description', 'VARCHAR(300) NULL AFTER `intro_video_url`');
CALL add_column_if_missing('courses', 'duration_days', 'INT NULL DEFAULT NULL AFTER `status`');

-- 2. Chuong hoc.
CREATE TABLE IF NOT EXISTS course_sections (
  id INT NOT NULL AUTO_INCREMENT,
  course_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  section_order INT NOT NULL,
  is_preview TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sections_course_order (course_id, section_order),
  CONSTRAINT fk_sections_course FOREIGN KEY (course_id) REFERENCES courses(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL add_column_if_missing('course_sections', 'description', 'TEXT NULL AFTER `title`');
CALL add_column_if_missing('course_sections', 'is_preview', 'TINYINT(1) NOT NULL DEFAULT 0 AFTER `section_order`');

-- 3. Bai hoc va hoc lieu.
CALL add_column_if_missing('lessons', 'section_id', 'INT NULL AFTER `course_id`');
CALL add_column_if_missing('lessons', 'video_url', 'VARCHAR(500) NULL AFTER `content`');
CALL add_column_if_missing('lessons', 'duration_seconds', 'INT NULL AFTER `video_url`');
CALL add_column_if_missing('lessons', 'is_preview', 'TINYINT(1) NOT NULL DEFAULT 0 AFTER `duration_seconds`');
CALL add_column_if_missing('lessons', 'status', 'VARCHAR(20) NOT NULL DEFAULT ''active'' AFTER `is_preview`');

CALL add_column_if_missing('materials', 'material_type', 'VARCHAR(50) NOT NULL DEFAULT ''document'' AFTER `file_type`');
CALL add_column_if_missing('materials', 'sort_order', 'INT NOT NULL DEFAULT 1 AFTER `file_url`');

-- 4. Bai tap quiz/tu luan tu cham.
CALL add_column_if_missing('assignments', 'section_id', 'INT NULL AFTER `course_id`');
CALL add_column_if_missing('assignments', 'status', 'VARCHAR(20) NOT NULL DEFAULT ''active'' AFTER `max_score`');
CALL add_column_if_missing('assignments', 'assignment_type', 'VARCHAR(20) NOT NULL DEFAULT ''manual'' AFTER `status`');
CALL add_column_if_missing('assignments', 'questions_json', 'LONGTEXT NULL AFTER `assignment_type`');
CALL add_column_if_missing('assignments', 'auto_grade', 'TINYINT(1) NOT NULL DEFAULT 0 AFTER `questions_json`');
CALL add_column_if_missing('submissions', 'answers_json', 'LONGTEXT NULL AFTER `content`');

-- 5. Du lieu nguon cho tro ly AI theo khoa hoc.
CALL add_column_if_missing('ai_data_sources', 'file_url', 'VARCHAR(500) NOT NULL DEFAULT '''' AFTER `file_type`');
CALL add_column_if_missing('ai_data_sources', 'content', 'LONGTEXT NULL AFTER `file_url`');

-- 6. Thanh toan, thoi han truy cap va bao luu.
CALL add_column_if_missing('payments', 'course_id', 'INT NULL AFTER `user_id`');
CALL add_column_if_missing('enrollments', 'expires_at', 'DATETIME NULL DEFAULT NULL AFTER `access_status`');
CALL add_column_if_missing('enrollments', 'is_preserved', 'TINYINT(1) NOT NULL DEFAULT 0 AFTER `expires_at`');
CALL add_column_if_missing('enrollments', 'preserved_at', 'DATETIME NULL DEFAULT NULL AFTER `is_preserved`');

-- Backend khong truyen submitted_at khi tao bai nop, nen cot nay can co default.
ALTER TABLE submissions
  MODIFY COLUMN submitted_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP;

-- 6b. Ho so giang vien (khu "Nguoi Truyen Lua"): avatar, chuc danh, tieu su.
CALL add_column_if_missing('users', 'avatar_url', 'VARCHAR(500) NULL AFTER `status`');
CALL add_column_if_missing('users', 'headline', 'VARCHAR(160) NULL AFTER `avatar_url`');
CALL add_column_if_missing('users', 'bio', 'TEXT NULL AFTER `headline`');

-- 6c. Theo doi tung bai hoc da hoan thanh (tinh tien do idempotent, tranh dem trung).
CREATE TABLE IF NOT EXISTS lesson_completions (
  id INT NOT NULL AUTO_INCREMENT,
  student_id INT NOT NULL,
  lesson_id INT NOT NULL,
  completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_lesson_completions_student_lesson (student_id, lesson_id),
  CONSTRAINT fk_lesson_completions_student FOREIGN KEY (student_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_lesson_completions_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Voucher.
CREATE TABLE IF NOT EXISTS vouchers (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) NOT NULL,
  mode VARCHAR(30) NOT NULL,
  description TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  min_order_amount DECIMAL(12,2) NULL,
  new_student_days INT NULL,
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  created_by INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vouchers_code (code),
  CONSTRAINT fk_vouchers_created_by FOREIGN KEY (created_by) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS voucher_courses (
  id INT NOT NULL AUTO_INCREMENT,
  voucher_id INT NOT NULL,
  course_id INT NOT NULL,
  discount_percent DECIMAL(5,2) NOT NULL,
  max_discount_amount DECIMAL(12,2) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_voucher_course (voucher_id, course_id),
  CONSTRAINT fk_voucher_courses_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_voucher_courses_course FOREIGN KEY (course_id) REFERENCES courses(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS voucher_usages (
  id INT NOT NULL AUTO_INCREMENT,
  voucher_id INT NOT NULL,
  payment_id INT NOT NULL,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  discount_percent DECIMAL(5,2) NOT NULL,
  original_amount DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(12,2) NOT NULL,
  final_amount DECIMAL(12,2) NOT NULL,
  used_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_voucher_usage_payment (payment_id),
  CONSTRAINT fk_voucher_usages_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_voucher_usages_payment FOREIGN KEY (payment_id) REFERENCES payments(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_voucher_usages_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_voucher_usages_course FOREIGN KEY (course_id) REFERENCES courses(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Tao chuong mac dinh va map du lieu cu.
INSERT INTO course_sections (course_id, title, description, section_order, is_preview)
SELECT
  c.id,
  'Chuong 1 - Noi dung mac dinh',
  'Chuong mac dinh duoc tao khi nang cap database',
  1,
  0
FROM courses c
LEFT JOIN course_sections cs
  ON cs.course_id = c.id AND cs.section_order = 1
WHERE cs.id IS NULL;

UPDATE lessons l
JOIN course_sections default_section
  ON default_section.course_id = l.course_id
 AND default_section.section_order = 1
LEFT JOIN course_sections current_section
  ON current_section.id = l.section_id
 AND current_section.course_id = l.course_id
SET l.section_id = default_section.id
WHERE current_section.id IS NULL;

UPDATE assignments a
JOIN course_sections default_section
  ON default_section.course_id = a.course_id
 AND default_section.section_order = 1
LEFT JOIN course_sections current_section
  ON current_section.id = a.section_id
 AND current_section.course_id = a.course_id
SET a.section_id = default_section.id
WHERE current_section.id IS NULL;

-- Moi payment cua backend hien tai gan voi mot course.
-- Backfill payment cu thong qua enrollment khi payment chi thuoc mot course.
UPDATE payments p
JOIN (
  SELECT payment_id, MIN(course_id) AS course_id
  FROM enrollments
  WHERE payment_id IS NOT NULL
  GROUP BY payment_id
  HAVING COUNT(DISTINCT course_id) = 1
) enrollment_payment
  ON enrollment_payment.payment_id = p.id
SET p.course_id = enrollment_payment.course_id
WHERE p.course_id IS NULL;

-- Gia tri course_id khong ton tai se duoc dua ve NULL truoc khi them FK.
UPDATE payments p
LEFT JOIN courses c ON c.id = p.course_id
SET p.course_id = NULL
WHERE p.course_id IS NOT NULL
  AND c.id IS NULL;

ALTER TABLE lessons MODIFY COLUMN section_id INT NOT NULL;
ALTER TABLE assignments MODIFY COLUMN section_id INT NOT NULL;

-- 9. Index va khoa ngoai theo schema hien tai.
CALL add_index_if_missing('course_sections', 'uq_sections_course_order', 'UNIQUE INDEX `uq_sections_course_order` (`course_id`, `section_order`)');
CALL add_index_if_missing('lessons', 'idx_lessons_course_id', 'INDEX `idx_lessons_course_id` (`course_id`)');
CALL drop_index_if_exists('lessons', 'uq_lessons_course_order');
CALL add_index_if_missing('lessons', 'uq_lessons_section_order', 'UNIQUE INDEX `uq_lessons_section_order` (`section_id`, `lesson_order`)');

CALL add_fk_if_missing(
  'course_sections',
  'fk_sections_course',
  'FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON UPDATE CASCADE ON DELETE CASCADE'
);

CALL add_fk_if_missing(
  'lessons',
  'fk_lessons_section',
  'FOREIGN KEY (`section_id`) REFERENCES `course_sections` (`id`) ON UPDATE CASCADE ON DELETE CASCADE'
);

CALL add_fk_if_missing(
  'assignments',
  'fk_assignments_section',
  'FOREIGN KEY (`section_id`) REFERENCES `course_sections` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT'
);

CALL add_fk_if_missing(
  'payments',
  'fk_payments_course',
  'FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON UPDATE CASCADE ON DELETE SET NULL'
);

-- Cap nhat quy tac xoa de tranh mat bai nop va ket qua.
CALL drop_fk_if_exists('submissions', 'fk_submissions_assignment');
CALL add_fk_if_missing(
  'submissions',
  'fk_submissions_assignment',
  'FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT'
);

CALL drop_fk_if_exists('results', 'fk_results_submission');
CALL add_fk_if_missing(
  'results',
  'fk_results_submission',
  'FOREIGN KEY (`submission_id`) REFERENCES `submissions` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT'
);

-- 10. Du lieu bat buoc.
INSERT IGNORE INTO roles (role_name) VALUES
  ('admin'),
  ('lecturer'),
  ('student');

DROP PROCEDURE IF EXISTS add_column_if_missing;
DROP PROCEDURE IF EXISTS add_index_if_missing;
DROP PROCEDURE IF EXISTS drop_index_if_exists;
DROP PROCEDURE IF EXISTS add_fk_if_missing;
DROP PROCEDURE IF EXISTS drop_fk_if_exists;

SET SQL_SAFE_UPDATES = @OLD_SQL_SAFE_UPDATES;

-- 10. Kiem tra sau migration.
SELECT TABLE_NAME, TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME;

-- Ket qua rong nghia la khong thieu bang/cot moi ma backend dang dung.
SELECT expected.table_name AS missing_table
FROM (
  SELECT 'course_sections' AS table_name
  UNION ALL SELECT 'vouchers'
  UNION ALL SELECT 'voucher_courses'
  UNION ALL SELECT 'voucher_usages'
  UNION ALL SELECT 'lesson_completions'
) expected
LEFT JOIN information_schema.TABLES actual
  ON actual.TABLE_SCHEMA = DATABASE()
 AND actual.TABLE_NAME = expected.table_name
WHERE actual.TABLE_NAME IS NULL;

SELECT expected.table_name, expected.column_name AS missing_column
FROM (
  SELECT 'courses' AS table_name, 'thumbnail_url' AS column_name
  UNION ALL SELECT 'courses', 'intro_video_url'
  UNION ALL SELECT 'courses', 'short_description'
  UNION ALL SELECT 'courses', 'duration_days'
  UNION ALL SELECT 'payments', 'course_id'
  UNION ALL SELECT 'enrollments', 'expires_at'
  UNION ALL SELECT 'enrollments', 'is_preserved'
  UNION ALL SELECT 'enrollments', 'preserved_at'
  UNION ALL SELECT 'lessons', 'section_id'
  UNION ALL SELECT 'lessons', 'video_url'
  UNION ALL SELECT 'lessons', 'duration_seconds'
  UNION ALL SELECT 'lessons', 'is_preview'
  UNION ALL SELECT 'lessons', 'status'
  UNION ALL SELECT 'materials', 'material_type'
  UNION ALL SELECT 'materials', 'sort_order'
  UNION ALL SELECT 'assignments', 'section_id'
  UNION ALL SELECT 'assignments', 'status'
  UNION ALL SELECT 'assignments', 'assignment_type'
  UNION ALL SELECT 'assignments', 'questions_json'
  UNION ALL SELECT 'assignments', 'auto_grade'
  UNION ALL SELECT 'submissions', 'answers_json'
  UNION ALL SELECT 'users', 'avatar_url'
  UNION ALL SELECT 'users', 'headline'
  UNION ALL SELECT 'users', 'bio'
) expected
LEFT JOIN information_schema.COLUMNS actual
  ON actual.TABLE_SCHEMA = DATABASE()
 AND actual.TABLE_NAME = expected.table_name
 AND actual.COLUMN_NAME = expected.column_name
WHERE actual.COLUMN_NAME IS NULL;

SELECT 'lessons.section_id NULL' AS check_name, COUNT(*) AS invalid_rows
FROM lessons
WHERE section_id IS NULL
UNION ALL
SELECT 'assignments.section_id NULL', COUNT(*)
FROM assignments
WHERE section_id IS NULL
UNION ALL
SELECT 'payments.course_id orphan', COUNT(*)
FROM payments p
LEFT JOIN courses c ON c.id = p.course_id
WHERE p.course_id IS NOT NULL AND c.id IS NULL;

SELECT 'MIGRATION COMPLETED' AS migration_status;
select * from users;