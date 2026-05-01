USE elearning_ai;

-- section_id references: course 1 sections (1,2), course 2 sections (3,4), course 3 sections (5,6)
INSERT INTO lessons (course_id, section_id, title, content, video_url, duration_seconds, is_preview, status, lesson_order) VALUES
  (1, 1, 'Giới thiệu HTML', 'HTML là ngôn ngữ đánh dấu siêu văn bản, dùng để xây dựng cấu trúc trang web...', NULL, NULL, 1, 'active', 1),
  (1, 1, 'Thẻ HTML cơ bản', 'Các thẻ cơ bản: div, span, p, a, img, ul, ol...', NULL, NULL, 0, 'active', 2),
  (1, 2, 'CSS cơ bản', 'CSS dùng để trang trí và định dạng giao diện trang web...', NULL, NULL, 0, 'active', 1),
  (1, 2, 'JavaScript cơ bản', 'JavaScript là ngôn ngữ lập trình phía client, giúp trang web trở nên tương tác...', NULL, NULL, 0, 'active', 2),
  (2, 3, 'Giới thiệu MySQL', 'MySQL là hệ quản trị cơ sở dữ liệu quan hệ mã nguồn mở phổ biến nhất...', NULL, NULL, 1, 'active', 1),
  (2, 4, 'Câu lệnh SELECT', 'SELECT dùng để truy vấn dữ liệu từ một hoặc nhiều bảng...', NULL, NULL, 0, 'active', 1),
  (3, 5, 'React Component', 'Component là đơn vị cơ bản trong React, giúp chia nhỏ UI thành các phần độc lập...', NULL, NULL, 1, 'active', 1),
  (3, 6, 'React Hooks', 'Hooks cho phép sử dụng state và lifecycle trong functional component...', NULL, NULL, 0, 'active', 1);
