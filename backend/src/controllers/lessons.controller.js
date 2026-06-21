const lessonsService = require('../services/lessons.service');
const materialsRepo = require('../repositories/materials.repository');
const enrollRepo = require('../repositories/enrollments.repository');
const coursesRepo = require('../repositories/courses.repository');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const isLessonPreview = (lesson) =>
  lesson.is_preview === 1 || lesson.section_is_preview === 1;

const getByCourse = asyncHandler(async (req, res) => {
  const courseId = req.params.courseId;
  const data = await lessonsService.getByCourse(courseId);

  // Xac dinh quyen xem noi dung day du
  let fullAccess = false;
  if (req.user) {
    if (req.user.role_name === 'admin') {
      fullAccess = true;
    } else if (req.user.role_name === 'lecturer') {
      const course = await coursesRepo.findById(courseId);
      fullAccess = !!course && course.lecturer_id === req.user.id;
    } else if (req.user.role_name === 'student') {
      const enrollment = await enrollRepo.findByUserAndCourse(req.user.id, courseId);
      fullAccess = enrollment?.access_status === 'active' && !enrollment.is_preserved;
    }
  }

  // Khong co quyen day du -> chi tra metadata, an video_url/content cua bai khong preview
  const result = data.map((lesson) => {
    if (fullAccess || isLessonPreview(lesson)) return lesson;
    const { video_url, content, ...meta } = lesson;
    return { ...meta, locked: true };
  });

  return ApiResponse.success(res, result);
});

const getById = asyncHandler(async (req, res) => {
  const lesson = await lessonsService.getById(req.params.id);
  if (req.user?.role_name === 'student') {
    const enrollment = await enrollRepo.findByUserAndCourse(req.user.id, lesson.course_id);
    const isPreview = lesson.is_preview === 1 || lesson.section_is_preview === 1;

    if (enrollment?.is_preserved) {
      return ApiResponse.forbidden(res, 'Khóa học đang bảo lưu. Vui lòng mở lại khóa học để tiếp tục học.');
    }

    if (enrollment?.access_status !== 'active' && !isPreview) {
      return ApiResponse.forbidden(res, 'Bạn cần đăng ký khóa học để xem bài học này.');
    }
  }
  const materials = await materialsRepo.findByLesson(req.params.id);
  return ApiResponse.success(res, { ...lesson, materials });
});

const create = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  // Handle video file upload
  if (req.file) {
    data.video_url = `/uploads/videos/${req.file.filename}`;
  }
  const lesson = await lessonsService.create(data, req.user.id, req.user.role_name);
  return ApiResponse.created(res, lesson, 'Tạo bài học thành công');
});

const update = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  // Handle video file upload
  if (req.file) {
    data.video_url = `/uploads/videos/${req.file.filename}`;
  }
  const lesson = await lessonsService.update(req.params.id, data, req.user.id, req.user.role_name);
  return ApiResponse.success(res, lesson, 'Cập nhật bài học thành công');
});

const remove = asyncHandler(async (req, res) => {
  await lessonsService.remove(req.params.id, req.user.id, req.user.role_name);
  return ApiResponse.success(res, null, 'Xóa bài học thành công');
});

module.exports = { getByCourse, getById, create, update, remove };
