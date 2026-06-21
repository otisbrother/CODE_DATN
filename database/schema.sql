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
  avatar_url VARCHAR(500) NULL,
  headline VARCHAR(160) NULL,
  bio TEXT NULL,
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
  duration_days INT NULL DEFAULT NULL,
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

CREATE TABLE IF NOT EXISTS enrollments (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  payment_id INT,
  enrolled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  access_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  expires_at DATETIME NULL DEFAULT NULL,
  is_preserved TINYINT(1) NOT NULL DEFAULT 0,
  preserved_at DATETIME NULL DEFAULT NULL,
  preserve_count INT NOT NULL DEFAULT 0,
  preserve_reason VARCHAR(500) NULL,
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
  section_id INT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  due_date DATETIME,
  max_score DECIMAL(5,2) NOT NULL DEFAULT 10,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  assignment_type VARCHAR(20) NOT NULL DEFAULT 'manual',
  questions_json LONGTEXT,
  auto_grade TINYINT(1) NOT NULL DEFAULT 0,
  is_final_test TINYINT(1) NOT NULL DEFAULT 0,
  time_limit_seconds INT NULL DEFAULT NULL, -- Thời gian làm bài (giây). Dùng cho Test cuối khóa: hết giờ tự nộp.
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
  answers_json LONGTEXT,
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

-- Theo doi tung bai hoc da hoan thanh de tinh tien do idempotent (tranh dem trung)
CREATE TABLE IF NOT EXISTS lesson_completions (
  id INT NOT NULL AUTO_INCREMENT,
  student_id INT NOT NULL,
  lesson_id INT NOT NULL,
  watched_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_lesson_completions_student_lesson (student_id, lesson_id),
  CONSTRAINT fk_lesson_completions_student FOREIGN KEY (student_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_lesson_completions_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 6B. NHÓM ĐÁNH GIÁ / PHẢN HỒI KHÓA HỌC
-- Học viên đánh giá khóa học sau khi hoàn thành: số sao (1-5) + bình luận.
-- Điều kiện hoàn thành 100% được kiểm tra ở tầng service (reviews.service.js).
-- =============================================

CREATE TABLE IF NOT EXISTS course_reviews (
  id INT NOT NULL AUTO_INCREMENT,
  course_id INT NOT NULL,
  student_id INT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_review_student_course (student_id, course_id),
  CONSTRAINT fk_reviews_course FOREIGN KEY (course_id) REFERENCES courses(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_reviews_student FOREIGN KEY (student_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 6C. NHÓM LỊCH HỌC CÁ NHÂN (THỜI KHÓA BIỂU)
-- Mỗi học viên tự sắp khóa học vào buổi (thứ + khung giờ) trong tuần; lặp lại hằng tuần.
-- =============================================

CREATE TABLE IF NOT EXISTS study_schedules (
  id INT NOT NULL AUTO_INCREMENT,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  day_key VARCHAR(3) NOT NULL,        -- mon, tue, wed, thu, fri, sat, sun
  start_time VARCHAR(5) NOT NULL,     -- '07:00'
  duration_minutes INT NOT NULL DEFAULT 45,
  lesson_id INT NULL,
  lesson_title VARCHAR(255) NULL,
  course_title VARCHAR(200) NULL,
  note TEXT NULL,                     -- ghi chú cá nhân của học viên cho buổi học
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_study_schedules_student (student_id),
  CONSTRAINT fk_study_schedules_student FOREIGN KEY (student_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_study_schedules_course FOREIGN KEY (course_id) REFERENCES courses(id)
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
  file_url VARCHAR(500) NOT NULL DEFAULT '',
  content LONGTEXT,
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

-- =============================================
-- 8. DU LIEU BAT BUOC KHI KHOI TAO HE THONG
-- Khong tao tai khoan mau tai day vi password_hash phai duoc ma hoa bang bcrypt.
-- =============================================

INSERT IGNORE INTO roles (role_name) VALUES
  ('admin'),
  ('lecturer'),
  ('student');
