const materialsRepo = require('../repositories/materials.repository');
const lessonsService = require('../services/lessons.service');
const enrollRepo = require('../repositories/enrollments.repository');
const coursesRepo = require('../repositories/courses.repository');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// Lecturer chi duoc quan ly hoc lieu cua khoa hoc minh phu trach (admin bo qua)
const ensureLecturerOwnsLesson = async (req, res, lesson) => {
  if (req.user.role_name !== 'lecturer') return true;
  const course = await coursesRepo.findById(lesson.course_id);
  if (!course || course.lecturer_id !== req.user.id) {
    ApiResponse.forbidden(res, 'Bạn không có quyền quản lý học liệu của khóa học này');
    return false;
  }
  return true;
};

const getByLesson = asyncHandler(async (req, res) => {
  const lesson = await lessonsService.getById(req.params.lessonId);
  if (req.user?.role_name === 'student') {
    const enrollment = await enrollRepo.findByUserAndCourse(req.user.id, lesson.course_id);
    const isPreview = lesson.is_preview === 1 || lesson.section_is_preview === 1;

    if (enrollment?.is_preserved) {
      return ApiResponse.forbidden(res, 'Khóa học đang bảo lưu. Vui lòng mở lại khóa học để tiếp tục học.');
    }

    if (enrollment?.access_status !== 'active' && !isPreview) {
      return ApiResponse.forbidden(res, 'Bạn cần đăng ký khóa học để xem tài liệu này.');
    }
  }
  const data = await materialsRepo.findByLesson(req.params.lessonId);
  return ApiResponse.success(res, data);
});

const upload = asyncHandler(async (req, res) => {
  if (!req.file) {
    return ApiResponse.error(res, 'Vui lòng chọn file để tải lên', 400);
  }
  const lesson = await lessonsService.getById(req.params.lessonId);
  if (!(await ensureLecturerOwnsLesson(req, res, lesson))) return;
  const material = await materialsRepo.create({
    lesson_id: req.params.lessonId,
    file_name: req.file.originalname,
    file_type: req.file.mimetype,
    material_type: req.body.material_type || 'document',
    file_url: `/uploads/materials/${req.file.filename}`,
    sort_order: req.body.sort_order || 1,
  });
  const data = await materialsRepo.findById(material);
  return ApiResponse.created(res, data, 'Tải tài liệu lên thành công');
});

const remove = asyncHandler(async (req, res) => {
  const material = await materialsRepo.findById(req.params.id);
  if (!material) return ApiResponse.notFound(res, 'Tài liệu không tồn tại');
  const lesson = await lessonsService.getById(material.lesson_id);
  if (!(await ensureLecturerOwnsLesson(req, res, lesson))) return;
  await materialsRepo.remove(req.params.id);
  return ApiResponse.success(res, null, 'Xóa tài liệu thành công');
});

module.exports = { getByLesson, upload, remove };
