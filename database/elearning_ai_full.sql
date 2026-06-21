-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: elearning_ai
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `elearning_ai`
--

/*!40000 DROP DATABASE IF EXISTS `elearning_ai`*/;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `elearning_ai` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `elearning_ai`;

--
-- Table structure for table `ai_conversations`
--

DROP TABLE IF EXISTS `ai_conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_conversations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `course_id` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_ai_conversations_student` (`student_id`),
  KEY `fk_ai_conversations_course` (`course_id`),
  CONSTRAINT `fk_ai_conversations_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ai_conversations_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_conversations`
--

LOCK TABLES `ai_conversations` WRITE;
/*!40000 ALTER TABLE `ai_conversations` DISABLE KEYS */;
INSERT INTO `ai_conversations` VALUES (1,3,2,'2026-04-15 10:21:01'),(2,3,1,'2026-04-20 13:39:46'),(3,6,6,'2026-04-24 09:15:46'),(4,6,1,'2026-04-24 09:25:40'),(5,6,2,'2026-05-19 21:31:18'),(6,3,6,'2026-05-26 11:17:38'),(7,3,6,'2026-05-26 11:17:49'),(8,3,6,'2026-05-26 11:18:11'),(9,3,6,'2026-05-26 11:19:31'),(10,3,6,'2026-05-26 11:19:34'),(11,3,6,'2026-05-26 11:21:30'),(12,3,6,'2026-05-26 11:21:31'),(13,6,9,'2026-06-12 22:32:50');
/*!40000 ALTER TABLE `ai_conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ai_data_sources`
--

DROP TABLE IF EXISTS `ai_data_sources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_data_sources` (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` int NOT NULL,
  `uploaded_by` int NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `content` longtext COLLATE utf8mb4_unicode_ci,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `approved_by` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_ai_data_sources_course` (`course_id`),
  KEY `fk_ai_data_sources_uploaded_by` (`uploaded_by`),
  KEY `fk_ai_data_sources_approved_by` (`approved_by`),
  CONSTRAINT `fk_ai_data_sources_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ai_data_sources_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ai_data_sources_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_data_sources`
--

LOCK TABLES `ai_data_sources` WRITE;
/*!40000 ALTER TABLE `ai_data_sources` DISABLE KEYS */;
INSERT INTO `ai_data_sources` VALUES (1,1,2,'Lập trình web','text','','KHÓA HỌC: LẬP TRÌNH WEB\n\nMô tả khóa học:\nKhóa học lập trình web cung cấp kiến thức nền tảng về cách xây dựng một website hoàn chỉnh, bao gồm giao diện người dùng, xử lý logic phía client, giao tiếp với server và lưu trữ dữ liệu. Người học sẽ được tìm hiểu HTML, CSS, JavaScript, React.js, Node.js, Express.js, MySQL và cách kết nối frontend với backend thông qua API.\n\n1. Chủ đề: HTML\n\nTừ khóa nhận diện:\nHTML, thẻ HTML, div, form, input, button, table, link, image, semantic HTML, cấu trúc trang web.\n\nCâu hỏi người học có thể hỏi:\n\n* HTML là gì?\n* HTML dùng để làm gì?\n* Thẻ div khác gì thẻ section?\n* Làm thế nào để tạo form đăng nhập?\n* Làm sao để chèn ảnh vào trang web?\n* Thẻ input dùng để làm gì?\n\nĐịnh hướng trả lời:\nHTML là ngôn ngữ đánh dấu dùng để xây dựng cấu trúc nội dung của trang web. HTML không phải là ngôn ngữ lập trình vì nó không xử lý logic, mà chủ yếu dùng để xác định các thành phần như tiêu đề, đoạn văn, hình ảnh, bảng, form và nút bấm. Khi xây dựng website, HTML thường kết hợp với CSS để trình bày giao diện và JavaScript để xử lý tương tác.\n\nVí dụ:\nMột form đăng nhập thường gồm thẻ form, input email, input password và button gửi dữ liệu.\n\n2. Chủ đề: CSS\n\nTừ khóa nhận diện:\nCSS, style, màu sắc, font chữ, layout, flexbox, grid, margin, padding, border, responsive, media query.\n\nCâu hỏi người học có thể hỏi:\n\n* CSS là gì?\n* Margin và padding khác nhau như thế nào?\n* Flexbox dùng để làm gì?\n* Grid khác Flexbox ở điểm nào?\n* Làm sao để căn giữa một div?\n* Responsive là gì?\n* Media query dùng để làm gì?\n\nĐịnh hướng trả lời:\nCSS dùng để định dạng giao diện cho trang web, bao gồm màu sắc, kích thước, khoảng cách, bố cục và hiệu ứng hiển thị. Margin là khoảng cách bên ngoài phần tử, còn padding là khoảng cách bên trong phần tử. Flexbox thường dùng để sắp xếp phần tử theo một chiều, còn Grid phù hợp với bố cục hai chiều gồm hàng và cột. Responsive giúp giao diện hiển thị tốt trên nhiều thiết bị như máy tính, máy tính bảng và điện thoại.\n\nVí dụ:\nĐể căn giữa một phần tử bằng Flexbox, có thể dùng display: flex, justify-content: center và align-items: center.\n\n3. Chủ đề: JavaScript\n\nTừ khóa nhận diện:\nJavaScript, biến, hàm, array, object, event, DOM, fetch, async, await, promise, localStorage.\n\nCâu hỏi người học có thể hỏi:\n\n* JavaScript là gì?\n* var, let, const khác nhau như thế nào?\n* Hàm trong JavaScript dùng để làm gì?\n* DOM là gì?\n* Event là gì?\n* Promise là gì?\n* async/await dùng để làm gì?\n* Làm sao để gọi API bằng JavaScript?\n\nĐịnh hướng trả lời:\nJavaScript là ngôn ngữ lập trình dùng để xử lý logic và tương tác trên trang web. JavaScript có thể thay đổi nội dung HTML, xử lý sự kiện người dùng, kiểm tra dữ liệu form, gọi API và cập nhật giao diện mà không cần tải lại trang. let và const thường được dùng thay cho var trong JavaScript hiện đại. Promise và async/await giúp xử lý các tác vụ bất đồng bộ như gọi API.\n\nVí dụ:\nKhi người dùng bấm nút đăng nhập, JavaScript có thể lấy email và mật khẩu từ form, gửi dữ liệu lên server thông qua fetch API và hiển thị kết quả trả về.\n\n4. Chủ đề: React.js\n\nTừ khóa nhận diện:\nReact, React.js, component, props, state, useState, useEffect, JSX, routing, React Router, frontend.\n\nCâu hỏi người học có thể hỏi:\n\n* React.js là gì?\n* Component là gì?\n* Props và state khác nhau như thế nào?\n* useState dùng để làm gì?\n* useEffect dùng để làm gì?\n* JSX là gì?\n* React Router dùng để làm gì?\n* Làm sao để gọi API trong React?\n\nĐịnh hướng trả lời:\nReact.js là thư viện JavaScript dùng để xây dựng giao diện người dùng. React chia giao diện thành các component nhỏ để dễ quản lý và tái sử dụng. Props dùng để truyền dữ liệu từ component cha xuống component con, còn state dùng để lưu dữ liệu có thể thay đổi bên trong component. useState dùng để quản lý state, useEffect thường dùng để xử lý các tác vụ phụ như gọi API khi component được hiển thị.\n\nVí dụ:\nTrong hệ thống E-learning, các màn hình như danh sách khóa học, chi tiết khóa học, trang học bài và dashboard admin có thể được xây dựng bằng các component React riêng biệt.\n\n5. Chủ đề: Node.js và Express.js\n\nTừ khóa nhận diện:\nNode.js, Express.js, backend, server, API, RESTful API, route, controller, middleware, request, response.\n\nCâu hỏi người học có thể hỏi:\n\n* Node.js là gì?\n* Express.js dùng để làm gì?\n* Backend là gì?\n* API là gì?\n* RESTful API là gì?\n* Route là gì?\n* Middleware là gì?\n* Request và response là gì?\n\nĐịnh hướng trả lời:\nNode.js là môi trường chạy JavaScript ở phía server. Express.js là framework giúp xây dựng backend và API nhanh hơn. Backend có nhiệm vụ xử lý nghiệp vụ, xác thực người dùng, truy vấn cơ sở dữ liệu và trả dữ liệu cho frontend. API là cầu nối giữa frontend và backend. RESTful API thường sử dụng các phương thức như GET, POST, PUT, DELETE để thao tác với dữ liệu.\n\nVí dụ:\nTrong hệ thống E-learning, API GET /courses có thể dùng để lấy danh sách khóa học, còn API POST /enrollments dùng để học viên đăng ký khóa học.\n\n6. Chủ đề: MySQL và cơ sở dữ liệu\n\nTừ khóa nhận diện:\nMySQL, database, bảng, khóa chính, khóa ngoại, SQL, SELECT, INSERT, UPDATE, DELETE, JOIN, users, courses, enrollments.\n\nCâu hỏi người học có thể hỏi:\n\n* MySQL là gì?\n* Cơ sở dữ liệu dùng để làm gì?\n* Khóa chính là gì?\n* Khóa ngoại là gì?\n* SELECT dùng để làm gì?\n* JOIN dùng để làm gì?\n* Làm sao để lấy danh sách khóa học từ database?\n* Vì sao cần thiết kế cơ sở dữ liệu?\n\nĐịnh hướng trả lời:\nMySQL là hệ quản trị cơ sở dữ liệu quan hệ, dùng để lưu trữ và quản lý dữ liệu. Trong hệ thống web, cơ sở dữ liệu lưu thông tin người dùng, khóa học, bài học, bài tập, đăng ký khóa học, thanh toán và kết quả học tập. Khóa chính dùng để định danh duy nhất một bản ghi trong bảng. Khóa ngoại dùng để liên kết dữ liệu giữa các bảng. JOIN dùng để truy vấn dữ liệu từ nhiều bảng có quan hệ với nhau.\n\nVí dụ:\nBảng users lưu thông tin người dùng, bảng courses lưu thông tin khóa học, bảng enrollments lưu thông tin học viên đăng ký khóa học.\n\n7. Chủ đề: Đăng nhập, xác thực và phân quyền\n\nTừ khóa nhận diện:\nđăng nhập, đăng ký, authentication, authorization, JWT, token, phân quyền, admin, giáo viên, học viên, bảo mật.\n\nCâu hỏi người học có thể hỏi:\n\n* Đăng nhập hoạt động như thế nào?\n* JWT là gì?\n* Token dùng để làm gì?\n* Authentication và authorization khác nhau thế nào?\n* Vì sao phải mã hóa mật khẩu?\n* Phân quyền người dùng là gì?\n* Admin, giáo viên và học viên khác quyền nhau như thế nào?\n\nĐịnh hướng trả lời:\nAuthentication là quá trình xác thực người dùng, tức kiểm tra người dùng có đúng là người sở hữu tài khoản hay không. Authorization là quá trình phân quyền, tức kiểm tra người dùng được phép truy cập chức năng nào. JWT là token được cấp sau khi đăng nhập thành công, giúp hệ thống nhận biết người dùng trong các lần gửi request tiếp theo. Mật khẩu cần được mã hóa trước khi lưu vào cơ sở dữ liệu để đảm bảo an toàn.\n\nVí dụ:\nHọc viên có thể xem bài học và làm bài tập, giáo viên có thể quản lý khóa học và chấm điểm, còn admin có thể quản lý người dùng và duyệt dữ liệu AI.\n\n8. Chủ đề: Kết nối frontend và backend\n\nTừ khóa nhận diện:\nfrontend, backend, API, fetch, axios, request, response, JSON, CORS, endpoint.\n\nCâu hỏi người học có thể hỏi:\n\n* Frontend và backend kết nối với nhau như thế nào?\n* API endpoint là gì?\n* JSON là gì?\n* fetch và axios dùng để làm gì?\n* CORS là lỗi gì?\n* Làm sao để lấy dữ liệu từ backend hiển thị lên React?\n\nĐịnh hướng trả lời:\nFrontend và backend giao tiếp với nhau thông qua API. Frontend gửi request đến endpoint của backend, backend xử lý nghiệp vụ, truy vấn database nếu cần và trả dữ liệu dạng JSON về cho frontend. React có thể dùng fetch hoặc axios để gọi API. CORS là cơ chế bảo mật của trình duyệt, thường xảy ra khi frontend và backend chạy khác domain hoặc khác port nhưng backend chưa cho phép truy cập.\n\nVí dụ:\nTrang danh sách khóa học trong React gọi API GET /api/courses để lấy dữ liệu khóa học từ backend và hiển thị lên giao diện.\n\n9. Chủ đề: Quy trình xây dựng một chức năng web\n\nTừ khóa nhận diện:\nquy trình làm chức năng, CRUD, thêm sửa xóa, form, validate, API, database, giao diện.\n\nCâu hỏi người học có thể hỏi:\n\n* Làm một chức năng web bắt đầu từ đâu?\n* CRUD là gì?\n* Làm sao để thêm khóa học?\n* Làm sao để sửa dữ liệu?\n* Làm sao để xóa dữ liệu?\n* Vì sao cần validate dữ liệu?\n\nĐịnh hướng trả lời:\nMột chức năng web thường được xây dựng theo các bước: xác định yêu cầu, thiết kế giao diện, tạo form nhập dữ liệu, xây dựng API backend, xử lý validate dữ liệu, lưu vào database, trả kết quả cho frontend và hiển thị thông báo cho người dùng. CRUD là viết tắt của Create, Read, Update, Delete, tương ứng với thêm, xem, sửa và xóa dữ liệu.\n\nVí dụ:\nChức năng quản lý khóa học gồm thêm khóa học, xem danh sách khóa học, cập nhật thông tin khóa học và thay đổi trạng thái khóa học.\n\n10. Chủ đề: Lỗi thường gặp khi học lập trình web\n\nTừ khóa nhận diện:\nlỗi code, lỗi JavaScript, lỗi React, lỗi API, lỗi database, undefined, null, 404, 500, CORS, validate.\n\nCâu hỏi người học có thể hỏi:\n\n* Vì sao bị lỗi undefined?\n* Lỗi 404 là gì?\n* Lỗi 500 là gì?\n* Vì sao gọi API không được?\n* Vì sao dữ liệu không hiển thị trên giao diện?\n* Vì sao form không gửi được dữ liệu?\n* Làm sao để debug lỗi?\n\nĐịnh hướng trả lời:\nKhi gặp lỗi lập trình web, cần đọc kỹ thông báo lỗi trong console, kiểm tra dữ liệu đầu vào, kiểm tra endpoint API, kiểm tra request gửi lên backend và kiểm tra dữ liệu trong database. Lỗi 404 thường là không tìm thấy route hoặc API. Lỗi 500 thường là lỗi phía server. Lỗi undefined hoặc null thường xảy ra khi biến chưa có dữ liệu nhưng đã được sử dụng. Debug nên thực hiện từng bước từ frontend đến backend và database.\n\nVí dụ:\nNếu danh sách khóa học không hiển thị, cần kiểm tra API có trả dữ liệu không, React có nhận đúng dữ liệu không và phần render giao diện có dùng đúng tên thuộc tính không.\n\n11. Chủ đề: Định hướng học lập trình web\n\nTừ khóa nhận diện:\nhọc lập trình web, học gì trước, lộ trình học web, frontend, backend, fullstack, dự án web.\n\nCâu hỏi người học có thể hỏi:\n\n* Muốn học lập trình web thì bắt đầu từ đâu?\n* Nên học HTML, CSS hay JavaScript trước?\n* Khi nào nên học React?\n* Khi nào nên học backend?\n* Học fullstack cần những gì?\n* Làm sao để giỏi lập trình web?\n\nĐịnh hướng trả lời:\nNgười mới học lập trình web nên bắt đầu từ HTML để hiểu cấu trúc trang web, sau đó học CSS để biết cách trình bày giao diện, tiếp theo học JavaScript để xử lý tương tác. Khi đã nắm chắc JavaScript cơ bản, có thể học React.js để xây dựng giao diện hiện đại. Sau đó học Node.js, Express.js và MySQL để xây dựng backend và cơ sở dữ liệu. Cuối cùng nên làm các dự án nhỏ như trang quản lý khóa học, trang đăng nhập, trang bán hàng hoặc hệ thống E-learning để luyện tập.\n\nLộ trình đề xuất:\nBước 1: HTML, CSS cơ bản.\nBước 2: JavaScript cơ bản và DOM.\nBước 3: React.js và gọi API.\nBước 4: Node.js, Express.js.\nBước 5: MySQL và thiết kế database.\nBước 6: Xây dựng dự án fullstack hoàn chỉnh.\nBước 7: Tối ưu giao diện, bảo mật và triển khai hệ thống.\n\n12. Chủ đề: Dự án thực hành E-learning\n\nTừ khóa nhận diện:\ndự án E-learning, quản lý khóa học, đăng ký khóa học, bài học, bài tập, nộp bài, AI hỏi đáp.\n\nCâu hỏi người học có thể hỏi:\n\n* Dự án E-learning gồm những chức năng nào?\n* Làm chức năng đăng ký khóa học như thế nào?\n* Làm chức năng quản lý khóa học như thế nào?\n* Làm chức năng nộp bài như thế nào?\n* AI hỏi đáp trong E-learning hoạt động như thế nào?\n\nĐịnh hướng trả lời:\nMột hệ thống E-learning cơ bản thường gồm các chức năng: quản lý người dùng, phân quyền, quản lý khóa học, đăng ký khóa học, quản lý bài học, quản lý tài liệu, quản lý bài tập, nộp bài, chấm điểm, theo dõi tiến độ học tập và AI hỏi đáp. Với chức năng đăng ký khóa học, hệ thống cần kiểm tra người dùng đã đăng nhập, khóa học có tồn tại, người dùng đã đăng ký hay chưa, sau đó lưu thông tin vào bảng enrollments. Với AI hỏi đáp, hệ thống nhận câu hỏi của học viên, xác định khóa học liên quan, lấy dữ liệu học tập phù hợp và gửi cho AI để tạo câu trả lời.\n\n13. Nguyên tắc trả lời của AI trong khóa học\n\nKhi học viên hỏi về kiến thức lập trình web, AI cần:\n\n* Giải thích ngắn gọn, dễ hiểu.\n* Ưu tiên giải thích bản chất trước, sau đó mới đưa ví dụ.\n* Nếu câu hỏi liên quan đến lỗi, cần hướng dẫn cách kiểm tra từng bước.\n* Nếu học viên hỏi bài tập, không nên đưa luôn toàn bộ đáp án ngay từ đầu, mà nên gợi ý hướng làm, các bước xử lý và phần kiến thức cần ôn.\n* Nếu câu hỏi chưa rõ, cần hỏi lại học viên đang gặp lỗi ở phần frontend, backend hay database.\n* Nếu câu hỏi liên quan đến dự án E-learning, cần định hướng theo các nghiệp vụ chính: quản lý khóa học, đăng ký khóa học, học bài, làm bài tập, theo dõi tiến độ và AI hỏi đáp.\n* Nếu học viên hỏi về lộ trình học, cần đề xuất thứ tự học từ HTML, CSS, JavaScript, React.js, Node.js, Express.js, MySQL đến dự án fullstack.\n\n14. Một số từ khóa ánh xạ nhanh\n\nHTML -> cấu trúc trang web, thẻ, form, input, button.\nCSS -> giao diện, màu sắc, bố cục, flexbox, grid, responsive.\nJavaScript -> xử lý logic, DOM, event, fetch API, async await.\nReact -> component, props, state, useState, useEffect, routing.\nNode.js -> backend, server, xử lý nghiệp vụ.\nExpress.js -> API, route, controller, middleware.\nMySQL -> database, bảng, khóa chính, khóa ngoại, truy vấn SQL.\nJWT -> đăng nhập, xác thực, token, phân quyền.\nAPI -> kết nối frontend và backend.\nCORS -> lỗi truy cập API khác domain hoặc khác port.\nCRUD -> thêm, xem, sửa, xóa dữ liệu.\nE-learning -> khóa học, bài học, bài tập, đăng ký khóa học, tiến độ học tập.\nAI hỏi đáp -> giải thích bài học, trả lời câu hỏi, gợi ý hướng làm bài.\n','approved',2,'2026-06-08 12:17:26','2026-04-14 19:47:10'),(2,2,2,'mysql_basics.txt','text','','MySQL l├á hß╗ç quß║ún trß╗ï CSDL quan hß╗ç. SELECT d├╣ng ─æß╗â truy vß║Ñn dß╗» liß╗çu. INSERT d├╣ng ─æß╗â th├¬m dß╗» liß╗çu mß╗øi. UPDATE d├╣ng ─æß╗â cß║¡p nhß║¡t dß╗» liß╗çu. DELETE d├╣ng ─æß╗â x├│a dß╗» liß╗çu. JOIN d├╣ng ─æß╗â kß║┐t hß╗úp nhiß╗üu bß║úng.','approved',NULL,NULL,'2026-04-14 19:47:10'),(5,9,2,'Nhập môn C','explain_guidance','','Chủ đề: Vòng lặp trong lập trình\n\nTừ khóa: vòng lặp, for, while, điều kiện dừng, biến đếm, lặp vô hạn.\n\nVòng lặp dùng để thực hiện lặp lại một khối lệnh nhiều lần. Vòng for thường dùng khi biết trước số lần lặp. Vòng while thường dùng khi chưa biết trước số lần lặp và cần lặp đến khi một điều kiện không còn đúng.\n\nVí dụ: dùng for để in các số từ 1 đến 10. Dùng while để yêu cầu người dùng nhập lại mật khẩu cho đến khi đúng.\n\nKhi học viên bị lặp vô hạn, cần kiểm tra điều kiện dừng và đảm bảo biến điều khiển vòng lặp được cập nhật sau mỗi lần lặp.','approved',2,'2026-06-08 11:25:13','2026-06-08 11:25:13');
/*!40000 ALTER TABLE `ai_data_sources` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ai_messages`
--

DROP TABLE IF EXISTS `ai_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conversation_id` int NOT NULL,
  `sender_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_ai_messages_conversation` (`conversation_id`),
  CONSTRAINT `fk_ai_messages_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_messages`
--

LOCK TABLES `ai_messages` WRITE;
/*!40000 ALTER TABLE `ai_messages` DISABLE KEYS */;
INSERT INTO `ai_messages` VALUES (1,1,'student','MySQL la gi?','2026-04-15 10:21:01'),(2,1,'ai','Dựa trên nội dung khóa học, đây là câu trả lời cho câu hỏi \"MySQL la gi?\":\n\nTheo tài liệu học tập, MySQL l├á hß╗ç quß║ún trß╗ï CSDL quan hß╗ç. SELECT d├╣ng ─æß╗â truy vß║Ñn dß╗» liß╗çu. INSERT d├╣ng ─æß╗â th├¬m dß╗» liß╗çu mß╗øi. UPDATE d├╣ng ─æß╗â cß║¡p nhß║¡t dß╗» liß╗çu. DELETE d├╣ng ─æß╗â x├│a ...\n\nBạn có thể tham khảo thêm trong bài học để hiểu rõ hơn. Hãy hỏi thêm nếu cần!','2026-04-15 10:21:01'),(3,1,'student','hello','2026-04-15 10:29:45'),(4,1,'ai','Dựa trên nội dung khóa học, đây là câu trả lời cho câu hỏi \"hello\":\n\nTheo tài liệu học tập, MySQL l├á hß╗ç quß║ún trß╗ï CSDL quan hß╗ç. SELECT d├╣ng ─æß╗â truy vß║Ñn dß╗» liß╗çu. INSERT d├╣ng ─æß╗â th├¬m dß╗» liß╗çu mß╗øi. UPDATE d├╣ng ─æß╗â cß║¡p nhß║¡t dß╗» liß╗çu. DELETE d├╣ng ─æß╗â x├│a ...\n\nBạn có thể tham khảo thêm trong bài học để hiểu rõ hơn. Hãy hỏi thêm nếu cần!','2026-04-15 10:29:45'),(5,1,'student','áđá','2026-04-15 10:29:49'),(6,1,'ai','Dựa trên nội dung khóa học, đây là câu trả lời cho câu hỏi \"áđá\":\n\nTheo tài liệu học tập, MySQL l├á hß╗ç quß║ún trß╗ï CSDL quan hß╗ç. SELECT d├╣ng ─æß╗â truy vß║Ñn dß╗» liß╗çu. INSERT d├╣ng ─æß╗â th├¬m dß╗» liß╗çu mß╗øi. UPDATE d├╣ng ─æß╗â cß║¡p nhß║¡t dß╗» liß╗çu. DELETE d├╣ng ─æß╗â x├│a ...\n\nBạn có thể tham khảo thêm trong bài học để hiểu rõ hơn. Hãy hỏi thêm nếu cần!','2026-04-15 10:29:49'),(7,2,'student','hello','2026-04-20 13:39:46'),(8,2,'ai','Dựa trên nội dung khóa học, đây là câu trả lời cho câu hỏi \"hello\":\n\nTheo tài liệu học tập, HTML l├á ng├┤n ngß╗» ─æ├ính dß║Ñu si├¬u v─ân bß║ún. CSS d├╣ng ─æß╗â trang tr├¡ giao diß╗çn. JavaScript d├╣ng ─æß╗â tß║ío tã░ãíng t├íc cho trang web. DOM l├á Document Object Model cho ph├®p JavaScript ...\n\nBạn có thể tham khảo thêm trong bài học để hiểu rõ hơn. Hãy hỏi thêm nếu cần!','2026-04-20 13:39:46'),(9,2,'student','hãy giải thích nội dung khóa học này','2026-04-20 13:40:01'),(10,2,'ai','Dựa trên nội dung khóa học, đây là câu trả lời cho câu hỏi \"hãy giải thích nội dung khóa học này\":\n\nTheo tài liệu học tập, HTML l├á ng├┤n ngß╗» ─æ├ính dß║Ñu si├¬u v─ân bß║ún. CSS d├╣ng ─æß╗â trang tr├¡ giao diß╗çn. JavaScript d├╣ng ─æß╗â tß║ío tã░ãíng t├íc cho trang web. DOM l├á Document Object Model cho ph├®p JavaScript ...\n\nBạn có thể tham khảo thêm trong bài học để hiểu rõ hơn. Hãy hỏi thêm nếu cần!','2026-04-20 13:40:01'),(11,3,'student','cấccác','2026-04-24 09:15:46'),(12,3,'ai','Cảm ơn bạn đã đặt câu hỏi: \"cấccác\"\n\nHiện tại chưa có dữ liệu AI được kích hoạt cho khóa học này. Vui lòng liên hệ giáo viên để được hỗ trợ thêm.','2026-04-24 09:15:46'),(13,4,'student','cho tôi hỏi khóa học này ','2026-04-24 09:25:40'),(14,4,'ai','Dựa trên nội dung khóa học, đây là câu trả lời cho câu hỏi \"cho tôi hỏi khóa học này \":\n\nTheo tài liệu học tập, HTML l├á ng├┤n ngß╗» ─æ├ính dß║Ñu si├¬u v─ân bß║ún. CSS d├╣ng ─æß╗â trang tr├¡ giao diß╗çn. JavaScript d├╣ng ─æß╗â tß║ío tã░ãíng t├íc cho trang web. DOM l├á Document Object Model cho ph├®p JavaScript ...\n\nBạn có thể tham khảo thêm trong bài học để hiểu rõ hơn. Hãy hỏi thêm nếu cần!','2026-04-24 09:25:40'),(15,3,'student','Bạn hãy giải thích cho tôi về bài học này','2026-05-19 07:30:09'),(16,3,'ai','Cảm ơn bạn đã đặt câu hỏi: \"Bạn hãy giải thích cho tôi về bài học này\"\n\nHiện tại chưa có dữ liệu AI được kích hoạt cho khóa học này. Vui lòng liên hệ giáo viên để được hỗ trợ thêm.','2026-05-19 07:30:09'),(17,3,'student','Pandas dùng để làm gì?','2026-05-19 21:28:31'),(18,3,'ai','Dựa trên nội dung khóa học, mình hiểu câu hỏi của bạn là: \"Pandas dùng để làm gì?\".\nPhần liên quan nhất:\n- Chương 1: Tổng quan AI / Bài 1: AI là gì\nTóm tắt kiến thức cần nắm:\nTrí tuệ nhân tạo (AI - Artificial Intelligence) là lĩnh vực trong khoa học máy tính tập trung vào việc xây dựng các hệ thống có khả năng thực hiện những nhiệm vụ mà trước đây cần đến trí thông minh của con người, như nhận diện hình ảnh, xử lý ngôn ngữ tự nhiên và ra quyết định.\r\n\r\nTrong bài học này, bạn sẽ hiểu được khái niệm cơ bản về AI, cách AI hoạt động và sự khác biệt giữa AI, Machine Learning và Deep Learning. Ngoài ra, bài học cũng giới th...\nCách học gợi ý:\n- Đọc lại khái niệm chính trong bài liên quan.\n- Tự viết ví dụ nhỏ để kiểm tra bạn đã hiểu chưa.\n- Nếu vẫn vướng, hỏi tiếp bằng một câu cụ thể hơn hoặc gửi đoạn bạn chưa hiểu.','2026-05-19 21:28:31'),(19,3,'student','Bạn hãy giải thích cho tôi về toàn bộ bài học liên quan đến phần này được ko','2026-05-19 21:29:01'),(20,3,'ai','Dựa trên nội dung khóa học, mình hiểu câu hỏi của bạn là: \"Bạn hãy giải thích cho tôi về toàn bộ bài học liên quan đến phần này được ko\".\nPhần liên quan nhất:\n- Chương 1: Tổng quan AI / Bài 1: AI là gì\nTóm tắt kiến thức cần nắm:\nTrí tuệ nhân tạo (AI - Artificial Intelligence) là lĩnh vực trong khoa học máy tính tập trung vào việc xây dựng các hệ thống có khả năng thực hiện những nhiệm vụ mà trước đây cần đến trí thông minh của con người, như nhận diện hình ảnh, xử lý ngôn ngữ tự nhiên và ra quyết định.\r\n\r\nTrong bài học này, bạn sẽ hiểu được khái niệm cơ bản về AI, cách AI hoạt động và sự khác biệt giữa AI, Machine Learning và Deep Learning. Ngoài ra, bài học cũng giới th...\nCách học gợi ý:\n- Đọc lại khái niệm chính trong bài liên quan.\n- Tự viết ví dụ nhỏ để kiểm tra bạn đã hiểu chưa.\n- Nếu vẫn vướng, hỏi tiếp bằng một câu cụ thể hơn hoặc gửi đoạn bạn chưa hiểu.','2026-05-19 21:29:01'),(21,5,'student','hello','2026-05-19 21:31:18'),(22,5,'ai','Dựa trên nội dung khóa học, mình hiểu câu hỏi của bạn là: \"hello\".\nPhần liên quan nhất:\n- Chương 1 - Nội dung mặc định / Giß╗øi thiß╗çu MySQL\n- Chương 1 - Nội dung mặc định / C├óu lß╗çnh SELECT\nTóm tắt kiến thức cần nắm:\nMySQL l├á hß╗ç quß║ún trß╗ï cãí sß╗ƒ dß╗» liß╗çu quan hß╗ç m├ú nguß╗ôn mß╗ƒ phß╗ò biß║┐n nhß║Ñt...\nCách học gợi ý:\n- Đọc lại khái niệm chính trong bài liên quan.\n- Tự viết ví dụ nhỏ để kiểm tra bạn đã hiểu chưa.\n- Nếu vẫn vướng, hỏi tiếp bằng một câu cụ thể hơn hoặc gửi đoạn bạn chưa hiểu.\n\n\nLưu ý: nếu câu hỏi liên quan đến bài tập như \"B├ái tß║¡p truy vß║Ñn SQL\", mình sẽ chỉ gợi ý hướng làm, không đưa đáp án nộp bài.','2026-05-19 21:31:18'),(23,4,'student','Bạn có thể giải thích cho tôi bài học về lập trình web được ko','2026-05-19 21:31:59'),(24,4,'ai','Dựa trên nội dung khóa học, mình hiểu câu hỏi của bạn là: \"Bạn có thể giải thích cho tôi bài học về lập trình web được ko\".\nPhần liên quan nhất:\n- Chưa tìm thấy bài học liên quan rõ ràng\nTóm tắt kiến thức cần nắm:\nBài học này chưa có nội dung text chi tiết, bạn nên xem video/tài liệu đính kèm trước.\nCách học gợi ý:\n- Đọc lại khái niệm chính trong bài liên quan.\n- Tự viết ví dụ nhỏ để kiểm tra bạn đã hiểu chưa.\n- Nếu vẫn vướng, hỏi tiếp bằng một câu cụ thể hơn hoặc gửi đoạn bạn chưa hiểu.\n\n\nLưu ý: nếu câu hỏi liên quan đến bài tập như \"B├ái tß║¡p HTML cãí bß║ún\", mình sẽ chỉ gợi ý hướng làm, không đưa đáp án nộp bài.','2026-05-19 21:31:59'),(25,3,'student','làm hộ tôi bài này được ko','2026-05-19 21:35:08'),(26,3,'ai','Dựa trên nội dung khóa học, mình hiểu câu hỏi của bạn là: \"làm hộ tôi bài này được ko\".\nPhần liên quan nhất:\n- Chương 1: Tổng quan AI / Bài 1: AI là gì\n- Chương 2: Python cho AI / Bài 1: Cài đặt Python\n- Chương 2: Python cho AI / Bài 2: Numpy, Pandas\nTóm tắt kiến thức cần nắm:\nTrí tuệ nhân tạo (AI - Artificial Intelligence) là lĩnh vực trong khoa học máy tính tập trung vào việc xây dựng các hệ thống có khả năng thực hiện những nhiệm vụ mà trước đây cần đến trí thông minh của con người, như nhận diện hình ảnh, xử lý ngôn ngữ tự nhiên và ra quyết định.\r\n\r\nTrong bài học này, bạn sẽ hiểu được khái niệm cơ bản về AI, cách AI hoạt động và sự khác biệt giữa AI, Machine Learning và Deep Learning. Ngoài ra, bài học cũng giới th...\nCách học gợi ý:\n- Đọc lại khái niệm chính trong bài liên quan.\n- Tự viết ví dụ nhỏ để kiểm tra bạn đã hiểu chưa.\n- Nếu vẫn vướng, hỏi tiếp bằng một câu cụ thể hơn hoặc gửi đoạn bạn chưa hiểu.','2026-05-19 21:35:08'),(27,3,'student','- Chương 2: Python cho AI / Bài 2: Numpy, Pandas (Mình ko hiểu phần này)','2026-05-19 21:35:29'),(28,3,'ai','Dựa trên nội dung khóa học, mình hiểu câu hỏi của bạn là: \"- Chương 2: Python cho AI / Bài 2: Numpy, Pandas (Mình ko hiểu phần này)\".\nPhần liên quan nhất:\n- Chương 1: Tổng quan AI / Bài 1: AI là gì\n- Chương 2: Python cho AI / Bài 1: Cài đặt Python\n- Chương 2: Python cho AI / Bài 2: Numpy, Pandas\nTóm tắt kiến thức cần nắm:\nTrí tuệ nhân tạo (AI - Artificial Intelligence) là lĩnh vực trong khoa học máy tính tập trung vào việc xây dựng các hệ thống có khả năng thực hiện những nhiệm vụ mà trước đây cần đến trí thông minh của con người, như nhận diện hình ảnh, xử lý ngôn ngữ tự nhiên và ra quyết định.\r\n\r\nTrong bài học này, bạn sẽ hiểu được khái niệm cơ bản về AI, cách AI hoạt động và sự khác biệt giữa AI, Machine Learning và Deep Learning. Ngoài ra, bài học cũng giới th...\nCách học gợi ý:\n- Đọc lại khái niệm chính trong bài liên quan.\n- Tự viết ví dụ nhỏ để kiểm tra bạn đã hiểu chưa.\n- Nếu vẫn vướng, hỏi tiếp bằng một câu cụ thể hơn hoặc gửi đoạn bạn chưa hiểu.','2026-05-19 21:35:29'),(29,4,'student','Bạn hãy giảng bài lại cho tôi về môn này được ko','2026-05-25 16:31:01'),(30,4,'ai','Dựa trên nội dung khóa học, mình hiểu câu hỏi của bạn là: \"Bạn hãy giảng bài lại cho tôi về môn này được ko\".\nPhần liên quan nhất:\n- Chưa tìm thấy bài học liên quan rõ ràng\nTóm tắt kiến thức cần nắm:\nBài học này chưa có nội dung text chi tiết, bạn nên xem video/tài liệu đính kèm trước.\nCách học gợi ý:\n- Đọc lại khái niệm chính trong bài liên quan.\n- Tự viết ví dụ nhỏ để kiểm tra bạn đã hiểu chưa.\n- Nếu vẫn vướng, hỏi tiếp bằng một câu cụ thể hơn hoặc gửi đoạn bạn chưa hiểu.\n\n\nLưu ý: nếu câu hỏi liên quan đến bài tập như \"B├ái tß║¡p HTML cãí bß║ún\", mình sẽ chỉ gợi ý hướng làm, không đưa đáp án nộp bài.','2026-05-25 16:31:01'),(31,6,'student','B�i Numpy Pandas d?y g�?','2026-05-26 11:17:38'),(32,6,'ai','Đây là nội dung nằm trong phần đăng ký khóa học. Vui lòng đăng ký khóa học để xem bài giảng và sử dụng AI hỗ trợ phần này.','2026-05-26 11:17:38'),(33,7,'student','AI l� g�, gi?i th�ch d? hi?u cho t�i','2026-05-26 11:17:49'),(34,7,'ai','Đây là nội dung nằm trong phần đăng ký khóa học. Vui lòng đăng ký khóa học để xem bài giảng và sử dụng AI hỗ trợ phần này.','2026-05-26 11:17:49'),(35,8,'student','AI l� g�, gi?i th�ch d? hi?u cho t�i','2026-05-26 11:18:11'),(36,8,'ai','Đây là nội dung nằm trong phần đăng ký khóa học. Vui lòng đăng ký khóa học để xem bài giảng và sử dụng AI hỗ trợ phần này.','2026-05-26 11:18:11'),(37,9,'student','AI l� g�, gi?i th�ch d? hi?u cho t�i','2026-05-26 11:19:34'),(38,9,'ai','Chào bạn,\n\nDựa trên nội dung bài học, AI (Trí tuệ nhân tạo) là một lĩnh vực trong khoa học máy tính. Mục tiêu của AI là tạo ra các hệ thống máy tính có thể thực hiện những công việc mà trước đây cần đến trí thông minh của con người.\n\nVí dụ về các công việc này bao gồm:\n*   **Nhận diện hình ảnh:** Máy tính có thể \"nhìn\" và hiểu được nội dung trong một bức ảnh (ví dụ: nhận ra đó là một con mèo hay một cái cây).\n*   **Xử lý ngôn ngữ tự nhiên:** Máy tính có thể \"hiểu\" và phản hồi lại ngôn ngữ của con người (ví dụ: chatbot).\n*   **Ra quyết định:** Máy tính có thể phân tích thông tin và đưa ra lựa chọn tốt nhất (ví dụ: hệ thống gợi ý sản phẩm).\n\nNói một cách đơn giản, AI là việc dạy máy tính cách suy nghĩ và hành động giống như con người để giải quyết các vấn đề phức tạp.','2026-05-26 11:19:34'),(39,10,'student','B�i Numpy Pandas d?y g�?','2026-05-26 11:19:34'),(40,10,'ai','Đây là nội dung nằm trong phần đăng ký khóa học. Vui lòng đăng ký khóa học để xem bài giảng và sử dụng AI hỗ trợ phần này.','2026-05-26 11:19:34'),(41,11,'student','AI l� g�, gi?i th�ch d? hi?u cho t�i','2026-05-26 11:21:31'),(42,11,'ai','Dựa trên nội dung khóa học \"Khóa học AI \", mình giải thích câu hỏi \"AI l� g�, gi?i th�ch d? hi?u cho t�i\" như sau:\n\nPhần liên quan:\n- Chương 1: Tổng quan AI / Bài 1: AI là gì\n\nÝ chính cần nắm:\nTrí tuệ nhân tạo (AI - Artificial Intelligence) là lĩnh vực trong khoa học máy tính tập trung vào việc xây dựng các hệ thống có khả năng thực hiện những nhiệm vụ mà trước đây cần đến trí thông minh của con người, như nhận diện hình ảnh, xử lý ngôn ngữ tự nhiên và ra quyết định.\r\n\r\nTrong bài học này, bạn sẽ hiểu được khái niệm cơ bản về AI, cách AI hoạt động và sự khác biệt giữa AI, Machine Learning và Deep Learning. Ngoài ra, bài học cũng giới thiệu các ứng dụng phổ biến của AI trong đời sống và công việc như chatbot, gợi ý sản phẩm và nhận diện khuôn mặt.\n\nCách học gợi ý:\n- Đọc lại nội dung bài liên quan.\n- Ghi ra khái niệm chưa rõ.\n- Hỏi tiếp bằng một câu cụ thể hơn nếu bạn vẫn vướng.','2026-05-26 11:21:31'),(43,12,'student','B�i Numpy Pandas d?y g�?','2026-05-26 11:21:31'),(44,12,'ai','Đây là nội dung nằm trong phần đăng ký khóa học. Vui lòng đăng ký khóa học để xem bài giảng và sử dụng AI hỗ trợ phần này.','2026-05-26 11:21:31'),(45,3,'student','hướng dẫn tôi các làm bài 1 đi','2026-06-08 09:33:46'),(46,3,'ai','Chào bạn,\n\nBạn đang hỏi về \"bài 1\". Tuy nhiên, trong nội dung khóa học được cung cấp, không có thông tin cụ thể về \"bài 1\" là bài tập hay nội dung học.\n\nNếu bạn đang muốn tìm hiểu về **Bài 1: AI là gì** (thuộc Chương 1: Tổng quan AI), bạn có thể xem lại nội dung bài học này để nắm vững các khái niệm cơ bản về AI, cách AI hoạt động, sự khác biệt giữa AI, Machine Learning và Deep Learning, cùng các ứng dụng phổ biến của AI.\n\nNếu bạn đang muốn tìm hiểu về **Bài 1: Cài đặt Python** (thuộc Chương 2: Python cho AI), nội dung bài học này sẽ hướng dẫn bạn cách cài đặt Python.\n\nVui lòng cho biết rõ hơn bạn muốn được hướng dẫn về nội dung nào để tôi có thể hỗ trợ bạn tốt nhất nhé.','2026-06-08 09:33:46'),(47,3,'student','Chương 1: Tổng quan AI / Bài 1: AI là gì','2026-06-08 09:34:05'),(48,3,'ai','Chào bạn,\n\nTrong bài học \"AI là gì\", bạn sẽ được tìm hiểu về:\n\n*   **Khái niệm AI:** Trí tuệ nhân tạo (AI) là một lĩnh vực trong khoa học máy tính, tập trung vào việc xây dựng các hệ thống có khả năng thực hiện những nhiệm vụ mà trước đây cần đến trí thông minh của con người.\n*   **Cách AI hoạt động:** Bài học sẽ giải thích cơ chế hoạt động cơ bản của AI.\n*   **Phân biệt AI, Machine Learning và Deep Learning:** Bạn sẽ hiểu rõ sự khác biệt giữa các khái niệm này.\n*   **Ứng dụng của AI:** Bài học cũng giới thiệu các ứng dụng phổ biến của AI trong đời sống và công việc, như chatbot, hệ thống gợi ý sản phẩm và nhận diện khuôn mặt.\n\nHy vọng giải thích này giúp bạn hiểu rõ hơn về nội dung bài học!','2026-06-08 09:34:05'),(49,4,'student','api là gì','2026-06-08 12:17:51'),(50,4,'ai','Chào bạn,\n\nAPI (Application Programming Interface) là một tập hợp các quy tắc và phương thức cho phép các ứng dụng khác nhau giao tiếp và trao đổi dữ liệu với nhau.\n\nTrong ngữ cảnh lập trình web, API thường được dùng để:\n*   **Kết nối Frontend với Backend:** Cho phép phần giao diện người dùng (frontend) gửi yêu cầu và nhận dữ liệu từ máy chủ (backend).\n*   **Tích hợp dịch vụ bên ngoài:** Giúp website của bạn kết nối và sử dụng các chức năng từ các dịch vụ khác (ví dụ: API của Google Maps, API thanh toán).\n\nVí dụ, khi bạn đăng nhập vào một trang web, trình duyệt của bạn (frontend) sẽ gửi thông tin đăng nhập đến máy chủ (backend) thông qua một API. Máy chủ sẽ xử lý thông tin đó và trả về kết quả (ví dụ: đăng nhập thành công hoặc thất bại) cũng thông qua API.\n\nBạn có thể tìm hiểu thêm về cách gọi API bằng JavaScript trong các bài học sắp tới.','2026-06-08 12:17:51'),(51,4,'student','đầu vào của khóa này là gì','2026-06-08 12:19:37'),(52,4,'ai','Chào bạn,\n\nKhóa học này được thiết kế để cung cấp kiến thức nền tảng về lập trình web. Dựa trên mô tả, khóa học sẽ bắt đầu với các khái niệm cơ bản như HTML (để xây dựng cấu trúc trang web) và CSS (để định dạng giao diện).\n\nVì vậy, đầu vào của khóa học này là bạn không cần có kiến thức lập trình web từ trước. Khóa học sẽ hướng dẫn bạn từ những bước cơ bản nhất.','2026-06-08 12:19:37'),(53,4,'student','css sẽ được học những cái j vậy','2026-06-08 12:19:58'),(54,4,'ai','Chào bạn,\n\nTrong khóa học này, bạn sẽ được học về CSS để định dạng giao diện cho trang web. Cụ thể, bạn sẽ tìm hiểu cách sử dụng CSS để:\n\n*   **Định dạng cơ bản:** Thay đổi màu sắc, font chữ, kích thước.\n*   **Bố cục trang:** Sắp xếp các phần tử trên trang web bằng các kỹ thuật như Flexbox và Grid.\n*   **Khoảng cách:** Điều chỉnh khoảng cách giữa các phần tử (margin) và khoảng cách bên trong phần tử (padding), cũng như đường viền (border).\n*   **Thiết kế đáp ứng (Responsive Design):** Giúp trang web hiển thị tốt trên nhiều loại thiết bị khác nhau (máy tính, máy tính bảng, điện thoại) bằng cách sử dụng Media Query.\n\nHy vọng bạn sẽ có trải nghiệm học tập tốt!','2026-06-08 12:19:58'),(55,4,'student','Bạn có thể giúp tôi làm bài tập css này được không','2026-06-08 12:21:59'),(56,4,'ai','Chào bạn, tôi là trợ lý học tập AI. Tôi sẽ không làm bài tập hộ bạn, nhưng tôi có thể giải thích các khái niệm trong bài học để giúp bạn hiểu rõ hơn và tự mình hoàn thành bài tập.\n\nBạn đang gặp khó khăn ở phần nào của bài tập CSS? Hãy cho tôi biết câu hỏi hoặc phần kiến thức bạn chưa rõ, tôi sẽ cố gắng giải thích dựa trên nội dung khóa học đã được cung cấp.','2026-06-08 12:21:59'),(57,4,'student','Trong một hệ thống E-learning fullstack dùng React, Node.js, Express.js và MySQL, nếu nhiều học viên cùng lúc làm bài kiểm tra trắc nghiệm có giới hạn thời gian, hệ thống cần thiết kế cơ chế như thế nào để đảm bảo: thời gian làm bài không bị gian lận ở phía client, đáp án không bị lộ qua API, kết quả chấm điểm vẫn chính xác khi có lỗi mạng hoặc học viên reload trang, đồng thời tránh tình trạng race condition khi học viên nộp bài nhiều lần?','2026-06-08 12:29:48'),(58,4,'ai','Chào bạn,\n\nCâu hỏi của bạn liên quan đến việc thiết kế một hệ thống phức tạp, đòi hỏi kiến thức sâu rộng về cả frontend và backend, cũng như các vấn đề về bảo mật và xử lý lỗi. Đây là một dạng bài tập lớn hoặc dự án thực tế, không phải là một câu hỏi lý thuyết đơn thuần trong phạm vi các bài học cơ bản về HTML và CSS.\n\nHiện tại, nội dung bài học bạn đang truy cập chỉ tập trung vào HTML và CSS, là những kiến thức nền tảng để xây dựng giao diện tĩnh của trang web. Các khái niệm như React.js, Node.js, Express.js, MySQL, API, bảo mật, xử lý lỗi mạng, race condition... đều thuộc các chủ đề nâng cao hơn và sẽ được đề cập trong các phần sau của khóa học.\n\nĐể có thể giải quyết được vấn đề bạn nêu ra, bạn cần nắm vững:\n\n*   **JavaScript:** Để xử lý logic phía client, tương tác với DOM, gọi API.\n*   **React.js:** Để xây dựng giao diện người dùng động và quản lý trạng thái.\n*   **Node.js & Express.js:** Để xây dựng API backend, xử lý logic phía server, tương tác với cơ sở dữ liệu.\n*   **MySQL:** Để lưu trữ dữ liệu người dùng, câu hỏi, đáp án, kết quả bài kiểm tra.\n*   **Kiến thức về bảo mật web:** Để ngăn chặn gian lận và lộ thông tin.\n*   **Kiến thức về xử lý bất đồng bộ (async/await, Promise):** Để gọi API và xử lý các tác vụ mất thời gian.\n*   **Kiến thức về quản lý trạng thái và đồng bộ hóa dữ liệu:** Để đảm bảo tính nhất quán của dữ liệu giữa client và server.\n\nBạn hãy tiếp tục học các bài học theo lộ trình của khóa học. Khi bạn đã nắm vững các kiến thức về JavaScript, React.js, Node.js, Express.js và MySQL, bạn sẽ có đủ công cụ và kiến thức để tự mình tìm hiểu và thiết kế giải pháp cho những vấn đề phức tạp như câu hỏi bạn vừa đặt ra.\n\nChúc bạn học tốt!','2026-06-08 12:29:48'),(59,4,'student','Khi học viên bấm nút ‘Đăng ký khóa học’ trên giao diện React, hãy giải thích toàn bộ luồng xử lý từ frontend đến backend và database: React lấy dữ liệu gì, gọi API nào, Node.js/Express xử lý ra sao, MySQL cần kiểm tra những bảng nào, và sau khi đăng ký thành công thì giao diện cập nhật như thế nào?','2026-06-08 12:31:43'),(60,4,'ai','Chào bạn,\n\nHiện tại, tôi chưa có thông tin về các bài học liên quan đến React, Node.js, Express và MySQL trong khóa học \"Lập trình web\" của bạn. Các bài học hiện có chỉ bao gồm HTML và CSS.\n\nVì vậy, tôi không thể giải thích chi tiết luồng xử lý khi bạn bấm nút \"Đăng ký khóa học\" trên giao diện React theo yêu cầu của bạn.\n\nBạn có thể tham khảo các chủ đề về HTML và CSS nếu có bất kỳ câu hỏi nào liên quan đến hai chủ đề này.','2026-06-08 12:31:43'),(61,4,'student','Khi dùng JavaScript để gọi API bằng fetch, tại sao có lúc dữ liệu trả về từ server không hiển thị ngay trên giao diện, mặc dù API đã trả về đúng dữ liệu? Hãy giải thích liên quan đến bất đồng bộ, Promise, async/await và quá trình cập nhật giao diện','2026-06-08 12:34:47'),(62,4,'ai','Khi dùng JavaScript để gọi API bằng `fetch`, việc dữ liệu không hiển thị ngay trên giao diện mặc dù API đã trả về đúng dữ liệu thường liên quan đến tính chất bất đồng bộ của JavaScript và cách bạn xử lý kết quả trả về.\n\n1.  **Bất đồng bộ (Asynchronous):**\n    *   JavaScript là ngôn ngữ đơn luồng (single-threaded), nghĩa là nó chỉ có thể thực hiện một tác vụ tại một thời điểm.\n    *   Các thao tác tốn thời gian như gọi API (I/O operations) được thực hiện bất đồng bộ. Điều này có nghĩa là khi bạn gọi `fetch`, JavaScript không chờ đợi API trả về dữ liệu mà sẽ tiếp tục thực thi các dòng code tiếp theo.\n    *   Nếu bạn cố gắng truy cập dữ liệu từ `fetch` ngay lập tức sau khi gọi nó mà không xử lý tính bất đồng bộ, dữ liệu đó sẽ chưa có sẵn, dẫn đến việc giao diện không được cập nhật.\n\n2.  **Promise:**\n    *   `fetch` trả về một đối tượng `Promise`. `Promise` là một đối tượng đại diện cho một giá trị có thể có sẵn trong tương lai (thành công hoặc thất bại).\n    *   Để xử lý kết quả của `Promise`, bạn sử dụng phương thức `.then()` để đăng ký một hàm callback sẽ được gọi khi `Promise` thành công (dữ liệu đã có).\n    *   Nếu bạn quên sử dụng `.then()` hoặc xử lý không đúng cách, dữ liệu sẽ không được trích xuất và sử dụng để cập nhật giao diện.\n\n3.  **`async/await`:**\n    *   `async/await` là cú pháp giúp làm việc với `Promise` dễ dàng hơn, giúp code bất đồng bộ trông giống như code đồng bộ.\n    *   Hàm được đánh dấu `async` luôn trả về một `Promise`.\n    *   Từ khóa `await` chỉ có thể được sử dụng bên trong một hàm `async`. Khi bạn `await` một `Promise` (ví dụ: `await fetch(...)`), JavaScript sẽ tạm dừng việc thực thi hàm `async` đó cho đến khi `Promise` được giải quyết (hoàn thành).\n    *   Nếu bạn gọi `fetch` mà không dùng `await` trong một hàm `async`, hoặc gọi `fetch` trong một ngữ cảnh không phải `async/await` mà không dùng `.then()`, bạn sẽ gặp vấn đề tương tự như khi không dùng `Promise` đúng cách.\n\n4.  **Quá trình cập nhật giao diện:**\n    *   Sau khi `fetch` thành công và bạn đã nhận được dữ liệu, bạn cần **chủ động** cập nhật các phần tử DOM (Document Object Model) trên trang web để hiển thị dữ liệu đó.\n    *   Nếu bạn chỉ nhận dữ liệu mà không có code để chọn các phần tử HTML và gán dữ liệu mới vào chúng (ví dụ: thay đổi `textContent`, `innerHTML`, hoặc thêm/xóa các phần tử), giao diện sẽ không thay đổi.\n\n**Tóm lại:** Dữ liệu không hiển thị ngay là do bạn cần xử lý tính bất đồng bộ của `fetch` bằng `Promise` (sử dụng `.then()`) hoặc `async/await` để đảm bảo rằng bạn chỉ cố gắng truy cập và sử dụng dữ liệu **sau khi** nó đã được trả về từ server. Sau đó, bạn phải viết code để thao tác với DOM và cập nhật giao diện với dữ liệu mới nhận được.','2026-06-08 12:34:47'),(63,13,'student','Tóm tắt bài này','2026-06-12 22:32:52'),(64,13,'ai','Chào bạn,\n\nBài học này cung cấp kiến thức về **vòng lặp trong lập trình**.\n\nVòng lặp được sử dụng để **thực hiện lặp lại một khối lệnh nhiều lần**. Có hai loại vòng lặp chính được đề cập:\n\n*   **Vòng lặp `for`**: Thường được dùng khi bạn **biết trước số lần lặp** cần thực hiện.\n    *   Ví dụ: In các số từ 1 đến 10.\n*   **Vòng lặp `while`**: Thường được dùng khi bạn **chưa biết trước số lần lặp** và cần lặp cho đến khi một điều kiện nào đó không còn đúng.\n    *   Ví dụ: Yêu cầu người dùng nhập lại mật khẩu cho đến khi đúng.\n\nKhi sử dụng vòng lặp, bạn cần chú ý đến **điều kiện dừng** để tránh **lặp vô hạn**. Điều này có nghĩa là bạn phải đảm bảo rằng biến điều khiển vòng lặp được cập nhật sau mỗi lần lặp để điều kiện dừng có thể đạt được.','2026-06-12 22:32:52');
/*!40000 ALTER TABLE `ai_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assignments`
--

DROP TABLE IF EXISTS `assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` int NOT NULL,
  `section_id` int NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `due_date` datetime DEFAULT NULL,
  `max_score` decimal(5,2) NOT NULL DEFAULT '10.00',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `assignment_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'manual',
  `questions_json` longtext COLLATE utf8mb4_unicode_ci,
  `auto_grade` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_assignments_course` (`course_id`),
  KEY `fk_assignments_section` (`section_id`),
  CONSTRAINT `fk_assignments_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_assignments_section` FOREIGN KEY (`section_id`) REFERENCES `course_sections` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignments`
--

LOCK TABLES `assignments` WRITE;
/*!40000 ALTER TABLE `assignments` DISABLE KEYS */;
INSERT INTO `assignments` VALUES (1,1,1,'B├ái tß║¡p HTML cãí bß║ún','Tß║ío mß╗Öt trang web c├í nh├ón ─æãín giß║ún sß╗¡ dß╗Ñng HTML.','2026-05-01 23:59:59',10.00,'active','manual',NULL,0),(2,1,1,'B├ái tß║¡p CSS','Thiß║┐t kß║┐ giao diß╗çn trang web sß╗¡ dß╗Ñng CSS.','2026-05-15 23:59:59',10.00,'active','manual',NULL,0),(3,2,2,'B├ái tß║¡p truy vß║Ñn SQL','Viß║┐t c├íc c├óu lß╗çnh SELECT, JOIN ─æß╗â truy vß║Ñn dß╗» liß╗çu.','2026-05-10 23:59:59',10.00,'active','manual',NULL,0),(5,1,1,'B├ái tß║¡p HTML cãí bß║ún','Tß║ío mß╗Öt trang web c├í nh├ón ─æãín giß║ún sß╗¡ dß╗Ñng HTML.','2026-05-01 23:59:59',10.00,'active','manual',NULL,0),(6,1,1,'B├ái tß║¡p CSS','Thiß║┐t kß║┐ giao diß╗çn trang web sß╗¡ dß╗Ñng CSS.','2026-05-15 23:59:59',10.00,'active','manual',NULL,0),(7,2,2,'B├ái tß║¡p truy vß║Ñn SQL','Viß║┐t c├íc c├óu lß╗çnh SELECT, JOIN ─æß╗â truy vß║Ñn dß╗» liß╗çu.','2026-05-10 23:59:59',10.00,'active','manual',NULL,0),(9,8,10,'abc','xyz',NULL,10.00,'active','manual',NULL,0);
/*!40000 ALTER TABLE `assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `course_sections`
--

DROP TABLE IF EXISTS `course_sections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_sections` (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` int NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `section_order` int NOT NULL,
  `is_preview` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_course_sections_course_order` (`course_id`,`section_order`),
  UNIQUE KEY `uq_sections_course_order` (`course_id`,`section_order`),
  CONSTRAINT `fk_course_sections_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sections_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course_sections`
--

LOCK TABLES `course_sections` WRITE;
/*!40000 ALTER TABLE `course_sections` DISABLE KEYS */;
INSERT INTO `course_sections` VALUES (1,1,'Chương 1 - Nội dung mặc định','Chương mặc định được tạo khi nâng cấp DB',1,1,'2026-04-23 22:33:45'),(2,2,'Chương 1 - Nội dung mặc định','Chương mặc định được tạo khi nâng cấp DB',1,1,'2026-04-23 22:33:45'),(4,4,'Chương 1 - Nội dung mặc định','Chương mặc định được tạo khi nâng cấp DB',1,1,'2026-04-23 22:33:45'),(8,6,'Chương 1: Tổng quan AI','',1,1,'2026-04-24 16:53:05'),(9,6,'Chương 2: Python cho AI','dđââsd',2,0,'2026-05-05 07:39:50'),(10,8,'Chương 1 : Ngăn xếp','cố lên',1,1,'2026-05-19 09:45:53'),(11,8,'Chương 2 : Hàng đợi','cô lên ',2,0,'2026-05-19 09:46:09'),(12,7,'Chuong 1 - Noi dung mac dinh','Chuong mac dinh duoc tao khi nang cap database',1,0,'2026-06-07 16:41:43'),(13,9,'Chuong 1 - Các câu lệnh cơ bản','làm quen',1,0,'2026-06-07 16:41:43'),(14,10,'Chuong 1 - Noi dung mac dinh','Chuong mac dinh duoc tao khi nang cap database',1,0,'2026-06-07 16:41:43');
/*!40000 ALTER TABLE `course_sections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `thumbnail_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `intro_video_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `short_description` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `lecturer_id` int NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `duration_days` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_courses_lecturer` (`lecturer_id`),
  CONSTRAINT `fk_courses_lecturer` FOREIGN KEY (`lecturer_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
INSERT INTO `courses` VALUES (1,'Khóa học lập trình web','Học html css ','/uploads/courses/1777910862768-684197376.jpg','/uploads/courses/1776961320233-613338951.mp4','',10000.00,2,'published',NULL,'2026-04-14 19:44:04'),(2,'Khóa học MySQL ','123ácc','/uploads/courses/1777910922400-974872531.png',NULL,'',10000.00,2,'published',NULL,'2026-04-14 19:44:04'),(4,'NodeJS v├á Express','Backend development vß╗øi NodeJS, x├óy dß╗▒ng REST API chuy├¬n nghiß╗çp.',NULL,NULL,NULL,450000.00,3,'archived',NULL,'2026-04-14 19:44:04'),(6,'Khóa học AI ','Khóa học AI giúp bạn nắm vững kiến thức từ cơ bản đến thực hành, bám sát bài giảng để có thể áp dụng ngay vào công việc. Bạn sẽ được hướng dẫn xây dựng các project thực tế, làm quen với công cụ phổ biến và hiểu cách triển khai AI trong đời sống.','/uploads/courses/1776968266361-576722642.jpg','/uploads/courses/1776968266366-889135625.mp4','học xong làm được việc ngay',10000.00,2,'published',NULL,'2026-04-24 01:17:46'),(7,'Khóa học lập trình nâng cao','ddâdd','/uploads/courses/1778551318130-6591936.png',NULL,'sđá',1000.00,2,'published',NULL,'2026-05-12 09:01:58'),(8,'Khóa học CTDL','học rất hay','/uploads/courses/1779158664102-659391710.png','/uploads/courses/1779158664157-965231340.mp4','học rất hay',10000.00,2,'published',2,'2026-05-19 09:44:24'),(9,'Nhập môn lập trình','học căn bản','/uploads/courses/1779716794743-653402604.png','/uploads/courses/1779716794747-376335250.mp4','học căn bản',10000.00,2,'published',15,'2026-05-25 20:46:34'),(10,'Nhập môn điện toán đám mây',NULL,'/uploads/courses/1779726118387-628519365.jpg','/uploads/courses/1779726118388-630915706.mp4',NULL,10000.00,20,'published',12,'2026-05-25 23:21:58');
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enrollments`
--

DROP TABLE IF EXISTS `enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enrollments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `course_id` int NOT NULL,
  `payment_id` int DEFAULT NULL,
  `enrolled_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `access_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `expires_at` datetime DEFAULT NULL,
  `is_preserved` tinyint(1) NOT NULL DEFAULT '0',
  `preserved_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_enrollments_user_course` (`user_id`,`course_id`),
  KEY `fk_enrollments_course` (`course_id`),
  KEY `fk_enrollments_payment` (`payment_id`),
  CONSTRAINT `fk_enrollments_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_enrollments_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_enrollments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enrollments`
--

LOCK TABLES `enrollments` WRITE;
/*!40000 ALTER TABLE `enrollments` DISABLE KEYS */;
INSERT INTO `enrollments` VALUES (1,4,1,1,'2026-04-14 19:44:04','active',NULL,0,NULL),(2,4,2,2,'2026-04-14 19:44:04','active',NULL,0,NULL),(3,5,1,3,'2026-04-14 19:44:04','active',NULL,0,NULL),(4,3,2,4,'2026-04-14 21:53:40','active',NULL,0,NULL),(5,3,1,5,'2026-04-15 10:57:19','active',NULL,0,NULL),(6,6,2,6,'2026-04-23 23:10:00','active',NULL,0,NULL),(7,6,1,7,'2026-04-23 23:23:07','active',NULL,0,NULL),(9,6,6,9,'2026-04-24 01:21:06','active','2026-06-18 20:15:51',0,NULL),(10,8,6,10,'2026-04-24 01:34:10','pending',NULL,0,NULL),(11,9,6,11,'2026-04-24 01:48:30','pending',NULL,0,NULL),(12,8,2,12,'2026-04-24 09:18:53','pending',NULL,0,NULL),(13,10,1,13,'2026-04-24 09:28:40','pending',NULL,0,NULL),(14,11,2,14,'2026-04-24 16:09:32','pending',NULL,0,NULL),(15,11,6,15,'2026-04-24 16:33:55','active','2026-06-18 09:15:47',0,NULL),(17,12,6,17,'2026-04-28 22:41:44','pending',NULL,0,NULL),(18,10,6,18,'2026-04-29 10:31:17','pending',NULL,0,NULL),(19,14,2,19,'2026-05-01 10:43:08','active',NULL,0,NULL),(20,14,6,20,'2026-05-01 11:14:56','active','2026-06-18 09:15:47',0,NULL),(21,15,2,21,'2026-05-01 11:21:07','active',NULL,0,NULL),(23,16,2,23,'2026-05-04 22:59:46','pending',NULL,0,NULL),(24,17,6,24,'2026-05-05 07:37:19','pending',NULL,0,NULL),(25,18,6,25,'2026-05-05 08:00:44','pending',NULL,0,NULL),(27,19,7,27,'2026-05-19 07:07:46','pending',NULL,0,NULL),(28,19,1,28,'2026-05-19 07:42:05','pending',NULL,0,NULL),(29,19,8,29,'2026-05-19 09:48:37','pending',NULL,0,NULL),(30,13,6,30,'2026-05-19 09:51:25','pending',NULL,0,NULL),(33,6,9,33,'2026-06-05 17:39:32','active','2026-06-23 13:47:32',0,NULL),(34,21,9,34,'2026-06-06 08:47:23','pending',NULL,0,NULL),(35,21,6,35,'2026-06-06 08:48:15','pending',NULL,0,NULL),(36,6,10,36,'2026-06-13 09:29:44','pending',NULL,0,NULL);
/*!40000 ALTER TABLE `enrollments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `learning_progress`
--

DROP TABLE IF EXISTS `learning_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `learning_progress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `course_id` int NOT NULL,
  `completed_lessons` int NOT NULL DEFAULT '0',
  `completed_assignments` int NOT NULL DEFAULT '0',
  `completion_rate` decimal(5,2) NOT NULL DEFAULT '0.00',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'in_progress',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_learning_progress_student_course` (`student_id`,`course_id`),
  KEY `fk_learning_progress_course` (`course_id`),
  CONSTRAINT `fk_learning_progress_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_learning_progress_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `learning_progress`
--

LOCK TABLES `learning_progress` WRITE;
/*!40000 ALTER TABLE `learning_progress` DISABLE KEYS */;
INSERT INTO `learning_progress` VALUES (1,3,2,0,0,0.00,'in_progress'),(2,3,1,0,0,0.00,'in_progress'),(3,6,2,0,1,25.00,'in_progress'),(4,6,1,0,0,0.00,'in_progress'),(5,6,6,2,0,66.67,'in_progress'),(6,11,6,0,0,0.00,'in_progress'),(7,14,2,1,0,25.00,'in_progress'),(8,14,6,0,0,0.00,'in_progress'),(9,15,2,0,0,0.00,'in_progress'),(10,6,9,2,0,100.00,'completed');
/*!40000 ALTER TABLE `learning_progress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lesson_completions`
--

DROP TABLE IF EXISTS `lesson_completions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lesson_completions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `lesson_id` int NOT NULL,
  `completed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_lesson_completions_student_lesson` (`student_id`,`lesson_id`),
  KEY `fk_lesson_completions_lesson` (`lesson_id`),
  CONSTRAINT `fk_lesson_completions_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_lesson_completions_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lesson_completions`
--

LOCK TABLES `lesson_completions` WRITE;
/*!40000 ALTER TABLE `lesson_completions` DISABLE KEYS */;
/*!40000 ALTER TABLE `lesson_completions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lessons`
--

DROP TABLE IF EXISTS `lessons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lessons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` int NOT NULL,
  `section_id` int NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` longtext COLLATE utf8mb4_unicode_ci,
  `video_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration_seconds` int DEFAULT NULL,
  `is_preview` tinyint(1) NOT NULL DEFAULT '0',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `lesson_order` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_lessons_section_order` (`section_id`,`lesson_order`),
  KEY `idx_lessons_course_id` (`course_id`),
  CONSTRAINT `fk_lessons_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_lessons_section` FOREIGN KEY (`section_id`) REFERENCES `course_sections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lessons`
--

LOCK TABLES `lessons` WRITE;
/*!40000 ALTER TABLE `lessons` DISABLE KEYS */;
INSERT INTO `lessons` VALUES (4,2,2,'Giß╗øi thiß╗çu MySQL','MySQL l├á hß╗ç quß║ún trß╗ï cãí sß╗ƒ dß╗» liß╗çu quan hß╗ç m├ú nguß╗ôn mß╗ƒ phß╗ò biß║┐n nhß║Ñt...',NULL,NULL,0,'active',1,'2026-04-14 19:44:21'),(5,2,2,'C├óu lß╗çnh SELECT','SELECT d├╣ng ─æß╗â truy vß║Ñn dß╗» liß╗çu tß╗½ mß╗Öt hoß║Àc nhiß╗üu bß║úng...',NULL,NULL,0,'active',2,'2026-04-14 19:44:21'),(9,6,8,'Bài 1: AI là gì','Trí tuệ nhân tạo (AI - Artificial Intelligence) là lĩnh vực trong khoa học máy tính tập trung vào việc xây dựng các hệ thống có khả năng thực hiện những nhiệm vụ mà trước đây cần đến trí thông minh của con người, như nhận diện hình ảnh, xử lý ngôn ngữ tự nhiên và ra quyết định.\r\n\r\nTrong bài học này, bạn sẽ hiểu được khái niệm cơ bản về AI, cách AI hoạt động và sự khác biệt giữa AI, Machine Learning và Deep Learning. Ngoài ra, bài học cũng giới thiệu các ứng dụng phổ biến của AI trong đời sống và công việc như chatbot, gợi ý sản phẩm và nhận diện khuôn mặt.','/uploads/videos/1777941317916-71176956.mp4',32,1,'active',1,'2026-05-05 07:35:17'),(10,6,9,'Bài 1: Cài đặt Python','qưeqưeqưe','/uploads/videos/1777941623850-103833391.mp4',32,0,'active',1,'2026-05-05 07:40:23'),(11,6,9,'Bài 2: Numpy, Pandas','Trong AI và Data Science, việc xử lý dữ liệu là bước cực kỳ quan trọng. Hai thư viện phổ biến nhất trong Python là NumPy và Pandas, giúp bạn làm việc với dữ liệu nhanh chóng và hiệu quả.\r\n\r\n🔹 NumPy là gì?\r\n\r\nNumPy (Numerical Python) là thư viện dùng để xử lý mảng số (array) và tính toán nhanh.\r\n\r\n👉 Ví dụ NumPy:\r\nimport numpy as np\r\n\r\n# Tạo mảng\r\narr = np.array([1, 2, 3, 4])\r\n\r\n# Nhân mảng với 2\r\nresult = arr * 2\r\n\r\nprint(result)\r\n\r\n👉 Kết quả:\r\n\r\n[2 4 6 8]\r\n👉 Giải thích:\r\nnp.array: tạo mảng\r\nNumPy cho phép tính toán nhanh hơn list Python\r\n🔹 Pandas là gì?\r\n\r\nPandas dùng để xử lý dữ liệu dạng bảng (giống Excel).\r\n\r\n👉 Ví dụ Pandas:\r\nimport pandas as pd\r\n\r\n# Tạo dữ liệu\r\ndata = {\r\n    \"Tên\": [\"An\", \"Bình\", \"Cường\"],\r\n    \"Điểm\": [8, 7, 9]\r\n}\r\n\r\ndf = pd.DataFrame(data)\r\n\r\nprint(df)\r\n\r\n👉 Kết quả:\r\n\r\n    Tên  Điểm\r\n0    An     8\r\n1  Bình     7\r\n2 Cường     9\r\n🔹 Xử lý dữ liệu với Pandas\r\nLọc dữ liệu:\r\n# Lấy sinh viên có điểm > 7\r\nfiltered = df[df[\"Điểm\"] > 7]\r\n\r\nprint(filtered)\r\nTính trung bình:\r\navg = df[\"Điểm\"].mean()\r\nprint(\"Điểm trung bình:\", avg)\r\n🔹 Ứng dụng trong AI\r\nLàm sạch dữ liệu\r\nPhân tích dữ liệu\r\nChuẩn bị dữ liệu trước khi train model\r\n🔹 Kết luận\r\n\r\nTrong bài học này, bạn đã:\r\n\r\nHiểu NumPy và Pandas là gì\r\nBiết cách tạo và xử lý dữ liệu\r\nÁp dụng vào các bài toán AI cơ bản\r\n\r\nỞ bài tiếp theo, bạn sẽ học cách trực quan hóa dữ liệu để hiểu dữ liệu tốt hơn.','/uploads/videos/1777947872237-422263431.mp4',32,0,'active',2,'2026-05-05 09:24:32'),(12,9,13,'Bài Mở Đầu Về Lập Trình C | Kiểu Dữ Liệu Và Vào Ra Trong Ngôn Ngữ Lập Trình C','00:00 : Hướng dẫn sử dụng Dev-C++ và cách chạy chương trình ngôn ngữ C\r\n09:18 : Các kiểu dữ liệu chính và đặc tả của chúng\r\n23:00 : Biến trong ngôn ngữ C, các quy tắc đặt tên biến\r\n33:35 : Nhập và xuất trong C với printf và scanf \r\n52:30 : Toán tử trong ngôn ngữ C : Toán tử toán học, toán tử so sánh, toán tử logic, toán tử gán, toán tử tăng giảm\r\n01:29:11 : Các hàm toán học thường dùng','/uploads/videos/1780907167100-552158280.mp4',NULL,0,'active',1,'2026-06-08 15:26:08'),(13,9,13,'Cấu Trúc Rẽ Nhánh Switch Case | Câu Lệnh GOTO','Nội dung video cung cấp kiến thức về Switch Case và câu lệnh GOTO:\r\n00:00 : Cấu trúc rẽ nhánh Switch Case\r\n12:00 : Câu lệnh goto trong C','/uploads/videos/1780907255276-981493403.mp4',NULL,0,'active',2,'2026-06-08 15:27:36');
/*!40000 ALTER TABLE `lessons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `materials`
--

DROP TABLE IF EXISTS `materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `materials` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lesson_id` int NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `material_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'document',
  `file_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `fk_materials_lesson` (`lesson_id`),
  CONSTRAINT `fk_materials_lesson` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `materials`
--

LOCK TABLES `materials` WRITE;
/*!40000 ALTER TABLE `materials` DISABLE KEYS */;
/*!40000 ALTER TABLE `materials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `course_id` int DEFAULT NULL,
  `total_amount` decimal(12,2) NOT NULL,
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `paid_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_payments_user` (`user_id`),
  KEY `fk_payments_course` (`course_id`),
  CONSTRAINT `fk_payments_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_payments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,4,1,500000.00,'bank_transfer','completed','2026-04-14 19:44:04'),(2,4,2,350000.00,'bank_transfer','completed','2026-04-14 19:44:04'),(3,5,1,500000.00,'momo','completed','2026-04-14 19:44:04'),(4,3,2,350000.00,'bank_transfer','completed','2026-04-14 21:53:41'),(5,3,1,500000.00,'bank_transfer','completed','2026-04-15 10:57:20'),(6,6,2,350000.00,'bank_transfer','completed','2026-04-23 23:10:01'),(7,6,1,500000.00,'bank_transfer','completed','2026-04-23 23:23:07'),(9,6,6,15000.00,'bank_transfer','completed','2026-04-24 01:25:39'),(10,8,6,15000.00,'bank_transfer','pending',NULL),(11,9,6,15000.00,'bank_transfer','pending',NULL),(12,8,2,350000.00,'bank_transfer','pending',NULL),(13,10,1,500000.00,'bank_transfer','pending',NULL),(14,11,2,10000.00,'bank_transfer','pending',NULL),(15,11,6,15000.00,'bank_transfer','completed','2026-04-24 20:42:38'),(17,12,6,15000.00,'bank_transfer','pending',NULL),(18,10,6,15000.00,'bank_transfer','pending',NULL),(19,14,2,10000.00,'bank_transfer','completed','2026-05-01 11:13:02'),(20,14,6,15000.00,'bank_transfer','completed','2026-05-01 11:16:28'),(21,15,2,10000.00,'bank_transfer','completed','2026-05-01 11:22:38'),(23,16,2,10000.00,'bank_transfer','pending',NULL),(24,17,6,10000.00,'bank_transfer','pending',NULL),(25,18,6,10000.00,'bank_transfer','pending',NULL),(27,19,7,900.00,'bank_transfer','pending',NULL),(28,19,1,10000.00,'bank_transfer','pending',NULL),(29,19,8,10000.00,'bank_transfer','pending',NULL),(30,13,6,9000.00,'bank_transfer','pending',NULL),(33,6,9,8000.00,'bank_transfer','completed','2026-06-08 13:47:32'),(34,21,9,10000.00,'bank_transfer','pending',NULL),(35,21,6,10000.00,'bank_transfer','pending',NULL),(36,6,10,10000.00,'bank_transfer','pending',NULL);
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `results`
--

DROP TABLE IF EXISTS `results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `results` (
  `id` int NOT NULL AUTO_INCREMENT,
  `submission_id` int NOT NULL,
  `score` decimal(5,2) DEFAULT NULL,
  `feedback` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_results_submission` (`submission_id`),
  CONSTRAINT `fk_results_submission` FOREIGN KEY (`submission_id`) REFERENCES `submissions` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `results`
--

LOCK TABLES `results` WRITE;
/*!40000 ALTER TABLE `results` DISABLE KEYS */;
/*!40000 ALTER TABLE `results` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'admin'),(2,'lecturer'),(3,'student');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `submissions`
--

DROP TABLE IF EXISTS `submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `submissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assignment_id` int NOT NULL,
  `student_id` int NOT NULL,
  `submitted_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `content` longtext COLLATE utf8mb4_unicode_ci,
  `answers_json` longtext COLLATE utf8mb4_unicode_ci,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'submitted',
  PRIMARY KEY (`id`),
  KEY `fk_submissions_student` (`student_id`),
  KEY `fk_submissions_assignment` (`assignment_id`),
  CONSTRAINT `fk_submissions_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_submissions_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `submissions`
--

LOCK TABLES `submissions` WRITE;
/*!40000 ALTER TABLE `submissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `submissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_id` int NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `headline` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_users_role` (`role_id`),
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','admin@gmail.com','$2a$10$MUH.3t6P0Wc75Jvpwba.jefoYbIllqNIfYXoIooSDQMAWY3ID9g56',1,'active','2026-04-14 07:23:33',NULL,NULL,NULL),(2,'Phạm Xuân Trung','teacher1@gmail.com','$2a$10$MUH.3t6P0Wc75Jvpwba.jefoYbIllqNIfYXoIooSDQMAWY3ID9g56',2,'active','2026-04-14 07:23:33','/uploads/avatars/1781578237212-134697202.jpg','4 năm kinh nghiệm lập trình','Học đại học Bách khoa'),(3,'Lê Văn Luyện','student1@gmail.com','$2a$10$MUH.3t6P0Wc75Jvpwba.jefoYbIllqNIfYXoIooSDQMAWY3ID9g56',3,'active','2026-04-14 07:23:33',NULL,NULL,NULL),(4,'Phạm Thị Học Viên 2','student2@gmail.com','$2a$10$MUH.3t6P0Wc75Jvpwba.jefoYbIllqNIfYXoIooSDQMAWY3ID9g56',3,'active','2026-04-14 07:23:33',NULL,NULL,NULL),(5,'Hoàng Văn Học Viên 3','student3@gmail.com','$2a$10$MUH.3t6P0Wc75Jvpwba.jefoYbIllqNIfYXoIooSDQMAWY3ID9g56',3,'active','2026-04-14 07:23:33',NULL,NULL,NULL),(6,'Nguyễn Huy Tỏa','huytoa3@gmail.com','$2a$10$MUH.3t6P0Wc75Jvpwba.jefoYbIllqNIfYXoIooSDQMAWY3ID9g56',3,'active','2026-04-15 10:31:34',NULL,NULL,NULL),(7,'Nguyễn Văn Test','student_test@gmail.com','$2a$10$vihrRz9DWV6EAK0urxWYkOU51cJX57BqtfjCc2Nz9oJ//Vpq53daS',3,'active','2026-04-20 18:55:18',NULL,NULL,NULL),(8,'coganglen','zaidepok973@gmail.com','$2a$10$9ycl8HKCOghi94qZ.4sO2espzUdybqIdeL6udTUzmYTuClXmjhB9O',3,'active','2026-04-24 01:33:20',NULL,NULL,NULL),(9,'Test Student','test99@gmail.com','$2a$10$gQqWYwYcPsfLPsvQdHcSbOGOnrr.xCnAcWxGTLvRXPGFJtQpFRhgG',3,'active','2026-04-24 01:40:03',NULL,NULL,NULL),(10,'Trường','truong@gmail.com','$2a$10$aWoYOIo0I61ujaDSPepLmumkj8LMSr8WNk1UIdeJv6LMMKQXlXwRi',3,'active','2026-04-24 09:28:34',NULL,NULL,NULL),(11,'hong','hong@gmail.com','$2a$10$xKc4xQB54wU3OAxXB2H7y.3O9WSUE/KTVA.eDMYvTnCkoRkAH4iTu',3,'active','2026-04-24 16:03:42',NULL,NULL,NULL),(12,'truong','truong1@gmail.com','$2a$10$ZGe6sytG1niHa/rYIb2zRO1JPxXST4/08cQmAQAguZmSMnRaICmp6',3,'active','2026-04-28 22:41:30',NULL,NULL,NULL),(13,'Phạm Xuân Trung','trung@gmail.com','$2a$10$K4pdBcW1//v/OVBTLMCLq.lUDCZgNNHDxiaRMYcQG5f/U4QzOXUai',3,'active','2026-04-30 20:49:53',NULL,NULL,NULL),(14,'Nha','nha@gmail.com','$2a$10$Gzn6Z5yJsS0.w3reSQTQ1.p3ssKdeWALjZ3G3OB7M9pqzHfVpmQLW',3,'active','2026-05-01 10:42:57',NULL,NULL,NULL),(15,'hongthianh','hongthianh@gmail.com','$2a$10$Q00pOwUX/Vgizn2YmhDQ0OdobzaomCzXa3GSCHr2/D3yZo9HrxDBG',3,'active','2026-05-01 11:20:57',NULL,NULL,NULL),(16,'dohainam','namhai@gmail.com','$2a$10$URGtYqRtHGb3RU/.BWgmFurJCOkrxrygbMt9Qd/.VFUuEWmnxQL6W',3,'active','2026-05-04 12:02:40',NULL,NULL,NULL),(17,'thaycuong','thaycuong@gmail.com','$2a$10$PhNHYgbKzyVmBB4TfNtPgOqvoIU/uRUb0BcWnvw/AyOArj4TMJlEC',3,'active','2026-05-05 07:36:28',NULL,NULL,NULL),(18,'user','user@gmail.com','$2a$10$MqUbXOSNN67XBNdRNuIZg.8sQTFQ27LT38mGFJgrfuUa67eQeIQaG',3,'active','2026-05-05 08:00:32',NULL,NULL,NULL),(19,'van','van@gmail.com','$2a$10$ufeso6E0c8xi/jJH4twhaOC9JIEc434uIVPwSmbqH5yusO0BgvEYe',3,'active','2026-05-19 07:07:34',NULL,NULL,NULL),(20,'Đỗ Oanh Cường','teacher2@gmail.com','$2a$10$u48OWGzeMfE7ezk.chcJKOgD6Zusm/cx0Eq5SA6HAWUyWVKIMi9qW',2,'active','2026-05-25 23:18:08','/uploads/avatars/1781579074709-3909536.jpg',NULL,NULL),(21,'dd','ddddty@gmail.com','$2a$10$P0K1QryDvwZ7I9LhXIMxfe.Un.oJskuw7FbYePX7/YQOqV4dq/Wg2',3,'active','2026-06-06 08:47:12',NULL,NULL,NULL),(22,'Lê Thị Tú Kiên','teacher3@gmail.com','$2a$10$oWyTQbTj6cSpmOjW9aatU.tbC9tf5.mNIcrM0o1bx373F/9hkNjKK',2,'active','2026-06-12 11:56:54',NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `voucher_courses`
--

DROP TABLE IF EXISTS `voucher_courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `voucher_courses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `voucher_id` int NOT NULL,
  `course_id` int NOT NULL,
  `discount_percent` decimal(5,2) NOT NULL,
  `max_discount_amount` decimal(12,2) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_voucher_course` (`voucher_id`,`course_id`),
  KEY `fk_voucher_courses_course` (`course_id`),
  CONSTRAINT `fk_voucher_courses_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_voucher_courses_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `voucher_courses`
--

LOCK TABLES `voucher_courses` WRITE;
/*!40000 ALTER TABLE `voucher_courses` DISABLE KEYS */;
INSERT INTO `voucher_courses` VALUES (4,1,6,10.00,NULL,1),(5,1,7,10.00,NULL,1),(7,2,9,20.00,NULL,1);
/*!40000 ALTER TABLE `voucher_courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `voucher_usages`
--

DROP TABLE IF EXISTS `voucher_usages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `voucher_usages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `voucher_id` int NOT NULL,
  `payment_id` int NOT NULL,
  `user_id` int NOT NULL,
  `course_id` int NOT NULL,
  `discount_percent` decimal(5,2) NOT NULL,
  `original_amount` decimal(12,2) NOT NULL,
  `discount_amount` decimal(12,2) NOT NULL,
  `final_amount` decimal(12,2) NOT NULL,
  `used_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_voucher_usage_payment` (`payment_id`),
  KEY `fk_voucher_usages_voucher` (`voucher_id`),
  KEY `fk_voucher_usages_user` (`user_id`),
  KEY `fk_voucher_usages_course` (`course_id`),
  CONSTRAINT `fk_voucher_usages_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_voucher_usages_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_voucher_usages_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_voucher_usages_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `voucher_usages`
--

LOCK TABLES `voucher_usages` WRITE;
/*!40000 ALTER TABLE `voucher_usages` DISABLE KEYS */;
INSERT INTO `voucher_usages` VALUES (3,1,27,19,7,10.00,1000.00,100.00,900.00,'2026-05-19 07:41:47'),(4,1,30,13,6,10.00,10000.00,1000.00,9000.00,'2026-05-19 09:51:25'),(6,2,33,6,9,20.00,10000.00,2000.00,8000.00,'2026-06-08 13:46:16');
/*!40000 ALTER TABLE `voucher_usages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vouchers`
--

DROP TABLE IF EXISTS `vouchers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vouchers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mode` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `min_order_amount` decimal(12,2) DEFAULT NULL,
  `new_student_days` int DEFAULT NULL,
  `starts_at` datetime DEFAULT NULL,
  `ends_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_vouchers_code` (`code`),
  KEY `fk_vouchers_created_by` (`created_by`),
  CONSTRAINT `fk_vouchers_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vouchers`
--

LOCK TABLES `vouchers` WRITE;
/*!40000 ALTER TABLE `vouchers` DISABLE KEYS */;
INSERT INTO `vouchers` VALUES (1,'Học viên mới đăng kí','SHA111','event',NULL,'inactive',NULL,NULL,'2026-05-19 07:06:00','2026-05-20 07:06:00',1,'2026-05-19 07:06:41','2026-05-26 09:02:08'),(2,'tri ân','DATN11','event','111','active',NULL,NULL,NULL,NULL,1,'2026-05-19 09:54:52','2026-05-19 09:54:52');
/*!40000 ALTER TABLE `vouchers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'elearning_ai'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-16 10:52:56
