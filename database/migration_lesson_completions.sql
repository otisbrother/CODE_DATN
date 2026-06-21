-- Migration: theo doi tung bai hoc da hoan thanh (idempotent progress)
-- Khac phuc loi complete-lesson cong don vo han khien completion_rate > 100%.

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
