const progressRepo = require('../repositories/progress.repository');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getMyProgress = asyncHandler(async (req, res) => {
  const data = await progressRepo.findByStudent(req.user.id);
  return ApiResponse.success(res, data);
});

const getCourseProgress = asyncHandler(async (req, res) => {
  const data = await progressRepo.findByCourse(req.params.courseId);
  return ApiResponse.success(res, data);
});

const completeLesson = asyncHandler(async (req, res) => {
  const { course_id } = req.body;
  const existing = await progressRepo.findByStudentAndCourse(req.user.id, course_id);
  const completedLessons = (existing ? existing.completed_lessons : 0) + 1;
  await progressRepo.upsert(req.user.id, course_id, {
    completed_lessons: completedLessons,
    completed_assignments: existing ? existing.completed_assignments : 0,
    completion_rate: existing ? existing.completion_rate : 0,
    status: 'in_progress',
  });
  const updated = await progressRepo.recalculate(req.user.id, course_id);
  return ApiResponse.success(res, updated, 'Cập nhật tiến độ thành công');
});

const recalculate = asyncHandler(async (req, res) => {
  const { course_id } = req.body;
  const result = await progressRepo.recalculate(req.user.id, course_id);
  return ApiResponse.success(res, result);
});

module.exports = { getMyProgress, getCourseProgress, completeLesson, recalculate };
