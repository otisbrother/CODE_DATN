-- =============================================
-- E-learning AI System - Database Schema
-- MySQL 8.0+
-- =============================================

CREATE DATABASE IF NOT EXISTS elearning_ai
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE elearning_ai;

-- =============================================
-- 1. NHÓM QUẢN LÝ NGƯỜI DÙNG VÀ PHÂN QUYỀN
-- =============================================

CREATE TABLE IF NOT EXISTS roles (
  id INT NOT NULL AUTO_INCREMENT,
  role_name VARCHAR(50) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_role_name (role_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id INT NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_email (email),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 2. NHÓM QUẢN LÝ KHÓA HỌC
-- =============================================

CREATE TABLE IF NOT EXISTS courses (
  id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  thumbnail_url VARCHAR(500) NULL,
  intro_video_url VARCHAR(500) NULL,
  short_description VARCHAR(300) NULL,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  lecturer_id INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_courses_lecturer FOREIGN KEY (lecturer_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  course_id INT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  paid_at DATETIME,
  PRIMARY KEY (id),
  CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_payments_course FOREIGN KEY (course_id) REFERENCES courses(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS enrollments (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  payment_id INT,
  enrolled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  access_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  PRIMARY KEY (id),
  UNIQUE KEY uq_enrollments_user_course (user_id, course_id),
  CONSTRAINT fk_enrollments_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id) REFERENCES courses(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_enrollments_payment FOREIGN KEY (payment_id) REFERENCES payments(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 3. NHÓM QUẢN LÝ CHƯƠNG (SECTIONS)
-- =============================================

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

-- =============================================
-- 4. NHÓM QUẢN LÝ BÀI HỌC VÀ HỌC LIỆU
-- =============================================

CREATE TABLE IF NOT EXISTS lessons (
  id INT NOT NULL AUTO_INCREMENT,
  course_id INT NOT NULL,
  section_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  content LONGTEXT,
  video_url VARCHAR(500) NULL,
  duration_seconds INT NULL,
  is_preview TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  lesson_order INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_lessons_course_id (course_id),
  UNIQUE KEY uq_lessons_section_order (section_id, lesson_order),
  CONSTRAINT fk_lessons_course FOREIGN KEY (course_id) REFERENCES courses(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_lessons_section FOREIGN KEY (section_id) REFERENCES course_sections(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS materials (
  id INT NOT NULL AUTO_INCREMENT,
  lesson_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  material_type VARCHAR(50) NOT NULL DEFAULT 'document',
  file_url VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  CONSTRAINT fk_materials_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 5. NHÓM QUẢN LÝ BÀI TẬP, BÀI NỘP VÀ KẾT QUẢ
-- =============================================

CREATE TABLE IF NOT EXISTS assignments (
  id INT NOT NULL AUTO_INCREMENT,
  course_id INT NOT NULL,
  section_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  due_date DATETIME,
  max_score DECIMAL(5,2) NOT NULL DEFAULT 10,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  PRIMARY KEY (id),
  CONSTRAINT fk_assignments_course FOREIGN KEY (course_id) REFERENCES courses(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_assignments_section FOREIGN KEY (section_id) REFERENCES course_sections(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS submissions (
  id INT NOT NULL AUTO_INCREMENT,
  assignment_id INT NOT NULL,
  student_id INT NOT NULL,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  content LONGTEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'submitted',
  PRIMARY KEY (id),
  CONSTRAINT fk_submissions_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_submissions_student FOREIGN KEY (student_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS results (
  id INT NOT NULL AUTO_INCREMENT,
  submission_id INT NOT NULL,
  score DECIMAL(5,2),
  feedback TEXT,
  PRIMARY KEY (id),
  UNIQUE KEY uq_results_submission (submission_id),
  CONSTRAINT fk_results_submission FOREIGN KEY (submission_id) REFERENCES submissions(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 6. NHÓM THEO DÕI TIẾN ĐỘ HỌC TẬP
-- =============================================

CREATE TABLE IF NOT EXISTS learning_progress (
  id INT NOT NULL AUTO_INCREMENT,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  completed_lessons INT NOT NULL DEFAULT 0,
  completed_assignments INT NOT NULL DEFAULT 0,
  completion_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
  PRIMARY KEY (id),
  UNIQUE KEY uq_learning_progress_student_course (student_id, course_id),
  CONSTRAINT fk_learning_progress_student FOREIGN KEY (student_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_learning_progress_course FOREIGN KEY (course_id) REFERENCES courses(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 7. NHÓM AI HỎI ĐÁP VÀ DỮ LIỆU AI
-- =============================================

CREATE TABLE IF NOT EXISTS ai_data_sources (
  id INT NOT NULL AUTO_INCREMENT,
  course_id INT NOT NULL,
  uploaded_by INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  approved_by INT,
  approved_at DATETIME,
  PRIMARY KEY (id),
  CONSTRAINT fk_ai_data_sources_course FOREIGN KEY (course_id) REFERENCES courses(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_ai_data_sources_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_ai_data_sources_approved_by FOREIGN KEY (approved_by) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ai_conversations (
  id INT NOT NULL AUTO_INCREMENT,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_ai_conversations_student FOREIGN KEY (student_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_ai_conversations_course FOREIGN KEY (course_id) REFERENCES courses(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ai_messages (
  id INT NOT NULL AUTO_INCREMENT,
  conversation_id INT NOT NULL,
  sender_type VARCHAR(20) NOT NULL,
  content LONGTEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_ai_messages_conversation FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
