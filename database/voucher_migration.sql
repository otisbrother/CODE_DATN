USE elearning_ai;

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
