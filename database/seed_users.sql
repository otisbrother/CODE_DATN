USE elearning_ai;

-- Passwords are all "123456" hashed with bcryptjs (10 rounds)
-- $2a$10$XXXXX... is a placeholder; the backend seed script will hash properly.
-- For manual insert, use this pre-computed hash of "123456":
-- $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

INSERT INTO users (full_name, email, password_hash, role_id, status) VALUES
  ('Admin Hệ Thống', 'admin@elearning.vn', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 'active'),
  ('GV. Nguyễn Văn An', 'lecturer1@elearning.vn', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 2, 'active'),
  ('GV. Trần Thị Bình', 'lecturer2@elearning.vn', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 2, 'active'),
  ('HV. Lê Minh Cường', 'student1@elearning.vn', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3, 'active'),
  ('HV. Phạm Thu Dung', 'student2@elearning.vn', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3, 'active'),
  ('HV. Hoàng Văn Em', 'student3@elearning.vn', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3, 'active');
