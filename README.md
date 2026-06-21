# Hệ thống E-Learning AI

Đồ án tốt nghiệp xây dựng hệ thống học trực tuyến tích hợp AI hỏi đáp, lộ trình học cá nhân, quản lý khóa học, bài tập, thanh toán và voucher.

- Sinh viên: Nguyễn Huy Tỏa - Lớp 64 HTTT3
- GVHD: TS. Đỗ Oanh Cường
- Repository: `https://github.com/otisbrother/CODE_DATN`

## Tính Năng Chính

### Public

- Trang chủ giới thiệu khóa học đang xuất bản.
- Chatbot tư vấn khóa học, gợi ý khóa học liên quan và voucher phù hợp.
- Xem trang khuyến mãi/voucher công khai.
- Xem hồ sơ giáo viên và các khóa học của giáo viên.
- Đăng nhập/đăng ký tài khoản, hỗ trợ đăng nhập Google nếu cấu hình OAuth.

### Học Viên

- Đăng ký khóa học, thanh toán bằng chuyển khoản ngân hàng/VietQR/SePay.
- Áp mã voucher khi mua khóa học.
- Theo dõi khóa học đã đăng ký, trạng thái thanh toán, thời hạn học và bảo lưu khóa học.
- Học bài theo chương/bài, xem video và ghi nhận hoàn thành bài học.
- Làm bài tập thủ công, quiz, tự luận, bài code tự chấm và test cuối khóa có đếm giờ.
- Xem điểm, bài nộp và tiến độ học tập.
- Đánh giá khóa học sau khi hoàn thành.
- Sử dụng trợ lý AI học tập theo nội dung bài học, tạo lộ trình học cá nhân.
- Lập lịch học cá nhân, lưu lịch và nhận thông báo nhắc học.

### Giáo Viên

- Quản lý khóa học, ảnh đại diện khóa học, video giới thiệu, thời hạn học.
- Quản lý chương, bài học, tài liệu và video bài học.
- Tạo bài tập thủ công, quiz, tự luận, bài code tự chấm và test cuối khóa.
- Xem/chấm bài nộp của học viên.
- Theo dõi tiến độ học viên theo từng khóa học.
- Quản lý dữ liệu AI cho khóa học, gồm dữ liệu giải thích và dữ liệu lộ trình học.
- Test AI học tập bằng câu hỏi mẫu trước khi học viên sử dụng.
- Cập nhật hồ sơ giáo viên: avatar, headline, bio.
- Xem phản hồi điểm thấp để cải thiện khóa học.

### Quản Trị Viên

- Dashboard thống kê người dùng, khóa học, doanh thu, ghi danh, tiến độ và lượng sử dụng AI.
- Quản lý người dùng, tạo tài khoản giáo viên, khóa tài khoản học viên/giáo viên.
- Giám sát khóa học và xem phản hồi/đánh giá khóa học.
- Quản lý voucher theo khóa học, điều kiện áp dụng và thời gian hiệu lực.
- Xem lịch sử thanh toán, voucher đã dùng và trạng thái giao dịch.
- Xem tiến độ học tập toàn hệ thống.

## Công Nghệ

| Lớp | Công nghệ |
|-----|-----------|
| Frontend | React, Vite, React Router, Axios, Zustand, React Icons |
| Backend | Node.js, Express, JWT, Multer, bcryptjs, Nodemailer |
| Database | MySQL 8.0 |
| AI | Gemini API, AI data source theo khóa học, fallback rule-based cho chatbot |
| Thanh toán | Chuyển khoản ngân hàng, VietQR, SePay webhook |

## Yêu Cầu Môi Trường

- Node.js 18+.
- MySQL 8.0+.
- npm.
- Tài khoản Gemini API nếu muốn dùng đầy đủ chức năng AI.
- Tài khoản/ngân hàng và webhook secret nếu muốn test SePay tự động.

## Cài Đặt Nhanh

### 1. Clone source

```bash
git clone https://github.com/otisbrother/CODE_DATN.git
cd CODE_DATN
```

Nếu đang dùng workspace hiện tại thì bỏ qua bước clone.

### 2. Tạo database

Với database mới:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p elearning_ai < database/seed_roles.sql
mysql -u root -p elearning_ai < database/seed_users.sql
mysql -u root -p elearning_ai < database/seed_courses.sql
mysql -u root -p elearning_ai < database/seed_sections.sql
mysql -u root -p elearning_ai < database/seed_lessons.sql
mysql -u root -p elearning_ai < database/seed_assignments.sql
mysql -u root -p elearning_ai < database/seed_ai_data.sql
```

Sau khi import seed user, chạy script backend để cập nhật hash mật khẩu bcrypt đúng:

```bash
cd backend
npm install
npm run seed
```

Nếu database đã có dữ liệu cũ, đọc thêm `database/README_DATABASE_UPDATE.md` và dùng các file migration trong thư mục `database/`.

### 3. Cấu hình backend

Tạo file `backend/.env`:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=elearning_ai

JWT_SECRET=change_me
JWT_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
GEMINI_LEARNING_MODEL=

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=E-Learning AI <noreply@elearning.com>

ADMIN_BANK_NAME=MB
ADMIN_BANK_BIN=970422
ADMIN_BANK_ACCOUNT_NO=0395256163
ADMIN_BANK_ACCOUNT_NAME=NGUYEN HUY TOA
SEPAY_WEBHOOK_SECRET=
BANK_WEBHOOK_SECRET=
```

