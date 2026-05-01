USE elearning_ai;

INSERT INTO courses (title, description, thumbnail_url, intro_video_url, short_description, price, lecturer_id, status) VALUES
  ('Lập trình Web cơ bản', 'Khóa học giới thiệu HTML, CSS, JavaScript cơ bản cho người mới bắt đầu.', NULL, NULL, 'HTML, CSS, JS cho người mới', 500000, 2, 'published'),
  ('Cơ sở dữ liệu MySQL', 'Tìm hiểu MySQL từ cơ bản đến nâng cao: thiết kế, truy vấn và tối ưu.', NULL, NULL, 'MySQL từ cơ bản đến nâng cao', 350000, 2, 'published'),
  ('ReactJS cho người mới', 'Xây dựng ứng dụng web hiện đại với ReactJS, hooks và component.', NULL, NULL, 'React, Hooks, Component', 600000, 3, 'published'),
  ('NodeJS và Express', 'Backend development với NodeJS, xây dựng REST API chuyên nghiệp.', NULL, NULL, 'NodeJS, Express, REST API', 450000, 3, 'draft');

-- Enrollments (student1 enrolled in course 1 & 2, student2 in course 1)
INSERT INTO payments (user_id, total_amount, payment_method, payment_status, paid_at) VALUES
  (4, 500000, 'bank_transfer', 'completed', NOW()),
  (4, 350000, 'bank_transfer', 'completed', NOW()),
  (5, 500000, 'momo', 'completed', NOW());

INSERT INTO enrollments (user_id, course_id, payment_id, access_status) VALUES
  (4, 1, 1, 'active'),
  (4, 2, 2, 'active'),
  (5, 1, 3, 'active');
