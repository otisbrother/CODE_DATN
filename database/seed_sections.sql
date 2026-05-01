USE elearning_ai;

INSERT INTO course_sections (course_id, title, description, section_order, is_preview) VALUES
  -- Course 1: Lập trình Web cơ bản
  (1, 'Chương 1 - Giới thiệu Web', 'Tổng quan về lập trình web và các công nghệ cơ bản', 1, 1),
  (1, 'Chương 2 - CSS nâng cao', 'Tìm hiểu CSS nâng cao và responsive design', 2, 0),
  -- Course 2: Cơ sở dữ liệu MySQL
  (2, 'Chương 1 - Nhập môn MySQL', 'Giới thiệu MySQL và cài đặt môi trường', 1, 1),
  (2, 'Chương 2 - Truy vấn dữ liệu', 'Các câu lệnh SELECT, JOIN và truy vấn nâng cao', 2, 0),
  -- Course 3: ReactJS cho người mới
  (3, 'Chương 1 - React cơ bản', 'Component, JSX và cách tư duy React', 1, 1),
  (3, 'Chương 2 - React Hooks', 'useState, useEffect và custom hooks', 2, 0),
  -- Course 4: NodeJS và Express
  (4, 'Chương 1 - NodeJS cơ bản', 'Giới thiệu NodeJS và module system', 1, 1);
