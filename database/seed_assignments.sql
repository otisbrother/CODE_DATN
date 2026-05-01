USE elearning_ai;

-- section_id references: course 1 sections (1,2), course 2 sections (3,4), course 3 sections (5,6)
INSERT INTO assignments (course_id, section_id, title, description, due_date, max_score, status) VALUES
  (1, 1, 'Bài tập HTML cơ bản', 'Tạo một trang web cá nhân đơn giản sử dụng HTML.', '2026-05-01 23:59:59', 10, 'active'),
  (1, 2, 'Bài tập CSS', 'Thiết kế giao diện trang web sử dụng CSS.', '2026-05-15 23:59:59', 10, 'active'),
  (2, 4, 'Bài tập truy vấn SQL', 'Viết các câu lệnh SELECT, JOIN để truy vấn dữ liệu.', '2026-05-10 23:59:59', 10, 'active'),
  (3, 5, 'Bài tập React Component', 'Xây dựng một ứng dụng Todo List bằng React.', '2026-06-01 23:59:59', 10, 'active');
