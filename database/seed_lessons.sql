USE elearning_ai;

INSERT INTO lessons (course_id, title, content, lesson_order) VALUES
  (1, 'Giới thiệu HTML', 'HTML là ngôn ngữ đánh dấu siêu văn bản, dùng để xây dựng cấu trúc trang web...', 1),
  (1, 'CSS cơ bản', 'CSS dùng để trang trí và định dạng giao diện trang web...', 2),
  (1, 'JavaScript cơ bản', 'JavaScript là ngôn ngữ lập trình phía client, giúp trang web trở nên tương tác...', 3),
  (2, 'Giới thiệu MySQL', 'MySQL là hệ quản trị cơ sở dữ liệu quan hệ mã nguồn mở phổ biến nhất...', 1),
  (2, 'Câu lệnh SELECT', 'SELECT dùng để truy vấn dữ liệu từ một hoặc nhiều bảng...', 2),
  (3, 'React Component', 'Component là đơn vị cơ bản trong React, giúp chia nhỏ UI thành các phần độc lập...', 1),
  (3, 'React Hooks', 'Hooks cho phép sử dụng state và lifecycle trong functional component...', 2);
