const progressRepo = require('../repositories/progress.repository');
const enrollRepo = require('../repositories/enrollments.repository');
const coursesRepo = require('../repositories/courses.repository');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getMyProgress = asyncHandler(async (req, res) => {
  const data = await progressRepo.findByStudent(req.user.id);
  return ApiResponse.success(res, data);
});

const getCourseProgress = asyncHandler(async (req, res) => {
  // Lecturer chi xem tien do hoc vien cua khoa hoc minh phu trach (admin bo qua)
  if (req.user.role_name === 'lecturer') {
    const course = await coursesRepo.findById(req.params.courseId);
    if (!course) return ApiResponse.notFound(res, 'Khóa học không tồn tại');
    if (course.lecturer_id !== req.user.id) {
      return ApiResponse.forbidden(res, 'Bạn không có quyền xem tiến độ của khóa học này');
    }
  }
  const data = await progressRepo.findByCourse(req.params.courseId);
  return ApiResponse.success(res, data);
});

const completeLesson = asyncHandler(async (req, res) => {
  const { course_id, lesson_id } = req.body;
  const enrollment = await enrollRepo.findByUserAndCourse(req.user.id, course_id);
  if (!enrollment || enrollment.access_status !== 'active') {
    return ApiResponse.forbidden(res, 'Bạn cần đăng ký khóa học để cập nhật tiến độ.');
  }
  if (enrollment.is_preserved) {
    return ApiResponse.forbidden(res, 'Khóa học đang bảo lưu. Vui lòng mở lại khóa học để tiếp tục học.');
  }
  // Luu % video da xem ("xem den dau luu den do"). Khong gui percent => coi nhu hoan thanh 100%.
  if (lesson_id) {
    const percent = req.body.watched_percent;
    if (percent !== undefined && percent !== null) {
      await progressRepo.saveLessonWatch(req.user.id, lesson_id, percent);
    } else {
      await progressRepo.markLessonComplete(req.user.id, lesson_id);
    }
  }
  const updated = await progressRepo.recalculate(req.user.id, course_id);
  return ApiResponse.success(res, updated, 'Cập nhật tiến độ thành công');
});

const recalculate = asyncHandler(async (req, res) => {
  const { course_id } = req.body;
  const result = await progressRepo.recalculate(req.user.id, course_id);
  return ApiResponse.success(res, result);
});

const getAllProgress = asyncHandler(async (req, res) => {
  const data = await progressRepo.findAll();
  return ApiResponse.success(res, data);
});

module.exports = { getMyProgress, getCourseProgress, completeLesson, recalculate, getAllProgress };
