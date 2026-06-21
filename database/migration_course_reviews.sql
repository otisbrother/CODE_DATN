-- =============================================
-- Migration: course_reviews table
-- Bảng lưu đánh giá/phản hồi khóa học từ học viên
-- Điều kiện: chỉ học viên đã hoàn thành 100% khóa học mới được review
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