Chạy backend:

```bash
cd backend
npm install
npm run dev
```

Backend mặc định chạy tại `http://localhost:5000`.

### 4. Cấu hình frontend

Tạo file `frontend/.env` theo `frontend/.env.example`:

```env
VITE_API_URL=/api
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```

Chạy frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend mặc định chạy tại `http://localhost:5173`.

## Tài Khoản Mẫu

Tất cả tài khoản seed dùng mật khẩu `123456` sau khi chạy `npm run seed` trong backend.

| Vai trò | Email |
|---------|-------|
| Admin | `admin@elearning.vn` |
| Giáo viên | `lecturer1@elearning.vn` |
| Giáo viên | `lecturer2@elearning.vn` |
| Học viên | `student1@elearning.vn` |
| Học viên | `student2@elearning.vn` |
| Học viên | `student3@elearning.vn` |

## Cấu Trúc Dự Án

```text
Elearning/
|-- backend/
|   |-- src/
|   |   |-- config/        # Cấu hình DB, env
|   |   |-- controllers/   # Xử lý request
|   |   |-- middlewares/   # Auth, role, upload, error
|   |   |-- repositories/  # Truy vấn MySQL
|   |   |-- routes/        # Khai báo API routes
|   |   |-- services/      # Nghiệp vụ
|   |   |-- utils/         # Response helper
|   |   |-- validators/    # Validate request
|   |   |-- app.js
|   |   |-- server.js
|   |   `-- seed.js
|   `-- uploads/           # File upload local, không commit
|-- frontend/
|   |-- src/
|   |   |-- components/    # Component dùng chung, chatbot, AI widget, chart
|   |   |-- layouts/       # Dashboard layout
|   |   |-- pages/         # Trang public, student, lecturer, admin
|   |   |-- services/      # Axios service
|   |   `-- store/         # Zustand auth store
|-- database/              # Schema, seed, migration, DBML
|-- docs/                  # UML/use case và tài liệu phụ trợ
`-- README.md
```

## API Chính

Tất cả endpoint backend có tiền tố `/api`.

| Module | Endpoint chính | Quyền |
|--------|----------------|-------|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/google`, `GET /auth/profile` | Public/Auth |
| Users | `GET /users`, `POST /users/lecturers`, `PUT /users/:id`, `DELETE /users/:id` | Admin |
| Lecturers | `GET /lecturers`, `GET /lecturers/:id`, `GET/PUT /lecturers/me/profile` | Public/Giáo viên |
| Courses | `GET /courses`, `GET /courses/:id`, `POST/PUT/DELETE /courses` | Public/Giáo viên/Admin |
| Lessons | `GET /lessons/:id`, CRUD lesson/material/section liên quan | Giáo viên/Admin/Học viên |
| Assignments | `GET /assignments/course/:courseId`, CRUD assignment, `POST /assignments/submit`, `POST /assignments/grade` | Học viên/Giáo viên/Admin |
| Enrollments | `POST /enrollments`, `GET /enrollments/my`, `POST /enrollments/preserve/:courseId`, `POST /enrollments/resume/:courseId` | Học viên |
| Payments | `GET /payments/my`, `GET /payments`, `GET /payments/:paymentId/status`, `POST /payments/bank-webhook` | Học viên/Admin/SePay |
| Vouchers | Public promotions, preview voucher, CRUD voucher | Public/Học viên/Admin |
| Reviews | Course reviews, trending, feedback điểm thấp | Public/Học viên/Giáo viên/Admin |
| Progress | `GET /progress/my`, `POST /progress/complete-lesson`, `GET /progress/course/:courseId`, `GET /progress/all` | Học viên/Giáo viên/Admin |
| AI data | `GET /ai/data/course/:courseId`, `POST/PUT/DELETE /ai/data/:id` | Giáo viên/Admin |
| AI chat | `POST /ai/learning-assistant/qa`, `POST /ai/learning-assistant/path`, schedule saved APIs | Học viên |
| Chatbot | `POST /chatbot/ask` | Public |
| Admin stats | `GET /admin/stats` | Admin |

## Thanh Toán SePay

Backend có endpoint webhook:

```text
POST /api/payments/bank-webhook
```

Khi cấu hình SePay/ngrok, đặt `SEPAY_WEBHOOK_SECRET` trong `backend/.env` và cấu hình header secret tương ứng trên SePay. Xem thêm `SEPAY_NGROK_SETUP.md`.

## Kiểm Tra Build

```bash
cd frontend
npm run build
```

```bash
cd backend
npm start
```

## Lưu Ý Khi Commit

- Không commit `node_modules/`, `.env`, `uploads/`, `dist/`.
- Không commit file local như `ngrok.exe`, PowerShell cache hoặc cấu hình IDE cá nhân.
- Database production nên cập nhật bằng migration thay vì import lại `schema.sql` nếu đã có dữ liệu.
