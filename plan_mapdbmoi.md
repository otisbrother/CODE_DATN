# Map New Database Schema to E-Learning System

Cập nhật toàn bộ hệ thống (backend + frontend) để phù hợp với schema DB mới, bao gồm:
- **`course_sections`** — bảng mới (chương/section)
- **`courses`** — thêm `thumbnail_url`, `intro_video_url`, `short_description`
- **`lessons`** — thêm `section_id` (NOT NULL), `video_url`, `duration_seconds`, `is_preview`, `status`; đổi unique từ `(course_id, lesson_order)` → `(section_id, lesson_order)`
- **`assignments`** — thêm `section_id` (NOT NULL), `status`
- **`materials`** — thêm `material_type`, `sort_order`

## Proposed Changes

### 1. Database — schema.sql update

#### [MODIFY] [schema.sql](file:///c:/Users/huyto/Downloads/DATN/Elearning/database/schema.sql)
- Cập nhật toàn bộ schema để khớp với DB mới
- Thêm bảng `course_sections`
- Thêm các cột mới cho `courses`, `lessons`, `assignments`, `materials`
- Cập nhật FK và UNIQUE constraints

---

### 2. Database — seed data update

#### [MODIFY] [seed_courses.sql](file:///c:/Users/huyto/Downloads/DATN/Elearning/database/seed_courses.sql)
- Thêm các cột mới `thumbnail_url`, `intro_video_url`, `short_description`

#### [NEW] [seed_sections.sql](file:///c:/Users/huyto/Downloads/DATN/Elearning/database/seed_sections.sql)
- Seed data cho bảng `course_sections`

#### [MODIFY] [seed_lessons.sql](file:///c:/Users/huyto/Downloads/DATN/Elearning/database/seed_lessons.sql)
- Thêm `section_id`, `video_url`, `duration_seconds`, `is_preview`, `status`

#### [MODIFY] [seed_assignments.sql](file:///c:/Users/huyto/Downloads/DATN/Elearning/database/seed_assignments.sql)
- Thêm `section_id`, `status`

---

### 3. Backend — New `course_sections` module

#### [NEW] [sections.repository.js](file:///c:/Users/huyto/Downloads/DATN/Elearning/backend/src/repositories/sections.repository.js)
- CRUD cho `course_sections`: `findByCourse`, `findById`, `create`, `update`, `remove`, `reorder`

#### [NEW] [sections.controller.js](file:///c:/Users/huyto/Downloads/DATN/Elearning/backend/src/controllers/sections.controller.js)
- Handlers: `getByCourse`, `getById`, `create`, `update`, `remove`

#### [NEW] [sections.routes.js](file:///c:/Users/huyto/Downloads/DATN/Elearning/backend/src/routes/sections.routes.js)
- Routes: `GET /sections/course/:courseId`, `GET /sections/:id`, `POST /sections`, `PUT /sections/:id`, `DELETE /sections/:id`

#### [MODIFY] [index.js](file:///c:/Users/huyto/Downloads/DATN/Elearning/backend/src/routes/index.js)
- Đăng ký route mới: `router.use('/sections', sectionsRoutes)`

---

### 4. Backend — Update `courses` module

#### [MODIFY] [courses.repository.js](file:///c:/Users/huyto/Downloads/DATN/Elearning/backend/src/repositories/courses.repository.js)
- `create()`: thêm `thumbnail_url`, `intro_video_url`, `short_description`
- `update()`: thêm xử lý cho 3 cột mới
- `findAll()`, `findById()`: các cột mới sẽ tự được trả về nhờ `SELECT c.*`
- `remove()`: thêm `DELETE FROM course_sections WHERE course_id = ?` vào cascade chain

---

### 5. Backend — Update `lessons` module

#### [MODIFY] [lessons.repository.js](file:///c:/Users/huyto/Downloads/DATN/Elearning/backend/src/repositories/lessons.repository.js)
- `create()`: thêm `section_id`, `video_url`, `duration_seconds`, `is_preview`, `status`
- `update()`: thêm xử lý cho các cột mới
- `findByCourse()`: thêm `section_id` (vẫn ORDER BY `lesson_order`)
- Thêm `findBySection(sectionId)` — lấy lessons theo section

