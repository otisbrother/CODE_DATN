# 🎓 Hệ thống E-learning tích hợp AI hỏi đáp

**Đồ án tốt nghiệp** — Trường Đại học Thủy Lợi  
**Sinh viên:** Nguyễn Huy Tỏa — Lớp 64 HTTT3  
**GVHD:** TS. Đỗ Oanh Cường

## Công nghệ
- **Frontend:** ReactJS + Vite + React Router + Axios + Zustand
- **Backend:** NodeJS + Express + JWT + Multer
- **Database:** MySQL 8.0
- **AI:** Mock AI (tích hợp OpenAI sau)

## Cài đặt

### 1. Database
```bash
mysql -u root -p123456 < database/schema.sql
mysql -u root -p123456 elearning_ai < database/seed_roles.sql
mysql -u root -p123456 elearning_ai < database/seed_users.sql
mysql -u root -p123456 elearning_ai < database/seed_courses.sql
mysql -u root -p123456 elearning_ai < database/seed_lessons.sql
mysql -u root -p123456 elearning_ai < database/seed_assignments.sql
mysql -u root -p123456 elearning_ai < database/seed_ai_data.sql
```

### 2. Backend
```bash
cd backend
npm install
node src/seed.js    # Cập nhật mật khẩu hash
npm run dev         # Chạy tại http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev         # Chạy tại http://localhost:5173
```

## Tài khoản test
| Vai trò | Email | Mật khẩu |
|---------|-------|-----------|
| Admin | admin@gmail.com | 123456 |
| Giảng viên | teacher1@gmail.com | 123456 |
| Học viên | student1@gmail.com | 123456 |

## Cấu trúc dự án
```
Elearning/
├── database/           # SQL schema + seed data
├── backend/
│   └── src/
│       ├── config/     # DB, JWT, env config
│       ├── constants/  # Role, status constants
│       ├── controllers/# Request handlers
│       ├── middlewares/ # Auth, role, error, upload
│       ├── repositories/# Database queries
│       ├── routes/     # API routes
│       ├── services/   # Business logic
│       └── utils/      # Response helpers
├── frontend/
│   └── src/
│       ├── layouts/    # Dashboard layout
│       ├── pages/      # Auth, Student, Lecturer, Admin pages
│       ├── router/     # Protected routes
│       ├── services/   # API client + services
│       └── store/      # Zustand auth store
└── README.md
```

## API Endpoints
| Module | Method | Endpoint | Quyền |
|--------|--------|----------|-------|
| Auth | POST | /api/auth/register | Public |
| Auth | POST | /api/auth/login | Public |
| Auth | GET | /api/auth/profile | Auth |
| Users | GET/PUT/DELETE | /api/users | Admin |
| Courses | CRUD | /api/courses | Lecturer/Admin |
| Enrollments | POST /api/enrollments | Student |
| Enrollments | GET | /api/enrollments/my | Student |
| Lessons | CRUD | /api/lessons | Lecturer/Admin |
| Materials | POST | /api/lessons/:id/materials | Lecturer |
| Assignments | CRUD | /api/assignments | Lecturer/Admin |
| Submissions | POST | /api/assignments/submit | Student |
| Grading | POST | /api/assignments/grade | Lecturer |
| Progress | GET | /api/progress/my | Student |
| AI Data | POST | /api/ai/data | Lecturer |
| AI Approve | PUT | /api/ai/data/:id/approve | Admin |
| AI Chat | POST | /api/ai/chat | Student |
