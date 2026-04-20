const assignRepo = require('../repositories/assignments.repository');
const subRepo = require('../repositories/submissions.repository');
const resultRepo = require('../repositories/results.repository');
const coursesRepo = require('../repositories/courses.repository');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// ---- Assignments ----
const getAssignmentsByCourse = asyncHandler(async (req, res) => {
  const data = await assignRepo.findByCourse(req.params.courseId);
  return ApiResponse.success(res, data);
});

const getAssignmentById = asyncHandler(async (req, res) => {
  const a = await assignRepo.findAssignmentById(req.params.id);
  if (!a) return ApiResponse.notFound(res);
  return ApiResponse.success(res, a);
});

const createAssignment = asyncHandler(async (req, res) => {
  const course = await coursesRepo.findById(req.body.course_id);
  if (!course) return ApiResponse.notFound(res, 'Khóa học không tồn tại');
  if (req.user.role_name === 'lecturer' && course.lecturer_id !== req.user.id) {
    return ApiResponse.forbidden(res, 'Bạn không có quyền tạo bài tập cho khóa học này');
  }
  const id = await assignRepo.createAssignment(req.body);
  const data = await assignRepo.findAssignmentById(id);
  return ApiResponse.created(res, data, 'Tạo bài tập thành công');
});

const updateAssignment = asyncHandler(async (req, res) => {
  const a = await assignRepo.findAssignmentById(req.params.id);
  if (!a) return ApiResponse.notFound(res);
  await assignRepo.updateAssignment(req.params.id, req.body);
  const data = await assignRepo.findAssignmentById(req.params.id);
  return ApiResponse.success(res, data, 'Cập nhật bài tập thành công');
});

const deleteAssignment = asyncHandler(async (req, res) => {
  const a = await assignRepo.findAssignmentById(req.params.id);
  if (!a) return ApiResponse.notFound(res);
  await assignRepo.removeAssignment(req.params.id);
  return ApiResponse.success(res, null, 'Xóa bài tập thành công');
});

// ---- Submissions ----
const submitAssignment = asyncHandler(async (req, res) => {
  const existing = await subRepo.findByStudentAndAssignment(req.user.id, req.body.assignment_id);
  if (existing) return ApiResponse.error(res, 'Bạn đã nộp bài này rồi', 400);
  const id = await subRepo.create({ ...req.body, student_id: req.user.id });
  const data = await subRepo.findById(id);
  return ApiResponse.created(res, data, 'Nộp bài thành công');
});

const getSubmissionsByAssignment = asyncHandler(async (req, res) => {
  const data = await subRepo.findByAssignment(req.params.assignmentId);
  return ApiResponse.success(res, data);
});

const getMySubmissions = asyncHandler(async (req, res) => {
  const data = await subRepo.findByStudent(req.user.id);
  return ApiResponse.success(res, data);
});

// ---- Results / Grading ----
const gradeSubmission = asyncHandler(async (req, res) => {
  const sub = await subRepo.findById(req.body.submission_id);
  if (!sub) return ApiResponse.notFound(res, 'Bài nộp không tồn tại');
  const existing = await resultRepo.findBySubmission(req.body.submission_id);
  if (existing) {
    await resultRepo.update(req.body.submission_id, req.body);
  } else {
    await resultRepo.create(req.body);
  }
  const result = await resultRepo.findBySubmission(req.body.submission_id);
  return ApiResponse.success(res, result, 'Chấm điểm thành công');
});

module.exports = {
  getAssignmentsByCourse, getAssignmentById, createAssignment, updateAssignment, deleteAssignment,
  submitAssignment, getSubmissionsByAssignment, getMySubmissions, gradeSubmission,
};
