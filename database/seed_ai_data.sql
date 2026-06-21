USE elearning_ai;

INSERT INTO ai_data_sources (course_id, uploaded_by, file_name, file_type, file_url, content, status) VALUES
  (1, 2, 'web_basics.txt', 'text', '', 'HTML là ngôn ngữ đánh dấu siêu văn bản. CSS dùng để trang trí giao diện. JavaScript dùng để tạo tương tác cho trang web. DOM là Document Object Model cho phép JavaScript thao tác với HTML.', 'approved'),
  (2, 2, 'mysql_basics.txt', 'text', '', 'MySQL là hệ quản trị CSDL quan hệ. SELECT dùng để truy vấn dữ liệu. INSERT dùng để thêm dữ liệu mới. UPDATE dùng để cập nhật dữ liệu. DELETE dùng để xóa dữ liệu. JOIN dùng để kết hợp nhiều bảng.', 'approved');