#### [MODIFY] [lessons.service.js](file:///c:/Users/huyto/Downloads/DATN/Elearning/backend/src/services/lessons.service.js)
- `create()`: yêu cầu `section_id`, validate section thuộc course

---

### 6. Backend — Update `assignments` module

#### [MODIFY] [assignments.repository.js](file:///c:/Users/huyto/Downloads/DATN/Elearning/backend/src/repositories/assignments.repository.js)
- `createAssignment()`: thêm `section_id`, `status`
- `updateAssignment()`: thêm xử lý cho `section_id`, `status`

---

### 7. Backend — Update `materials` module

#### [MODIFY] [materials.repository.js](file:///c:/Users/huyto/Downloads/DATN/Elearning/backend/src/repositories/materials.repository.js)
- `create()`: thêm `material_type`, `sort_order`
- `findByLesson()`: ORDER BY `sort_order ASC`

#### [MODIFY] [materials.controller.js](file:///c:/Users/huyto/Downloads/DATN/Elearning/backend/src/controllers/materials.controller.js)
- `upload()`: xử lý `material_type` từ request body, set `sort_order`

---

### 8. Frontend — New `section.service.js`

#### [NEW] [section.service.js](file:///c:/Users/huyto/Downloads/DATN/Elearning/frontend/src/services/section.service.js)
- API calls: `getByCourse`, `getById`, `create`, `update`, `remove`

---

### 9. Frontend — Update Lecturer Pages

#### [MODIFY] [ManageCoursesPage.jsx](file:///c:/Users/huyto/Downloads/DATN/Elearning/frontend/src/pages/lecturer/ManageCoursesPage.jsx)
- Form thêm/sửa: thêm fields `short_description`, `thumbnail_url`, `intro_video_url`

#### [MODIFY] [CourseFormPage.jsx](file:///c:/Users/huyto/Downloads/DATN/Elearning/frontend/src/pages/lecturer/CourseFormPage.jsx)
- Form thêm/sửa: thêm fields `short_description`, `thumbnail_url`, `intro_video_url`

#### [MODIFY] [ManageLessonsPage.jsx](file:///c:/Users/huyto/Downloads/DATN/Elearning/frontend/src/pages/lecturer/ManageLessonsPage.jsx)
- Tổ chức UI theo sections: hiển thị sections → mỗi section hiện danh sách lessons
- Form thêm/sửa lesson: thêm `section_id` (dropdown), `video_url`, `duration_seconds`, `is_preview`, `status`
- Thêm UI quản lý sections (tạo/sửa/xóa section)

#### [MODIFY] [ManageAssignmentsPage.jsx](file:///c:/Users/huyto/Downloads/DATN/Elearning/frontend/src/pages/lecturer/ManageAssignmentsPage.jsx)
- Form thêm/sửa: thêm `section_id` (dropdown), `status`
- Tổ chức hiển thị theo sections

---

### 10. Frontend — Update Student Pages

#### [MODIFY] [CourseDetailPage.jsx](file:///c:/Users/huyto/Downloads/DATN/Elearning/frontend/src/pages/student/CourseDetailPage.jsx)
- Hiển thị nội dung khóa học theo sections
- Hiển thị thumbnail, short_description, intro_video_url
- Đánh dấu lessons/assignments có `is_preview` 

#### [MODIFY] [LessonLearningPage.jsx](file:///c:/Users/huyto/Downloads/DATN/Elearning/frontend/src/pages/student/LessonLearningPage.jsx)
- Hiển thị video nếu có `video_url`
- Hiển thị `material_type` cho tài liệu

---

## Verification Plan

### Automated Tests
- Chạy `node src/server.js` — server start không lỗi
- Test API endpoints qua curl/browser:
  - `GET /api/sections/course/1` — trả về sections
  - `POST /api/sections` — tạo section mới
  - `GET /api/courses` — courses có 3 cột mới
  - `POST /api/lessons` — tạo lesson với `section_id`
  - `POST /api/assignments` — tạo assignment với `section_id`

### Manual Verification
- Dùng browser kiểm tra các trang lecturer/student hoạt động đúng
- Verify seed SQL chạy không lỗi trên DB mới
