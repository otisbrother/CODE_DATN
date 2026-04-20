const enrollService = require('../services/enrollments.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const enroll = asyncHandler(async (req, res) => {
  const result = await enrollService.enroll(req.user.id, req.body.course_id, req.body.payment_method);
  return ApiResponse.created(res, result, 'Đăng ký khóa học thành công');
});

const getMyEnrollments = asyncHandler(async (req, res) => {
  const data = await enrollService.getMyEnrollments(req.user.id);
  return ApiResponse.success(res, data);
});

const getCourseEnrollments = asyncHandler(async (req, res) => {
  const data = await enrollService.getCourseEnrollments(req.params.courseId);
  return ApiResponse.success(res, data);
});

module.exports = { enroll, getMyEnrollments, getCourseEnrollments };
